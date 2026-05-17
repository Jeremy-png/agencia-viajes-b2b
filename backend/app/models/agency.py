from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database.database import Base

class Agency(Base):
    __tablename__ = "agencies"

    agency_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())