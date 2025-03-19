# app/api/endpoints/user_files.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.endpoints.users import get_current_user
from app.database.models.session import get_db
from app.database.models.uploaded_files import UploadedFile
from app.database.models.user import User

router = APIRouter()

# Actualizar en app/api/endpoints/user_files.py

from app.database.models.manual_entries import ManualEntry

@router.get("/", response_model=List[dict])
def get_user_files(
    section: Optional[str] = Query(None, description="Filtrar por sección"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna la lista de archivos y entradas manuales subidos por el usuario actual.
    Opcionalmente se puede filtrar por sección.
    """
    result = []
    
    # 1. Consultar archivos subidos
    file_query = db.query(UploadedFile).filter(UploadedFile.user_id == current_user.id)
    if section:
        file_query = file_query.filter(UploadedFile.section == section)
    
    files = file_query.all()
    
    for f in files:
        result.append({
            "id": f.id,
            "original_filename": f.original_filename,
            "file_size": f.file_size,
            "processing_status": f.processing_status,
            "upload_date": f.upload_date,
            "section": f.section or "products",
            "type": "file"  # Marcamos el tipo para diferenciarlo
        })
    
    # 2. Consultar entradas manuales
    manual_query = db.query(ManualEntry).filter(ManualEntry.user_id == current_user.id)
    if section:
        manual_query = manual_query.filter(ManualEntry.section == section)
    
    manuals = manual_query.all()
    
    for m in manuals:
        result.append({
            "id": m.id,
            "original_filename": m.title,  # Usamos el título como nombre de archivo
            "file_size": 0,  # No aplicable para entradas manuales
            "processing_status": "completed",  # Siempre completadas
            "upload_date": m.created_at,
            "section": m.section or "products",
            "type": "manual",  # Marcamos como manual
            "content": m.content  # Incluimos el contenido JSON
        })
    
    # Ordenamos por fecha más reciente primero
    result.sort(key=lambda x: x["upload_date"], reverse=True)
    
    return result

@router.delete("/{file_id}", status_code=204)
async def delete_user_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un archivo subido por el usuario y sus embeddings asociados.
    """
    # Buscar el archivo asegurando que pertenezca al usuario actual
    file = db.query(UploadedFile).filter(
        UploadedFile.id == file_id,
        UploadedFile.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=404,
            detail="Archivo no encontrado o no pertenece al usuario actual"
        )
    
    try:
        # 1. Eliminar embeddings asociados mediante el servicio
        from app.services.ML.embeddings.generation.text_embeddings_processor import EnhancedTextEmbeddingsProcessor
        processor = EnhancedTextEmbeddingsProcessor(current_user.email, current_user.id)
        await processor.delete_embeddings_for_file(file.original_filename)
        
        # 2. Eliminar el registro de la base de datos
        db.delete(file)
        db.commit()
        
        return None  # Código 204 No Content
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar el archivo: {str(e)}"
        )