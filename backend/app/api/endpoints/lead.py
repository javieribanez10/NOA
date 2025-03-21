from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.database.models.lead import Lead
from app.database.models.session import get_db
from app.core.logger import logger  # Importa el logger configurado

router = APIRouter()

# Esquema de respuesta actualizado para Pydantic v2
class LeadOut(BaseModel):
    id: int
    company_id: int
    name: str
    email: str | None
    phone: str | None
    company_name: str | None
    sector: str | None
    location: str | None
    interested_product: str | None
    lead_type: str | None
    channel: str | None
    lead_source: str | None
    status: str | None
    first_contact: datetime | None  # Cambiado a datetime para que valide correctamente
    last_contact: datetime | None   # Cambiado a datetime para que valide correctamente
    conversations_count: int
    avg_response_time: str | None

    model_config = ConfigDict(
        from_attributes=True,  # Permite cargar desde atributos del ORM
        json_encoders={datetime: lambda v: v.isoformat() if v else None},
    )

# Al usar la ruta "/" y al registrar el router con el prefijo en main.py,
# la URL completa será /api/v1/leads/
@router.get("/", response_model=List[LeadOut])
def get_leads(db: Session = Depends(get_db)):
    try:
        leads = db.query(Lead).all()
        logger.info(f"Se han recuperado {len(leads)} leads de la base de datos.")
        return leads
    except Exception as e:
        logger.error(f"Error al obtener leads: {e}", exc_info=True)
        raise e
