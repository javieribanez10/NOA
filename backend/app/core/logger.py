from loguru import logger
import sys
from pathlib import Path

# Crear directorio de logs si no existe
Path("logs").mkdir(exist_ok=True)

# Remover el handler por defecto
logger.remove()

# Configurar el formato de los logs
log_format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)

# Añadir handler para consola (stdout)
logger.add(
    sys.stdout,
    format=log_format,
    level="INFO",
    colorize=True
)

# Añadir handler para archivo con rotación
logger.add(
    "logs/app.log",
    format=log_format,
    level="INFO",
    rotation="1 MB",
    retention="10 days",
    compression="zip",
    backtrace=True,
    diagnose=True
)

# Añadir handler específico para errores
logger.add(
    "logs/error.log",
    format=log_format,
    level="ERROR",
    rotation="1 MB",
    retention="10 days",
    compression="zip",
    backtrace=True,
    diagnose=True
)

# Handler específico para audit logs (seguridad y autenticación)
logger.add(
    "logs/audit.log",
    format=log_format,
    level="INFO",
    rotation="1 MB",
    retention="30 days",
    compression="zip",
    filter=lambda record: "audit" in record["extra"]
)

def get_audit_logger():
    """
    Retorna un logger configurado específicamente para logs de auditoría
    """
    return logger.bind(audit=True)

# Exportar el logger configurado
__all__ = ["logger", "get_audit_logger"]