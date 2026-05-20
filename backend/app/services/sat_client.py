"""
Cliente REST para integración con el Sistema de Simulación SAT.

Responsabilidades:
- Autenticación (obtener token JWT)
- Emitir facturas
- Consultar facturas
- Obtener reportes

Configuración necesaria en environment variables:
  SAT_API_URL=http://localhost:9090
  SAT_API_EMAIL=agencia-viajes@example.com
  SAT_API_PASSWORD=password123
"""

import os
import httpx
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN
# ════════════════════════════════════════════════════════════════════════════

SAT_API_URL = os.getenv("SAT_API_URL", "http://localhost:9090")
SAT_API_EMAIL = os.getenv("SAT_API_EMAIL", "agencia-viajes@example.com")
SAT_API_PASSWORD = os.getenv("SAT_API_PASSWORD", "password123")

TIMEOUT = 30.0  # segundos


# ════════════════════════════════════════════════════════════════════════════
# MODELOS DTO
# ════════════════════════════════════════════════════════════════════════════

class ProductoLinea(BaseModel):
    """Línea de producto en una factura"""
    descripcion: str
    cantidad: float
    precioUnitario: float
    total: float


class FacturaRequest(BaseModel):
    """Solicitud de emisión de factura"""
    nombreCliente: str
    pasaporteNit: str  # Pasaporte o correo (no NIT en Guatemala)
    direccion: Optional[str] = None
    correo: Optional[str] = None
    tipoServicio: str  # VUELO, HOTEL, PAQUETE
    productos: List[ProductoLinea]


class FacturaResponse(BaseModel):
    """Respuesta de emisión de factura"""
    uuid: str
    numeroFactura: str
    nombreCliente: str
    pasaporteNit: str
    tipoServicio: str
    subtotal: float
    porcentajeIva: float
    montoIva: float
    total: float
    pdfUrl: Optional[str] = None
    fechaEmision: str
    proveedor: str
    mensaje: str


class LoginRequest(BaseModel):
    """Solicitud de autenticación"""
    email: str
    password: str


class LoginResponse(BaseModel):
    """Respuesta de autenticación"""
    token: str
    email: str
    nombreSistema: str
    role: str


# ════════════════════════════════════════════════════════════════════════════
# CLIENTE SAT
# ════════════════════════════════════════════════════════════════════════════

