from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.reserva_hotel import ReservaHotel
from app.models.provider import Provider
from app.schemas.reserva_hotel_schema import ReservaHotelCreate
from app.services.hotelchain_client import hotelchain_login, hotelchain_create_reservation


def crear_reserva_hotel(db: Session, data: ReservaHotelCreate) -> ReservaHotel:
    noches = (data.check_out - data.check_in).days
    if noches <= 0:
        raise HTTPException(status_code=400, detail="check_out debe ser posterior a check_in")

    provider = db.query(Provider).filter(Provider.provider_id == data.provider_id).first()
    if not provider:
        raise HTTPException(status_code=400, detail="Proveedor no existe")
    if not provider.base_url or not provider.ws_email or not provider.ws_password:
        raise HTTPException(status_code=400, detail="Proveedor sin base_url o credenciales WEBSERVICE")

    markup = float(provider.agency_markup_percent or 0.0)

    # 1) Login al proveedor
    try:
        token = hotelchain_login(provider.base_url, provider.ws_email, provider.ws_password)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error autenticando contra hotel: {str(e)}")

    # 2) Crear reserva REAL
    payload = {
        "RoomId": data.room_id,
        "CheckIn": f"{data.check_in}T00:00:00",
        "CheckOut": f"{data.check_out}T00:00:00",
        "Guests": data.huespedes
    }

    try:
        hotel_resp = hotelchain_create_reservation(provider.base_url, token, payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error creando reserva en hotel: {str(e)}")

    provider_code = hotel_resp.get("code") or hotel_resp.get("Code")
    provider_status = hotel_resp.get("status") or hotel_resp.get("Status") or "PENDING"
    provider_total = float(hotel_resp.get("totalAmount") or hotel_resp.get("TotalAmount") or 0)

    if not provider_code:
        raise HTTPException(status_code=502, detail=f"Reserva creada pero no vino code. Respuesta: {hotel_resp}")
    if provider_total <= 0:
        raise HTTPException(status_code=502, detail=f"Reserva creada pero totalAmount inválido. Respuesta: {hotel_resp}")

    # 3) Auditoría y totales agencia
    precio_base_noche = round(provider_total / noches, 2)
    precio_final_noche = round(precio_base_noche * (1 + markup), 2)

    total_base = round(provider_total, 2)
    total_final = round(total_base * (1 + markup), 2)

    reserva = ReservaHotel(
        provider_id=data.provider_id,
        provider_booking_code=provider_code,

        room_id=data.room_id,
        provider_total_amount=total_base,
        provider_status=provider_status,

        destino=data.destino,
        check_in=data.check_in,
        check_out=data.check_out,
        huespedes=data.huespedes,
        moneda=data.moneda,

        # legacy fields permitidos NULL (ya lo arreglaste en MySQL)
        hotel_codigo=None,
        habitacion_tipo=None,

        precio_base_noche=precio_base_noche,
        precio_final_noche=precio_final_noche,
        markup_percent=markup,
        noches=noches,
        total_base=total_base,
        total=total_final
    )

    db.add(reserva)
    db.commit()
    db.refresh(reserva)
    return reserva


def listar_reservas_hotel(db: Session):
    return db.query(ReservaHotel).all()