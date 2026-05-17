"""
Servicio de generación de PDF para reservas.

Genera un PDF profesional con los datos de la reserva usando ReportLab.
Devuelve bytes del PDF para:
  - Adjuntarlo al email de confirmación
  - Guardarlo y permitir descarga por URL
"""
import os
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# Directorio donde guardamos los PDFs generados
PDF_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "generated_pdfs")


def _ensure_pdf_dir():
    os.makedirs(PDF_DIR, exist_ok=True)


# Colores de la marca
BRAND_BLUE  = colors.HexColor("#1a56db")
BRAND_LIGHT = colors.HexColor("#eff6ff")
GRAY_TEXT   = colors.HexColor("#6b7280")
DARK_TEXT   = colors.HexColor("#111827")
GREEN_OK    = colors.HexColor("#16a34a")
RED_CANCEL  = colors.HexColor("#dc2626")


def generate_reservation_pdf(data: dict) -> bytes:
    """
    Genera el PDF de confirmación de reserva.

    data esperado:
      booking_code, hotel_nombre, habitacion_tipo, destino,
      check_in, check_out, noches, huespedes, moneda, total,
      precio_final_noche, card_last4,
      cliente_nombres, cliente_apellidos, cliente_email,
      agency_name, confirmed_at
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize    = A4,
        rightMargin = 2*cm,
        leftMargin  = 2*cm,
        topMargin   = 2*cm,
        bottomMargin= 2*cm,
    )

    styles = getSampleStyleSheet()
    story  = []

    # ── Estilos personalizados ──────────────────────────────────────
    title_style = ParagraphStyle(
        "Title", parent=styles["Heading1"],
        textColor=colors.white, fontSize=20,
        alignment=TA_CENTER, spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        textColor=colors.white, fontSize=10,
        alignment=TA_CENTER,
    )
    section_title = ParagraphStyle(
        "SectionTitle", parent=styles["Normal"],
        textColor=BRAND_BLUE, fontSize=11, fontName="Helvetica-Bold",
        spaceBefore=12, spaceAfter=6,
    )
    label_style = ParagraphStyle(
        "Label", parent=styles["Normal"],
        textColor=GRAY_TEXT, fontSize=9,
    )
    value_style = ParagraphStyle(
        "Value", parent=styles["Normal"],
        textColor=DARK_TEXT, fontSize=11, fontName="Helvetica-Bold",
    )
    normal = styles["Normal"]

    # ── Header con fondo azul ──────────────────────────────────────
    header_data = [[
        Paragraph("✈ Agencia de Viajes B2B", title_style),
    ]]
    header_table = Table(header_data, colWidths=[17*cm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), BRAND_BLUE),
        ("ROUNDEDCORNERS", [8]),
        ("TOPPADDING",    (0,0), (-1,-1), 16),
        ("BOTTOMPADDING", (0,0), (-1,-1), 16),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ("RIGHTPADDING",  (0,0), (-1,-1), 12),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.3*cm))

    # Subtítulo
    story.append(Paragraph(
        "<b>COMPROBANTE DE RESERVA</b>",
        ParagraphStyle("Sub", parent=normal, textColor=BRAND_BLUE,
                       fontSize=13, alignment=TA_CENTER, spaceAfter=2),
    ))

    # Código de reserva destacado
    code_data = [[
        Paragraph("Código de reserva", label_style),
        Paragraph(f"<b>{data.get('booking_code', 'N/A')}</b>",
                  ParagraphStyle("Code", parent=normal,
                                 textColor=BRAND_BLUE, fontSize=16,
                                 alignment=TA_RIGHT, fontName="Helvetica-Bold")),
    ]]
    code_table = Table(code_data, colWidths=[8.5*cm, 8.5*cm])
    code_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), BRAND_LIGHT),
        ("ROUNDEDCORNERS",[6]),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ("RIGHTPADDING",  (0,0), (-1,-1), 12),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(Spacer(1, 0.3*cm))
    story.append(code_table)
    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE))

    # ── Detalles del hotel ─────────────────────────────────────────
    story.append(Paragraph("🏨 Detalles del Hotel", section_title))

    hotel_data = [
        [Paragraph("Hotel",             label_style), Paragraph(data.get("hotel_nombre",""),   value_style)],
        [Paragraph("Tipo de habitación",label_style), Paragraph(data.get("habitacion_tipo",""),value_style)],
        [Paragraph("Destino",           label_style), Paragraph(data.get("destino",""),         value_style)],
    ]
    hotel_table = Table(hotel_data, colWidths=[5*cm, 12*cm])
    hotel_table.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
    ]))
    story.append(hotel_table)

    # ── Fechas ────────────────────────────────────────────────────
    story.append(Paragraph("📅 Fechas de Estadía", section_title))

    fechas_data = [[
        Paragraph(f"<b>Check-in</b><br/>{data.get('check_in','')}",   normal),
        Paragraph(f"<b>Check-out</b><br/>{data.get('check_out','')}", normal),
        Paragraph(f"<b>Noches</b><br/>{data.get('noches','')}",       normal),
        Paragraph(f"<b>Huéspedes</b><br/>{data.get('huespedes','')}",  normal),
    ]]
    fechas_table = Table(fechas_data, colWidths=[4.25*cm]*4)
    fechas_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), BRAND_LIGHT),
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("ROUNDEDCORNERS",[6]),
    ]))
    story.append(fechas_table)

    # ── Datos del cliente ─────────────────────────────────────────
    story.append(Paragraph("👤 Datos del Huésped", section_title))

    cliente_data = [
        [Paragraph("Nombre",  label_style),
         Paragraph(f"{data.get('cliente_nombres','')} {data.get('cliente_apellidos','')}", value_style)],
        [Paragraph("Email",   label_style),
         Paragraph(data.get("cliente_email",""), value_style)],
    ]
    cliente_table = Table(cliente_data, colWidths=[5*cm, 12*cm])
    cliente_table.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
    ]))
    story.append(cliente_table)

    # ── Resumen de pago ───────────────────────────────────────────
    story.append(Paragraph("💳 Resumen de Pago", section_title))

    pago_data = [
        ["Concepto", "Valor"],
        [f"Habitación × {data.get('noches','')} noches",
         f"{data.get('moneda','USD')} {data.get('precio_final_noche',0):.2f}/noche"],
        ["Total pagado",
         f"{data.get('moneda','USD')} {data.get('total',0):.2f}"],
        [f"Tarjeta",  f"•••• {data.get('card_last4','****')}"],
    ]
    pago_table = Table(pago_data, colWidths=[10*cm, 7*cm])
    pago_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), BRAND_BLUE),
        ("TEXTCOLOR",     (0,0), (-1,0), colors.white),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("BACKGROUND",    (0,-1),(-1,-1), BRAND_LIGHT),
        ("FONTNAME",      (0,-1),(-1,-1), "Helvetica-Bold"),
        ("TEXTCOLOR",     (0,-1),(-1,-1), BRAND_BLUE),
        ("FONTSIZE",      (0,-1),(-1,-1), 13),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("GRID",          (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
        ("ALIGN",         (1,0), (1,-1), "RIGHT"),
    ]))
    story.append(pago_table)

    # ── Footer ────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
    story.append(Spacer(1, 0.2*cm))

    confirmed_str = ""
    if data.get("confirmed_at"):
        try:
            confirmed_str = datetime.fromisoformat(str(data["confirmed_at"])).strftime("%d/%m/%Y %H:%M")
        except Exception:
            confirmed_str = str(data["confirmed_at"])

    story.append(Paragraph(
        f"Confirmado el {confirmed_str} · {data.get('agency_name','Agencia Viajes UNIS')} · Sistema académico UNIS",
        ParagraphStyle("Footer", parent=normal,
                       textColor=GRAY_TEXT, fontSize=8, alignment=TA_CENTER),
    ))

    doc.build(story)
    return buffer.getvalue()


def save_pdf(booking_code: str, pdf_bytes: bytes) -> str:
    """
    Guarda el PDF en disco y devuelve la ruta relativa para descarga.
    Ruta: generated_pdfs/reserva_{booking_code}.pdf
    """
    _ensure_pdf_dir()
    filename = f"reserva_{booking_code}.pdf"
    filepath = os.path.join(PDF_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(pdf_bytes)
    return filename
