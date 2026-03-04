from sqlalchemy.orm import Session
from app.schemas.vuelos_schema import VueloBusqueda, VueloBusquedaResponse, VueloResultado
from app.models.busqueda import Busqueda

from app.models.busqueda import Busqueda
from typing import List

def buscar_vuelos_service(data: VueloBusqueda, db: Session) -> VueloBusquedaResponse:

    # Crear objeto modelo para base de datos
    nueva_busqueda = Busqueda(
        origen=data.origen,
        destino=data.destino,
        fecha_salida=data.fecha_salida,
        pasajeros=data.pasajeros
    )

    # Guardar en base de datos
    db.add(nueva_busqueda)
    db.commit()
    db.refresh(nueva_busqueda)

    # Simulación de resultados
    resultados_simulados = [
        VueloResultado(aerolinea="AeroUno", precio=350.50, moneda="USD"),
        VueloResultado(aerolinea="SkyJet", precio=420.00, moneda="USD")
    ]

    return VueloBusquedaResponse(
        origen=data.origen,
        destino=data.destino,
        fecha_salida=data.fecha_salida,
        pasajeros=data.pasajeros,
        resultados=resultados_simulados
    )

# Función para obtener todas las búsquedas realizadas
def obtener_busquedas_service(db: Session) -> List[Busqueda]:
    return db.query(Busqueda).all()