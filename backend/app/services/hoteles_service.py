from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.provider import Provider
from app.schemas.hoteles_schema import HotelBusqueda, HotelBusquedaResponse, HotelResultado
from app.services.hotelchain_client import (
    hotelchain_login,
    hotelchain_get_cities,
    hotelchain_search_rooms,
)

def g(obj: dict, *keys, default=None):
    """Obtiene el primer valor existente de varias llaves posibles (case-insensitive manual)."""
    for k in keys:
        if k in obj and obj[k] is not None:
            return obj[k]
    return default

def dt(d):
    """Convierte date -> string con hora para .NET (DateTime)."""
    return f"{d}T00:00:00"

def _get_ciudad_id(c: dict) -> int | None:
    # acepta "id" o "Id"
    v = c.get("id", c.get("Id"))
    return int(v) if v is not None else None

def _get_ciudad_nombre(c: dict) -> str:
    # acepta "name" o "Name"
    return str(c.get("name", c.get("Name", ""))).strip()

def _find_city_id(cities: list[dict], destino: str) -> int | None:
    d = destino.strip().lower()

    # match exacto
    for c in cities:
        name = _get_ciudad_nombre(c).lower()
        if name == d:
            cid = _get_ciudad_id(c)
            if cid is not None:
                return cid

    # match por "contains"
    for c in cities:
        name = _get_ciudad_nombre(c).lower()
        if d in name:
            cid = _get_ciudad_id(c)
            if cid is not None:
                return cid

    return None

def buscar_hoteles_service(data: HotelBusqueda, db: Session) -> HotelBusquedaResponse:
    providers = (
        db.query(Provider)
        .filter(Provider.provider_type == "HOTEL", Provider.is_active == True)
        .all()
    )

    resultados: list[HotelResultado] = []

    for p in providers:
        if not p.base_url or not p.ws_email or not p.ws_password:
            # si un provider no está bien configurado, lo saltamos
            continue

        # 1) login
        try:
            token = hotelchain_login(p.base_url, p.ws_email, p.ws_password)
        except Exception as e:
            # saltamos provider caído
            continue

        # 2) obtener cities y resolver cityId por nombre (destino)
        try:
            cities = hotelchain_get_cities(p.base_url, token)
            city_id = _find_city_id(cities, data.destino)
            if not city_id:
                continue
        except Exception:
            continue

        # 3) llamar search real
        search_payload = {
            "CityId": city_id,
            "CheckIn": f"{data.check_in}T00:00:00",
            "CheckOut": f"{data.check_out}T00:00:00",
            "Guests": data.huespedes,
            "MinPrice": data.min_price,
            "MaxPrice": data.max_price,
            "RoomTypeId": data.room_type_id,
            "MinRating": data.min_rating,
        }

        try:
            rooms_raw = hotelchain_search_rooms(p.base_url, token, search_payload)

            # soporta respuesta como lista o como objeto { data: [...] }
            if isinstance(rooms_raw, dict):
                rooms = rooms_raw.get("data") or rooms_raw.get("results") or rooms_raw.get("items") or []
            else:
                rooms = rooms_raw
            print("DEBUG rooms sample:", str(rooms)[:300])
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Search falló en {p.name}: {str(e)}")

        # 4) mapear rooms → resultados de agencia (aplicando markup)
        markup = float(p.agency_markup_percent or 0.0)

        for r in rooms:
            room_id = int(g(r, "id", "Id"))
            hotel_id = int(g(r, "hotelId", "HotelId"))
            hotel_name = str(g(r, "hotel", "Hotel"))
            room_name = str(g(r, "nameOrNumber", "NameOrNumber"))
            room_type = str(g(r, "roomType", "RoomType"))
            max_guests = int(g(r, "maxGuests", "MaxGuests"))
            base_price = float(g(r, "basePricePerNight", "BasePricePerNight"))

            final_price = round(base_price * (1 + markup), 2)

            resultados.append(
                HotelResultado(
                    provider_id=p.provider_id,
                    cadena_hotel=p.name,
                    city_id=city_id,
                    hotel_id=hotel_id,
                    hotel_nombre=hotel_name,
                    room_id=room_id,
                    room_nombre=room_name,
                    room_type=room_type,
                    max_guests=max_guests,
                    precio_base_noche=round(base_price, 2),
                    precio_final_noche=final_price,
                    moneda="USD",
                )
            )

    return HotelBusquedaResponse(
        destino=data.destino,
        check_in=data.check_in,
        check_out=data.check_out,
        huespedes=data.huespedes,
        resultados=resultados,
    )