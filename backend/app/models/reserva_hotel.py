"""Modelo de Reserva de Hotel."""
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, DateTime, func
from app.database.database import Base


class ReservaHotel(Base):
    __tablename__ = "reservas_hotel"

    reservation_id        = Column(Integer, primary_key=True, index=True)

    # Proveedor
    provider_id           = Column(Integer, nullable=False)
    provider_booking_code = Column(String(50), nullable=True)
    room_id               = Column(Integer, nullable=False)
    provider_total_amount = Column(Float,   nullable=False)
    provider_status       = Column(String(20), nullable=False, default="PENDING")

    # Hotel / habitación (info de display)
    hotel_codigo          = Column(String(30),  nullable=True)
    hotel_nombre          = Column(String(120),  nullable=True)
    habitacion_tipo       = Column(String(30),  nullable=True)

    # Estancia
    destino               = Column(String(80),  nullable=False)
    check_in              = Column(Date,         nullable=False)
    check_out             = Column(Date,         nullable=False)
    huespedes             = Column(Integer,      nullable=False)
    moneda                = Column(String(10),   nullable=False, default="USD")

    # Precios con markup
    precio_base_noche     = Column(Float, nullable=False)
    precio_final_noche    = Column(Float, nullable=False)
    markup_percent        = Column(Float, nullable=False)
    noches                = Column(Integer, nullable=False)
    total_base            = Column(Float, nullable=False)
    total                 = Column(Float, nullable=False)

    # Checkout
    customer_id           = Column(Integer, ForeignKey("customers.customer_id"), nullable=True)
    confirmed_at          = Column(DateTime, nullable=True)

    # Multi-agencia / usuario
    user_id               = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    agency_id             = Column(Integer, ForeignKey("agencies.agency_id"), nullable=False)

    # Auditoría
    created_at            = Column(DateTime, nullable=False, server_default=func.now())
