from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.schemas.provider_schema import ProviderCreate, ProviderResponse
from app.services.provider_service import create_provider, list_providers

router = APIRouter()

@router.post("/", response_model=ProviderResponse)
def create(data: ProviderCreate, db: Session = Depends(get_db)):
    """
    Endpoint HTTP para crear proveedor.
    - FastAPI valida el body con ProviderCreate
    - Inyecta db session con Depends(get_db)
    - Llama al service
    - Devuelve ProviderResponse
    """
    return create_provider(db, data)

@router.get("/", response_model=List[ProviderResponse])
def list_all(db: Session = Depends(get_db)):
    """
    Endpoint HTTP para listar proveedores.
    """
    return list_providers(db)