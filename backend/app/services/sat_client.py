"""
Cliente REST para el Sistema SAT.
La agencia llama al SAT para emitir facturas después de cada reserva confirmada.
"""
import requests
from typing import Optional

SAT_BASE_URL  = "http://localhost:9090"
SAT_WS_EMAIL  = "agencia@viajesb2b.gt"
SAT_WS_PASS   = "Agencia@SAT2026"

_sat_token: Optional[str] = None


def _get_token() -> str:
    """Obtiene o renueva el token JWT del SAT."""
    global _sat_token
    try:
        resp = requests.post(
            f"{SAT_BASE_URL}/api/auth/login",
            json={"email": SAT_WS_EMAIL, "password": SAT_WS_PASS},
            timeout=10
        )
        if resp.ok:
            _sat_token = resp.json().get("token")
            return _sat_token
    except Exception as e:
        print(f"⚠️  SAT login error: {e}")
    return None


def emitir_factura(
    nombre_cliente   : str,
    pasaporte_nit    : str,
    correo           : str,
    tipo_servicio    : str,  # HOTEL, VUELO, PAQUETE
    descripcion      : str,
    noches           : int,
    precio_por_noche : float,
    total            : float,
    direccion        : str = "Guatemala",
) -> Optional[dict]:
    """
    Emite una factura en el SAT.
    Retorna el dict con uuid, numeroFactura, total, pdfUrl o None si falla.
    """
    token = _get_token()
    if not token:
        print("⚠️  SAT no disponible — factura no emitida")
        return None

    payload = {
        "nombreCliente" : nombre_cliente,
        "pasaporteNit"  : pasaporte_nit,
        "correo"        : correo,
        "direccion"     : direccion,
        "tipoServicio"  : tipo_servicio.upper(),
        "productos"     : [
            {
                "descripcion"   : descripcion,
                "cantidad"      : noches,
                "precioUnitario": round(precio_por_noche, 2),
                "total"         : round(total, 2),
            }
        ],
    }

    try:
        resp = requests.post(
            f"{SAT_BASE_URL}/api/facturas/emitir",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=15
        )
        if resp.ok:
            return resp.json()
        else:
            print(f"⚠️  SAT error {resp.status_code}: {resp.text}")
            return None
    except Exception as e:
        print(f"⚠️  SAT conexión fallida: {e}")
        return None