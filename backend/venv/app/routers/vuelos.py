from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.vuelos_service import buscar_vuelos_service
from app.schemas.vuelos_schema import VueloBusqueda, VueloBusquedaResponse
from app.database.database import get_db
from typing import List
from app.schemas.vuelos_schema import BusquedaResponse
from app.services.vuelos_service import obtener_busquedas_service

router = APIRouter()

@router.post("/", response_model=VueloBusquedaResponse)
def buscar_vuelos(data: VueloBusqueda, db: Session = Depends(get_db)):
    return buscar_vuelos_service(data, db)

@router.get("/busquedas", response_model=List[BusquedaResponse])
def obtener_busquedas(db: Session = Depends(get_db)):
    return obtener_busquedas_service(db)