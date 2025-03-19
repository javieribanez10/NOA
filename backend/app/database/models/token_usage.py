# app/models/token_usage.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.database.models.session import Base
from sqlalchemy.orm import relationship

class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    model = Column(String)  # gpt-3.5-turbo, gpt-4, etc.
    input_tokens = Column(Integer)
    output_tokens = Column(Integer)
    total_tokens = Column(Integer)

    # Aquí, las columnas de Zaaps
    input_zaaps = Column(Float, default=0.0)
    output_zaaps = Column(Float, default=0.0)
    total_zaaps = Column(Float, default=0.0)

    endpoint = Column(String)     # /api/v1/chat, etc.
    cost = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="token_usage")

from app.database.models.user import User
User.token_usage = relationship("TokenUsage", back_populates="user")
