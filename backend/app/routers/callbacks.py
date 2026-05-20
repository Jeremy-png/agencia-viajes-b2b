"""Router de Callbacks entrantes desde proveedores (HotelChain)."""
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database.database import get_db
from app.core.config import settings
from app.models.reserva_hotel import ReservaHotel
from app.models.customer import Customer
from app.services.audit_service import log_operation
from app.services.email_service import send_cancellation_email

router = APIRouter()


class ReservacionCambioPayload(BaseModel):
    """Payload que envía el HotelChain cuando cambia el estado de una reserva."""
    code      : str                    # Código de reserva del proveedor (ej. R-20260518-XXXXXX)
    oldStatus : Optional[str] = None   # Estado anterior
    newStatus : str                    # Nuevo estado (CANCELED, MODIFIED, etc.)
    reason    : Optional[str] = None   # Motivo del cambio
    changedAt : Optional[str] = None   # Timestamp del cambio


@router.post("/reservacion-cambio", tags=["Callbacks"])
async def recibir_cambio_reservacion(
    payload: ReservacionCambioPayload,
    db     : Session = Depends(get_db),
    x_callback_secret: Optional[str] = Header(default=None),
):
    """
    Recibe notificación del HotelChain cuando cancela/modifica una reserva.
    """

    # ── 1. Validar secret ─────────────────────────────────────────
    expected = settings.PROVIDER_CALLBACK_SECRET
    if not x_callback_secret or x_callback_secret != expected:
        raise HTTPException(
            status_code=401,
            detail="X-Callback-Secret inválido o ausente"
        )

    # ── 2. Buscar la reserva local por provider_booking_code ──────
    reserva = db.query(ReservaHotel).filter(
        ReservaHotel.provider_booking_code == payload.code
    ).first()

    if not reserva:
        return {
            "received"  : True,
            "processed" : False,
            "reason"    : f"Reserva {payload.code} no encontrada en esta agencia"
        }

    # ── 3. Actualizar estado local ────────────────────────────────
    old_local_status = reserva.provider_status
    reserva.provider_status = payload.newStatus.upper()
    db.commit()
    db.refresh(reserva)

    # ── 4. Auditoría ──────────────────────────────────────────────
    log_operation(
        db,
        operation = "PROVIDER_CALLBACK",
        agency_id = reserva.agency_id,
        entity    = "reserva_hotel",
        entity_id = reserva.reservation_id,
        detail    = {
            "code"      : payload.code,
            "oldStatus" : payload.oldStatus or old_local_status,
            "newStatus" : payload.newStatus,
            "reason"    : payload.reason,
        },
        channel   = "WEBSERVICE",
        status    = "SUCCESS",
    )

    # ── 5. Email al cliente si fue cancelación ────────────────────
    if payload.newStatus.upper() in ("CANCELED", "CANCELLED"):
        customer = None
        if reserva.customer_id:
            customer = db.query(Customer).filter(
                Customer.customer_id == reserva.customer_id
            ).first()

        if customer and customer.email:
            send_cancellation_email(
                to   = customer.email,
                data = {
                    "booking_code"     : payload.code,
                    "hotel_nombre"     : reserva.hotel_nombre or "",
                    "destino"          : reserva.destino,
                    "check_in"         : str(reserva.check_in),
                    "check_out"        : str(reserva.check_out),
                    "cliente_nombres"  : customer.nombres,
                    "cliente_apellidos": customer.apellidos,
                    "motivo"           : payload.reason or "Cancelación por parte del hotel",
                },
            )

    return {
        "received"        : True,
        "processed"       : True,
        "reservation_id"  : reserva.reservation_id,
        "code"            : payload.code,
        "old_status"      : old_local_status,
        "new_status"      : reserva.provider_status,
        "email_sent"      : bool(reserva.customer_id),
    }
