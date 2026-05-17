"""
Schemas del flujo de Checkout.

Flujo:
  1. Usuario busca hoteles → recibe lista de HotelResultado
  2. Selecciona uno → POST /checkout/iniciar → recibe CheckoutSession
  3. Llena datos personales + tarjeta → POST /checkout/confirmar → recibe CheckoutConfirmado
  4. Se genera PDF y se envía email de confirmación
"""
from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional


# ──────────────────────────────────────────────────────────────────
# Paso 1: Iniciar checkout (selección de habitación)
# ──────────────────────────────────────────────────────────────────

class CheckoutIniciarRequest(BaseModel):
    """Datos de la habitación seleccionada en la búsqueda."""
    provider_id        : int
    room_id            : int
    hotel_nombre       : str
    habitacion_tipo    : str
    destino            : str
    check_in           : date
    check_out          : date
    huespedes          : int = Field(..., gt=0, le=10)
    precio_final_noche : float
    moneda             : str = "USD"


class CheckoutSession(BaseModel):
    """
    Resumen de la reserva antes de pagar.
    El frontend lo muestra en el paso de confirmación.
    """
    provider_id        : int
    room_id            : int
    hotel_nombre       : str
    habitacion_tipo    : str
    destino            : str
    check_in           : date
    check_out          : date
    huespedes          : int
    noches             : int
    precio_final_noche : float
    total_estimado     : float
    moneda             : str


# ──────────────────────────────────────────────────────────────────
# Paso 2: Confirmar checkout (datos cliente + pago)
# ──────────────────────────────────────────────────────────────────

class DatosCliente(BaseModel):
    """Datos personales del huésped principal."""
    nombres          : str = Field(..., min_length=2, max_length=100)
    apellidos        : str = Field(..., min_length=2, max_length=100)
    fecha_nacimiento : Optional[date] = None
    nacionalidad     : Optional[str]  = Field(None, max_length=80)
    email            : str = Field(..., min_length=5, max_length=120)


class DatosPago(BaseModel):
    """
    Datos de la tarjeta de crédito.
    NUNCA guardamos el número completo ni el CVV.
    Solo guardamos los últimos 4 dígitos y el nombre.
    """
    numero_tarjeta   : str = Field(..., min_length=13, max_length=19,
                                   description="Número completo — solo guardamos últimos 4 dígitos")
    cvv              : str = Field(..., min_length=3, max_length=4,
                                   description="CVV — NUNCA se almacena")
    nombre_en_tarjeta: str = Field(..., min_length=3, max_length=120)
    direccion_cobro  : str = Field(..., min_length=5, max_length=255)

    @field_validator("numero_tarjeta")
    @classmethod
    def validar_tarjeta(cls, v: str) -> str:
        digits = v.replace(" ", "").replace("-", "")
        if not digits.isdigit():
            raise ValueError("El número de tarjeta solo debe contener dígitos")
        if len(digits) < 13 or len(digits) > 19:
            raise ValueError("Número de tarjeta inválido")
        return digits  # guardamos solo dígitos sin espacios

    @field_validator("cvv")
    @classmethod
    def validar_cvv(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("CVV solo debe contener dígitos")
        return v


class CheckoutConfirmarRequest(BaseModel):
    """Body completo para confirmar el pago y crear la reserva."""
    # Datos de la habitación (mismo que CheckoutIniciarRequest)
    provider_id        : int
    room_id            : int
    hotel_nombre       : str
    habitacion_tipo    : str
    destino            : str
    check_in           : date
    check_out          : date
    huespedes          : int = Field(..., gt=0, le=10)
    precio_final_noche : float
    moneda             : str = "USD"

    # Datos del cliente y pago
    cliente : DatosCliente
    pago    : DatosPago


# ──────────────────────────────────────────────────────────────────
# Respuesta final del checkout
# ──────────────────────────────────────────────────────────────────

class CheckoutConfirmado(BaseModel):
    """Respuesta tras confirmar el pago exitosamente."""
    reservation_id        : int
    provider_booking_code : str
    hotel_nombre          : str
    habitacion_tipo       : str
    destino               : str
    check_in              : date
    check_out             : date
    huespedes             : int
    noches                : int
    total                 : float
    moneda                : str
    confirmed_at          : datetime
    pdf_url               : Optional[str] = None   # URL relativa para descargar PDF
    mensaje               : str = "Reserva confirmada. Recibirás un correo de confirmación."
