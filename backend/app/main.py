from fastapi import FastAPI
from app.database.database import Base, engine
from app.routers import providers
from app.routers import hoteles
from app.models.reserva import Reserva
from app.routers import reservas
from app.routers import reservas_vuelo
from app.models.reserva_vuelo import ReservaVuelo

Base.metadata.create_all(bind=engine)


app = FastAPI()

app.include_router(hoteles.router, prefix="/hoteles", tags=["Hoteles"])

app.include_router(reservas_vuelo.router, prefix="/reservas-vuelo", tags=["Reservas Vuelo"])

@app.get("/")
def root():
    return {"mensaje": "API Agencia de Viajes funcionando"}

app.include_router(reservas.router, prefix="/reservas", tags=["Reservas"])

app.include_router(providers.router, prefix="/providers", tags=["Providers"])
