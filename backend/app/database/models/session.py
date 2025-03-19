# backend/app/database/session.py

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Crear el motor de conexión a la base de datos usando la URL definida en las variables de entorno
engine = create_engine(settings.DATABASE_URL)

# Configuración de la sesión de SQLAlchemy
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarativa para los modelos
Base = declarative_base()

# Listener para establecer la variable de sesión 'app.current_user_id' en cada nueva transacción
@event.listens_for(SessionLocal, "after_begin")
def set_rls_parameter(session, transaction, connection):
    # Se espera que el id del usuario autenticado se almacene en session.info["current_user_id"]
    current_user_id = session.info.get("current_user_id")
    if current_user_id:
        # Usamos SET LOCAL para que la variable se aplique únicamente en la transacción actual
        connection.execute("SET LOCAL app.current_user_id = :user_id", {"user_id": current_user_id})

# Función para obtener la sesión de base de datos en cada request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()