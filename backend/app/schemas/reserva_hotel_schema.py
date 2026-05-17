"""
Schemas de Reserva Hotel actualizados.
Incluye los nuevos campos: hotel_nombre, habitacion_tipo, customer_id, confirmed_at.
"""
from pydantic import BaseModel, Field, model_validator
from datetime import date, datetime
from typing import Optional


class ReservaHotelCreate(BaseModel):
    provider_id : int
    room_id     : int
    destino     : str = Field(..., min_length=2, max_length=80)
    check_in    : date
    check_out   : date
    huespedes   : int = Field(..., gt=0, le=10)
    moneda      : str = Field(..., min_length=3, max_length=10)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_out <= self.check_in:
            raise ValueError("check_out debe ser posterior a check_in")
        return self


class ReservaHotelResponse(BaseModel):
    reservation_id        : int
    user_id               : int
    agency_id             : int
    provider_id           : int
    provider_booking_code : Optional[str]
    provider_status       : str
    room_id               : int
    provider_total_amount : float
    customer_id           : Optional[int]

    # Info de display
    hotel_nombre          : Optional[str]
    habitacion_tipo       : Optional[str]

    # Estancia
    destino               : str
    check_in              : date
    check_out             : date
    huespedes             : int
    moneda                : str

    # Precios
    precio_base_noche     : float
    precio_final_noche    : float
    markup_percent        : float
    noches                : int
    total_base            : float
    total                 : float

    # Tiempos
    confirmed_at          : Optional[datetime]
    created_at            : Optional[datetime]

    class Config:
        from_attributes = True
