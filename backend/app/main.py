"""
Punto de entrada de la API.

Cambios respecto a la versión anterior:
- Sin imports de `Reserva` legacy (modelo de vuelos eliminado).
- Configuración de CORS y título toman valores desde settings.
- Imprime warnings de configuración al arrancar.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.database import Base, engine

# Importar modelos REGISTRA las tablas en Base.metadata.
# Mantenerlos aquí garantiza que create_all las cree todas.
from app.models import agency, user, provider, reserva_hotel  # noqa: F401

# Routers
from app.routers import auth, agencies, providers, hoteles, reservas_hotel

# Crea tablas si no existen (modo dev; luego migramos a Alembic si da tiempo)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    debug=settings.APP_DEBUG,
)

# CORS solo para el frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,            prefix="/auth",          tags=["Auth"])
app.include_router(agencies.router,        prefix="/agencies",      tags=["Agencies"])
app.include_router(providers.router,       prefix="/providers",     tags=["Providers"])
app.include_router(hoteles.router,         prefix="/hoteles",       tags=["Hoteles"])
app.include_router(reservas_hotel.router,  prefix="/reservas/hotel", tags=["Reservas Hotel"])


@app.get("/", tags=["Health"])
def root():
    return {"mensaje": "API Agencia de Viajes funcionando", "app": settings.APP_NAME}


@app.on_event("startup")
def on_startup():
    for w in settings.warn_if_defaults():
        print(w)
    print(f"✅ {settings.APP_NAME} arrancando en modo debug={settings.APP_DEBUG}")
