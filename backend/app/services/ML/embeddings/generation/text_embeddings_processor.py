# app/services/ML/embeddings/generation/text_embeddings_processor.py

import json
import re
import unicodedata
import time
import os
from datetime import datetime
from loguru import logger
from app.core.config import settings
from app.utils.file_utils import extract_text_from_file
from app.services.ML.embeddings.generation.agentic_chunker import AgenticChunker
from app.services.ML.embeddings.generation.document_structure_extractor import DocumentStructureExtractor
from app.services.ML.embeddings.openai.vector_store import OpenAIVectorStore  # Importamos el wrapper

class EnhancedTextEmbeddingsProcessor:
    def __init__(self, user_email: str, user_id: int, chat_id: int = None, archivo_id: int = None):
        """
        Procesador mejorado que utiliza chunking inteligente y almacena embeddings en el vector store de OpenAI.
        """
        self.user_email = user_email
        self.user_id = user_id
        self.chat_id = chat_id
        self.archivo_id = archivo_id
        # Se asume que ya tienes un vector store creado; si no, se puede crear aquí
        self.vector_store = OpenAIVectorStore(vector_store_id="vs_67da2a9a90b4819194ed77849ac443db")
        self.agentic_chunker = AgenticChunker(openai_api_key=settings.OPENAI_API_KEY)
        self.structure_extractor = DocumentStructureExtractor()

    def sanitize_filename(self, filename: str) -> str:
        """
        Convierte el nombre del archivo a un formato ASCII seguro.
        """
        filename = unicodedata.normalize('NFKD', filename)
        filename = filename.encode('ascii', 'ignore').decode('ascii')
        filename = re.sub(r'[^\w\s-]', '-', filename)
        filename = re.sub(r'[-\s]+', '-', filename)
        return filename.strip('-')

    async def process_text_file(self, file_path: str, file_name: str):
        """
        Procesa un archivo de texto generando chunks semánticos, guarda sus metadatos en un archivo JSON
        y lo sube al vector store de OpenAI.
        
        Returns:
            str: El ID del archivo en el vector store de OpenAI
        """
        try:
            safe_file_name = self.sanitize_filename(file_name)
            text_content = extract_text_from_file(file_path)
            logger.info(f"Iniciando extracción de estructura para {file_name}...")
            document_structure = await self.structure_extractor.process_document(file_path)
            logger.info(f"Estructura extraída: {len(document_structure.get('sections', []))} secciones")
            logger.info(f"Iniciando chunking inteligente para {file_name}...")
            semantic_chunks = await self.agentic_chunker.process_text(
                text=text_content,
                max_chunk_size=settings.CHUNK_SIZE,
                overlap=200,
                document_structure=document_structure
            )
            del text_content
            logger.info(f"Chunking completado: {len(semantic_chunks)} chunks generados")
            # Preparar los chunks con metadatos para subir al vector store
            chunks_with_metadata = []
            for i, chunk in enumerate(semantic_chunks):
                chunk_text = chunk.get("content", "")
                metadata = chunk.get("metadata", {})
                metadata.update({
                    "user_id": self.user_id,
                    "chat_id": self.chat_id,
                    "archivo_id": self.archivo_id,
                    "file": file_name,
                    "sanitized_file": safe_file_name,
                    "chunk_number": i,
                    "processed_at": datetime.now().isoformat()
                })
                chunks_with_metadata.append({
                    "chunk_text": chunk_text,
                    "metadata": metadata
                })
            # Guardar en un archivo JSON temporal
            temp_json_file = f"/tmp/{safe_file_name}_{int(time.time())}.json"
            with open(temp_json_file, "w", encoding="utf-8") as f:
                json.dump(chunks_with_metadata, f)
            
            # Subir el archivo al vector store
            result = self.vector_store.upload_file(temp_json_file)
            
            # Extraer el ID del resultado
            logger.info(f"Resultado de upload_file: {result}")
            
            # Determinar el ID correcto del archivo en el vector store
            if hasattr(result, 'id'):
                file_id = result.id
            elif isinstance(result, dict) and 'id' in result:
                file_id = result['id']
            else:
                # Si no podemos obtener un ID válido, usar un fallback
                logger.warning(f"No se pudo obtener ID del vector store, generando uno: {result}")
                import uuid
                file_id = f"file-{str(uuid.uuid4())}"
            
            logger.info(f"Se han subido {len(chunks_with_metadata)} chunks al vector store con ID: {file_id}")
            os.remove(temp_json_file)
            return file_id
            
        except Exception as e:
            logger.error(f"Error procesando archivo de texto {file_name}: {e}")
            raise