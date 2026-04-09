from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.schemas.reserva_hotel_schema import ReservaHotelCreate, ReservaHotelResponse
from app.services.reserva_hotel_service import crear_reserva_hotel, listar_reservas_hotel

router = APIRouter()

@router.post("/", response_model=ReservaHotelResponse)
def reservar_hotel(data: ReservaHotelCreate, db: Session = Depends(get_db)):
    return crear_reserva_hotel(db, data)

@router.get("/", response_model=List[ReservaHotelResponse])
def obtener_reservas(db: Session = Depends(get_db)):
    return listar_reservas_hotel(db)