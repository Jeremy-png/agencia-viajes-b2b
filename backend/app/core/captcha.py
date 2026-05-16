"""
Servicio de Captcha matemático.

Genera un desafío del tipo "¿Cuánto es X + Y?" (o X * Y para más variedad).
El ID del captcha y la respuesta correcta se guardan en un diccionario
en memoria con TTL de 5 minutos.

No requiere Redis ni ninguna dependencia externa.

Uso:
    captcha = generate_captcha()
    # → {"captcha_id": "uuid", "pregunta": "¿Cuánto es 7 + 4?"}

    ok = validate_captcha(captcha_id, 11)
    # → True (y elimina el captcha de la cache para que no se reutilice)
"""
import uuid
import random
import time
from typing import Optional

# Cache en memoria: { captcha_id: {"answer": int, "expires_at": float} }
_captcha_cache: dict[str, dict] = {}

TTL_SECONDS = 300  # 5 minutos


def _clean_expired() -> None:
    """Elimina captchas vencidos de la cache."""
    now = time.time()
    expired = [k for k, v in _captcha_cache.items() if v["expires_at"] < now]
    for k in expired:
        del _captcha_cache[k]


def generate_captcha() -> dict:
    """
    Genera un nuevo captcha matemático.
    Devuelve: { captcha_id: str, pregunta: str }
    """
    _clean_expired()

    a = random.randint(1, 20)
    b = random.randint(1, 20)

    # Elegir operación al azar
    op = random.choice(["+", "-", "*"])
    if op == "+":
        answer   = a + b
        pregunta = f"¿Cuánto es {a} + {b}?"
    elif op == "-":
        # Evitar negativos
        a, b     = max(a, b), min(a, b)
        answer   = a - b
        pregunta = f"¿Cuánto es {a} - {b}?"
    else:
        # Multiplicación con números pequeños para no torturar al usuario
        a = random.randint(1, 9)
        b = random.randint(1, 9)
        answer   = a * b
        pregunta = f"¿Cuánto es {a} × {b}?"

    captcha_id = str(uuid.uuid4())
    _captcha_cache[captcha_id] = {
        "answer"    : answer,
        "expires_at": time.time() + TTL_SECONDS,
    }

    return {"captcha_id": captcha_id, "pregunta": pregunta}


def validate_captcha(captcha_id: str, answer: int) -> bool:
    """
    Valida la respuesta del usuario.
    Si es correcta (o incorrecta), ELIMINA el captcha de la cache
    para que no se pueda reutilizar.
    Devuelve True si es válido, False en cualquier otro caso.
    """
    _clean_expired()

    entry = _captcha_cache.get(captcha_id)
    if not entry:
        return False  # No existe o expiró

    # Eliminar siempre (un captcha = un intento)
    del _captcha_cache[captcha_id]

    if entry["expires_at"] < time.time():
        return False  # Expiró justo al validar

    return entry["answer"] == answer
