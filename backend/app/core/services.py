# app/core/services.py
from redis import Redis
from app.core.config import settings
from app.services.api_key import APIKeyService
from app.core.logger import logger

# Cliente Redis global
redis_client = Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
    decode_responses=True
)

# Servicio de API Keys global
api_key_service = APIKeyService(redis_client)

def init_services():
    """
    Inicializa y verifica la conexión con los servicios necesarios
    """
    try:
        # Verificar conexión con Redis
        redis_client.ping()
        logger.info("Conexión exitosa con Redis")
        
        # Inicializar otros servicios si es necesario
        
    except Exception as e:
        logger.error(f"Error al inicializar servicios: {str(e)}")
        raise e

__all__ = ["redis_client", "api_key_service", "init_services"]