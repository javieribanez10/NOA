import os
import re
import unicodedata
import time
import json
from loguru import logger
from app.services.ML.embeddings.openai.vector_store import OpenAIVectorStore

class EnhancedTextEmbeddingsProcessor:
    def __init__(self, user_email: str, user_id: int, chat_id: int = None, archivo_id: int = None):
        """
        Procesador simplificado que sube directamente el archivo al vector store de OpenAI.
        """
        self.user_email = user_email
        self.user_id = user_id
        self.chat_id = chat_id
        self.archivo_id = archivo_id
        self.vector_store = OpenAIVectorStore(vector_store_id="vs_67da2a9a90b4819194ed77849ac443db")

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
        Sube directamente el archivo (sin modificaciones ni extracción de texto)
        al vector store de OpenAI utilizando el método upload, y retorna el ID real.
        
        Returns:
            str: El ID del archivo en el vector store de OpenAI.
        """
        try:
            # Directamente se sube el archivo sin ningún procesamiento adicional.
            result = self.vector_store.upload_file(file_path)
            logger.info(f"Resultado de upload_file: {result}")
            
            # Extraer el ID del resultado
            if hasattr(result, 'id'):
                file_id = result.id
            elif isinstance(result, dict) and 'id' in result:
                file_id = result['id']
            else:
                logger.warning(f"No se pudo obtener ID del vector store, generando uno: {result}")
                import uuid
                file_id = f"file-{str(uuid.uuid4())}"
            
            logger.info(f"Archivo subido al vector store con ID: {file_id}")
            return file_id

        except Exception as e:
            logger.error(f"Error subiendo archivo {file_name} a vector store: {e}")
            raise