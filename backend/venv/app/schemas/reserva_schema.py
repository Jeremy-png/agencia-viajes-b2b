from pydantic import BaseModel
from datetime import date

class ReservaCreate(BaseModel):
    origen: str
    destino: str
    fecha_salida: date
    pasajeros: int
    aerolinea: str
    precio: float
    moneda: str

class ReservaResponse(BaseModel):
    id: int
    origen: str
    destino: str
    fecha_salida: date
    pasajeros: int
    aerolinea: str
    precio: float
    moneda: str

    class Config:
        from_attributes = True