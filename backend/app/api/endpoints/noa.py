# app/api/endpoints/noa.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.models.session import get_db
from app.database.models.noa_config import NoaConfig
from app.database.models.user import User
from app.api.endpoints.users import get_current_user  # Para vincular a un usuario logueado

router = APIRouter()

class NoaConfigSchema(BaseModel):
    prompt: str
    model: str
    temperature: float
    personality: str
    objective: str

@router.get("/config", response_model=NoaConfigSchema)
def get_noa_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Buscar si hay una config para este usuario
    config_db = db.query(NoaConfig).filter_by(user_id=current_user.id).first()
    if not config_db:
        # Retornar valores por defecto si no existe
        return NoaConfigSchema(
            prompt="",
            model="gpt4",
            temperature=0.7,
            personality="professional",
            objective="sales"
        )
    return NoaConfigSchema(
        prompt=config_db.prompt,
        model=config_db.model,
        temperature=config_db.temperature,
        personality=config_db.personality,
        objective=config_db.objective
    )

@router.post("/config")
def save_noa_config(
    config: NoaConfigSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Asegurarse de que la temperatura sea un número válido
    try:
        temp_value = float(config.temperature)
    except Exception as e:
        raise HTTPException(status_code=400, detail="El valor de 'temperature' es inválido.")

    # Buscar si ya existe una configuración para este usuario
    config_db = db.query(NoaConfig).filter_by(user_id=current_user.id).first()
    
    if config_db:
        # Actualizar la configuración existente
        config_db.prompt = config.prompt
        config_db.model = config.model
        config_db.temperature = temp_value
        config_db.personality = config.personality
        config_db.objective = config.objective
    else:
        # Crear una nueva configuración
        config_db = NoaConfig(
            user_id=current_user.id,
            prompt=config.prompt,
            model=config.model,
            temperature=temp_value,
            personality=config.personality,
            objective=config.objective
        )
        db.add(config_db)
    
    try:
        db.commit()
        db.refresh(config_db)
    except Exception as e:
        db.rollback()
        # Registra el error para poder depurar
        raise HTTPException(status_code=500, detail="Error al guardar la configuración: " + str(e))
    
    return {"message": "Configuración guardada con éxito"}
