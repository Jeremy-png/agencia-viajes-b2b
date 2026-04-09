from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class ReservaHotelCreate(BaseModel):
    provider_id: int
    hotel_codigo: str = Field(..., min_length=3, max_length=30)
    habitacion_tipo: str = Field(..., min_length=3, max_length=30)

    destino: str = Field(..., min_length=2, max_length=80)
    check_in: date
    check_out: date
    huespedes: int = Field(..., gt=0, le=10)

    precio_final_noche: float = Field(..., gt=0)
    moneda: str = Field(..., min_length=3, max_length=10)

    # Lo llenaremos cuando exista el sistema de hoteles real
    provider_booking_code: Optional[str] = None

class ReservaHotelResponse(BaseModel):
    reservation_id: int
    provider_id: int
    provider_booking_code: Optional[str]

    hotel_codigo: str
    habitacion_tipo: str
    destino: str
    check_in: date
    check_out: date
    huespedes: int

    precio_final_noche: float
    moneda: str

    class Config:
        from_attributes = True