from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.schemas.reserva_schema import ReservaCreate, ReservaResponse
from app.services.reserva_service import crear_reserva_service, obtener_reservas_service

router = APIRouter()

@router.post("/", response_model=ReservaResponse)
def crear_reserva(data: ReservaCreate, db: Session = Depends(get_db)):
    return crear_reserva_service(data, db)

@router.get("/", response_model=List[ReservaResponse])
def obtener_reservas(db: Session = Depends(get_db)):
    return obtener_reservas_service(db)