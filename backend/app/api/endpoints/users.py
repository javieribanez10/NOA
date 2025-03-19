# backend/app/api/endpoints/users.py

from datetime import timedelta, datetime
from typing import Any, Optional, Dict
from loguru import logger
import redis

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

# Importaciones locales
from app.core.config import settings
from app.core.security import verify_password, create_access_token
from app.database.models.session import get_db
from app.database.models.user import User, LicenseTypeSQLA
from app.services.user import UserService
from app.services.gpt_tracker import GPTTokenTracker
from app.services.api_key import APIKeyService
from app.services.company import get_or_create_company

# ================================================
# Configuración del router y OAuth2
# ================================================
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/token")  # Corregido el tokenUrl

# ================================================
# Configuración de Redis
# ================================================
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
    decode_responses=True
)

# ================================================
#                 Esquemas (Schemas)
# ================================================
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    country: str
    division: str
    company: str  # Nombre de la empresa (cadena que ingresará el usuario)
    license_type: str
    phone: str

class UserCreate(UserBase):
    password: str
    password_confirm: str

class PilotUserRegister(BaseModel):
    email: EmailStr
    full_name: str
    country: str
    division: str
    company: str
    phone: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    country: Optional[str] = None
    division: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    country: str
    division: str
    company_name: Optional[str] = None  # Asegurando que el nombre sea consistente
    license_type: str
    phone: str
    is_active: bool
    api_key: str
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    expires_at: str

# ================================================
# Dependencia para obtener usuario
# ================================================
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    request: Request = None
) -> User:
    """
    Obtiene el usuario actual basado en el token JWT.
    Verifica también que su sesión siga activa en Redis.
    Ahora incluye tracking de uso de API Key.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decodificar el token JWT
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        email: str = payload.get("sub")
        if not email:
            logger.warning("Token sin 'sub' válido")
            raise credentials_exception

        logger.info(f"Token decodificado correctamente para {email}")

    except JWTError as e:
        logger.error(f"Error al decodificar token: {str(e)}")
        raise credentials_exception

    # Obtener usuario de la base de datos
    user = UserService.get_user_by_email(db, email)
    if not user:
        logger.warning(f"Usuario no encontrado para email: {email}")
        raise credentials_exception

    # Verificar sesión en Redis
    session_data = UserService.get_user_session(user.id)
    if not session_data or session_data.get("email") != user.email:
        logger.warning(f"Sesión inválida o expirada para {user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión expirada o inválida",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Trackear uso de API Key solo si se proporciona la solicitud
    if request:
        api_key_service = APIKeyService(redis_client)
        api_key_service.increment_usage(user.api_key, request)

    return user

# ================================================
#                 Endpoints
# ================================================
@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Registra un nuevo usuario en el sistema.
    Verifica que la contraseña y su confirmación coincidan.
    Luego, crea o asigna la empresa (tabla companies) y enlaza user.company_id.
    """
    if user_data.password != user_data.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden"
        )

    try:
        # Crear el usuario
        new_user = await UserService.create_user(db, user_data)

        # Asignar la empresa
        # user_data.company es el nombre de la empresa que ingresó el usuario
        company_obj = get_or_create_company(db, user_data.company)
        new_user.company_id = company_obj.id
        db.commit()
        db.refresh(new_user)

        return new_user

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error inesperado al registrar usuario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error inesperado al registrar el usuario"
        )

