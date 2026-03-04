from sqlalchemy.orm import Session
from app.schemas.vuelos_schema import VueloBusqueda, VueloBusquedaResponse, VueloResultado
from app.models.busqueda import Busqueda

from app.models.busqueda import Busqueda
from typing import List

def buscar_vuelos_service(data: VueloBusqueda, db: Session) -> VueloBusquedaResponse:

    # 1) Crear objeto modelo para base de datos (Guardar Busqueda)
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

    # 2) Traer proveedores Airline activos
    providers = (
        db.query(Provider)
        .filter(Provider.provider_type == "AIRLINE", Provider.is_active == True)
        .all()
    )
    # 3) Para cada proveedor, llamar a su API (simulado) y obtener resultados
    # (Luego esto sera asíncrono, con colas, llamada http real, etc.)
    resultados = []
    pirecio_base_seed = 300.0

    for i, p in enumerate(providers):
        # Simulamos que cada proveedor devuelve un precio base diferente
        precio_base = pirecio_base_seed + i * 50

        # Aplicamos el markup de la agencia
        precio_final = round(precio_base * (1 + p.agency_markup_percent), 2)

        resultado = VueloResultado(
            provider_id=p.provider_id,
            aerolinea=p.name,
            precio_base=precio_base,
            precio_final=precio_final,
            moneda="USD"
        )
        resultados.append(resultado)

    return VueloBusquedaResponse(
        origen=data.origen,
        destino=data.destino,
        fecha_salida=data.fecha_salida,
        pasajeros=data.pasajeros,
        resultados=resultados
    )

# Función para obtener todas las búsquedas realizadas
def obtener_busquedas_service(db: Session) -> List[Busqueda]:
    return db.query(Busqueda).all()