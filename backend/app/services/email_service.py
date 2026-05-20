"""Servicio de Email usando SMTP de Gmail."""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import date, datetime
from typing import Optional
import os

from app.core.config import settings


def _build_confirmation_html(data: dict) -> str:
    """Construye el HTML del email de confirmación de reserva."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }}
        .container {{ background: white; max-width: 600px; margin: 0 auto;
                     padding: 30px; border-radius: 8px; }}
        .header {{ background: #1a56db; color: white; padding: 20px;
                  border-radius: 6px; text-align: center; }}
        .section {{ margin: 20px 0; padding: 15px;
                   background: #f8f9fa; border-radius: 6px; }}
        .label {{ color: #6b7280; font-size: 12px; margin-bottom: 2px; }}
        .value {{ font-weight: bold; font-size: 15px; }}
        .total {{ font-size: 22px; color: #1a56db; font-weight: 900; }}
        .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }}
        .code {{ background: #1a56db; color: white; padding: 10px 20px;
                border-radius: 6px; font-size: 18px; font-weight: bold;
                letter-spacing: 2px; display: inline-block; margin: 10px 0; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0">✅ Reserva Confirmada</h1>
          <p style="margin:5px 0 0">{settings.APP_NAME}</p>
        </div>

        <p>Hola <strong>{data.get('cliente_nombres', '')} {data.get('cliente_apellidos', '')}</strong>,</p>
        <p>Tu reserva ha sido confirmada exitosamente. Guarda este correo como comprobante.</p>

        <div style="text-align:center; margin: 20px 0;">
          <div class="label">Código de reserva</div>
          <div class="code">{data.get('booking_code', '')}</div>
        </div>

        <div class="section">
          <h3 style="margin-top:0">🏨 Detalles del hotel</h3>
          <div class="label">Hotel</div>
          <div class="value">{data.get('hotel_nombre', '')}</div>
          <div class="label" style="margin-top:10px">Tipo de habitación</div>
          <div class="value">{data.get('habitacion_tipo', '')}</div>
          <div class="label" style="margin-top:10px">Destino</div>
          <div class="value">{data.get('destino', '')}</div>
        </div>

        <div class="section">
          <h3 style="margin-top:0">📅 Fechas</h3>
          <div style="display:flex; gap:40px;">
            <div>
              <div class="label">Check-in</div>
              <div class="value">{data.get('check_in', '')}</div>
            </div>
            <div>
              <div class="label">Check-out</div>
              <div class="value">{data.get('check_out', '')}</div>
            </div>
            <div>
              <div class="label">Noches</div>
              <div class="value">{data.get('noches', '')}</div>
            </div>
            <div>
              <div class="label">Huéspedes</div>
              <div class="value">{data.get('huespedes', '')}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 style="margin-top:0">💳 Resumen de pago</h3>
          <div class="label">Total pagado</div>
          <div class="total">{data.get('moneda', 'USD')} {data.get('total', '')}</div>
          <div class="label" style="margin-top:8px">Tarjeta terminada en</div>
          <div class="value">•••• {data.get('card_last4', '****')}</div>
        </div>

        <div class="footer">
          <p>Este es un correo automático. Por favor no respondas a este mensaje.</p>
          <p>{settings.APP_NAME} · Sistema académico UNIS</p>
        </div>
      </div>
    </body>
    </html>
    """


def _build_cancellation_html(data: dict) -> str:
    """Construye el HTML del email de cancelación."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }}
        .container {{ background: white; max-width: 600px; margin: 0 auto;
                     padding: 30px; border-radius: 8px; }}
        .header {{ background: #dc2626; color: white; padding: 20px;
                  border-radius: 6px; text-align: center; }}
        .section {{ margin: 20px 0; padding: 15px;
                   background: #fef2f2; border-radius: 6px; }}
        .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0">❌ Reserva Cancelada</h1>
          <p style="margin:5px 0 0">{settings.APP_NAME}</p>
        </div>

        <p>Hola <strong>{data.get('cliente_nombres', '')} {data.get('cliente_apellidos', '')}</strong>,</p>
        <p>Tu reserva ha sido cancelada.</p>

        <div class="section">
          <p><strong>Código:</strong> {data.get('booking_code', '')}</p>
          <p><strong>Hotel:</strong> {data.get('hotel_nombre', '')}</p>
          <p><strong>Destino:</strong> {data.get('destino', '')}</p>
          <p><strong>Check-in:</strong> {data.get('check_in', '')}</p>
          <p><strong>Check-out:</strong> {data.get('check_out', '')}</p>
          {f"<p><strong>Motivo:</strong> {data.get('motivo', '')}</p>" if data.get('motivo') else ''}
        </div>

        <div class="footer">
          <p>Este es un correo automático. Por favor no respondas a este mensaje.</p>
          <p>{settings.APP_NAME} · Sistema académico UNIS</p>
        </div>
      </div>
    </body>
    </html>
    """


def _send_email(to: str, subject: str, html: str, pdf_bytes: bytes | None = None, pdf_filename: str | None = None) -> None:
    """Función base para enviar un email HTML con adjunto opcional."""
    msg = MIMEMultipart("alternative" if not pdf_bytes else "mixed")
    msg["Subject"] = subject
    msg["From"]    = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"]      = to

    msg.attach(MIMEText(html, "html", "utf-8"))

    if pdf_bytes and pdf_filename:
        part = MIMEApplication(pdf_bytes, Name=pdf_filename)
        part["Content-Disposition"] = f'attachment; filename="{pdf_filename}"'
        msg.attach(part)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to, msg.as_string())


def send_confirmation_email(to: str, data: dict, pdf_bytes: bytes | None = None) -> None:
    """
    Envía email de confirmación de reserva.
    Si falla, loguea el error sin interrumpir el flujo.
    """
    try:
        html = _build_confirmation_html(data)
        _send_email(
            to          = to,
            subject     = f"✅ Confirmación de reserva — {data.get('hotel_nombre', '')} [{data.get('booking_code', '')}]",
            html        = html,
            pdf_bytes   = pdf_bytes,
            pdf_filename= f"reserva_{data.get('booking_code', 'confirmacion')}.pdf",
        )
        print(f"📧 Email de confirmación enviado a {to}")
    except Exception as e:
        print(f"⚠️  Error enviando email de confirmación a {to}: {e}")


def send_cancellation_email(to: str, data: dict) -> None:
    """
    Envía email de cancelación de reserva.
    Si falla, loguea el error sin interrumpir el flujo.
    """
    try:
        html = _build_cancellation_html(data)
        _send_email(
            to      = to,
            subject = f"❌ Cancelación de reserva — {data.get('hotel_nombre', '')} [{data.get('booking_code', '')}]",
            html    = html,
        )
        print(f"📧 Email de cancelación enviado a {to}")
    except Exception as e:
        print(f"⚠️  Error enviando email de cancelación a {to}: {e}")
