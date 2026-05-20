"""
Captcha matemático.

"""
import uuid
import random
import time
from typing import Optional

# Cache en memoria: { captcha_id: {"answer": int, "expires_at": float} }
_captcha_cache: dict[str, dict] = {}

TTL_SECONDS = 300  # 5 minutos


def _clean_expired() -> None:
    """ captchas vencidos de la cache."""
    now = time.time()
    expired = [k for k, v in _captcha_cache.items() if v["expires_at"] < now]
    for k in expired:
        del _captcha_cache[k]


def generate_captcha() -> dict:
    """nuevo captcha matemático."""
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
    """
    _clean_expired()

    entry = _captcha_cache.get(captcha_id)
    if not entry:
        return False  # No existe o expiró

    del _captcha_cache[captcha_id]

    if entry["expires_at"] < time.time():
        return False  # Expiró justo al validar

    return entry["answer"] == answer
