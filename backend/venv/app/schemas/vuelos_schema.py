from pydantic import BaseModel, Field
from datetime import date
from typing import List

class VueloBusqueda(BaseModel):
    origen: str = Field(..., min_length=3, max_length=3)
    destino: str = Field(..., min_length=3, max_length=3)
    fecha_salida: date
    pasajeros: int = Field(..., gt=0, le=10)

class VueloResultado(BaseModel):
    aerolinea: str
    precio: float
    moneda: str

class VueloBusquedaResponse(BaseModel):
    origen: str
    destino: str
    fecha_salida: date
    pasajeros: int
    resultados: List[VueloResultado]

class BusquedaResponse(BaseModel):
    id: int
    origen: str
    destino: str
    fecha_salida: date
    pasajeros: int

class Config:
    from_attributes = True