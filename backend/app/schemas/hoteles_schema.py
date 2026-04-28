from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional

class HotelBusqueda(BaseModel):
    destino: str = Field(..., min_length=2, max_length=80)
    check_in: date
    check_out: date
    huespedes: int = Field(..., gt=0, le=10)

    # filtros opcionales (si no los usas, igual no estorban)
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    room_type_id: Optional[int] = None
    min_rating: Optional[float] = None

class HotelResultado(BaseModel):
    provider_id: int
    cadena_hotel: str

    city_id: int
    hotel_id: int
    hotel_nombre: str

    room_id: int
    room_nombre: str
    room_type: str
    max_guests: int

    precio_base_noche: float
    precio_final_noche: float
    moneda: str

class HotelBusquedaResponse(BaseModel):
    destino: str
    check_in: date
    check_out: date
    huespedes: int
    resultados: List[HotelResultado]