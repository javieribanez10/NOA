# app/database/models/uploaded_files.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.models.session import Base

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)
    processing_status = Column(String(50), nullable=True, default="pending")
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    section = Column(String(50), nullable=True, default="products")  # Añadido campo para sección

    # (Si quieres relacionarlo con ChatSession o Company, déjalo)
    # chat_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=True, index=True)
    # chat = relationship("ChatSession", back_populates="files")

    # organization_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    # organization = relationship("Company", backref="uploaded_files")