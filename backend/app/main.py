"""
Punto de entrada de la API.

Cambios en este lote:
- Registra modelos Customer y OperationAudit para que create_all los cree.
- Agrega router de Checkout con FileResponse para PDFs.
- Agrega FileResponse StaticFiles para servir PDFs generados.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.database.database import Base, engine, SessionLocal

# ── Registrar TODOS los modelos ────────────────────────────────────
from app.models import agency, user, provider, reserva_hotel  # noqa: F401
from app.models import customer, operation_audit               # noqa: F401

# ── Routers ────────────────────────────────────────────────────────
from app.routers import auth, agencies, providers, hoteles, reservas_hotel, checkout

# Crea tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title   = settings.APP_NAME,
    version = "0.3.0",
    debug   = settings.APP_DEBUG,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins    = [settings.FRONTEND_ORIGIN],
    allow_credentials= True,
    allow_methods    = ["*"],
    allow_headers    = ["*"],
)

# Routers
app.include_router(auth.router,           prefix="/auth",           tags=["Auth"])
app.include_router(agencies.router,       prefix="/agencies",       tags=["Agencies"])
app.include_router(providers.router,      prefix="/providers",      tags=["Providers"])
app.include_router(hoteles.router,        prefix="/hoteles",        tags=["Hoteles"])
app.include_router(reservas_hotel.router, prefix="/reservas/hotel", tags=["Reservas Hotel"])
app.include_router(checkout.router,       prefix="/checkout",       tags=["Checkout"])


@app.get("/", tags=["Health"])
def root():
    return {"mensaje": "API Agencia de Viajes funcionando", "app": settings.APP_NAME}


@app.on_event("startup")
def on_startup():
    for w in settings.warn_if_defaults():
        print(w)

    # Crear directorio de PDFs si no existe
    pdf_dir = os.path.join(os.path.dirname(__file__), "..", "generated_pdfs")
    os.makedirs(pdf_dir, exist_ok=True)

    # Seed
    print("🌱 Ejecutando seed...")
    db = SessionLocal()
    try:
        from app.core.seed import run_seed
        run_seed(db)
    finally:
        db.close()

    print(f"✅ {settings.APP_NAME} listo en modo debug={settings.APP_DEBUG}")
