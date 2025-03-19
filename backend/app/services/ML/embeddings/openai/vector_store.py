# vector_store.py
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

class OpenAIVectorStore:
    def __init__(self, name: str = "Default Vector Store", vector_store_id: str = None):
        self.client = OpenAI()  # Se asume que OPENAI_API_KEY está configurado en el entorno
        if vector_store_id:
            self.id = vector_store_id
            logger.info(f"Usando vector store existente: {self.id}")
        else:
            store = self.client.vector_stores.create(name=name)
            self.id = store.id
            logger.info(f"Vector store creado con id: {self.id}")

    def upload_file(self, file_path: str):
        """
        Sube un archivo al vector store y espera a que se procese.
        """
        try:
            with open(file_path, "rb") as f:
                result = self.client.vector_stores.files.upload_and_poll(
                    vector_store_id=self.id,
                    file=f
                )
            logger.info(f"Archivo subido correctamente al vector store {self.id}")
            return result
        except Exception as e:
            logger.error(f"Error al subir archivo: {e}")
            raise

    def search(self, query: str, **kwargs):
        """
        Realiza una búsqueda en el vector store usando el query dado.
        """
        try:
            results = self.client.vector_stores.search(
                vector_store_id=self.id,
                query=query,
                **kwargs
            )
            logger.info(f"Búsqueda realizada correctamente en el vector store {self.id}")
            return results
        except Exception as e:
            logger.error(f"Error en búsqueda: {e}")
            raise

    def delete_file(self, file_identifier: str):
        """
        Elimina un archivo (y sus embeddings) del vector store.
        Se asume que la API de OpenAI expone un endpoint similar.
        """
        try:
            result = self.client.vector_stores.files.delete(
                vector_store_id=self.id,
                file_id=file_identifier  
            )
            logger.info(f"Embeddings eliminados correctamente para el archivo {file_identifier} en el vector store {self.id}")
            return result
        except Exception as e:
            logger.error(f"Error eliminando embeddings para {file_identifier}: {e}")
            raise
