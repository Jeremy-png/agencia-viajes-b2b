"""
Router de Facturación SAT.

Endpoints:
  POST /sat/facturas/emitir/{reservation_id}  → Emite factura para una reserva
  GET  /sat/facturas/consultar/{uuid}         → Consulta factura por UUID
  GET  /sat/reportes/periodo                  → Reporte de impuestos
  GET  /sat/pdf/{filename}                    → Descarga PDF de factura
"""

import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.auth_dependencies import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.reserva_hotel import ReservaHotel
from app.services.sat_client import (
    sat_client,
    FacturaRequest,
    FacturaResponse,
    ProductoLinea,
)
from app.services.audit_service import log_operation
from io import BytesIO

router = APIRouter()


# ──────────────────────────────────────────────────────────────────────────────
# EMITIR FACTURA SAT PARA UNA RESERVA
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/facturas/emitir/{reservation_id}")
def emitir_factura_sat(
    reservation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FacturaResponse:

    # ── 1. Obtener reserva ──────────────────────────────────────────────
    reserva = db.query(ReservaHotel).filter(
        ReservaHotel.reservation_id == reservation_id,
        ReservaHotel.agency_id == user.agency_id,
    ).first()
    
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    if reserva.sat_uuid:
        raise HTTPException(
            status_code=400,
            detail="Esta reserva ya tiene factura emitida en SAT"
        )
    
    # ── 2. Obtener datos del cliente ────────────────────────────────────
    customer = db.query(Customer).filter(
        Customer.customer_id == reserva.customer_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Datos del cliente no encontrados")
    
    # ── 3. Convertir a formato SAT ──────────────────────────────────────
    # Un producto: la habitación de hotel
    producto = ProductoLinea(
        descripcion=(
            f"{reserva.hotel_nombre} - {reserva.habitacion_tipo} "
            f"({reserva.check_in} a {reserva.check_out})"
        ),
        cantidad=float(reserva.noches),
        precioUnitario=reserva.precio_final_noche,
        total=reserva.total,  # Incluye markup
    )
    
    sat_request = FacturaRequest(
        nombreCliente=f"{customer.nombres} {customer.apellidos}",
        pasaporteNit=customer.email,  # Usar email como identificador
        direccion="",  # No disponible en BD actual
        correo=customer.email,
        tipoServicio="HOTEL",  # Tipo de servicio
        productos=[producto],
    )
    
    # ── 4. Emitir factura en SAT ────────────────────────────────────────
    try:
        factura_response = sat_client.emitir_factura(sat_request)
    except Exception as e:
        log_operation(
            db,
            operation="EMIT_INVOICE_SAT",
            user_id=user.user_id,
            agency_id=user.agency_id,
            entity="reserva_hotel",
            entity_id=reserva.reservation_id,
            status="ERROR",
            detail={"error": str(e)},
            channel="WEB",
        )
        raise HTTPException(
            status_code=502,
            detail=f"Error emitiendo factura en SAT: {str(e)}"
        )
    
    # ── 5. Guardar UUID en reserva ──────────────────────────────────────
    reserva.sat_uuid = factura_response.uuid
    reserva.sat_numero_factura = factura_response.numeroFactura
    reserva.sat_monto_iva = factura_response.montoIva
    reserva.sat_total = factura_response.total
    reserva.sat_pdf_url = factura_response.pdfUrl
    reserva.sat_emitida_en = datetime.utcnow()
    db.commit()
    
    # ── 6. Registrar en auditoría ───────────────────────────────────────
    log_operation(
        db,
        operation="EMIT_INVOICE_SAT",
        user_id=user.user_id,
        agency_id=user.agency_id,
        entity="reserva_hotel",
        entity_id=reserva.reservation_id,
        status="SUCCESS",
        detail={
            "sat_uuid": factura_response.uuid,
            "numero_factura": factura_response.numeroFactura,
            "hotel": reserva.hotel_nombre,
            "total": factura_response.total,
        },
        channel="WEB",
    )
    
    return factura_response


# ──────────────────────────────────────────────────────────────────────────────
# CONSULTAR FACTURA POR UUID
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/facturas/consultar/{uuid}")
def consultar_factura_sat(
    uuid: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FacturaResponse:

    try:
        factura = sat_client.consultar_factura(uuid)
        
        log_operation(
            db,
            operation="CONSULT_INVOICE_SAT",
            user_id=user.user_id,
            agency_id=user.agency_id,
            entity="factura_sat",
            entity_id=uuid,
            status="SUCCESS",
            channel="WEB",
        )
        
        return factura
        
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# REPORTE DE IMPUESTOS (PERÍODO)
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/reportes/periodo")
def obtener_reporte_impuestos(
    fecha_inicio: str,  # yyyy-MM-dd
    fecha_fin: str,     # yyyy-MM-dd
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Obtiene reporte de impuestos pagados en un período."""
    try:
        facturas = sat_client.obtener_reporte_por_proveedor(
            fecha_inicio, fecha_fin
        )
        
        # Calcular totales
        total_impuestos = sum(f.montoIva for f in facturas)
        total_ventas = sum(f.total for f in facturas)
        
        log_operation(
            db,
            operation="GET_REPORT_SAT",
            user_id=user.user_id,
            agency_id=user.agency_id,
            entity="reporte_sat",
            entity_id=f"{fecha_inicio}_{fecha_fin}",
            status="SUCCESS",
            detail={
                "cantidad_facturas": len(facturas),
                "total_impuestos": total_impuestos,
                "total_ventas": total_ventas,
            },
            channel="WEB",
        )
        
        return {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "cantidad_facturas": len(facturas),
            "total_impuestos": total_impuestos,
            "total_ventas": total_ventas,
            "porcentaje_impuesto_promedio": (
                (total_impuestos / total_ventas * 100)
                if total_ventas > 0 else 0
            ),
            "facturas": facturas,
        }
        
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# DESCARGAR PDF DE FACTURA
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/pdf/{filename}")
def descargar_pdf_factura(
    filename: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    try:
        # Validar que el usuario tenga acceso        
        pdf_content = sat_client.descargar_pdf(filename)
        
        log_operation(
            db,
            operation="DOWNLOAD_PDF_SAT",
            user_id=user.user_id,
            agency_id=user.agency_id,
            entity="pdf",
            entity_id=filename,
            status="SUCCESS",
            channel="WEB",
        )
        
        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
        
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# OBTENER ESTADO DE FACTURA SAT PARA UNA RESERVA
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/reservas/{reservation_id}/factura-estado")
def obtener_estado_factura(
    reservation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Obtiene el estado de facturación SAT de una reserva."""
    reserva = db.query(ReservaHotel).filter(
        ReservaHotel.reservation_id == reservation_id,
        ReservaHotel.agency_id == user.agency_id,
    ).first()
    
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    return {
        "reservation_id": reserva.reservation_id,
        "facturada": bool(reserva.sat_uuid),
        "sat_uuid": reserva.sat_uuid,
        "numero_factura": reserva.sat_numero_factura,
        "monto_iva": reserva.sat_monto_iva,
        "total": reserva.sat_total,
        "pdf_url": reserva.sat_pdf_url,
        "emitida_en": reserva.sat_emitida_en.isoformat() if reserva.sat_emitida_en else None,
    }
