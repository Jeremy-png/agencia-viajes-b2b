"""
Router de Checkout.

Flujo completo en 2 pasos:

  POST /checkout/iniciar   → calcula totales, devuelve resumen (sin guardar nada)
  POST /checkout/confirmar → crea la reserva real, genera PDF, envía email

Endpoint extra:
  GET  /checkout/pdf/{booking_code} → descarga el PDF de la reserva
"""
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.auth_dependencies import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.models.reserva_hotel import ReservaHotel
from app.schemas.checkout_schema import (
    CheckoutIniciarRequest, CheckoutSession,
    CheckoutConfirmarRequest, CheckoutConfirmado,
)
from app.services.hotelchain_client import (
    hotelchain_login, hotelchain_create_reservation
)
from app.services.audit_service import log_operation
from app.services.pdf_service import generate_reservation_pdf, save_pdf, PDF_DIR
from app.services.email_service import send_confirmation_email

router = APIRouter()


# ──────────────────────────────────────────────────────────────────
# PASO 1: Iniciar checkout (preview sin guardar nada)
# ──────────────────────────────────────────────────────────────────

@router.post("/iniciar", response_model=CheckoutSession)
def iniciar_checkout(
    data: CheckoutIniciarRequest,
    user: User    = Depends(get_current_user),
    db  : Session = Depends(get_db),
):
    """
    Calcula el total de la reserva y devuelve un resumen para mostrar
    al usuario ANTES de pedirle los datos de pago.
    No hace ninguna llamada al proveedor ni guarda nada en BD.
    """
    noches = (data.check_out - data.check_in).days
    if noches <= 0:
        raise HTTPException(status_code=400, detail="check_out debe ser posterior a check_in")

    total = round(data.precio_final_noche * noches, 2)

    return CheckoutSession(
        provider_id        = data.provider_id,
        room_id            = data.room_id,
        hotel_nombre       = data.hotel_nombre,
        habitacion_tipo    = data.habitacion_tipo,
        destino            = data.destino,
        check_in           = data.check_in,
        check_out          = data.check_out,
        huespedes          = data.huespedes,
        noches             = noches,
        precio_final_noche = data.precio_final_noche,
        total_estimado     = total,
        moneda             = data.moneda,
    )


# ──────────────────────────────────────────────────────────────────
# PASO 2: Confirmar checkout (crea reserva real + PDF + email)
# ──────────────────────────────────────────────────────────────────

