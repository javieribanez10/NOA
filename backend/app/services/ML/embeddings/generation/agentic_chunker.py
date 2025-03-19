import json
import re
import asyncio
from openai import OpenAI
from loguru import logger
from typing import List, Dict, Any

class AgenticChunker:
    """
    Implementación de un sistema de chunking inteligente basado en LLM
    que crea chunks semánticamente coherentes para mejorar la calidad de
    los embeddings y la recuperación de información.
    """
    
    def __init__(self, openai_api_key: str):
        """Inicializa el chunker basado en agente."""
        self.client = OpenAI(api_key=openai_api_key)
        
    async def process_text(self, text: str, max_chunk_size: int = 1000, overlap: int = 200, document_structure: Dict = None) -> List[Dict[str, Any]]:
        """
        Procesa un texto y lo divide en chunks semánticamente coherentes utilizando un LLM.
        
        Args:
            text: El texto completo a procesar
            max_chunk_size: Tamaño máximo deseado para cada chunk (en palabras)
            overlap: Cantidad de palabras de solapamiento entre chunks
            document_structure: Estructura del documento extraída previamente (opcional)
            
        Returns:
            Lista de diccionarios con el contenido de los chunks y sus metadatos
        """
        if not text or not text.strip():
            logger.warning("Texto vacío o solo espacios proporcionado a process_text")
            return []
            
        # 1. Dividir en bloques preliminares para análisis
        preliminary_chunks = self._create_preliminary_chunks(text, max_chunk_size * 2, overlap)
        logger.info(f"Texto dividido en {len(preliminary_chunks)} chunks preliminares para análisis")
        
        # 2. Analizar y optimizar cada bloque preliminar
        final_chunks = []
        
        # Información de contexto del documento si está disponible
        document_context = {}
        if document_structure:
            document_context = {
                "title": document_structure.get("title", ""),
                "total_pages": document_structure.get("total_pages", 1),
                "sections": document_structure.get("sections", [])
            }
        
        for i, chunk in enumerate(preliminary_chunks):
            logger.info(f"Analizando chunk preliminar {i+1}/{len(preliminary_chunks)}")
            
            # Solo procesar chunks significativos
            if len(chunk.split()) < 50:  # Si es muy corto, mantenerlo como está
                # Determinar metadatos de posición
                position_metadata = self._calculate_position_metadata(
                    chunk, text, i, len(preliminary_chunks), document_structure
                )
                
                final_chunks.append({
                    "content": chunk,
                    "metadata": {
                        "chunk_type": "small_fragment",
                        "word_count": len(chunk.split()),
                        "key_terms": self._extract_key_terms(chunk),
                        **position_metadata
                    }
                })
                continue
            
            # Para chunks más grandes, usar el LLM para encontrar divisiones óptimas
            optimized_chunks = await self._optimize_chunk(
                chunk, 
                max_chunk_size, 
                position=(i / len(preliminary_chunks)),
                document_context=document_context
            )
            
            # Enriquecer con metadatos de posición
            for j, opt_chunk in enumerate(optimized_chunks):
                position_metadata = self._calculate_position_metadata(
                    opt_chunk["content"], 
                    text, 
                    i + (j / len(optimized_chunks)) if optimized_chunks else i,
                    len(preliminary_chunks),
                    document_structure
                )
                opt_chunk["metadata"].update(position_metadata)
                
            final_chunks.extend(optimized_chunks)
            
        logger.info(f"Proceso completado: {len(final_chunks)} chunks semánticos creados")
        return final_chunks
    
    def _create_preliminary_chunks(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Divide el texto en bloques preliminares basados en párrafos."""
        # Dividir por párrafos
        paragraphs = re.split(r'\n\s*\n', text)
        chunks = []
        current_chunk = []
        current_size = 0
        
        for paragraph in paragraphs:
            if not paragraph.strip():  # Saltar párrafos vacíos
                continue
                
            paragraph_words = paragraph.split()
            paragraph_size = len(paragraph_words)
            
            # Si el párrafo es muy grande, subdividirlo
            if paragraph_size > chunk_size:
                # Si hay algo en el chunk actual, añadirlo primero
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_size = 0
                
                # Subdividir párrafo largo
                for i in range(0, len(paragraph_words), chunk_size - overlap):
                    if i > 0:  # Añadir overlap excepto en el primer chunk
                        start = max(0, i - overlap)
                    else:
                        start = 0
                    end = min(len(paragraph_words), i + chunk_size)
                    chunk_text = " ".join(paragraph_words[start:end])
                    chunks.append(chunk_text)
                continue
                
            # Si añadir el párrafo excede el tamaño del chunk, crear uno nuevo
            if current_size + paragraph_size > chunk_size:
                # Guardar el chunk actual
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                
                # Iniciar nuevo chunk con overlap
                if current_chunk and overlap > 0:
                    # Tomar las últimas palabras del chunk anterior para overlap
                    current_text = " ".join(current_chunk)
                    overlap_words = current_text.split()[-min(overlap, len(current_text.split())):]
                    current_chunk = [" ".join(overlap_words), paragraph]
                    current_size = len(overlap_words) + paragraph_size
                else:
                    current_chunk = [paragraph]
                    current_size = paragraph_size
            else:
                current_chunk.append(paragraph)
                current_size += paragraph_size
        
        # Añadir el último chunk si existe
        if current_chunk:
            chunks.append(" ".join(current_chunk))
            
        # Si no se generaron chunks, devolver el texto completo como un chunk
        if not chunks and text.strip():
            chunks = [text.strip()]
            
        return chunks
    
    async def _optimize_chunk(self, text: str, preferred_size: int, position: float = 0.5, document_context: Dict = None) -> List[Dict[str, Any]]:
        """Usa un LLM para determinar divisiones óptimas del texto."""
        try:
            # Sanear texto para el prompt
            text_for_prompt = self._sanitize_text_for_prompt(text)
            
            # Información adicional de contexto del documento
            doc_context_info = ""
            if document_context:
                doc_title = document_context.get("title", "Documento")
                doc_title = doc_title[:50] if len(doc_title) > 50 else doc_title  # Limitar longitud
                
                total_pages = document_context.get("total_pages", 1)
                if not isinstance(total_pages, (int, float)) or total_pages < 1:
                    total_pages = 1
                    
                doc_context_info = f"""
                Este fragmento pertenece al documento "{doc_title}" 
                que tiene aproximadamente {total_pages} páginas.
                El fragmento está ubicado aproximadamente al {position * 100:.0f}% del documento.
                """
            
            # Prompt para el LLM
            prompt = f"""
            Eres un experto en procesamiento de textos y comprensión semántica. Tu tarea es dividir el
            siguiente texto en chunks semánticamente coherentes. Cada chunk debe ser una unidad de
            significado completa, idealmente con aproximadamente {preferred_size} palabras, pero priorizando
            siempre la coherencia semántica sobre el tamaño exacto.

            {doc_context_info}

            Texto a dividir:
            ```
            {text_for_prompt}
            ```

            Por favor:
            1. Identifica los límites naturales donde el texto podría dividirse manteniendo la coherencia.
            2. Para cada chunk propuesto, identifica 3-5 términos clave que representen su contenido.
            3. Asigna un breve título descriptivo a cada chunk.
            4. Identifica las entidades principales mencionadas (personas, organizaciones, conceptos, etc.)
            5. Clasifica el tipo de contenido (descriptivo, narrativo, argumentativo, etc.)

            Responde ÚNICAMENTE con un JSON en el siguiente formato sin explicaciones adicionales:
            ```json
            [
                {{
                    "chunk_text": "texto del primer chunk...",
                    "chunk_title": "título descriptivo",
                    "key_terms": ["término1", "término2", "término3"],
                    "entities": ["entidad1", "entidad2"],
                    "content_type": "tipo de contenido"
                }},
                ...
            ]
            ```
            """

            # Llamada al modelo con manejo de timeouts
            try:
                llm_start_time = asyncio.get_event_loop().time()
                response = await asyncio.wait_for(
                    self._call_llm(prompt),
                    timeout=45.0  # 45 segundos timeout
                )
                llm_duration = asyncio.get_event_loop().time() - llm_start_time
                logger.info(f"LLM respondió en {llm_duration:.2f}s")
            except asyncio.TimeoutError:
                logger.warning("Timeout en la llamada al LLM para optimización de chunks")
                # Fallback simple: dividir por párrafos o frases
                return self._fallback_chunking(text, preferred_size)
            
            # Extraer el JSON de la respuesta
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response
                
            # Intentar parsear JSON con manejo robusto de errores
            try:
                chunks_data = json.loads(json_str)
                if not isinstance(chunks_data, list):
                    logger.warning(f"Formato JSON inesperado, no es una lista: {type(chunks_data)}")
                    return self._fallback_chunking(text, preferred_size)
            except json.JSONDecodeError as e:
                logger.error(f"Error decodificando JSON: {e}")
                return self._fallback_chunking(text, preferred_size)
            
            # Procesar los chunks optimizados
            result = []
            for i, chunk_data in enumerate(chunks_data):
                if not isinstance(chunk_data, dict):
                    logger.warning(f"Item no es un diccionario: {type(chunk_data)}")
                    continue
                    
                chunk_text = chunk_data.get("chunk_text", "").strip()
                if not chunk_text:
                    logger.warning(f"Chunk {i} sin texto, ignorando")
                    continue
                
                # Construir metadata sanitizada (evitar valores null)
                chunk_metadata = {
                    "chunk_type": "semantic_unit",
                    "chunk_title": chunk_data.get("chunk_title", f"Chunk {i+1}") or f"Chunk {i+1}",
                    "word_count": len(chunk_text.split())
                }
                
                # Añadir key_terms si existen
                key_terms = chunk_data.get("key_terms", [])
                if key_terms and isinstance(key_terms, list):
                    # Filtrar valores vacíos o nulos
                    key_terms = [term for term in key_terms if term]
                    if key_terms:
                        chunk_metadata["key_terms"] = key_terms
                else:
                    # Fallback a extracción básica
                    chunk_metadata["key_terms"] = self._extract_key_terms(chunk_text)
                
                # Añadir entities si existen
                entities = chunk_data.get("entities", [])
                if entities and isinstance(entities, list):
                    # Filtrar valores vacíos o nulos
                    entities = [entity for entity in entities if entity]
                    if entities:
                        chunk_metadata["entities"] = entities
                
                # Añadir content_type si existe
                content_type = chunk_data.get("content_type", "")
                if content_type and isinstance(content_type, str):
                    chunk_metadata["content_type"] = content_type.lower()
                else:
                    chunk_metadata["content_type"] = "general"
                
                result.append({
                    "content": chunk_text,
                    "metadata": chunk_metadata
                })
            
            # Si no se generaron chunks válidos, usar fallback
            if not result:
                logger.warning("LLM no produjo chunks válidos, usando fallback")
                return self._fallback_chunking(text, preferred_size)
                
            return result
            
        except Exception as e:
            logger.error(f"Error en optimización de chunk con LLM: {e}")
            return self._fallback_chunking(text, preferred_size)
    
    async def _call_llm(self, prompt: str) -> str:
        """Realiza la llamada al LLM con manejo de errores mejorado."""
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo-16k", 
                messages=[{"role": "system", "content": prompt}],
                temperature=0.1,
                max_tokens=2000
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error en llamada al LLM: {e}")
            raise
    
    def _sanitize_text_for_prompt(self, text: str) -> str:
        """Sanitiza el texto para incluirlo en el prompt, limitando su longitud."""
        if len(text) > 12000:  # Límite para caber en el contexto de GPT-3.5-16k
            text = text[:12000] + "..."
        
        # Eliminar caracteres problemáticos
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        return text
    
    def _fallback_chunking(self, text: str, preferred_size: int) -> List[Dict[str, Any]]:
        """Método de fallback que divide el texto en chunks por tamaño fijo."""
        logger.info("Usando chunking de fallback basado en párrafos")
        
        # Dividir por párrafos
        paragraphs = [p for p in re.split(r'\n\s*\n', text) if p.strip()]
        
        # Agrupar párrafos en chunks de tamaño aproximado
        chunks = []
        current_chunk = []
        current_size = 0
        
        for para in paragraphs:
            para_size = len(para.split())
            
            if current_size + para_size > preferred_size and current_chunk:
                # Guardar chunk actual y empezar uno nuevo
                chunk_text = " ".join(current_chunk)
                chunks.append({
                    "content": chunk_text,
                    "metadata": {
                        "chunk_type": "fallback",
                        "chunk_title": self._generate_simple_title(chunk_text),
                        "key_terms": self._extract_key_terms(chunk_text),
                        "word_count": current_size,
                        "content_type": "general"
                    }
                })
                current_chunk = [para]
                current_size = para_size
            else:
                current_chunk.append(para)
                current_size += para_size
        
        # Añadir el último chunk
        if current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append({
                "content": chunk_text,
                "metadata": {
                    "chunk_type": "fallback",
                    "chunk_title": self._generate_simple_title(chunk_text),
                    "key_terms": self._extract_key_terms(chunk_text),
                    "word_count": current_size,
                    "content_type": "general"
                }
            })
        
        # Si no se generaron chunks, devolver el texto original como un chunk
        if not chunks:
            chunks = [{
                "content": text,
                "metadata": {
                    "chunk_type": "fallback_single",
                    "chunk_title": "Texto completo",
                    "key_terms": self._extract_key_terms(text),
                    "word_count": len(text.split()),
                    "content_type": "general"
                }
            }]
            
        return chunks
    
    def _generate_simple_title(self, text: str) -> str:
        """Genera un título simple basado en las primeras palabras del texto."""
        words = text.split()
        if not words:
            return "Chunk sin contenido"
            
        # Usar las primeras palabras como título
        title_words = words[:min(8, len(words))]
        title = " ".join(title_words)
        
        # Truncar si es muy largo y añadir elipsis
        if len(title) > 50:
            title = title[:47] + "..."
            
        return title
    
    def _extract_key_terms(self, text: str, max_terms: int = 5) -> List[str]:
        """Extrae términos clave del texto usando un método simplificado."""
        if not text or not text.strip():
            return []
            
        # Tokenizar y filtrar palabras comunes
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        stop_words = {'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'porque', 
                      'como', 'para', 'por', 'que', 'del', 'al', 'es', 'son', 'con', 'sin', 'sobre', 'entre',
                      'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella',
                      'mas', 'más', 'muy', 'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca', 'pocos', 'pocas'}
        filtered_words = [w for w in words if w not in stop_words]
        
        if not filtered_words:
            return []
            
        # Contar frecuencias
        word_counts = {}
        for word in filtered_words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        # Obtener los términos más frecuentes
        sorted_terms = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
        return [term for term, _ in sorted_terms[:max_terms]]
    
    def _calculate_position_metadata(self, chunk_text: str, full_text: str, chunk_index: float, total_chunks: int, document_structure: Dict = None) -> Dict[str, Any]:
        """
        Calcula metadatos relacionados con la posición del chunk en el documento.
        Versión mejorada que garantiza que no se devuelvan valores null.
        
        Args:
            chunk_text: El texto del chunk
            full_text: El texto completo del documento
            chunk_index: Índice (posiblemente fraccionario) del chunk
            total_chunks: Número total de chunks
            document_structure: Estructura del documento (opcional)
            
        Returns:
            Diccionario con metadatos de posición (nunca contiene valores None)
        """
        # Prevenir división por cero
        total_chunks = max(1, total_chunks)
        
        # Calcular posición relativa en el documento
        position = chunk_index / total_chunks
        
        # Determinar ubicación general
        if position < 0.2:
            position_in_document = "inicio"
        elif position > 0.8:
            position_in_document = "final"
        else:
            position_in_document = "medio"
            
        # Calcular porcentaje aproximado en el documento
        document_percentage = int(position * 100)
        
        # Inicializar resultado con valores por defecto (no null)
        result = {
            "position_in_document": position_in_document,
            "document_percentage": document_percentage,
            "estimated_page": 1
        }
        
        # Estimar número de página si hay información disponible
        if document_structure and "total_pages" in document_structure:
            total_pages = document_structure.get("total_pages", 1)
            if isinstance(total_pages, (int, float)) and total_pages > 0:
                result["estimated_page"] = max(1, int(position * total_pages) + 1)
                
        # Procesar información de secciones
        sections_data = self._extract_section_info(document_structure, document_percentage)
        if sections_data.get("section"):
            result["section"] = sections_data["section"]
        if sections_data.get("parent_section"):
            result["parent_section"] = sections_data["parent_section"]
        
        return result
    
    def _extract_section_info(self, document_structure: Dict, document_percentage: int) -> Dict[str, Any]:
        """
        Extrae información de secciones para un punto específico del documento.
        Garantiza que no se devuelvan valores null.
        
        Args:
            document_structure: La estructura del documento
            document_percentage: Porcentaje de posición en el documento (0-100)
            
        Returns:
            Diccionario con información de secciones
        """
        result = {}
        
        if not document_structure or "sections" not in document_structure:
            return result
            
        sections = document_structure.get("sections", [])
        if not sections or not isinstance(sections, list):
            return result
            
        # Encontrar la sección más cercana antes de esta posición
        sections_before = [s for s in sections if s.get("position_percentage", 0) <= document_percentage]
        
        if sections_before:
            # Encontrar la sección más reciente
            latest_section = max(sections_before, key=lambda s: s.get("position_percentage", 0))
            section_title = latest_section.get("title")
            if section_title:
                result["section"] = section_title
                
            # Buscar sección padre (nivel superior)
            level = latest_section.get("level", 1)
            if level > 1:
                parent_sections = [s for s in sections_before if s.get("level", 1) == 1]
                if parent_sections:
                    parent = max(parent_sections, key=lambda s: s.get("position_percentage", 0))
                    parent_title = parent.get("title")
                    if parent_title:
                        result["parent_section"] = parent_title
                        
        return result