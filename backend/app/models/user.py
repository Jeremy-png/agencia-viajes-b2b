"""
Modelo de Usuario.

Roles disponibles (constantes en la clase Roles):
  - ADMIN      : administrador/empleado del sistema
  - USER       : visitante registrado (puede reservar y comentar)
  - WEBSERVICE : cuenta de integración REST para sistemas externos
  (ANONYMOUS no se almacena en BD, es simplemente "sin token")

Campos requeridos por el spec:
  email, password, nombres, apellidos, edad, pais_origen, numero_pasaporte
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey
from app.database.database import Base


class Roles:
    ADMIN      = "ADMIN"
    USER       = "USER"
    WEBSERVICE = "WEBSERVICE"

    ALL = {ADMIN, USER, WEBSERVICE}


class User(Base):
    __tablename__ = "users"

    user_id          = Column(Integer,      primary_key=True, index=True)

    # ---- Credenciales ----
    email            = Column(String(120),  unique=True, index=True, nullable=False)
    password_hash    = Column(String(255),  nullable=False)

    # ---- Datos personales (requeridos por el spec) ----
    nombres          = Column(String(100),  nullable=False)
    apellidos        = Column(String(100),  nullable=False)
    edad             = Column(Integer,      nullable=False)
    pais_origen      = Column(String(80),   nullable=False)
    numero_pasaporte = Column(String(40),   nullable=False)

    # ---- Rol y estado ----
    role             = Column(String(20),   nullable=False, default=Roles.USER)
    is_active        = Column(Boolean,      nullable=False, default=True)

    # ---- Auditoría ----
    created_at       = Column(DateTime,     nullable=False, server_default=func.now())

    # ---- Multi-agencia ----
    agency_id        = Column(Integer, ForeignKey("agencies.agency_id"), nullable=False)
