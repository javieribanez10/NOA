# app/api/endpoints/upload.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Form
from typing import Dict, Any
import tempfile
import os
import time
import threading
from loguru import logger

from app.database.models.user import User
from app.api.endpoints.users import get_current_user
from app.database.models.session import get_db
from sqlalchemy.orm import Session

from app.database.models.uploaded_files import UploadedFile
from app.services.ML.embeddings.generation.text_embeddings_processor import EnhancedTextEmbeddingsProcessor

router = APIRouter()

def schedule_file_deletion(file_path: str, delay: int = 600):
    """
    Programa la eliminación del archivo después de un tiempo determinado.
    """
    def delete_file():
        time.sleep(delay)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"✅ Archivo temporal eliminado: {file_path}")
            except Exception as e:
                logger.error(f"❌ Error eliminando archivo temporal {file_path}: {str(e)}")

    threading.Thread(target=delete_file, daemon=True).start()


@router.post("/file", status_code=status.HTTP_200_OK)
async def upload_file(
    section: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sube un archivo, genera embeddings y registra el nombre en la BD (uploaded_files).
    Luego, el frontend puede listarlo con GET /api/v1/user-files.
    """
    try:
        # Validar extensión
        file_extension = file.filename.split(".")[-1].lower()
        allowed_extensions = ["csv", "xlsx", "pdf", "txt", "docx"]
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Formato de archivo no soportado ({file_extension}). "
                       "Solo se admiten: CSV, XLSX, PDF, TXT, DOCX."
            )

        # Guardar archivo temporal
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}")
        contents = await file.read()
        temp_file.write(contents)
        temp_file.close()

        logger.info(f"Archivo '{file.filename}' subido por {current_user.email} (ID: {current_user.id})")

        # 1) Crear el registro en BD
        new_file = UploadedFile(
            user_id=current_user.id,
            original_filename=file.filename,
            file_size=len(contents),
            processing_status="processing", # Estado inicial
            section=section
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)

        # Programar eliminación automática del archivo temporal (opcional)
        schedule_file_deletion(temp_file.name)

        # 2) Generar embeddings
        try:
            processor = EnhancedTextEmbeddingsProcessor(current_user.email, current_user.id)
            await processor.process_text_file(temp_file.name, file.filename)
            logger.info(f"Embeddings generados para '{file.filename}' (usuario: {current_user.email})")

            # Actualizar estado a 'completed'
            new_file.processing_status = "completed"
            db.commit()

        except Exception as e:
            logger.error(f"Error generando embeddings para '{file.filename}': {e}")
            new_file.processing_status = "error"
            db.commit()

        # 3) Responder con info mínima (id y filename)
        return {
            "file_id": new_file.id,
            "filename": new_file.original_filename,
            "message": "Archivo subido y procesado con éxito."
        }

    except Exception as e:
        logger.error(f"Error en upload_file: {str(e)}")
        # Eliminar archivo temporal en caso de error
        if 'temp_file' in locals() and os.path.exists(temp_file.name):
            os.remove(temp_file.name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


from app.database.models.manual_entries import ManualEntry

@router.post("/manual", status_code=status.HTTP_200_OK)
async def upload_manual(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Maneja la "carga manual" de texto, genera embeddings y guarda un registro en BD.
    """
    try:
        # Obtener el título según la sección y campos disponibles
        section = data.get('section', 'products')
        title = data.get('title') or data.get('productName') or data.get('topic') or "Entrada Manual"
        
        # Combinar campos en un texto
        combined_text = ""
        for key, value in data.items():
            if isinstance(value, str) and key != 'section':
                combined_text += f"{key}: {value}\n"

        if not combined_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se recibió contenido válido para la carga manual."
            )

        logger.info(f"Carga manual recibida de {current_user.email} con {len(data.keys())} campos.")

        # 1) Crear un registro en BD
        new_entry = ManualEntry(
            user_id=current_user.id,
            title=title,
            content=data,  # Guardamos todo el objeto JSON
            section=section
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)

        # 2) Generar embeddings
        try:
            processor = EnhancedTextEmbeddingsProcessor(current_user.email, current_user.id)
            await processor.process_raw_text(combined_text, title=title)
            logger.info(f"Embeddings generados para la carga manual (usuario: {current_user.email})")
        except Exception as e:
            logger.error(f"Error generando embeddings para la carga manual: {e}")
            # No fallamos toda la operación si los embeddings fallan
            # pero marcamos el error

        return {
            "id": new_entry.id,
            "title": new_entry.title,
            "message": "Carga manual procesada y embeddings generados con éxito."
        }

    except Exception as e:
        logger.error(f"Error en upload_manual: {e}")
        raise HTTPException(status_code=500, detail=str(e))
