from pydantic import BaseModel, Field
from datetime import date

class ReservaVueloCreate(BaseModel):
    provider_id: int
    provider_flight_code: str

    origen: str 
    destino: str 
    fecha_salida: date
    pasajeros: int 

    precio_final: float 
    moneda: str

class ReservaVueloResponse(BaseModel):
    reservation_id: int
    provider_id: int
    provider_flight_code: str
    origen: str
    destino: str
    fecha_salida: date
    pasajeros: int
    precio_final: float
    moneda: str

    class Config:
        from_attributes = True