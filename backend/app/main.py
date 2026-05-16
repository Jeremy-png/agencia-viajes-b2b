"""
Punto de entrada de la API.

Cambios en este lote:
- Llama a run_seed() en startup para crear agencias y admins si no existen.
- Importa captcha module para que el cache esté disponible desde el inicio.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.database import Base, engine, SessionLocal

# Registrar modelos en Base.metadata
from app.models import agency, user, provider, reserva_hotel  # noqa: F401

# Routers
from app.routers import auth, agencies, providers, hoteles, reservas_hotel

# Crea tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="0.2.0",
    debug=settings.APP_DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,           prefix="/auth",           tags=["Auth"])
app.include_router(agencies.router,       prefix="/agencies",       tags=["Agencies"])
app.include_router(providers.router,      prefix="/providers",      tags=["Providers"])
app.include_router(hoteles.router,        prefix="/hoteles",        tags=["Hoteles"])
app.include_router(reservas_hotel.router, prefix="/reservas/hotel", tags=["Reservas Hotel"])


@app.get("/", tags=["Health"])
def root():
    return {"mensaje": "API Agencia de Viajes funcionando", "app": settings.APP_NAME}


@app.on_event("startup")
def on_startup():
    # Advertencias de configuración
    for w in settings.warn_if_defaults():
        print(w)

    # Seed inicial
    print("🌱 Ejecutando seed...")
    db = SessionLocal()
    try:
        from app.core.seed import run_seed
        run_seed(db)
    finally:
        db.close()

    print(f"✅ {settings.APP_NAME} listo en modo debug={settings.APP_DEBUG}")
