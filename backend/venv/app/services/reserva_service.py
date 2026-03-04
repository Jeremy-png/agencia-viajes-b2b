from sqlalchemy.orm import Session
from app.models.reserva import Reserva
from app.schemas.reserva_schema import ReservaCreate

def crear_reserva_service(data: ReservaCreate, db: Session):
    nueva_reserva = Reserva(
        origen=data.origen,
        destino=data.destino,
        fecha_salida=data.fecha_salida,
        pasajeros=data.pasajeros,
        aerolinea=data.aerolinea,
        precio=data.precio,
        moneda=data.moneda
    )

    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)

    return nueva_reserva


def obtener_reservas_service(db: Session):
    return db.query(Reserva).all()