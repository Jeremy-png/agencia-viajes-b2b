from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.hoteles_schema import HotelBusqueda, HotelBusquedaResponse
from app.services.hoteles_service import buscar_hoteles_service

# ✅ nuevo import: el dependency que valida JWT y te devuelve el usuario
from app.core.auth_dependencies import get_current_user

router = APIRouter()

@router.post("/buscar", response_model=HotelBusquedaResponse)
def buscar_hoteles(data: HotelBusqueda, db: Session = Depends(get_db)):
    agency_id = data.agency_id or 1  # si no mandan, usamos Agencia A por defecto
    return buscar_hoteles_service(data, db, agency_id)