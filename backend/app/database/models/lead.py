# backend/app/database/models/lead.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.models.session import Base
from app.database.models.company import Company  # Para que la FK funcione correctamente

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    # Nombre de la empresa del lead (no confundir con la tabla Company)
    company_name = Column(String(255), nullable=True)
    sector = Column(String(100), nullable=True)
    location = Column(String(100), nullable=True)
    interested_product = Column(String(255), nullable=True)

    # "Caliente", "Tibio" o "Frío", etc.
    lead_type = Column(String(50), nullable=True)  

    # "Página Web", "Meta", "Google Ads", etc.
    channel = Column(String(100), nullable=True)

    # Opcional: si deseas diferenciar de channel
    lead_source = Column(String(100), nullable=True)

    # "Completado", "En proceso", "Perdido", "Fuga", etc.
    status = Column(String(50), nullable=True)

    first_contact = Column(DateTime(timezone=True), nullable=True)
    last_contact = Column(DateTime(timezone=True), nullable=True)

    # Métricas para análisis (se pueden recalcular)
    conversations_count = Column(Integer, default=0)
    avg_response_time = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación con la tabla Company
    company = relationship("Company", backref="leads", lazy="joined")
