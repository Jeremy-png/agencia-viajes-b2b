from sqlalchemy import Column, Integer, String, Date, Float
from app.database.database import Base

class ReservaHotel(Base):
    __tablename__ = "reservas_hotel"

    reservation_id = Column(Integer, primary_key=True, index=True)

    provider_id = Column(Integer, nullable=False)
    provider_booking_code = Column(String(50), nullable=True)

    hotel_codigo = Column(String(30), nullable=False)
    habitacion_tipo = Column(String(30), nullable=False)

    destino = Column(String(80), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    huespedes = Column(Integer, nullable=False)

    precio_final_noche = Column(Float, nullable=False)
    moneda = Column(String(10), nullable=False)