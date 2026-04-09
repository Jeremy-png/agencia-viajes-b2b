from sqlalchemy import Column, Integer, String, Date, Float
from app.database.database import Base

class ReservaVuelo(Base):
    __tablename__ = "reservas_vuelo"

    reservation_id = Column(Integer, primary_key=True, index=True)

    provider_id = Column(Integer, nullable=False)
    provider_flight_code = Column(String(30), nullable=False)

    origen = Column(String(3), nullable=False)
    destino = Column(String(3), nullable=False)
    fecha_salida = Column(Date, nullable=False)
    pasajeros = Column(Integer, nullable=False)

    precio_final = Column(Float, nullable=False)
    moneda = Column(String(10), nullable=False)