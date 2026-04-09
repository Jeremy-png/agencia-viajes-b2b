from pydantic import BaseModel, Field
from datetime import date
from typing import List

class HotelBusqueda(BaseModel):
    destino: str = Field(..., min_length=2, max_length=80)
    check_in: date
    check_out: date
    huespedes: int = Field(..., gt=0, le=10)

class HotelResultado(BaseModel):
    provider_id: int
    cadena_hotel: str
    hotel_codigo: str
    habitacion_tipo: str
    precio_base_noche: float
    precio_final_noche: float
    moneda: str

class HotelBusquedaResponse(BaseModel):
    destino: str
    check_in: date
    check_out: date
    huespedes: int
    resultados: List[HotelResultado]