"""Schemas de autenticación y usuario."""
from pydantic import BaseModel, Field, EmailStr
from typing import Literal
from datetime import datetime


class RegisterRequest(BaseModel):
    # Credenciales
    email    : str = Field(..., min_length=5,  max_length=120)
    password : str = Field(..., min_length=8,  max_length=200)

    # Datos personales — spec los exige en el registro
    nombres          : str = Field(..., min_length=2, max_length=100)
    apellidos        : str = Field(..., min_length=2, max_length=100)
    edad             : int = Field(..., gt=0,  le=120)
    pais_origen      : str = Field(..., min_length=2, max_length=80)
    numero_pasaporte : str = Field(..., min_length=3, max_length=40)

    # Agencia a la que pertenece (multi-tenant)
    agency_id : int = 1

    # Captcha (se valida en el router antes de crear el usuario)
    captcha_id    : str = Field(..., description="ID recibido de GET /auth/captcha")
    captcha_answer: int = Field(..., description="Resultado de la operación matemática")


class TokenResponse(BaseModel):
    access_token : str
    token_type   : str = "bearer"


class UserResponse(BaseModel):
    user_id          : int
    email            : str
    nombres          : str
    apellidos        : str
    edad             : int
    pais_origen      : str
    numero_pasaporte : str
    role             : Literal["ADMIN", "USER", "WEBSERVICE"]
    is_active        : bool
    agency_id        : int
    created_at       : datetime

    class Config:
        from_attributes = True


class UserListItem(BaseModel):
    """Versión resumida para listar usuarios (admin)."""
    user_id   : int
    email     : str
    nombres   : str
    apellidos : str
    role      : str
    is_active : bool
    agency_id : int

    class Config:
        from_attributes = True


class PromoteRequest(BaseModel):
    """Body para promover a un usuario a un rol específico."""
    role: Literal["ADMIN", "USER", "WEBSERVICE"]
