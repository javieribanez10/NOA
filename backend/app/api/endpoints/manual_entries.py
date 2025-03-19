# app/api/endpoints/manual_entries.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.endpoints.users import get_current_user
from app.database.models.session import get_db
from app.database.models.manual_entries import ManualEntry
from app.database.models.user import User

router = APIRouter()

@router.delete("/{entry_id}", status_code=204)
async def delete_manual_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina una entrada manual y sus embeddings asociados.
    """
    # Buscar la entrada manual asegurando que pertenezca al usuario actual
    entry = db.query(ManualEntry).filter(
        ManualEntry.id == entry_id,
        ManualEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Entrada manual no encontrada o no pertenece al usuario actual"
        )
    
    try:
        # 1. Eliminar embeddings asociados mediante el servicio
        from app.services.ML.embeddings.generation.text_embeddings_processor import EnhancedTextEmbeddingsProcessor
        processor = EnhancedTextEmbeddingsProcessor(current_user.email, current_user.id)
        await processor.delete_embeddings_for_file(entry.title)
        
        # 2. Eliminar el registro de la base de datos
        db.delete(entry)
        db.commit()
        
        return None  # Código 204 No Content
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar la entrada manual: {str(e)}"
        )