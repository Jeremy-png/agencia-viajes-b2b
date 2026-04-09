from sqlalchemy.orm import Session
from app.models.provider import Provider
from app.schemas.hoteles_schema import HotelBusqueda, HotelBusquedaResponse, HotelResultado

def buscar_hoteles_service(data: HotelBusqueda, db: Session) -> HotelBusquedaResponse:
    # 1) Obtener providers tipo HOTEL activos
    providers = (
        db.query(Provider)
        .filter(Provider.provider_type == "HOTEL", Provider.is_active == True)
        .all()
    )

    # 2) Simular resultados por cada provider (hasta integrar C# real)
    resultados = []
    precio_base_seed = 80.0

    for i, p in enumerate(providers):
        precio_base = precio_base_seed + (i * 25.0)  # simulación
        precio_final = round(precio_base * (1 + p.agency_markup_percent), 2)

        resultados.append(
            HotelResultado(
                provider_id=p.provider_id,
                cadena_hotel=p.name,
                hotel_codigo=f"HT-{p.provider_id}",
                habitacion_tipo="DOBLE",
                precio_base_noche=round(precio_base, 2),
                precio_final_noche=precio_final,
                moneda="USD"
            )
        )

    # 3) Retornar respuesta consolidada
    return HotelBusquedaResponse(
        destino=data.destino,
        check_in=data.check_in,
        check_out=data.check_out,
        huespedes=data.huespedes,
        resultados=resultados
    )