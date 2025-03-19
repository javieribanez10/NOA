from app.core.logger import logger, get_audit_logger
from redis import Redis
from typing import Dict
from datetime import datetime, timedelta
import json
from sqlalchemy.orm import Session
from app.database.models.token_usage import TokenUsage
from app.database.models.user import User

audit_logger = get_audit_logger()

class GPTTokenTracker:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.GPT_USAGE_PREFIX = "gpt_usage:"
        self.DAILY_GPT_PREFIX = "daily_gpt:"
        self.MODEL_PREFIX = "model_usage:"
        
        # Costos y nombres de modelos
        self.MODELS = {
            "gpt-3.5-turbo": {
                "display_name": "M.A.T.E.O MINI",
                "costs": {
                    "input": 0.0015,   # $0.0015 por 1K tokens
                    "output": 0.002,   # $0.002 por 1K tokens
                },
                "zaap_multiplier": {
                    "input": 1.0,      # Base multiplier
                    "output": 1.33     # 2/1.5 = factor de conversión relativo al input
                }
            },
            "gpt-4": {
                "display_name": "M.A.T.E.O",
                "costs": {
                    "input": 0.03,     # $0.03 por 1K tokens
                    "output": 0.06,    # $0.06 por 1K tokens
                },
                "zaap_multiplier": {
                    "input": 20.0,     # 0.03/0.0015 = 20x el costo base
                    "output": 40.0     # 0.06/0.0015 = 40x el costo base
                }
            }
        }
        
    def calculate_zaaps(self, model: str, input_tokens: int, output_tokens: int) -> Dict[str, float]:
        """Calcula los Zaaps basado en el modelo y tokens usados."""
        if model not in self.MODELS:
            return {"input_zaaps": 0, "output_zaaps": 0, "total_zaaps": 0}
            
        multipliers = self.MODELS[model]["zaap_multiplier"]
        input_zaaps = (input_tokens / 1000) * multipliers["input"] * 1000
        output_zaaps = (output_tokens / 1000) * multipliers["output"] * 1000
        
        return {
            "input_zaaps": input_zaaps,
            "output_zaaps": output_zaaps,
            "total_zaaps": input_zaaps + output_zaaps
        }
        
    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calcula el costo en USD basado en el modelo y tokens usados."""
        if model not in self.MODELS:
            return 0.0
            
        costs = self.MODELS[model]["costs"]
        input_cost = (input_tokens / 1000) * costs["input"]
        output_cost = (output_tokens / 1000) * costs["output"]
        return input_cost + output_cost
        
    def track_tokens(
        self, 
        db: Session,
        user: User,
        input_tokens: int,
        output_tokens: int,
        model: str,
        endpoint: str
    ) -> Dict:
        """
        Trackea el uso de tokens de GPT y guarda en Redis y Base de datos.
        """
        try:
            api_key = user.api_key
            today = datetime.now().strftime("%Y-%m-%d")
            
            # Calcular costos y Zaaps
            cost = self.calculate_cost(model, input_tokens, output_tokens)
            zaaps = self.calculate_zaaps(model, input_tokens, output_tokens)
            total_tokens = input_tokens + output_tokens
            
            # Guardar en la base de datos
            db_usage = TokenUsage(
                user_id=user.id,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                endpoint=endpoint,
                cost=cost,
                input_zaaps=zaaps["input_zaaps"],
                output_zaaps=zaaps["output_zaaps"],
                total_zaaps=zaaps["total_zaaps"]
            )
            db.add(db_usage)
            db.commit()
            db.refresh(db_usage)
            
            # Keys para Redis
            total_key = f"{self.GPT_USAGE_PREFIX}{api_key}"
            daily_key = f"{self.DAILY_GPT_PREFIX}{api_key}:{today}"
            model_key = f"{self.MODEL_PREFIX}{api_key}:{model}"
            
            # Pipeline de Redis
            pipeline = self.redis.pipeline()
            
            # Actualizar contadores
            for key in [total_key, daily_key, model_key]:
                pipeline.hincrby(key, "input_tokens", input_tokens)
                pipeline.hincrby(key, "output_tokens", output_tokens)
                pipeline.hincrby(key, "total_tokens", total_tokens)
                pipeline.hincrby(key, "input_zaaps", int(zaaps["input_zaaps"]))
                pipeline.hincrby(key, "output_zaaps", int(zaaps["output_zaaps"]))
                pipeline.hincrby(key, "total_zaaps", int(zaaps["total_zaaps"]))
                
            pipeline.hincrby(model_key, "requests", 1)
            pipeline.expire(daily_key, timedelta(days=7))
            pipeline.execute()
            
            usage_data = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "model": self.MODELS[model]["display_name"],
                "model_key": model,
                "cost": cost,
                "zaaps": zaaps,
                "endpoint": endpoint
            }
            
            audit_logger.info(
                f"GPT usage tracked - User: {user.email}, Model: {model}, "
                f"Tokens: {total_tokens}, Zaaps: {zaaps['total_zaaps']}, Cost: ${cost:.4f}"
            )
            
            return usage_data
            
        except Exception as e:
            logger.error(f"Error tracking GPT usage: {str(e)}")
            raise e

    def get_user_usage_stats(self, db: Session, user: User) -> Dict:
        """
        Obtiene estadísticas completas de uso para un usuario.
        """
        try:
            # Obtener estadísticas de la base de datos
            total_usage = db.query(TokenUsage).filter(
                TokenUsage.user_id == user.id
            ).all()
            
            # Agrupar por modelo
            model_stats = {}
            total_cost = 0.0
            total_zaaps = 0.0
            
            for usage in total_usage:
                # Manejo de modelo no definido en self.MODELS
                if usage.model not in self.MODELS:
                    continue

                model_name = self.MODELS[usage.model]["display_name"]
                if model_name not in model_stats:
                    model_stats[model_name] = {
                        "requests": 0,
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "total_tokens": 0,
                        "input_zaaps": 0.0,
                        "output_zaaps": 0.0,
                        "total_zaaps": 0.0,
                        "cost": 0.0
                    }
                    
                stats = model_stats[model_name]
                stats["requests"] += 1
                stats["input_tokens"] += usage.input_tokens or 0
                stats["output_tokens"] += usage.output_tokens or 0
                stats["total_tokens"] += usage.total_tokens or 0
                
                stats["input_zaaps"] += usage.input_zaaps or 0.0
                stats["output_zaaps"] += usage.output_zaaps or 0.0
                stats["total_zaaps"] += usage.total_zaaps or 0.0
                stats["cost"] += usage.cost or 0.0
                
                total_cost += usage.cost or 0.0
                total_zaaps += usage.total_zaaps or 0.0
            
            return {
                "total_cost": total_cost,
                "total_zaaps": total_zaaps,
                "model_stats": model_stats,
                "usage_history": [
                    {
                        "timestamp": usage.created_at,
                        "model": self.MODELS[usage.model]["display_name"]
                                if usage.model in self.MODELS else usage.model,
                        "tokens": usage.total_tokens or 0,
                        "zaaps": usage.total_zaaps or 0.0,
                        "cost": usage.cost or 0.0
                    }
                    for usage in total_usage
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting user usage stats: {str(e)}")
            return {}

