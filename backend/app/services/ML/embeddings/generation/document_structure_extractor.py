import re
import os
from typing import Dict, List, Any
from loguru import logger
from datetime import datetime

class DocumentStructureExtractor:
    """
    Clase para extraer la estructura jerárquica y metadatos enriquecidos de documentos.
    Versión mejorada con manejo robusto de diferentes tipos de archivo.
    """
    
    def __init__(self):
        """Inicializa el extractor de estructura de documentos."""
        self.heading_patterns = [
            # Patrones para títulos con numeración
            r'^#{1,6}\s+(.+)$',  # Formato Markdown
            r'^(\d+\.)+\s+(.+)$',  # Numeración decimal (1.2.3)
            r'^Chapter\s+\d+:?\s+(.+)$',  # Capítulos en inglés
            r'^Capítulo\s+\d+:?\s+(.+)$',  # Capítulos en español
            r'^Sección\s+\d+:?\s+(.+)$',  # Secciones en español
            r'^Section\s+\d+:?\s+(.+)$',  # Secciones en inglés
        ]
    
    async def process_document(self, file_path: str) -> Dict[str, Any]:
        """
        Procesa un documento para extraer su estructura y metadatos básicos.
        
        Args:
            file_path: Ruta al archivo a procesar
            
        Returns:
            Diccionario con la estructura básica del documento y metadatos
        """
        if not os.path.exists(file_path):
            logger.error(f"El archivo {file_path} no existe")
            return self._create_empty_structure(os.path.basename(file_path))
            
        # Determinar el tipo de archivo y procesarlo adecuadamente
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.pdf':
            return await self._process_pdf(file_path)
        elif file_extension in ['.docx', '.doc']:
            return await self._process_docx(file_path)
        else:
            # Para archivos de texto plano
            return await self._process_text(file_path)
    
    async def _process_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Procesa un archivo PDF utilizando varias estrategias para extraer el texto.
        """
        try:
            text_content = ""
            
            # Estrategia 1: Intentar con PyPDF2
            try:
                import PyPDF2
                logger.info(f"Extrayendo texto de PDF con PyPDF2: {file_path}")
                with open(file_path, 'rb') as pdf_file:
                    reader = PyPDF2.PdfReader(pdf_file)
                    num_pages = len(reader.pages)
                    
                    # Extraer texto de todas las páginas
                    for page_num in range(num_pages):
                        page_text = reader.pages[page_num].extract_text() or ""
                        text_content += page_text + "\n\n"
                    
                    logger.info(f"Extraídas {num_pages} páginas de PDF con PyPDF2")
            except ImportError:
                logger.warning("PyPDF2 no disponible, intentando alternativa")
                text_content = ""
            except Exception as e:
                logger.error(f"Error extrayendo texto con PyPDF2: {e}")
                text_content = ""
            
            # Estrategia 2: Si PyPDF2 falló, intentar con pdfminer
            if not text_content.strip():
                try:
                    from pdfminer.high_level import extract_text as pdfminer_extract
                    logger.info(f"Extrayendo texto de PDF con pdfminer: {file_path}")
                    text_content = pdfminer_extract(file_path)
                    logger.info(f"Texto extraído con pdfminer: {len(text_content)} caracteres")
                except ImportError:
                    logger.warning("pdfminer no disponible, intentando alternativa")
                except Exception as e:
                    logger.error(f"Error extrayendo texto con pdfminer: {e}")
            
            # Estrategia 3: Último recurso, leer como binario y decodificar
            if not text_content.strip():
                logger.warning(f"Intentando leer PDF como binario: {file_path}")
                with open(file_path, 'rb') as f:
                    binary_content = f.read()
                    try:
                        # Intentar diferentes codificaciones
                        for encoding in ['utf-8', 'latin-1', 'cp1252', 'ascii']:
                            try:
                                text_content = binary_content.decode(encoding, errors='ignore')
                                if text_content.strip():
                                    logger.info(f"Texto extraído con codificación {encoding}")
                                    break
                            except:
                                continue
                    except Exception as e:
                        logger.error(f"Error decodificando PDF como texto: {e}")
            
            # Si no pudimos extraer texto, retornar estructura vacía
            if not text_content.strip():
                logger.warning(f"No se pudo extraer texto del PDF: {file_path}")
                return self._create_empty_structure(os.path.basename(file_path))
            
            # Utilizar el texto extraído para analizar la estructura
            return self._process_text_content(text_content, os.path.basename(file_path))
            
        except Exception as e:
            logger.error(f"Error procesando PDF {file_path}: {e}")
            return self._create_empty_structure(os.path.basename(file_path))
    
    async def _process_docx(self, file_path: str) -> Dict[str, Any]:
        """
        Procesa un archivo DOCX para extraer estructura y metadatos.
        """
        try:
            text_content = ""
            
            # Estrategia 1: Usar docx2txt si está disponible
            try:
                import docx2txt
                logger.info(f"Extrayendo texto de DOCX con docx2txt: {file_path}")
                text_content = docx2txt.process(file_path)
                logger.info(f"Texto extraído con docx2txt: {len(text_content)} caracteres")
            except ImportError:
                logger.warning("docx2txt no disponible, intentando alternativa")
            except Exception as e:
                logger.error(f"Error extrayendo texto con docx2txt: {e}")
            
            # Estrategia 2: Usar python-docx si está disponible
            if not text_content.strip():
                try:
                    import docx
                    logger.info(f"Extrayendo texto de DOCX con python-docx: {file_path}")
                    doc = docx.Document(file_path)
                    text_content = "\n\n".join([paragraph.text for paragraph in doc.paragraphs])
                    logger.info(f"Texto extraído con python-docx: {len(text_content)} caracteres")
                except ImportError:
                    logger.warning("python-docx no disponible, intentando alternativa")
                except Exception as e:
                    logger.error(f"Error extrayendo texto con python-docx: {e}")
            
            # Estrategia 3: Último recurso, leer como binario
            if not text_content.strip():
                logger.warning(f"Leyendo DOCX como binario: {file_path}")
                with open(file_path, 'rb') as f:
                    binary_content = f.read()
                    # Buscar texto plano en el binario
                    for encoding in ['utf-8', 'latin-1', 'cp1252']:
                        try:
                            decoded = binary_content.decode(encoding, errors='ignore')
                            # Eliminar caracteres no imprimibles
                            text_content = re.sub(r'[^\x20-\x7E\n\r\t\u00A0-\u00FF]', ' ', decoded)
                            if text_content.strip():
                                break
                        except:
                            continue
            
            # Si no pudimos extraer texto, retornar estructura vacía
            if not text_content.strip():
                logger.warning(f"No se pudo extraer texto del DOCX: {file_path}")
                return self._create_empty_structure(os.path.basename(file_path))
            
            # Utilizar el texto extraído para analizar la estructura
            return self._process_text_content(text_content, os.path.basename(file_path))
            
        except Exception as e:
            logger.error(f"Error procesando DOCX {file_path}: {e}")
            return self._create_empty_structure(os.path.basename(file_path))
    
    async def _process_text(self, file_path: str) -> Dict[str, Any]:
        """
        Procesa un archivo de texto para extraer estructura y metadatos.
        """
        try:
            # Intentar diferentes codificaciones para abrir el archivo
            text_content = None
            encodings = ['utf-8', 'latin-1', 'cp1252', 'ascii']
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        text_content = f.read()
                    logger.info(f"Archivo leído exitosamente con codificación {encoding}")
                    break
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    logger.error(f"Error leyendo archivo con codificación {encoding}: {e}")
            
            # Si no se pudo leer con ninguna codificación, intentar como binario
            if text_content is None:
                logger.warning(f"Intentando leer archivo como binario: {file_path}")
                with open(file_path, 'rb') as f:
                    binary_content = f.read()
                    text_content = binary_content.decode('latin-1', errors='ignore')
            
            # Procesar el contenido de texto
            return self._process_text_content(text_content, os.path.basename(file_path))
            
        except Exception as e:
            logger.error(f"Error procesando texto {file_path}: {e}")
            return self._create_empty_structure(os.path.basename(file_path))
    
    def _create_empty_structure(self, filename: str) -> Dict[str, Any]:
        """Crea una estructura vacía para casos de error."""
        return {
            "title": filename,
            "sections": [],
            "pages": [],
            "total_pages": 1,
            "metadata": {
                "word_count": 0,
                "character_count": 0,
                "creation_date": datetime.now().isoformat(),
                "modification_date": datetime.now().isoformat(),
                "error": "No se pudo extraer estructura del documento"
            }
        }
    
    def _process_text_content(self, content: str, title: str) -> Dict[str, Any]:
        """
        Procesa el contenido de texto para extraer estructura y metadatos.
        """
        if not content or not content.strip():
            logger.warning(f"Contenido vacío para el documento: {title}")
            return self._create_empty_structure(title)
            
        try:
            # Limpiar el texto (eliminar caracteres de control, espacios múltiples)
            content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
            content = re.sub(r'\s+', ' ', content)
            
            # Estructura básica del documento
            document_structure = {
                "title": title,
                "sections": self._extract_sections(content),
                "pages": self._simulate_pages(content),
                "total_pages": self._estimate_pages(content),
                "metadata": {
                    "word_count": len(content.split()),
                    "character_count": len(content),
                    "creation_date": datetime.now().isoformat(),
                    "modification_date": datetime.now().isoformat(),
                }
            }
            
            return document_structure
            
        except Exception as e:
            logger.error(f"Error procesando contenido de texto para {title}: {e}")
            return self._create_empty_structure(title)
    
    def _extract_sections(self, content: str) -> List[Dict]:
        """
        Extrae secciones y jerarquía del contenido.
        Método simplificado que busca encabezados.
        """
        if not content:
            return []
            
        lines = content.split('\n')
        sections = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Detectar si es un encabezado
            for pattern in self.heading_patterns:
                match = re.match(pattern, line)
                if match:
                    level = 1  # Nivel predeterminado
                    
                    # Extraer el texto y determinar el nivel según el patrón
                    if pattern == r'^#{1,6}\s+(.+)$':  # Markdown
                        hash_match = re.match(r'^(#+)', line)
                        level = len(hash_match.group(1)) if hash_match else 1
                        title = match.group(1)
                    elif pattern == r'^(\d+\.)+\s+(.+)$':  # Numeración decimal
                        nums = re.match(r'^(\d+\.)+', line)
                        level = len(nums.group(0).split('.')) - 1 if nums else 1
                        title = match.group(2)
                    else:
                        title = match.group(1)
                    
                    # Calcular la posición aproximada en el documento
                    position = i / max(1, len(lines))
                    page_estimate = int(position * self._estimate_pages(content)) + 1
                    
                    sections.append({
                        "title": title,
                        "level": level,
                        "line_number": i + 1,
                        "estimated_page": page_estimate,
                        "position_percentage": round(position * 100, 2)
                    })
                    break
        
        # Detectar relaciones jerárquicas entre secciones
        self._process_section_hierarchy(sections)
        
        return sections
    
    def _process_section_hierarchy(self, sections: List[Dict]) -> None:
        """
        Procesa relaciones jerárquicas entre secciones y agrega parent_section.
        Modifica la lista de secciones in-place.
        """
        if not sections:
            return
            
        # Ordenar por position_percentage para asegurar orden cronológico
        sections.sort(key=lambda s: s["position_percentage"])
        
        # Inicializar parent_sections para cada nivel
        parent_sections = {}  # {level: section}
        
        for section in sections:
            level = section["level"]
            
            # Encontrar parent_section (sección de nivel superior más reciente)
            parent_level = level - 1
            parent_title = ""
            
            while parent_level > 0:
                if parent_level in parent_sections:
                    parent_title = parent_sections[parent_level]["title"]
                    break
                parent_level -= 1
            
            # Asignar parent_section (string vacío si no hay)
            section["parent_section"] = parent_title
            
            # Actualizar parent_sections para este nivel
            parent_sections[level] = section
    
    def _simulate_pages(self, content: str) -> List[Dict]:
        """
        Simula páginas para el contenido de texto.
        Aproximadamente 3000 caracteres por página.
        """
        if not content:
            return []
            
        chars_per_page = 3000
        pages = []
        
        for i in range(0, len(content), chars_per_page):
            page_content = content[i:i+chars_per_page]
            
            # Extraer párrafos
            paragraphs = self._extract_paragraphs(page_content)
            
            pages.append({
                "page_number": (i // chars_per_page) + 1,
                "start_char": i,
                "end_char": min(i + chars_per_page, len(content)),
                "content_preview": page_content[:100] + "..." if len(page_content) > 100 else page_content,
                "paragraphs_count": len(paragraphs)
            })
        
        return pages
    
    def _estimate_pages(self, content: str) -> int:
        """
        Estima el número de páginas basado en caracteres.
        """
        if not content:
            return 1
            
        chars_per_page = 3000
        return max(1, (len(content) + chars_per_page - 1) // chars_per_page)
    
    def _extract_paragraphs(self, text: str) -> List[str]:
        """
        Extrae párrafos de un texto.
        """
        if not text:
            return []
            
        # Dividir por líneas en blanco
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]