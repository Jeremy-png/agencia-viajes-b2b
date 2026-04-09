from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.hoteles_schema import HotelBusqueda, HotelBusquedaResponse
from app.services.hoteles_service import buscar_hoteles_service

router = APIRouter()

@router.post("/buscar", response_model=HotelBusquedaResponse)
def buscar_hoteles(data: HotelBusqueda, db: Session = Depends(get_db)):
    return buscar_hoteles_service(data, db)