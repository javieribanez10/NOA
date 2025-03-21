# backend/app/database/models/init_db.py

from app.database.models.session import engine, Base
# Importar aquí todos tus modelos para que se registren en Base.metadata
from app.database.models import user, lead, manual_entries, noa_config, token_usage, uploaded_files

def init_database():
    # Esto crea todas las tablas que aún no existan en la base de datos
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_database()
