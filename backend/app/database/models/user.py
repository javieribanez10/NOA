from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from typing import Optional
from app.database.models.session import Base
from app.database.models.company import Company  # Relación con la tabla Company
import sqlalchemy as sa

# ✅ Enum específica para SQLAlchemy
class LicenseTypeSQLA(str, enum.Enum):
    BUILDER = "BUILDER"
    SCALER = "SCALER"
    LEADER = "LEADER"
    PILOT = "PILOT"  # Agregamos el tipo PILOT para usuarios del programa piloto

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)  # Se utiliza para autenticar
    full_name = Column(String)
    country = Column(String)
    division = Column(String)

    # ✅ FK a la tabla companies
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)

    license_type = Column(Enum(LicenseTypeSQLA))  # Usa la enum de SQLAlchemy

    phone = Column(String)
    is_active = Column(Boolean, default=True)
    api_key = Column(String, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Se usa server_default=sa.text('now()') para que PostgreSQL asigne la fecha actual en la inserción
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()'))

    # Relación con la tabla Company
    company = relationship("Company", backref="users")

    @property
    def company_name(self) -> Optional[str]:
        """Retorna el nombre de la empresa si existe, o None."""
        return self.company.name if self.company else None