@router.post("/confirmar", response_model=CheckoutConfirmado)
def confirmar_checkout(
    data: CheckoutConfirmarRequest,
    user: User    = Depends(get_current_user),
    db  : Session = Depends(get_db),
):
    """
    Confirma la reserva:
    1. Valida el proveedor
    2. Llama al HotelChain para crear la reserva real
    3. Guarda el Customer (datos personales + últimos 4 de tarjeta)
    4. Guarda la ReservaHotel en BD
    5. Genera PDF
    6. Envía email de confirmación
    7. Registra en auditoría
    """
    noches = (data.check_out - data.check_in).days
    if noches <= 0:
        raise HTTPException(status_code=400, detail="check_out debe ser posterior a check_in")

    # ── 1. Validar proveedor ────────────────────────────────────
    provider = db.query(Provider).filter(
        Provider.provider_id == data.provider_id,
        Provider.agency_id   == user.agency_id,
        Provider.is_active   == True,
    ).first()
    if not provider:
        raise HTTPException(status_code=400, detail="Proveedor no encontrado o inactivo")
    if not provider.base_url or not provider.ws_email or not provider.ws_password:
        raise HTTPException(status_code=400, detail="Proveedor sin credenciales configuradas")

    markup = float(provider.agency_markup_percent or 0.0)

    # ── 2. Crear reserva en el proveedor ────────────────────────
    try:
        token = hotelchain_login(provider.base_url, provider.ws_email, provider.ws_password)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error autenticando con hotel: {e}")

    payload = {
        "RoomId"  : data.room_id,
        "CheckIn" : f"{data.check_in}T00:00:00",
        "CheckOut": f"{data.check_out}T00:00:00",
        "Guests"  : data.huespedes,
    }
    try:
        hotel_resp = hotelchain_create_reservation(provider.base_url, token, payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error creando reserva en hotel: {e}")

    provider_code   = hotel_resp.get("code") or hotel_resp.get("Code")
    provider_status = hotel_resp.get("status") or hotel_resp.get("Status") or "CONFIRMED"
    provider_total  = float(hotel_resp.get("totalAmount") or hotel_resp.get("TotalAmount") or 0)

    if not provider_code:
        raise HTTPException(status_code=502, detail=f"Reserva creada pero sin código. Respuesta: {hotel_resp}")

    # ── 3. Guardar Customer ─────────────────────────────────────
    card_digits = data.pago.numero_tarjeta.replace(" ", "").replace("-", "")
    card_last4  = card_digits[-4:]  # últimos 4 únicamente

    customer = Customer(
        nombres          = data.cliente.nombres,
        apellidos        = data.cliente.apellidos,
        fecha_nacimiento = data.cliente.fecha_nacimiento,
        nacionalidad     = data.cliente.nacionalidad,
        email            = data.cliente.email,
        card_last4       = card_last4,
        card_holder_name = data.pago.nombre_en_tarjeta,
        billing_address  = data.pago.direccion_cobro,
        # CVV: NUNCA se guarda
    )
    db.add(customer)
    db.flush()  # genera customer_id sin hacer commit aún

    # ── 4. Calcular precios con markup ──────────────────────────
    if provider_total > 0:
        precio_base_noche  = round(provider_total / noches, 2)
    else:
        precio_base_noche  = round(data.precio_final_noche / (1 + markup), 2)

    precio_final_noche = round(precio_base_noche * (1 + markup), 2)
    total_base         = round(provider_total, 2)
    total_final        = round(total_base * (1 + markup), 2)
    confirmed_at       = datetime.utcnow()

    # ── 5. Guardar ReservaHotel ─────────────────────────────────
    reserva = ReservaHotel(
        user_id               = user.user_id,
        agency_id             = user.agency_id,
        provider_id           = data.provider_id,
        provider_booking_code = provider_code,
        room_id               = data.room_id,
        provider_total_amount = total_base,
        provider_status       = provider_status,
        hotel_nombre          = data.hotel_nombre,
        habitacion_tipo       = data.habitacion_tipo,
        hotel_codigo          = None,
        destino               = data.destino,
        check_in              = data.check_in,
        check_out             = data.check_out,
        huespedes             = data.huespedes,
        moneda                = data.moneda,
        precio_base_noche     = precio_base_noche,
        precio_final_noche    = precio_final_noche,
        markup_percent        = markup,
        noches                = noches,
        total_base            = total_base,
        total                 = total_final,
        customer_id           = customer.customer_id,
        confirmed_at          = confirmed_at,
    )
    db.add(reserva)
    db.commit()
    db.refresh(reserva)

    # ── 6. Generar PDF ──────────────────────────────────────────
    pdf_data = {
        "booking_code"    : provider_code,
        "hotel_nombre"    : data.hotel_nombre,
        "habitacion_tipo" : data.habitacion_tipo,
        "destino"         : data.destino,
        "check_in"        : str(data.check_in),
        "check_out"       : str(data.check_out),
        "noches"          : noches,
        "huespedes"       : data.huespedes,
        "moneda"          : data.moneda,
        "precio_final_noche": precio_final_noche,
        "total"           : total_final,
        "card_last4"      : card_last4,
        "cliente_nombres" : data.cliente.nombres,
        "cliente_apellidos": data.cliente.apellidos,
        "cliente_email"   : data.cliente.email,
        "agency_name"     : provider.name,
        "confirmed_at"    : confirmed_at.isoformat(),
    }

    pdf_filename = None
    pdf_bytes    = None
    try:
        pdf_bytes    = generate_reservation_pdf(pdf_data)
        pdf_filename = save_pdf(provider_code, pdf_bytes)
    except Exception as e:
        print(f"⚠️  Error generando PDF: {e}")

    # ── 7. Enviar email ─────────────────────────────────────────
    send_confirmation_email(
        to        = data.cliente.email,
        data      = pdf_data,
        pdf_bytes = pdf_bytes,
    )

    # ── 8. Auditoría ────────────────────────────────────────────
    log_operation(
        db,
        operation = "CREATE_RESERVATION",
        user_id   = user.user_id,
        agency_id = user.agency_id,
        entity    = "reserva_hotel",
        entity_id = reserva.reservation_id,
        detail    = {
            "booking_code"  : provider_code,
            "hotel"         : data.hotel_nombre,
            "destino"       : data.destino,
            "check_in"      : str(data.check_in),
            "check_out"     : str(data.check_out),
            "total"         : total_final,
            "provider_id"   : data.provider_id,
        },
        channel   = "WEB",
        status    = "SUCCESS",
    )

    return CheckoutConfirmado(
        reservation_id        = reserva.reservation_id,
        provider_booking_code = provider_code,
        hotel_nombre          = data.hotel_nombre,
        habitacion_tipo       = data.habitacion_tipo,
        destino               = data.destino,
        check_in              = data.check_in,
        check_out             = data.check_out,
        huespedes             = data.huespedes,
        noches                = noches,
        total                 = total_final,
        moneda                = data.moneda,
        confirmed_at          = confirmed_at,
        pdf_url               = f"/checkout/pdf/{provider_code}" if pdf_filename else None,
    )


# ──────────────────────────────────────────────────────────────────
# Descarga de PDF
# ──────────────────────────────────────────────────────────────────

@router.get("/pdf/{booking_code}")
def download_pdf(
    booking_code: str,
    user        : User    = Depends(get_current_user),
    db          : Session = Depends(get_db),
):
    """
    Descarga el PDF de una reserva por código de reserva.
    Solo el dueño de la reserva o un ADMIN puede descargarlo.
    """
    reserva = db.query(ReservaHotel).filter(
        ReservaHotel.provider_booking_code == booking_code,
        ReservaHotel.agency_id             == user.agency_id,
    ).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    from app.models.user import Roles
    if user.role != Roles.ADMIN and reserva.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este PDF")

    filepath = os.path.join(PDF_DIR, f"reserva_{booking_code}.pdf")
    if not os.path.exists(filepath):
        # Regenerar si no existe en disco
        customer = db.query(Customer).filter(
            Customer.customer_id == reserva.customer_id
        ).first()
        pdf_data = {
            "booking_code"     : booking_code,
            "hotel_nombre"     : reserva.hotel_nombre or "",
            "habitacion_tipo"  : reserva.habitacion_tipo or "",
            "destino"          : reserva.destino,
            "check_in"         : str(reserva.check_in),
            "check_out"        : str(reserva.check_out),
            "noches"           : reserva.noches,
            "huespedes"        : reserva.huespedes,
            "moneda"           : reserva.moneda,
            "precio_final_noche": reserva.precio_final_noche,
            "total"            : reserva.total,
            "card_last4"       : customer.card_last4 if customer else "****",
            "cliente_nombres"  : customer.nombres if customer else "",
            "cliente_apellidos": customer.apellidos if customer else "",
            "cliente_email"    : customer.email if customer else "",
            "agency_name"      : "Agencia Viajes UNIS",
            "confirmed_at"     : str(reserva.confirmed_at or reserva.created_at),
        }
        try:
            pdf_bytes = generate_reservation_pdf(pdf_data)
            save_pdf(booking_code, pdf_bytes)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generando PDF: {e}")

    return FileResponse(
        path             = filepath,
        media_type       = "application/pdf",
        filename         = f"reserva_{booking_code}.pdf",
    )
