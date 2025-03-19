from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, Dict, Tuple
from app.database.models.user import User, LicenseTypeSQLA
from app.database.models.company import Company
from app.schemas.user import UserCreate, LicenseTypeEnum
from app.core.security import get_password_hash, generate_api_key
import redis
from app.core.config import settings
import json
from loguru import logger
from app.services.email import FastapiMailService
import random
import string
from datetime import datetime, timedelta

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
    decode_responses=True 
)

logger.add("logs/user_service.log", rotation="500 MB")

class UserService:
    @staticmethod
    async def create_user(db: Session, user_data: UserCreate) -> User:
        try:
            existing_user = UserService.get_user_by_email(db, user_data.email)
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")

            if hasattr(user_data, 'password') and hasattr(user_data, 'password_confirm'):
                if user_data.password != user_data.password_confirm:
                    raise HTTPException(status_code=400, detail="Passwords don't match")
                password = user_data.password
            else:
                # Si no se proporciona contraseña, usamos la almacenada en Redis para usuarios piloto
                password = user_data.system_generated_password if hasattr(user_data, 'system_generated_password') else None
                if not password:
                    raise HTTPException(status_code=400, detail="No password provided")

            # Buscamos o creamos la empresa según su nombre
            company = db.query(Company).filter(Company.name == user_data.company).first()
            if not company:
                company = Company(name=user_data.company)
                db.add(company)
                db.commit()
                db.refresh(company)

            # Para usuarios piloto, forzamos el tipo de licencia a "PILOT"
            if hasattr(user_data, 'is_pilot') and user_data.is_pilot:
                license_type = LicenseTypeSQLA.PILOT
            else:
                # Aseguramos que license_type sea una enum de SQLAlchemy
                license_type = LicenseTypeSQLA(user_data.license_type) if isinstance(user_data.license_type, str) else user_data.license_type

            db_user = User(
                email=user_data.email,
                hashed_password=get_password_hash(password),
                full_name=user_data.full_name,
                country=user_data.country,
                division=user_data.division,
                license_type=license_type,
                company_id=company.id,
                phone=user_data.phone,
                api_key=generate_api_key()
            )

            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            try:
                await FastapiMailService.send_welcome_email(
                    email=db_user.email,
                    full_name=db_user.full_name
                )
            except Exception as e:
                logger.error(f"Error sending welcome email: {str(e)}")

            return db_user

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @staticmethod
    def generate_password(length=10) -> str:
        """Genera una contraseña alfanumérica aleatoria"""
        characters = string.ascii_letters + string.digits
        return ''.join(random.choice(characters) for _ in range(length))
    
    @staticmethod
    async def register_pilot_user(user_data: Dict, db: Session) -> Tuple[str, Dict]:
            """
            Registra un usuario piloto directamente, genera una contraseña y la envía al admin
            Crea el usuario en la base de datos y devuelve un mensaje para el usuario
            """
            try:
                # Verificar si el usuario ya existe
                existing_user = UserService.get_user_by_email(db, user_data['email'])
                if existing_user:
                    raise HTTPException(status_code=400, detail="Email already registered")
                
                # Generar contraseña aleatoria
                generated_password = UserService.generate_password()
                logger.info(f"Contraseña generada para usuario piloto: {user_data['email']}")
                
                # Crear objeto para crear el usuario
                user_dict = {
                    "email": user_data['email'],
                    "password": generated_password,
                    "password_confirm": generated_password,
                    "full_name": user_data['full_name'],
                    "country": user_data['country'],
                    "division": user_data['division'],
                    "company": user_data['company'],
                    "license_type": "PILOT",
                    "phone": user_data['phone']
                }
                
                # Crear UserCreate objeto para pasar al create_user
                from app.schemas.user import UserCreate
                user_create_data = UserCreate(**user_dict)
                
                # Crear el usuario en la base de datos
                db_user = await UserService.create_user(db, user_create_data)
                logger.info(f"Usuario piloto creado en base de datos: {db_user.id}")
                
                # Almacenar la contraseña en texto plano en Redis para que el admin pueda acceder a ella
                redis_key = f"pilot_password:{user_data['email']}"
                redis_client.setex(
                    redis_key,
                    60 * 60 * 24 * 7,  # 7 días en segundos
                    generated_password
                )
                logger.info(f"Contraseña almacenada en Redis para: {user_data['email']}")
                
                # Enviar email al administrador con los datos del usuario y la contraseña
                try:
                    await FastapiMailService.send_admin_credentials_email(
                        user_email=user_data['email'],
                        generated_password=generated_password,
                        user_data=user_data
                    )
                    logger.info(f"Email con credenciales enviado al administrador para: {user_data['email']}")
                except Exception as e:
                    logger.error(f"Error enviando email: {str(e)}")
                
                return generated_password, {
                    "message": "Tu cuenta ha sido creada. El administrador te proporcionará tus credenciales de acceso después de verificar tu información."
                }
                
            except Exception as e:
                if isinstance(e, HTTPException):
                    raise e
                logger.error(f"Error en registro de usuario piloto: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error en registro de usuario piloto: {str(e)}")
    
    @staticmethod
    def get_user_password(email: str) -> Optional[str]:
        """Recupera la contraseña del usuario piloto almacenada"""
        key = f"pilot_password:{email}"
        return redis_client.get(key)

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def store_user_session(user_id: int, session_data: Dict, expires: int = 86400) -> None:
        key = f"user_session:{user_id}"
        try:
            redis_client.setex(key, expires, json.dumps(session_data))
        except Exception as e:
            logger.error(f"Error storing session in Redis: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al almacenar la sesión"
            )

    @staticmethod
    def get_user_session(user_id: int) -> Optional[Dict]:
        key = f"user_session:{user_id}"
        try:
            data = redis_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Error retrieving session from Redis: {str(e)}")
            return None