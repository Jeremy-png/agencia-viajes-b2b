"""
Router de autenticación y gestión de usuarios.

Endpoints públicos:
  POST /auth/captcha          → genera desafío matemático
  POST /auth/register         → registro con captcha
  POST /auth/login            → login OAuth2, devuelve JWT

Endpoints autenticados:
  GET  /auth/me               → datos del usuario actual

Endpoints solo ADMIN:
  GET  /auth/users            → listar usuarios de la agencia
  GET  /auth/users/{id}       → detalle de un usuario
  POST /auth/users/{id}/role  → cambiar rol (ADMIN / USER / WEBSERVICE)
  POST /auth/users/{id}/deactivate → desactivar usuario
  POST /auth/users/{id}/activate   → reactivar usuario
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.models.user import User, Roles
from app.models.agency import Agency
from app.schemas.auth_schema import (
    RegisterRequest, TokenResponse, UserResponse,
    UserListItem, PromoteRequest,
)
from app.core.security import hash_password, verify_password, create_access_token
from app.core.auth_dependencies import get_current_user, require_admin
from app.core.captcha import validate_captcha          # ← Lote 3

router = APIRouter()


# ──────────────────────────────────────────────────────────────────
# Captcha
# ──────────────────────────────────────────────────────────────────

@router.get("/captcha", tags=["Auth"])
def get_captcha():
    """
    Genera un desafío matemático para el registro.
    Devuelve: { captcha_id, pregunta }
    El frontend muestra la pregunta y el usuario escribe la respuesta.
    """
    from app.core.captcha import generate_captcha
    return generate_captcha()


# ──────────────────────────────────────────────────────────────────
# Registro
# ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, tags=["Auth"])
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Registra un nuevo usuario (visitante → USER)."""

    # 1) Validar captcha
    if not validate_captcha(data.captcha_id, data.captcha_answer):
        raise HTTPException(status_code=400, detail="Captcha incorrecto o expirado")

    # 2) Email único
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    # 3) Agencia válida y activa
    agency = db.query(Agency).filter(
        Agency.agency_id == data.agency_id,
        Agency.is_active == True,
    ).first()
    if not agency:
        raise HTTPException(status_code=400, detail="Agencia inválida o inactiva")

    # 4) Crear usuario
    user = User(
        email            = data.email,
        password_hash    = hash_password(data.password),
        nombres          = data.nombres,
        apellidos        = data.apellidos,
        edad             = data.edad,
        pais_origen      = data.pais_origen,
        numero_pasaporte = data.numero_pasaporte,
        role             = Roles.USER,
        is_active        = True,
        agency_id        = data.agency_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ──────────────────────────────────────────────────────────────────
# Login
# ──────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse, tags=["Auth"])
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db       : Session                   = Depends(get_db),
):
    """Login con email + password (OAuth2 form). Devuelve JWT."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario inactivo")

    token = create_access_token({
        "sub"      : str(user.user_id),
        "role"     : user.role,
        "agency_id": user.agency_id,
    })
    return TokenResponse(access_token=token)


# ──────────────────────────────────────────────────────────────────
# Perfil propio
# ──────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse, tags=["Auth"])
def me(user: User = Depends(get_current_user)):
    """Devuelve los datos del usuario autenticado."""
    return user


# ──────────────────────────────────────────────────────────────────
# Gestión de usuarios (solo ADMIN)
# ──────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserListItem], tags=["Admin - Usuarios"])
def list_users(
    role     : Optional[str] = Query(default=None, description="Filtrar por rol: ADMIN, USER, WEBSERVICE"),
    is_active: Optional[bool]= Query(default=None, description="Filtrar por estado"),
    admin    : User          = Depends(require_admin),
    db       : Session       = Depends(get_db),
):
    """Lista todos los usuarios de la misma agencia del admin."""
    q = db.query(User).filter(User.agency_id == admin.agency_id)
    if role:
        q = q.filter(User.role == role.upper())
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    return q.order_by(User.user_id).all()


@router.get("/users/{user_id}", response_model=UserResponse, tags=["Admin - Usuarios"])
def get_user(
    user_id: int,
    admin  : User    = Depends(require_admin),
    db     : Session = Depends(get_db),
):
    """Detalle de un usuario (solo dentro de la misma agencia)."""
    user = _get_user_in_agency(db, user_id, admin.agency_id)
    return user


@router.post("/users/{user_id}/role", response_model=UserResponse, tags=["Admin - Usuarios"])
def change_role(
    user_id: int,
    body   : PromoteRequest,
    admin  : User           = Depends(require_admin),
    db     : Session        = Depends(get_db),
):
    """
    Cambia el rol de un usuario.
    - USER       → puede reservar y comentar
    - ADMIN      → puede administrar el sistema
    - WEBSERVICE → cuenta de integración REST (para sistemas externos)
    Un admin no puede cambiar su propio rol.
    """
    if user_id == admin.user_id:
        raise HTTPException(status_code=400, detail="No puedes cambiar tu propio rol")

    user = _get_user_in_agency(db, user_id, admin.agency_id)
    user.role = body.role
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/deactivate", response_model=UserResponse, tags=["Admin - Usuarios"])
def deactivate_user(
    user_id: int,
    admin  : User    = Depends(require_admin),
    db     : Session = Depends(get_db),
):
    """Desactiva un usuario (no puede ingresar al sistema)."""
    if user_id == admin.user_id:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")
    user = _get_user_in_agency(db, user_id, admin.agency_id)
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/activate", response_model=UserResponse, tags=["Admin - Usuarios"])
def activate_user(
    user_id: int,
    admin  : User    = Depends(require_admin),
    db     : Session = Depends(get_db),
):
    """Reactiva un usuario desactivado."""
    user = _get_user_in_agency(db, user_id, admin.agency_id)
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


# ──────────────────────────────────────────────────────────────────
# Helper interno
# ──────────────────────────────────────────────────────────────────

def _get_user_in_agency(db: Session, user_id: int, agency_id: int) -> User:
    """
    Busca un usuario por ID y verifica que pertenece a la misma agencia.
    Lanza 404 si no existe o es de otra agencia (no revelamos si existe en otra).
    """
    user = db.query(User).filter(
        User.user_id  == user_id,
        User.agency_id == agency_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
