"""Router de Hoteles."""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from typing import Optional

from app.database.database import get_db
from app.core.auth_dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.provider import Provider
from app.services.hotelchain_client import (
    hotelchain_login,
    hotelchain_get_cities,
    hotelchain_search_rooms,
)

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────

class BuscarRequest(BaseModel):
    destino     : str
    check_in    : date
    check_out   : date
    huespedes   : int = 1
    min_price   : Optional[float] = None
    max_price   : Optional[float] = None
    room_type_id: Optional[int]   = None
    min_rating  : Optional[float] = None


# ── Búsqueda multi-proveedor ──────────────────────────────────────

@router.post("/buscar")
def buscar_hoteles(
    body: BuscarRequest,
    db  : Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    agency_id = user.agency_id if user else 1

    providers = db.query(Provider).filter(
        Provider.agency_id    == agency_id,
        Provider.is_active    == True,
        Provider.provider_type == "HOTEL",
    ).all()

    if not providers:
        raise HTTPException(
            status_code=400,
            detail="No hay proveedores HOTEL activos configurados. Revisa /providers (is_active, provider_type)."
        )

    resultados = []

    for provider in providers:
        try:
            token = hotelchain_login(provider.base_url, provider.ws_email, provider.ws_password)
            cities = hotelchain_get_cities(provider.base_url, token)

            # Buscar ciudad por nombre (case insensitive)
            city = next(
                (c for c in cities
                 if body.destino.lower() in str(c.get("name", "")).lower()),
                None
            )
            if not city:
                continue

            city_id = city.get("id") or city.get("Id")
            markup  = float(provider.agency_markup_percent or 0.0)

            payload = {
                "CityId"    : city_id,
                "CheckIn"   : f"{body.check_in}T00:00:00",
                "CheckOut"  : f"{body.check_out}T00:00:00",
                "Guests"    : body.huespedes,
                "MinPrice"  : body.min_price,
                "MaxPrice"  : body.max_price,
                "RoomTypeId": body.room_type_id,
                "MinRating" : body.min_rating,
            }

            rooms = hotelchain_search_rooms(provider.base_url, token, payload)

            for r in rooms:
                precio_base  = float(r.get("basePricePerNight") or r.get("BasePricePerNight") or 0)
                precio_final = round(precio_base * (1 + markup), 2)

                resultados.append({
                    "provider_id"       : provider.provider_id,
                    "cadena_hotel"      : provider.name,
                    "city_id"           : city_id,
                    "hotel_id"          : r.get("hotelId") or r.get("HotelId"),
                    "hotel_nombre"      : r.get("hotel") or r.get("Hotel") or r.get("hotelName") or "",
                    "room_id"           : r.get("id") or r.get("Id"),
                    "room_nombre"       : r.get("nameOrNumber") or r.get("NameOrNumber") or "",
                    "room_type"         : r.get("roomType") or r.get("RoomType") or "",
                    "max_guests"        : r.get("maxGuests") or r.get("MaxGuests") or 1,
                    "precio_base_noche" : precio_base,
                    "precio_final_noche": precio_final,
                    "moneda"            : "USD",
                })

        except Exception as e:
            print(f"⚠️  Error con provider {provider.name}: {e}")
            continue

    # Ordenar por precio final
    resultados.sort(key=lambda x: x["precio_final_noche"])

    return {
        "destino"   : body.destino,
        "agency_id" : agency_id,
        "check_in"  : str(body.check_in),
        "check_out" : str(body.check_out),
        "resultados": resultados,
    }


# ── Detalle de hotel ──────────────────────────────────────────────

@router.get("/detalle/{provider_id}/{hotel_id}")
def detalle_hotel(
    provider_id: int,
    hotel_id   : int,
    check_in   : Optional[str] = Query(default=None),
    check_out  : Optional[str] = Query(default=None),
    guests     : Optional[int] = Query(default=None),
    db         : Session       = Depends(get_db),
    user       : Optional[User] = Depends(get_optional_user),
):

    agency_id = user.agency_id if user else 1

    provider = db.query(Provider).filter(
        Provider.provider_id == provider_id,
        Provider.agency_id   == agency_id,
        Provider.is_active   == True,
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    import requests
    markup = float(provider.agency_markup_percent or 0.0)

    try:
        # El endpoint público no requiere auth
        params = {}
        if check_in:  params["checkIn"]  = check_in
        if check_out: params["checkOut"] = check_out
        if guests:    params["guests"]   = guests

        url = f"{provider.base_url}/api/public/hotels/{hotel_id}"
        resp = requests.get(url, params=params, timeout=15)

        if not resp.ok:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Error obteniendo detalle del hotel: {resp.text}"
            )

        data = resp.json()

        # Aplicar markup a los precios de las habitaciones
        room_options = data.get("roomOptions") or data.get("rooms") or []
        for room in room_options:
            base = float(room.get("basePricePerNight") or 0)
            room["priceWithMarkup"] = round(base * (1 + markup), 2)
            room["markup_percent"]  = markup

        data["cadenaHotel"] = provider.name
        data["markup"]      = markup

        return data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error conectando con el hotel: {str(e)}"
        )


# ── Ciudades disponibles ───────────────────────────────────────────

@router.get("/ciudades")
def get_ciudades(
    db  : Session       = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Devuelve todas las ciudades de todos los proveedores activos."""
    agency_id = user.agency_id if user else 1

    providers = db.query(Provider).filter(
        Provider.agency_id    == agency_id,
        Provider.is_active    == True,
        Provider.provider_type == "HOTEL",
    ).all()

    ciudades = []
    for provider in providers:
        try:
            token  = hotelchain_login(provider.base_url, provider.ws_email, provider.ws_password)
            cities = hotelchain_get_cities(provider.base_url, token)
            for c in cities:
                ciudades.append({
                    "provider_id"  : provider.provider_id,
                    "cadena_hotel" : provider.name,
                    "city_id"      : c.get("id") or c.get("Id"),
                    "city_name"    : c.get("name") or c.get("Name"),
                })
        except Exception as e:
            print(f"⚠️  Error ciudades de {provider.name}: {e}")
            continue

    return ciudades
