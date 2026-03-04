from pydantic import BaseModel
from datetime import date
from typing import List

class VueloBusqueda(BaseModel):
    origen: str
    destino: str
    fecha_salida: date
    pasajeros: int

class VueloResultado(BaseModel):
    provider_id: int
    aerolinea: str
    precio_base: float
    precio_final: float
    moneda: str

class VueloBusquedaResponse(BaseModel):
    origen: str
    destino: str
    fecha_salida: date
    pasajeros: int
    resultados: List[VueloResultado]
