from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.vuelos_schema import VueloBusqueda, VueloBusquedaResponse
from app.services.vuelos_service import buscar_vuelos_service

router = APIRouter()

@router.post("/", response_model=VueloBusquedaResponse)
def buscar_vuelos(data: VueloBusqueda, db: Session = Depends(get_db)):
    return buscar_vuelos_service(data, db)