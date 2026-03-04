from sqlalchemy import Column, Integer, String, Boolean, Float
from app.database.database import Base

class Provider(Base):
    """
    Modelo SQLAlchemy = representación de la tabla 'providers' en MySQL.
    Aquí definimos cómo se almacena un proveedor en la BD.
    """
    __tablename__ = "providers"

    provider_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    provider_type = Column(String(10), nullable=False)  # AIRLINE | HOTEL
    base_url = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Comisión/markup de la agencia para este proveedor:
    # Ejemplo: 0.10 = 10% adicional
    agency_markup_percent = Column(Float, default=0.0, nullable=False)