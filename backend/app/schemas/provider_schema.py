from pydantic import BaseModel, Field
from typing import Literal

class ProviderCreate(BaseModel):
    """
    Request schema (entrada):
    Define el JSON que el cliente DEBE enviar para crear un proveedor.
    """
    name: str = Field(..., min_length=2, max_length=100)
    provider_type: Literal["HOTEL"]
    base_url: str = Field(..., min_length=5, max_length=255)
    is_active: bool = True

    # 0.10 = 10%. Guardaremos porcentaje en formato 0..1
    agency_markup_percent: float = Field(..., ge=0, le=1)

class ProviderResponse(BaseModel):
    """
    Response schema (salida):
    Define el JSON que la API DEVUELVE al cliente.
    Incluye provider_id (lo genera MySQL).
    """
    provider_id: int
    name: str
    provider_type: str
    base_url: str
    is_active: bool
    agency_markup_percent: float

    class Config:
        from_attributes = True