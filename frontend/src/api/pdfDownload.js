/**
 * Descarga un PDF de reserva con autenticación JWT.
 *
 * El problema: <a href="..."> abre el link directo en el navegador
 * sin enviar el header Authorization → backend devuelve 401.
 *
 * La solución: usar fetch() con el token, convertir a Blob,
 * crear un object URL temporal y disparar la descarga.
 */
export async function downloadReservaPdf(bookingCode) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Debes iniciar sesión para descargar el PDF.");
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:8000/checkout/pdf/${bookingCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `reserva_${bookingCode}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error descargando PDF:", err);
    alert(`No se pudo descargar el PDF: ${err.message}`);
  }
}
