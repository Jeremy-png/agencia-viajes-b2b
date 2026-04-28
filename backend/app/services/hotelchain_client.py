import requests

def hotelchain_login(base_url: str, email: str, password: str) -> str:
    """
    Login al HotelChain y devuelve JWT.
    """
    url = f"{base_url}/api/auth/login"
    payload = {"email": email, "password": password}

    r = requests.post(url, json=payload, timeout=15)
    if not r.ok:
        raise Exception(f"{r.status_code} {r.text}")

    data = r.json()
    token = data.get("token") or data.get("accessToken") or data.get("jwt")
    if not token:
        raise Exception(f"Login OK pero no vino token. Respuesta: {data}")

    return token


def hotelchain_get_cities(base_url: str, token: str):
    """
    GET /api/integration/cities
    """
    url = f"{base_url}/api/integration/cities"
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.get(url, headers=headers, timeout=15)
    if not r.ok:
        raise Exception(f"{r.status_code} {r.text}")

    return r.json()


def hotelchain_search_rooms(base_url: str, token: str, payload: dict):
    """
    POST /api/integration/search
    payload esperado por el proveedor (ejemplo):
    {
      "CityId": 1,
      "CheckIn": "2026-04-27T00:00:00",
      "CheckOut": "2026-04-28T00:00:00",
      "Guests": 1,
      "MinPrice": null,
      "MaxPrice": null,
      "RoomTypeId": null,
      "MinRating": null
    }
    """
    url = f"{base_url}/api/integration/search"
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.post(url, json=payload, headers=headers, timeout=20)
    if not r.ok:
        raise Exception(f"{r.status_code} {r.text}")

    return r.json()


def hotelchain_create_reservation(base_url: str, token: str, payload: dict) -> dict:
    """
    POST /api/integration/reservations
    payload esperado por el proveedor:
    {
      "RoomId": 2,
      "CheckIn": "2026-04-27T00:00:00",
      "CheckOut": "2026-04-28T00:00:00",
      "Guests": 1
    }
    """
    url = f"{base_url}/api/integration/reservations"
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.post(url, json=payload, headers=headers, timeout=25)
    if not r.ok:
        # IMPORTANTÍSIMO: devuelve el body real del proveedor (ej. "No hay disponibilidad.")
        raise Exception(f"{r.status_code} {r.text}")

    return r.json()


def hotelchain_get_reservation(base_url: str, token: str, code: str) -> dict:
    """
    GET /api/integration/reservations/{code}
    """
    url = f"{base_url}/api/integration/reservations/{code}"
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.get(url, headers=headers, timeout=20)
    if not r.ok:
        raise Exception(f"{r.status_code} {r.text}")

    return r.json()


def hotelchain_cancel_reservation(base_url: str, token: str, code: str) -> dict:
    """
    POST /api/integration/reservations/{code}/cancel
    """
    url = f"{base_url}/api/integration/reservations/{code}/cancel"
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.post(url, headers=headers, timeout=20)
    if not r.ok:
        raise Exception(f"{r.status_code} {r.text}")

    # algunos backends responden 204 sin body
    if r.text and r.text.strip():
        return r.json()

    return {"status": "CANCELLED", "code": code}