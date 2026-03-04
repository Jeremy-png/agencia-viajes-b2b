from sqlalchemy import Column, Integer, String, Date, Float
from app.database.database import Base

class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    origen = Column(String(3))
    destino = Column(String(3))
    fecha_salida = Column(Date)
    pasajeros = Column(Integer)
    aerolinea = Column(String(50))
    precio = Column(Float)
    moneda = Column(String(10))