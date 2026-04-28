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

    noches = Column(Integer, nullable=False)
    total = Column(Float, nullable=False)   

    precio_base_noche = Column(Float, nullable=False)
    markup_percent = Column(Float, nullable=False)
    total_base = Column(Float, nullable=False)

    room_id = Column(Integer, nullable=False)
    provider_total_amount = Column(Float, nullable=False)
    provider_status = Column(String(20), nullable=False)