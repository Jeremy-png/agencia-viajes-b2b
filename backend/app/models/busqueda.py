from sqlalchemy import Column, Integer, String, Date
from app.database.database import Base

class Busqueda(Base):
    __tablename__ = "busquedas"

    id = Column(Integer, primary_key=True, index=True)
    origen = Column(String(3))
    destino = Column(String(3))
    fecha_salida = Column(Date)
    pasajeros = Column(Integer)