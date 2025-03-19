from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
   model_config = SettingsConfigDict(
       env_file=".env",
       case_sensitive=True,
       extra="allow"
   )
   
   gittoken: str | None = None
   
   # Database
   POSTGRES_USER: str 
   POSTGRES_PASSWORD: str
   POSTGRES_DB: str
   POSTGRES_HOST: str = "localhost"
   POSTGRES_PORT: str = "5432"
   DATABASE_URL: Optional[str] = None

   # Redis
   REDIS_HOST: str = "localhost"
   REDIS_PORT: int = 6379
   REDIS_DB: int = 0
   REDIS_PASSWORD: Optional[str] = None

   # Security
   JWT_SECRET_KEY: str = "temporalSecretKey123"
   JWT_ALGORITHM: str = "HS256"
   ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
   REFRESH_TOKEN_EXPIRE_DAYS: int = 7

   # Application Hosts and Ports
   BACKEND_HOST: str = "0.0.0.0"
   BACKEND_PORT: str = "8000"
   FRONTEND_HOST: str = "0.0.0.0" 
   FRONTEND_PORT: str = "5173"

   # OpenAI
   OPENAI_API_KEY: str

    # Pinecone
   PINECONE_API_KEY: str
   PINECONE_ENVIRONMENT: str = "us-east-1"
   PINECONE_INDEX: str = "webapp"
   EMBEDDINGS_DIMENSION: int = 3072  
   PINECONE_MAX_RETRIES: int = 3
   PINECONE_RETRY_DELAY: float = 1.0
   CHUNK_SIZE: int = 512
   BATCH_SIZE: int = 100

   # Mail
   MAIL_USERNAME: str
   MAIL_PASSWORD: str
   MAIL_FROM: str
   MAIL_PORT: int = 587
   MAIL_SERVER: str = "smtp.gmail.com"
   
   # Admin settings for pilot program
   ADMIN_EMAIL: str = ""  # Por defecto vacío, se asignará en el init

   def __init__(self, **kwargs):
       super().__init__(**kwargs)
       self.DATABASE_URL = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
       # Utilizar MAIL_FROM como email del administrador
       self.ADMIN_EMAIL = self.MAIL_FROM

settings = Settings()