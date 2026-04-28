from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.reserva_hotel import ReservaHotel
from app.models.provider import Provider
from app.services.hotelchain_client import (
    hotelchain_login,
    hotelchain_get_reservation,
    hotelchain_cancel_reservation
)

def _get_provider_or_400(db: Session, provider_id: int) -> Provider:
    provider = db.query(Provider).filter(Provider.provider_id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=400, detail="Proveedor no existe")
    if not provider.base_url or not provider.ws_email or not provider.ws_password:
        raise HTTPException(status_code=400, detail="Proveedor sin base_url o credenciales WEBSERVICE")
    return provider

def _get_reserva_or_404(db: Session, reservation_id: int) -> ReservaHotel:
    reserva = db.query(ReservaHotel).filter(ReservaHotel.reservation_id == reservation_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva

def consultar_reserva_en_proveedor(db: Session, reservation_id: int) -> dict:
    reserva = _get_reserva_or_404(db, reservation_id)

    if not reserva.provider_booking_code:
        raise HTTPException(status_code=400, detail="Esta reserva no tiene provider_booking_code (no está integrada)")

    provider = _get_provider_or_400(db, reserva.provider_id)

    try:
        token = hotelchain_login(provider.base_url, provider.ws_email, provider.ws_password)
        provider_data = hotelchain_get_reservation(provider.base_url, token, reserva.provider_booking_code)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error consultando reserva en hotel: {str(e)}")

    # opcional: sincronizar status local con el proveedor
    status = provider_data.get("status") or provider_data.get("Status")
    if status:
        reserva.provider_status = status
        db.commit()
        db.refresh(reserva)

    return provider_data

def cancelar_reserva_en_proveedor(db: Session, reservation_id: int) -> dict:
    reserva = _get_reserva_or_404(db, reservation_id)

    if not reserva.provider_booking_code:
        raise HTTPException(status_code=400, detail="Esta reserva no tiene provider_booking_code (no está integrada)")

    provider = _get_provider_or_400(db, reserva.provider_id)

    try:
        token = hotelchain_login(provider.base_url, provider.ws_email, provider.ws_password)
        cancel_data = hotelchain_cancel_reservation(provider.base_url, token, reserva.provider_booking_code)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error cancelando reserva en hotel: {str(e)}")

    # actualizar local
    reserva.provider_status = "CANCELLED"
    db.commit()
    db.refresh(reserva)

    return {
        "reservation_id": reserva.reservation_id,
        "provider_booking_code": reserva.provider_booking_code,
        "local_status": reserva.provider_status,
        "provider_response": cancel_data
    }