# app/database/models/manual_entries.py

from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database.models.session import Base

class ManualEntry(Base):
    __tablename__ = "manual_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    content = Column(JSON, nullable=False)  # Almacena los campos como JSON
    section = Column(String(50), nullable=True, default="products")
    created_at = Column(DateTime(timezone=True), server_default=func.now())