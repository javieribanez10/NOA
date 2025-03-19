# app/database/models/noa_config.py

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.models.session import Base
from app.database.models.user import User

class NoaConfig(Base):
    __tablename__ = "noa_config"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    prompt = Column(String, nullable=False, default="")
    model = Column(String, nullable=False, default="gpt4")
    temperature = Column(Float, nullable=False, default=0.7)
    personality = Column(String, nullable=False, default="professional")
    objective = Column(String, nullable=False, default="sales")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación con el modelo de usuario (si deseas vincular la config a un usuario)
    user = relationship("User", backref="noa_configs")
