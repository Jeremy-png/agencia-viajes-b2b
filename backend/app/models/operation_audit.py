"""Modelo de Auditoría de Operaciones."""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from app.database.database import Base


class OperationAudit(Base):
    __tablename__ = "operation_audit"

    audit_id      = Column(Integer,  primary_key=True, index=True)

    # Quién hizo la operación
    user_id       = Column(Integer,  ForeignKey("users.user_id"), nullable=True)
    agency_id     = Column(Integer,  ForeignKey("agencies.agency_id"), nullable=True)

    # Qué operación
    operation     = Column(String(50),  nullable=False)   # CREATE_RESERVATION, CANCEL_RESERVATION, etc.
    entity        = Column(String(50),  nullable=True)    # reserva_hotel, etc.
    entity_id     = Column(Integer,     nullable=True)    # ID del registro afectado

    # Detalle adicional (JSON string o texto libre)
    detail        = Column(Text,        nullable=True)

    # Canal: WEB o WEBSERVICE
    channel       = Column(String(20),  nullable=False, default="WEB")

    # Resultado
    status        = Column(String(20),  nullable=False, default="SUCCESS")  # SUCCESS | ERROR
    error_detail  = Column(Text,        nullable=True)

    # Cuándo
    created_at    = Column(DateTime, nullable=False, server_default=func.now())
