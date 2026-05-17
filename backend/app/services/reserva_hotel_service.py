from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from app.models.reserva_hotel import ReservaHotel
from app.models.reserva_hotel import ReservaHotel
from app.models.provider import Provider
from app.schemas.reserva_hotel_schema import ReservaHotelCreate
from app.services.hotelchain_client import hotelchain_login, hotelchain_create_reservation


def crear_reserva_hotel(db: Session, data: ReservaHotelCreate, user_id: int, agency_id: int) -> ReservaHotel:
    noches = (data.check_out - data.check_in).days
    if noches <= 0:
        raise HTTPException(status_code=400, detail="check_out debe ser posterior a check_in")

    provider = (
        db.query(Provider)
        .filter(Provider.provider_id == data.provider_id, Provider.agency_id == agency_id)
        .first()
    )
    if not provider:
        raise HTTPException(status_code=400, detail="Proveedor no existe para esta agencia")

    markup = float(provider.agency_markup_percent or 0.0)

    # 1) Login proveedor
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

    # 3) Auditoría
    precio_base_noche = round(provider_total / noches, 2)
    precio_final_noche = round(precio_base_noche * (1 + markup), 2)

    total_base = round(provider_total, 2)
    total_final = round(total_base * (1 + markup), 2)

    reserva = ReservaHotel(
        user_id=user_id,
        agency_id=agency_id,

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

        # legacy (permitidos NULL en DB)
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


def listar_reservas_hotel_por_usuario(db: Session, user_id: int):
    return db.query(ReservaHotel).filter(ReservaHotel.user_id == user_id).all()

def listar_reservas_hotel_filtradas(
    db: Session,
    *,
    # ownership
    agency_id: int | None = None,
    user_id: Optional[int] = None,   # si viene, filtra por ese user (USER)
    # filtros
    provider_id: Optional[int] = None,
    status: Optional[str] = None,
    destino: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    q = db.query(ReservaHotel)
    
    if agency_id is not None:
        q = q.filter(ReservaHotel.agency_id == agency_id)

    # 1) scope: si user_id viene, aplica ownership (USER)
    if user_id is not None:
        q = q.filter(ReservaHotel.user_id == user_id)

    # 2) filtros opcionales
    if provider_id is not None:
        q = q.filter(ReservaHotel.provider_id == provider_id)

    if status:
        q = q.filter(ReservaHotel.provider_status == status)

    if destino:
        # contains (case-insensitive)
        q = q.filter(ReservaHotel.destino.ilike(f"%{destino}%"))

    # fechas:
    # - date_from: reservas cuyo check_in es >= date_from
    if date_from is not None:
        q = q.filter(ReservaHotel.check_in >= date_from)

    # - date_to: reservas cuyo check_out es <= date_to
    if date_to is not None:
        q = q.filter(ReservaHotel.check_out <= date_to)

    # 3) orden: más recientes primero (por reservation_id)
    return q.order_by(ReservaHotel.reservation_id.desc()).all()