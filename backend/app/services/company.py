# backend/app/services/company.py

from sqlalchemy.orm import Session
from app.database.models.company import Company

def get_or_create_company(db: Session, company_name: str) -> Company:
    """
    Busca la compañía por nombre. Si no existe, la crea.
    Retorna la instancia de la compañía.
    """
    company = db.query(Company).filter_by(name=company_name).first()
    if not company:
        company = Company(name=company_name)
        db.add(company)
        db.commit()
        db.refresh(company)
    return company
