from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.reserva_vuelo_schema import ReservaVueloCreate, ReservaVueloResponse
from app.services.reserva_vuelo_service import crear_reserva_vuelo

router = APIRouter()

@router.post("/", response_model=ReservaVueloResponse)
def reservar_vuelo(data: ReservaVueloCreate, db: Session = Depends(get_db)):
    return crear_reserva_vuelo(db, data)