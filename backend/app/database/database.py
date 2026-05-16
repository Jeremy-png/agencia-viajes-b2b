"""
Configuración SQLAlchemy.

DATABASE_URL ya NO está hardcoded — viene de app.core.config.settings,
que la lee del .env.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency de FastAPI: abre y cierra sesión por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
