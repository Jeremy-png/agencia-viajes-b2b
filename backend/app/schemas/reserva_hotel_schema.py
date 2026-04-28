from pydantic import BaseModel, Field, model_validator
from datetime import date
from typing import Optional

class ReservaHotelCreate(BaseModel):
    provider_id: int
    room_id: int

    destino: str = Field(..., min_length=2, max_length=80)
    check_in: date
    check_out: date
    huespedes: int = Field(..., gt=0, le=10)

    moneda: str = Field(..., min_length=3, max_length=10)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_out <= self.check_in:
            raise ValueError("check_out debe ser posterior a check_in")
        return self

class ReservaHotelResponse(BaseModel):
    reservation_id: int
    provider_id: int
    provider_booking_code: Optional[str]

    room_id: int
    provider_total_amount: float
    provider_status: str

    destino: str
    check_in: date
    check_out: date
    huespedes: int
    moneda: str

    # auditoría de precios
    precio_base_noche: float
    precio_final_noche: float
    markup_percent: float
    noches: int
    total_base: float
    total: float

    class Config:
        from_attributes = True