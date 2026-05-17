"""
Mock del servidor HotelChain para pruebas locales.

Simula exactamente los endpoints que consume la agencia:
  POST /api/auth/login
  GET  /api/integration/cities
  POST /api/integration/search
  POST /api/integration/reservations
  GET  /api/integration/reservations/{code}
  POST /api/integration/reservations/{code}/cancel

Correr en un puerto diferente al backend principal:
  python mock_hotelchain.py
  → corre en http://localhost:8081

Instalar dependencias (solo fastapi y uvicorn, ya los tienes):
  No requiere nada extra.
"""
import uuid
import random
from datetime import datetime, date
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(title="Mock HotelChain", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Datos fake en memoria ──────────────────────────────────────────

FAKE_TOKEN = "mock-jwt-token-hotelchain-12345"

CITIES = [
    {"id": 1, "name": "Guatemala"},
    {"id": 2, "name": "Antigua Guatemala"},
    {"id": 3, "name": "Quetzaltenango"},
    {"id": 4, "name": "Flores"},
    {"id": 5, "name": "Cobán"},
]

HOTELS = [
    {
        "id": 1, "name": "Hotel Vista Maya", "cityId": 1,
        "address": "Zona 10, Ciudad de Guatemala",
        "rating": 4.5, "description": "Hotel de lujo en el corazón de la ciudad.",
        "amenities": ["WiFi", "Piscina", "Gimnasio", "Restaurante", "Spa"],
    },
    {
        "id": 2, "name": "Hotel Antigua Colonial", "cityId": 2,
        "address": "5a Avenida Norte, Antigua Guatemala",
        "rating": 4.8, "description": "Hotel boutique en el centro histórico de Antigua.",
        "amenities": ["WiFi", "Desayuno incluido", "Jardín", "Bar"],
    },
    {
        "id": 3, "name": "Hotel Xela Grand", "cityId": 3,
        "address": "Zona 1, Quetzaltenango",
        "rating": 4.2, "description": "Hotel moderno en la segunda ciudad de Guatemala.",
        "amenities": ["WiFi", "Restaurante", "Estacionamiento"],
    },
]

ROOMS = [
    # Hotel 1 - Guatemala
    {"id": 1,  "hotelId": 1, "hotel": "Hotel Vista Maya",      "nameOrNumber": "101", "roomType": "Doble",       "maxGuests": 2, "basePricePerNight": 85.00,  "available": True},
    {"id": 2,  "hotelId": 1, "hotel": "Hotel Vista Maya",      "nameOrNumber": "201", "roomType": "Junior Suite","maxGuests": 3, "basePricePerNight": 130.00, "available": True},
    {"id": 3,  "hotelId": 1, "hotel": "Hotel Vista Maya",      "nameOrNumber": "301", "roomType": "Suite",       "maxGuests": 4, "basePricePerNight": 200.00, "available": True},
    {"id": 4,  "hotelId": 1, "hotel": "Hotel Vista Maya",      "nameOrNumber": "401", "roomType": "Gran Suite",  "maxGuests": 6, "basePricePerNight": 350.00, "available": True},
    # Hotel 2 - Antigua
    {"id": 5,  "hotelId": 2, "hotel": "Hotel Antigua Colonial","nameOrNumber": "A01", "roomType": "Doble",       "maxGuests": 2, "basePricePerNight": 95.00,  "available": True},
    {"id": 6,  "hotelId": 2, "hotel": "Hotel Antigua Colonial","nameOrNumber": "A02", "roomType": "Junior Suite","maxGuests": 3, "basePricePerNight": 150.00, "available": True},
    {"id": 7,  "hotelId": 2, "hotel": "Hotel Antigua Colonial","nameOrNumber": "A03", "roomType": "Suite",       "maxGuests": 4, "basePricePerNight": 220.00, "available": True},
    # Hotel 3 - Xela
    {"id": 8,  "hotelId": 3, "hotel": "Hotel Xela Grand",      "nameOrNumber": "X01", "roomType": "Doble",       "maxGuests": 2, "basePricePerNight": 60.00,  "available": True},
    {"id": 9,  "hotelId": 3, "hotel": "Hotel Xela Grand",      "nameOrNumber": "X02", "roomType": "Junior Suite","maxGuests": 3, "basePricePerNight": 90.00,  "available": True},
]

# Reservas creadas (en memoria, se reinician al reiniciar el mock)
RESERVATIONS: dict[str, dict] = {}

# Mapa roomType → room_type_id para filtrado
ROOM_TYPE_IDS = {
    "Doble": 1, "Junior Suite": 2, "Suite": 3, "Gran Suite": 4
}

# ── Schemas ───────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email   : str
    password: str

class SearchRequest(BaseModel):
    CityId    : int
    CheckIn   : str
    CheckOut  : str
    Guests    : int
    MinPrice  : Optional[float] = None
    MaxPrice  : Optional[float] = None
    RoomTypeId: Optional[int]   = None
    MinRating : Optional[float] = None

class ReservationRequest(BaseModel):
    RoomId  : int
    CheckIn : str
    CheckOut: str
    Guests  : int

# ── Helper de auth ────────────────────────────────────────────────

def _require_auth(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    token = authorization.replace("Bearer ", "")
    if token != FAKE_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido")
    return token

# ── Endpoints ─────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(body: LoginRequest):
    """Acepta cualquier email/password para facilitar pruebas."""
    return {"token": FAKE_TOKEN, "email": body.email}


@app.get("/api/integration/cities")
def get_cities(authorization: str = Header(...)):
    _require_auth(authorization)
    return CITIES


@app.post("/api/integration/search")
def search(body: SearchRequest, authorization: str = Header(...)):
    _require_auth(authorization)

    # Calcular noches para validar
    try:
        ci = datetime.fromisoformat(body.CheckIn.replace("T", " ").split(" ")[0])
        co = datetime.fromisoformat(body.CheckOut.replace("T", " ").split(" ")[0])
        noches = (co - ci).days
        if noches <= 0:
            return []
    except Exception:
        return []

    results = []
    for room in ROOMS:
        if not room["available"]:
            continue

        # Filtrar por ciudad (via hotel)
        hotel = next((h for h in HOTELS if h["id"] == room["hotelId"]), None)
        if not hotel or hotel["cityId"] != body.CityId:
            continue

        # Filtrar por huéspedes
        if room["maxGuests"] < body.Guests:
            continue

        # Filtrar por precio
        price = room["basePricePerNight"]
        if body.MinPrice and price < body.MinPrice:
            continue
        if body.MaxPrice and price > body.MaxPrice:
            continue

        # Filtrar por tipo de habitación
        if body.RoomTypeId:
            expected_type = next(
                (k for k, v in ROOM_TYPE_IDS.items() if v == body.RoomTypeId), None
            )
            if expected_type and room["roomType"] != expected_type:
                continue

        # Filtrar por rating del hotel
        if body.MinRating and hotel["rating"] < body.MinRating:
            continue

        results.append({**room, "hotelRating": hotel["rating"]})

    return results


@app.post("/api/integration/reservations")
def create_reservation(body: ReservationRequest, authorization: str = Header(...)):
    _require_auth(authorization)

    room = next((r for r in ROOMS if r["id"] == body.RoomId), None)
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    if not room["available"]:
        raise HTTPException(status_code=400, detail="Habitación no disponible")

    # Calcular total
    try:
        ci = datetime.fromisoformat(body.CheckIn.replace("T", " ").split(" ")[0])
        co = datetime.fromisoformat(body.CheckOut.replace("T", " ").split(" ")[0])
        noches = max((co - ci).days, 1)
    except Exception:
        noches = 1

    total = round(room["basePricePerNight"] * noches, 2)
    code  = f"HC-{str(uuid.uuid4())[:8].upper()}"

    RESERVATIONS[code] = {
        "code"       : code,
        "status"     : "CONFIRMED",
        "roomId"     : body.RoomId,
        "roomType"   : room["roomType"],
        "hotelName"  : room["hotel"],
        "checkIn"    : body.CheckIn,
        "checkOut"   : body.CheckOut,
        "guests"     : body.Guests,
        "totalAmount": total,
        "createdAt"  : datetime.utcnow().isoformat(),
    }

    return {
        "code"       : code,
        "status"     : "CONFIRMED",
        "totalAmount": total,
        "roomId"     : body.RoomId,
        "checkIn"    : body.CheckIn,
        "checkOut"   : body.CheckOut,
    }


@app.get("/api/integration/reservations/{code}")
def get_reservation(code: str, authorization: str = Header(...)):
    _require_auth(authorization)

    reservation = RESERVATIONS.get(code)
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reservation


@app.post("/api/integration/reservations/{code}/cancel")
def cancel_reservation(code: str, authorization: str = Header(...)):
    _require_auth(authorization)

    reservation = RESERVATIONS.get(code)
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if reservation["status"] == "CANCELLED":
        raise HTTPException(status_code=400, detail="Reserva ya cancelada")

    RESERVATIONS[code]["status"] = "CANCELLED"
    return {"code": code, "status": "CANCELLED"}


@app.get("/api/public/hotels/{hotel_id}")
def get_hotel_public(hotel_id: int):
    """Endpoint público para detalle de hotel (no requiere auth)."""
    hotel = next((h for h in HOTELS if h["id"] == hotel_id), None)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel no encontrado")

    hotel_rooms = [r for r in ROOMS if r["hotelId"] == hotel_id]
    return {
        **hotel,
        "rooms"   : hotel_rooms,
        "reviews" : [
            {"id": 1, "author": "María G.", "rating": 5, "comment": "Excelente servicio, lo recomiendo.", "replies": []},
            {"id": 2, "author": "Carlos P.", "rating": 4, "comment": "Muy buena ubicación.", "replies": [
                {"id": 3, "author": "Hotel", "comment": "¡Gracias Carlos!", "replies": []}
            ]},
        ],
        "images"  : [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
        ],
    }


if __name__ == "__main__":
    print("🏨 Mock HotelChain corriendo en http://localhost:8081")
    print("   Ciudades disponibles: Guatemala, Antigua, Quetzaltenango, Flores, Cobán")
    print("   Credenciales: cualquier email / cualquier password")
    uvicorn.run(app, host="0.0.0.0", port=8081)