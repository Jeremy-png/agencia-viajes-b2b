from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.reserva_hotel_schema import ReservaHotelCreate, ReservaHotelResponse
from app.services.reserva_hotel_service import crear_reserva_hotel, listar_reservas_hotel
from app.services.reserva_hotel_provider_service import (
    consultar_reserva_en_proveedor,
    cancelar_reserva_en_proveedor
)

router = APIRouter()

# ✅ 1) CREAR reserva (integración real)
@router.post("/", response_model=ReservaHotelResponse)
def post_reserva_hotel(data: ReservaHotelCreate, db: Session = Depends(get_db)):
    return crear_reserva_hotel(db, data)

# ✅ 2) LISTAR reservas (MySQL)
@router.get("/", response_model=list[ReservaHotelResponse])
def get_reservas_hotel(db: Session = Depends(get_db)):
    return listar_reservas_hotel(db)

# ✅ 3) CONSULTAR estado real en proveedor
@router.get("/{reservation_id}/provider")
def get_reserva_provider(reservation_id: int, db: Session = Depends(get_db)):
    return consultar_reserva_en_proveedor(db, reservation_id)

# ✅ 4) CANCELAR en proveedor + actualizar local
@router.post("/{reservation_id}/cancelar")
def cancelar_reserva(reservation_id: int, db: Session = Depends(get_db)):
    return cancelar_reserva_en_proveedor(db, reservation_id)