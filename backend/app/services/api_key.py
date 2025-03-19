from app.core.logger import logger, get_audit_logger
from redis import Redis
from typing import Dict, Optional
from datetime import datetime, timedelta
import json

audit_logger = get_audit_logger()

from fastapi import Request

class APIKeyService:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.USAGE_PREFIX = "usage:"
        self.DAILY_USAGE_PREFIX = "daily_usage:"
        
    def increment_usage(self, api_key: str, request: Request) -> int:
        """
        Incrementa el contador de uso de una API Key y registra el uso diario
        """
        try:
            # Incrementar contador general
            total_key = f"{self.USAGE_PREFIX}{api_key}"
            total_usage = self.redis.incr(total_key)
            
            # Registrar uso diario
            today = datetime.now().strftime("%Y-%m-%d")
            daily_key = f"{self.DAILY_USAGE_PREFIX}{api_key}:{today}"
            daily_usage = self.redis.incr(daily_key)
            
            # Establecer expiración de 90 días para las estadísticas diarias
            self.redis.expire(daily_key, timedelta(days=90))
            
            # Registrar información detallada del request
            endpoint = f"{request.method} {request.url.path}"
            audit_logger.info(
                f"API Key usage increment - Key: {api_key}, "
                f"Endpoint: {endpoint}, "
                f"Method: {request.method}, "
                f"Path: {request.url.path}, "
                f"Total: {total_usage}"
            )
            return total_usage
            
        except Exception as e:
            logger.error(f"Error incrementing API Key usage: {str(e)}")
            return 0
            
    def get_usage_stats(self, api_key: str) -> Dict:
        """
        Obtiene estadísticas de uso de una API Key
        """
        try:
            # Obtener uso total
            total_key = f"{self.USAGE_PREFIX}{api_key}"
            total_usage = int(self.redis.get(total_key) or 0)
            
            # Obtener uso diario de los últimos 30 días
            daily_stats = {}
            today = datetime.now()
            
            for i in range(30):
                date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
                daily_key = f"{self.DAILY_USAGE_PREFIX}{api_key}:{date}"
                usage = int(self.redis.get(daily_key) or 0)
                daily_stats[date] = usage
                
            return {
                "total_usage": total_usage,
                "daily_stats": daily_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting API Key usage stats: {str(e)}")
            return {"total_usage": 0, "daily_stats": {}}
            
    def reset_usage(self, api_key: str) -> bool:
        """
        Reinicia los contadores de uso de una API Key
        """
        try:
            pattern = f"{self.USAGE_PREFIX}{api_key}*"
            keys = self.redis.keys(pattern)
            if keys:
                self.redis.delete(*keys)
            audit_logger.warning(f"API Key usage reset - Key: {api_key}")
            return True
        except Exception as e:
            logger.error(f"Error resetting API Key usage: {str(e)}")
            return False