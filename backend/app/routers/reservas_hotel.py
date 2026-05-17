"""
Router de Reservas Hotel.

Actualizado en este lote:
- Cancelación ahora envía email al cliente
- Todas las operaciones quedan en auditoría
- Admin puede cancelar cualquier reserva de su agencia
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.database.database import get_db
from app.core.auth_dependencies import get_current_user
from app.models.user import User, Roles
from app.models.reserva_hotel import ReservaHotel
from app.models.customer import Customer
from app.schemas.reserva_hotel_schema import ReservaHotelResponse
from app.services.reserva_hotel_service import listar_reservas_hotel_filtradas
from app.services.reserva_hotel_provider_service import (
    consultar_reserva_en_proveedor,
    cancelar_reserva_en_proveedor,
)
from app.services.audit_service import log_operation
from app.services.email_service import send_cancellation_email

router = APIRouter()


# ── Listar reservas ────────────────────────────────────────────────

@router.get("/", response_model=list[ReservaHotelResponse])
def get_reservas_hotel(
    db       : Session       = Depends(get_db),
    user     : User          = Depends(get_current_user),
    provider_id: Optional[int]  = Query(default=None),
    status     : Optional[str]  = Query(default=None),
    destino    : Optional[str]  = Query(default=None),
    date_from  : Optional[date] = Query(default=None),
    date_to    : Optional[date] = Query(default=None),
):
    """
    Lista reservas con filtros.
    USER: solo las suyas. ADMIN: todas las de la agencia.
    """
    scope_user_id = None if user.role == Roles.ADMIN else user.user_id
    return listar_reservas_hotel_filtradas(
        db,
        agency_id   = user.agency_id,
        user_id     = scope_user_id,
        provider_id = provider_id,
        status      = status,
        destino     = destino,
        date_from   = date_from,
        date_to     = date_to,
    )


# ── Ver estado en proveedor ────────────────────────────────────────

@router.get("/{reservation_id}/provider")
def get_reserva_provider(
    reservation_id: int,
    db  : Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    reserva = _get_reserva_accesible(db, reservation_id, user)
    return consultar_reserva_en_proveedor(db, reservation_id)


# ── Cancelar reserva ───────────────────────────────────────────────

@router.post("/{reservation_id}/cancelar")
def cancelar_reserva(
    reservation_id: int,
    db  : Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    """
    Cancela una reserva en el proveedor y actualiza el estado local.
    Envía email de cancelación al cliente si tenemos sus datos.
    Registra la operación en auditoría.
    """
    reserva = _get_reserva_accesible(db, reservation_id, user)

    if reserva.provider_status == "CANCELLED":
        raise HTTPException(status_code=400, detail="La reserva ya está cancelada")

    # Cancelar en el proveedor
    result = cancelar_reserva_en_proveedor(db, reservation_id)

    # ── Auditoría ──────────────────────────────────────────────
    log_operation(
        db,
        operation = "CANCEL_RESERVATION",
        user_id   = user.user_id,
        agency_id = user.agency_id,
        entity    = "reserva_hotel",
        entity_id = reservation_id,
        detail    = {
            "booking_code": reserva.provider_booking_code,
            "hotel"       : reserva.hotel_nombre,
            "cancelado_por": user.role,
        },
        channel   = "WEB",
        status    = "SUCCESS",
    )

    # ── Email de cancelación ───────────────────────────────────
    customer = None
    if reserva.customer_id:
        customer = db.query(Customer).filter(
            Customer.customer_id == reserva.customer_id
        ).first()

    if customer and customer.email:
        send_cancellation_email(
            to   = customer.email,
            data = {
                "booking_code"    : reserva.provider_booking_code,
                "hotel_nombre"    : reserva.hotel_nombre or "",
                "destino"         : reserva.destino,
                "check_in"        : str(reserva.check_in),
                "check_out"       : str(reserva.check_out),
                "cliente_nombres" : customer.nombres,
                "cliente_apellidos": customer.apellidos,
                "motivo"          : "Cancelación solicitada" + (
                    " por administrador" if user.role == Roles.ADMIN else ""
                ),
            },
        )

    return result


# ── Helper interno ─────────────────────────────────────────────────

def _get_reserva_accesible(db: Session, reservation_id: int, user: User) -> ReservaHotel:
    """
    Devuelve la reserva si el usuario tiene acceso.
    - Verifica que pertenece a la agencia del usuario.
    - USER solo puede ver/cancelar las suyas.
    - ADMIN puede ver/cancelar cualquiera de su agencia.
    """
    reserva = db.query(ReservaHotel).filter(
        ReservaHotel.reservation_id == reservation_id
    ).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if reserva.agency_id != user.agency_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta reserva")
    if user.role != Roles.ADMIN and reserva.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta reserva")
    return reserva