# Nuevo endpoint para registro de usuarios piloto
@router.post("/register-pilot", status_code=status.HTTP_202_ACCEPTED)
async def register_pilot_user(
    user_data: PilotUserRegister,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Registra un nuevo usuario piloto.
    
    Genera una contraseña automáticamente, crea el usuario en la BD
    y envía las credenciales al administrador.
    """
    try:
        # Convertir el modelo Pydantic a diccionario
        user_data_dict = user_data.model_dump()
        
        # Registrar el usuario piloto (crea el usuario en la BD)
        _, response = await UserService.register_pilot_user(user_data_dict, db)
        return response

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error inesperado al registrar usuario piloto: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error inesperado al registrar el usuario piloto"
        )

# Agregamos un endpoint para que el admin recupere la contraseña de un usuario piloto
@router.get("/pilot-credentials/{email}", response_model=Dict[str, str])
async def get_pilot_credentials(
    email: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Obtiene las credenciales de un usuario piloto.
    Solo accesible por el administrador.
    """
    # Verificar si el usuario actual es administrador
    if current_user.email != settings.ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el administrador puede recuperar credenciales"
        )
    
    password = UserService.get_user_password(email)
    if not password:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron credenciales para este usuario o han expirado"
        )
    
    return {"email": email, "password": password}

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    Login de usuario y generación de token JWT.
    """
    # Buscar el usuario por email
    user = UserService.get_user_by_email(db, form_data.username)
    
    if not user:
        logger.warning(f"Intento de login con email no existente: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar la contraseña
    is_valid = verify_password(form_data.password, user.hashed_password)
    
    if not is_valid:
        logger.warning(f"Contraseña incorrecta para usuario: {form_data.username}")
        
        # Para depuración - comprobación especial para usuarios piloto
        pilot_password = UserService.get_user_password(form_data.username)
        if pilot_password:
            logger.info(f"Intentando login con usuario piloto. Contraseña en Redis: {pilot_password[:3]}***")
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token de acceso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email})

    # Almacenar datos de sesión en Redis
    session_data = {
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "license_type": user.license_type.value if hasattr(user.license_type, 'value') else user.license_type,
        "api_key": user.api_key
    }
    
    UserService.store_user_session(
        user.id, session_data, expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    logger.info(f"Inicio de sesión exitoso para: {user.email}")

    # Retornar token y expiración
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds()),  # en segundos
        "expires_at": (datetime.utcnow() + access_token_expires).isoformat()  # fecha/hora exacta
    }

# Alias para el endpoint de login (mantener compatibilidad)
@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    Alias para login_for_access_token
    """
    return await login_for_access_token(form_data, db)

@router.get("/me", response_model=UserResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene la información del usuario actual.
    """
    logger.info(f"Obteniendo perfil para usuario: {current_user.email}")
    return current_user

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Cierra la sesión del usuario actual (elimina su sesión en Redis).
    """
    redis_key = f"user_session:{current_user.id}"
    redis_client.delete(redis_key)
    return {"message": "Sesión cerrada exitosamente"}

@router.put("/me", response_model=UserResponse)
async def update_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Actualiza la información del usuario actual.
    Solo actualiza los campos enviados en el body.
    """
    try:
        logger.info(f"Actualizando perfil para usuario: {current_user.email}")
        logger.info(f"Datos de actualización: {user_update.model_dump()}")
        
        # Actualizar solo los campos incluidos en el request
        update_data = user_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            # Manejar caso especial para company (que es company_id en el modelo)
            if field == 'company':
                company_obj = get_or_create_company(db, value)
                setattr(current_user, 'company_id', company_obj.id)
            else:
                setattr(current_user, field, value)

        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Perfil actualizado exitosamente para: {current_user.email}")
        return current_user
    except Exception as e:
        db.rollback()
        logger.error(f"Error al actualizar perfil: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar perfil: {str(e)}"
        )

@router.get("/validate-session")
async def validate_session(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Valida si la sesión del usuario está activa.
    Si se logra obtener current_user, la sesión es válida.
    """
    return {"valid": True, "user_id": current_user.id}

@router.get("/usage", response_model=Dict[str, Any])
async def get_token_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Obtiene las estadísticas de uso de tokens.
    Se integran tanto las estadísticas de GPT (usando GPTTokenTracker)
    como las estadísticas de API Key (usando APIKeyService).
    """
    try:
        # Obtener estadísticas de uso con GPTTokenTracker
        gpt_tracker = GPTTokenTracker(redis_client)
        gpt_usage = gpt_tracker.get_user_usage_stats(db, current_user)
        gpt_usage["lastUpdated"] = datetime.utcnow().isoformat()

        # Obtener estadísticas de uso con APIKeyService
        api_key_service = APIKeyService(redis_client)
        api_usage = api_key_service.get_usage_stats(current_user.api_key)
        api_usage["last_updated"] = datetime.utcnow().isoformat()

        # Fusionar ambos resultados en un solo diccionario
        return {
            "gpt_usage": gpt_usage,
            "api_key_usage": api_usage
        }

    except Exception as e:
        logger.error(f"Error getting token usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving token usage"
        )