class SatIntegrationClient:
    """ Cliente REST para comunicación con el Sistema de Simulación SAT."""

    def __init__(
        self,
        api_url: str = SAT_API_URL,
        api_email: str = SAT_API_EMAIL,
        api_password: str = SAT_API_PASSWORD,
    ):
        """Inicializar cliente SAT"""
        self.api_url = api_url.rstrip("/")
        self.api_email = api_email
        self.api_password = api_password
        self.cached_token: Optional[str] = None
        self.token_expiration: Optional[datetime] = None

    def obtener_token(self) -> str:

        # Verificar si tenemos un token válido en caché
        if (
            self.cached_token 
            and self.token_expiration 
            and datetime.now() < self.token_expiration
        ):
            logger.debug("Usando token en caché")
            return self.cached_token

        try:
            url = f"{self.api_url}/api/auth/login"
            
            logger.info(f"🔐 Obteniendo token del SAT desde: {url}")
            
            with httpx.Client(timeout=TIMEOUT) as client:
                response = client.post(
                    url,
                    json={
                        "email": self.api_email,
                        "password": self.api_password,
                    }
                )
            
            response.raise_for_status()
            data = response.json()
            
            self.cached_token = data.get("token")
            # Cachear por 23 horas (SAT lo valida 24)
            self.token_expiration = datetime.now() + timedelta(hours=23)
            
            logger.info("✅ Token obtenido exitosamente")
            return self.cached_token

        except httpx.HTTPError as e:
            logger.error(f"❌ Error de conexión con SAT: {e}")
            raise Exception(f"No se pudo conectar con el Sistema SAT: {e}")
        except Exception as e:
            logger.error(f"❌ Error obteniendo token: {e}")
            raise Exception(f"Error obteniendo token de SAT: {e}")

    def emitir_factura(self, request: FacturaRequest) -> FacturaResponse:
        """Emite una factura en el Sistema SAT."""
        try:
            token = self.obtener_token()
            url = f"{self.api_url}/api/facturas/emitir"
            
            logger.info(
                f"📋 Emitiendo factura para cliente: {request.nombreCliente} "
                f"(tipo: {request.tipoServicio})"
            )
            
            with httpx.Client(timeout=TIMEOUT) as client:
                response = client.post(
                    url,
                    json=request.dict(),
                    headers={"Authorization": f"Bearer {token}"},
                )
            
            response.raise_for_status()
            data = response.json()
            
            factura_response = FacturaResponse(**data)
            logger.info(
                f"✅ Factura emitida: {factura_response.numeroFactura} "
                f"(UUID: {factura_response.uuid})"
            )
            return factura_response

        except httpx.HTTPError as e:
            logger.error(f"❌ Error de conexión al emitir factura: {e}")
            raise Exception(f"No se pudo conectar con SAT para emitir factura: {e}")
        except Exception as e:
            logger.error(f"❌ Error emitiendo factura: {e}")
            raise Exception(f"Error al emitir factura en SAT: {e}")

    def consultar_factura(self, uuid: str) -> FacturaResponse:
        """Consulta una factura por su UUID."""
        try:
            token = self.obtener_token()
            url = f"{self.api_url}/api/facturas/{uuid}"
            
            logger.info(f"🔍 Consultando factura: {uuid}")
            
            with httpx.Client(timeout=TIMEOUT) as client:
                response = client.get(
                    url,
                    headers={"Authorization": f"Bearer {token}"},
                )
            
            response.raise_for_status()
            data = response.json()
            
            factura_response = FacturaResponse(**data)
            logger.info(f"✅ Factura encontrada: {factura_response.numeroFactura}")
            return factura_response

        except httpx.HTTPError as e:
            logger.error(f"❌ Error al consultar factura: {e}")
            raise Exception(f"No se pudo consultar la factura en SAT: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando respuesta: {e}")
            raise Exception(f"Error al consultar factura: {e}")

    def obtener_reporte_por_proveedor(
        self,
        fecha_inicio: str,
        fecha_fin: str,
    ) -> List[FacturaResponse]:
        """Obtiene un reporte de impuestos por proveedor (agencia de viajes)."""
        try:
            token = self.obtener_token()
            url = f"{self.api_url}/api/reportes/por-proveedor"
            
            logger.info(
                f"📊 Obteniendo reporte de impuestos para período: "
                f"{fecha_inicio} a {fecha_fin}"
            )
            
            with httpx.Client(timeout=TIMEOUT) as client:
                response = client.post(
                    url,
                    json={
                        "fechaInicio": fecha_inicio,
                        "fechaFin": fecha_fin,
                        "proveedor": self.api_email,
                    },
                    headers={"Authorization": f"Bearer {token}"},
                )
            
            response.raise_for_status()
            data = response.json()
            
            reportes = [FacturaResponse(**item) for item in data]
            logger.info(f"✅ Reporte obtenido: {len(reportes)} registros")
            return reportes

        except httpx.HTTPError as e:
            logger.error(f"❌ Error al obtener reporte: {e}")
            raise Exception(f"No se pudo obtener el reporte del SAT: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando reporte: {e}")
            raise Exception(f"Error al procesar reporte: {e}")

    def descargar_pdf(self, filename: str) -> bytes:
        """Descarga un PDF de factura desde SAT."""
        try:
            token = self.obtener_token()
            url = f"{self.api_url}/api/facturas/pdf/{filename}"
            
            logger.info(f"📥 Descargando PDF: {filename}")
            
            with httpx.Client(timeout=TIMEOUT) as client:
                response = client.get(
                    url,
                    headers={"Authorization": f"Bearer {token}"},
                )
            
            response.raise_for_status()
            logger.info(f"✅ PDF descargado: {filename}")
            return response.content

        except httpx.HTTPError as e:
            logger.error(f"❌ Error descargando PDF: {e}")
            raise Exception(f"No se pudo descargar el PDF: {e}")

    def invalidar_token(self):

        self.cached_token = None
        self.token_expiration = None
        logger.info("🔄 Token invalidado, se solicitará uno nuevo")


# ════════════════════════════════════════════════════════════════════════════
# INSTANCIA GLOBAL
# ════════════════════════════════════════════════════════════════════════════

# Cliente global para usar en toda la aplicación
sat_client = SatIntegrationClient()
