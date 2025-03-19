# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.models.init_db import init_database
from app.core.services import init_services
from app.utils.error_handlers import http_error_handler, CustomException
from starlette.responses import JSONResponse
import openai
from app.api.endpoints import users
from app.api.endpoints import noa  # <-- Importa tu archivo noa.py
from app.core.logger import logger
from app.api.endpoints import upload
from app.api.endpoints import user_files
from app.api.endpoints import manual_entries  # <-- Importa el nuevo archivo manual_entries.py
from app.api.endpoints import chat

app = FastAPI(title="NOA API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Inicializar servicios en el evento de startup
@app.on_event("startup")
async def startup_event():
    try:
        init_database()
        init_services()
        logger.info("Servicios inicializados correctamente")
    except Exception as e:
        logger.error(f"Error al inicializar servicios: {str(e)}")
        raise e

# Error handlers
@app.exception_handler(HTTPException)
async def custom_http_error_handler(request, exc):
    return await http_error_handler(request, exc)

@app.exception_handler(CustomException)
async def custom_exception_handler(request, exc: CustomException):
    return JSONResponse(status_code=exc.code, content={"detail": exc.message})

# Health y Status endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ZAAS API"
    }

@app.get("/status")
async def status_check():
    return {
        "status": "operational",
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "redis": "connected",
            "openai": "configured"
        }
    }

# Routers existentes
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
# <-- Agrega el include_router para NOA:
app.include_router(noa.router, prefix="/api/v1/noa", tags=["noa"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"])
app.include_router(user_files.router, prefix="/api/v1/user-files", tags=["user_files"])
# <-- Agrega el include_router para entradas manuales:
app.include_router(manual_entries.router, prefix="/api/v1/manual-entries", tags=["manual_entries"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])

@app.get("/")
async def root():
    return {"message": "Welcome to NOA API"}