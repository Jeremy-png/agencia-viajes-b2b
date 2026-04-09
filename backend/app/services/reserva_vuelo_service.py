from sqlalchemy.orm import Session
from app.models.reserva_vuelo import ReservaVuelo
from app.schemas.reserva_vuelo_schema import ReservaVueloCreate

def crear_reserva_vuelo(db: Session, data: ReservaVueloCreate) -> ReservaVuelo:
    reserva = ReservaVuelo(
        provider_id=data.provider_id,
        provider_flight_code=data.provider_flight_code,
        origen=data.origen,
        destino=data.destino,
        fecha_salida=data.fecha_salida,
        pasajeros=data.pasajeros,
        precio_final=data.precio_final,
        moneda=data.moneda
    )
    db.add(reserva)
    db.commit() 
    db.refresh(reserva)  # <- aquí se carga el reservation_id generado

    return reserva