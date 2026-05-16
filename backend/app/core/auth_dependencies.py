"""
Dependencias de autenticación reutilizables en los routers.

get_current_user   → cualquier usuario con JWT válido
require_admin      → solo ADMIN
require_webservice → solo WEBSERVICE
get_optional_user  → devuelve None si no hay token (para rutas públicas)
"""
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.models.user import User, Roles
from app.core.security import SECRET_KEY, ALGORITHM

oauth2_scheme          = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    db   : Session = Depends(get_db),
    token: str     = Depends(oauth2_scheme),
) -> User:
    """Decodifica el JWT y devuelve el usuario activo correspondiente."""
    try:
        payload  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub      = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Token inválido: falta sub")
        user_id = int(sub)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no válido o inactivo")
    return user


def get_optional_user(
    db   : Session       = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional),
) -> Optional[User]:
    """
    Como get_current_user pero no lanza error si no hay token.
    Útil para rutas públicas que muestran info extra si el usuario está logueado.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub     = payload.get("sub")
        if not sub:
            return None
        user = db.query(User).filter(User.user_id == int(sub)).first()
        return user if user and user.is_active else None
    except (JWTError, ValueError):
        return None


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Solo deja pasar a usuarios con rol ADMIN."""
    if user.role != Roles.ADMIN:
        raise HTTPException(status_code=403, detail="Requiere rol ADMIN")
    return user


def require_webservice(user: User = Depends(get_current_user)) -> User:
    """Solo deja pasar a usuarios con rol WEBSERVICE."""
    if user.role != Roles.WEBSERVICE:
        raise HTTPException(status_code=403, detail="Requiere rol WEBSERVICE")
    return user


def require_admin_or_webservice(user: User = Depends(get_current_user)) -> User:
    """Deja pasar a ADMIN o WEBSERVICE (útil para endpoints de integración)."""
    if user.role not in {Roles.ADMIN, Roles.WEBSERVICE}:
        raise HTTPException(status_code=403, detail="Requiere rol ADMIN o WEBSERVICE")
    return user
