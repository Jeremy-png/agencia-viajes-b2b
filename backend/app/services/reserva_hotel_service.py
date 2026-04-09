from sqlalchemy.orm import Session
from app.models.reserva_hotel import ReservaHotel
from app.schemas.reserva_hotel_schema import ReservaHotelCreate

def crear_reserva_hotel(db: Session, data: ReservaHotelCreate) -> ReservaHotel:
    reserva = ReservaHotel(
        provider_id=data.provider_id,
        provider_booking_code=data.provider_booking_code,
        hotel_codigo=data.hotel_codigo,
        habitacion_tipo=data.habitacion_tipo,
        destino=data.destino,
        check_in=data.check_in,
        check_out=data.check_out,
        huespedes=data.huespedes,
        precio_final_noche=data.precio_final_noche,
        moneda=data.moneda
    )
    db.add(reserva)
    db.commit()
    db.refresh(reserva)
    return reserva

def listar_reservas_hotel(db: Session):
    return db.query(ReservaHotel).all()