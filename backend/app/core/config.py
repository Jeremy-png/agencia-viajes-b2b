"""
Configuración centralizada de la aplicación.

Lee variables de entorno desde un archivo `.env` (gracias a python-dotenv)
y las expone como atributos de la clase Settings.

Uso:
    from app.core.config import settings
    print(settings.DATABASE_URL)
"""
import os
from dotenv import load_dotenv

# Carga .env desde el directorio actual o ancestros (busca hacia arriba)
load_dotenv()


def _bool_env(name: str, default: bool = False) -> bool:
    """Helper: lee una env var como booleano ('true', '1', 'yes' → True)."""
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("true", "1", "yes", "on")


class Settings:
    """Singleton de configuración. Lee todo desde variables de entorno."""

    # ---- App ----
    APP_NAME: str = os.getenv("APP_NAME", "Agencia Viajes B2B - UNIS")
    APP_DEBUG: bool = _bool_env("APP_DEBUG", True)
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    # ---- Database ----
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root@localhost/agencia_db",
    )

    # ---- JWT ----
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_ME_IN_ENV_FILE")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480")
    )

    # ---- SMTP (Gmail) ----
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Agencia Viajes UNIS")

    # ---- Callback security ----
    PROVIDER_CALLBACK_SECRET: str = os.getenv(
        "PROVIDER_CALLBACK_SECRET",
        "CHANGE_ME_CALLBACK_SECRET",
    )

    def warn_if_defaults(self) -> list[str]:
        """Devuelve lista de warnings si hay valores por default peligrosos."""
        warnings = []
        if self.SECRET_KEY.startswith("CHANGE_ME"):
            warnings.append("⚠️  SECRET_KEY usa valor por default. Configura .env")
        if self.PROVIDER_CALLBACK_SECRET.startswith("CHANGE_ME"):
            warnings.append("⚠️  PROVIDER_CALLBACK_SECRET usa default. Configura .env")
        return warnings


settings = Settings()
