from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# ✅ Enum exclusiva para Pydantic
class LicenseTypeEnum(str, Enum):
    STARTER = "STARTER"
    AVANZADO = "AVANZADO"
    PREMIUM = "PREMIUM"
    PILOT = "PILOT"  # Agregamos el tipo PILOT

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    country: str
    division: str
    company: str  # ✅ Ahora recibimos el nombre de la empresa en lugar de company_id
    license_type: LicenseTypeEnum
    phone: str

class UserCreate(UserBase):
    password: str = Field(min_length=8)
    password_confirm: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool
    api_key: str  # Manteniendo API Key
    company: str  # ✅ Aseguramos que la respuesta devuelve el nombre de la empresa

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Nuevos schemas para el registro de usuarios piloto
class PilotUserCreate(UserCreate):
    """Schema para la solicitud inicial de registro de usuarios piloto"""
    # Forzamos el tipo de licencia a PILOT
    license_type: LicenseTypeEnum = LicenseTypeEnum.PILOT

class PilotUserVerify(BaseModel):
    """Schema para la verificación de usuarios piloto"""
    email: EmailStr
    verification_code: str