from app.database.models.session import engine
from app.database.models import user

def init_database():
    user.Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_database()