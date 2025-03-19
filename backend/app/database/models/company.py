# backend/app/models/company.py

from sqlalchemy import Column, Integer, String
from app.database.models.session import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)

    # Si lo deseas, puedes poner un relationship para ver los usuarios
    # company.users -> la lista de usuarios
    # from sqlalchemy.orm import relationship
    # users = relationship("User", back_populates="company")
