from fastapi import FastAPI
from app.database.database import Base, engine
from app.routers import vuelos
from app.routers import providers
from app.models.busqueda import Busqueda
from app.models.reserva import Reserva
from app.routers import reservas


Base.metadata.create_all(bind=engine)


app = FastAPI()

app.include_router(vuelos.router, prefix="/vuelos", tags=["Vuelos"])

@app.get("/")
def root():
    return {"mensaje": "API Agencia de Viajes funcionando"}

app.include_router(reservas.router, prefix="/reservas", tags=["Reservas"])

app.include_router(providers.router, prefix="/providers", tags=["Providers"])
