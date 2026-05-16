"""
Funciones de seguridad: hash de password y emisión de JWT.

Antes vivía hardcoded. Ahora todo viene de app.core.config.settings
(que a su vez lee desde .env).
"""
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt

from app.core.config import settings

# Compatibilidad con código existente que importa estas constantes:
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    """Devuelve un hash pbkdf2_sha256 del password."""
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verifica un password contra un hash almacenado."""
    return pwd_context.verify(password, password_hash)


def create_access_token(data: dict, expires_minutes: int | None = None) -> str:
    """
    Crea un JWT con el payload `data` y expiración configurable.
    Por defecto usa ACCESS_TOKEN_EXPIRE_MINUTES del .env.
    """
    if expires_minutes is None:
        expires_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
