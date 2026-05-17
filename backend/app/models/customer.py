"""
Modelo de datos del cliente al momento del checkout.

Guardamos:
  - Datos personales del pasajero/huésped
  - Últimos 4 dígitos de tarjeta + nombre en tarjeta + dirección de cobro
  - NUNCA el CVV ni el número completo de tarjeta
"""
from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, func
from app.database.database import Base


class Customer(Base):
    __tablename__ = "customers"

    customer_id      = Column(Integer, primary_key=True, index=True)

    # Datos del pasajero/huésped (requeridos por el spec en compra)
    nombres          = Column(String(100), nullable=False)
    apellidos        = Column(String(100), nullable=False)
    fecha_nacimiento = Column(Date,        nullable=True)
    nacionalidad     = Column(String(80),  nullable=True)

    # Datos de cobro — SOLO últimos 4 dígitos, NUNCA CVV
    card_last4       = Column(String(4),   nullable=True)   # ej. "4242"
    card_holder_name = Column(String(120), nullable=True)   # nombre en la tarjeta
    billing_address  = Column(String(255), nullable=True)   # dirección de cobro

    # Email de contacto para confirmaciones
    email            = Column(String(120), nullable=True)

    # Auditoría
    created_at       = Column(DateTime, nullable=False, server_default=func.now())
