import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import { downloadReservaPdf } from "../api/pdfDownload";
import SatFacturacion from '../components/sat/SatFacturacion';

const STEPS = ["Resumen", "Huésped", "Pago", "Confirmación"];

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user }            = useAuth();
  const nav                 = useNavigate();

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [confirm, setConfirm] = useState(null);

  const [captcha,       setCaptcha]       = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [nombres,         setNombres]         = useState(user?.nombres || "");
  const [apellidos,       setApellidos]       = useState(user?.apellidos || "");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [nacionalidad,    setNacionalidad]    = useState("");
  const [emailCliente,    setEmailCliente]    = useState(user?.email || "");

  const [numTarjeta, setNumTarjeta] = useState("");
  const [cvv,        setCvv]        = useState("");
  const [nombreCard, setNombreCard] = useState("");
  const [direccion,  setDireccion]  = useState("");

  // ── Guardamos snapshot del carrito antes de vaciarlo ──────────
  // Así los datos siguen disponibles en el paso de confirmación
  const [cartSnapshot, setCartSnapshot] = useState(null);

  // ── Carrito vacío: solo si NO estamos en confirmación ─────────
  if (!cart && step !== 3) {
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: "center", paddingBottom: 80 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
        <div className="h1" style={{ marginBottom: 8 }}>Tu carrito está vacío</div>
        <p className="muted" style={{ marginBottom: 24 }}>
          Busca un hotel y agrega una habitación al carrito.
        </p>
        <Link to="/buscar">
          <button className="btn-blue" style={{
            padding: "11px 28px", borderRadius: 10,
          }}>
            Buscar hoteles
          </button>
        </Link>
      </div>
    );
  }

  // Usamos el snapshot si el carrito ya fue vaciado
  const data = cart || cartSnapshot;

  const noches = data
    ? Math.max((new Date(data.check_out) - new Date(data.check_in)) / 86400000, 1)
    : 0;
  const total = data ? (data.precio_final_noche * noches).toFixed(2) : "0.00";

  // ── Paso 1→2: captcha ─────────────────────────────────────────
  async function handleDatosOk(e) {
    e.preventDefault(); setErr("");
    try {
      const res = await api.get("/auth/captcha");
      setCaptcha(res.data);
      setCaptchaAnswer("");
      setStep(2);
    } catch { setErr("Error obteniendo captcha, intenta de nuevo."); }
  }

  // ── Paso 2: confirmar pago ────────────────────────────────────
  async function handlePagar(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const payload = {
        provider_id        : data.provider_id,
        room_id            : data.room_id,
        hotel_nombre       : data.hotel_nombre,
        habitacion_tipo    : data.habitacion_tipo,
        destino            : data.destino,
        check_in           : data.check_in,
        check_out          : data.check_out,
        huespedes          : Number(data.huespedes),
        precio_final_noche : data.precio_final_noche,
        moneda             : data.moneda || "USD",
        cliente: {
          nombres,
          apellidos,
          fecha_nacimiento: fechaNacimiento || null,
          nacionalidad    : nacionalidad    || null,
          email           : emailCliente,
        },
        pago: {
          numero_tarjeta   : numTarjeta.replace(/\s/g, ""),
          cvv,
          nombre_en_tarjeta: nombreCard,
          direccion_cobro  : direccion,
        },
      };

      const res  = await api.post("/checkout/confirmar", payload);
      const resp = res.data;

      // Guardar snapshot ANTES de vaciar el carrito
      setCartSnapshot({ ...data });
      setConfirm(resp);
      clearCart();          // ahora sí vaciamos el carrito
      setStep(3);           // avanzamos al paso de confirmación
    } catch (e) {
      const d = e?.response?.data?.detail;
      if (Array.isArray(d)) {
        setErr(d.map(x => `${x.loc?.slice(-1)[0]}: ${x.msg}`).join(" | "));
      } else {
        setErr(typeof d === "string" ? d : JSON.stringify(d ?? e.message));
      }
    } finally { setLoading(false); }
  }

  // ── Stepper ───────────────────────────────────────────────────
  const Stepper = () => (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              display: "grid", placeItems: "center",
              fontWeight: 800, fontSize: 13,
              border: i <= step ? "2px solid var(--brand)" : "2px solid var(--border)",
              background: i < step ? "var(--brand)" : i === step ? "var(--brand-light)" : "var(--surface)",
              color: i < step ? "white" : i === step ? "var(--brand-dark)" : "var(--muted)",
              transition: "all 0.25s",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600, marginTop: 5,
              color: i === step ? "var(--brand-dark)" : "var(--muted)",
            }}>
              {s}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 6px 16px",
              background: i < step ? "var(--brand)" : "var(--border)",
              transition: "background 0.25s",
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Fila de detalle ───────────────────────────────────────────
  const Row = ({ label, value, highlight }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0", borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</span>
      <span style={{
        fontWeight: highlight ? 900 : 600,
        fontSize: highlight ? 20 : 14,
        color: highlight ? "var(--brand-dark)" : "var(--text)",
      }}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 660 }}>
      <h1 style={{ marginBottom: 24 }}>Checkout</h1>
      <Stepper />

      {err && (
        <div style={{
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 18,
          color: "var(--danger)", fontSize: 13,
        }}>
          ⚠️ {err}
        </div>
      )}

      {/* ── Paso 0: Resumen ──────────────────────────────── */}
      {step === 0 && data && (
        <div className="card">
          <h2 style={{ marginBottom: 18, fontSize: 18 }}>Resumen de tu reserva</h2>
          <Row label="🏨 Hotel"        value={data.hotel_nombre} />
          <Row label="🛏️ Habitación"   value={data.habitacion_tipo} />
          <Row label="🏙️ Destino"      value={data.destino} />
          <Row label="📅 Check-in"     value={data.check_in} />
          <Row label="📅 Check-out"    value={data.check_out} />
          <Row label="🌙 Noches"       value={noches} />
          <Row label="👥 Huéspedes"    value={data.huespedes} />
          <Row label="💵 Precio/noche" value={`${data.moneda} $${data.precio_final_noche}`} />
          <Row label="💳 Total"        value={`${data.moneda} $${total}`} highlight />
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Link to="/buscar">
              <button className="btn" style={{ borderRadius: 10 }}>← Atrás</button>
            </Link>
            <button className="btn-blue" onClick={() => { setErr(""); setStep(1); }}
              style={{ flex: 1, padding: 12, fontSize: 15, borderRadius: 10 }}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 1: Datos del huésped ────────────────────── */}
      {step === 1 && (
        <form className="card" onSubmit={handleDatosOk}>
          <h2 style={{ marginBottom: 18, fontSize: 18 }}>Datos del huésped</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <div className="grid-2">
              <div>
                <label>Nombres *</label>
                <input className="input" required value={nombres}
                  onChange={e => setNombres(e.target.value)} />
              </div>
              <div>
                <label>Apellidos *</label>
                <input className="input" required value={apellidos}
                  onChange={e => setApellidos(e.target.value)} />
              </div>
            </div>
            <div>
              <label>Email de confirmación *</label>
              <input className="input" type="email" required value={emailCliente}
                onChange={e => setEmailCliente(e.target.value)} />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                Recibirás el PDF en este correo
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label>Fecha de nacimiento</label>
                <input className="input" type="date" value={fechaNacimiento}
                  onChange={e => setFechaNacimiento(e.target.value)} />
              </div>
              <div>
                <label>Nacionalidad</label>
                <input className="input" value={nacionalidad}
                  onChange={e => setNacionalidad(e.target.value)}
                  placeholder="Guatemalteca" />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button type="button" className="btn" style={{ borderRadius: 10 }}
              onClick={() => setStep(0)}>
              ← Atrás
            </button>
            <button type="submit" className="btn-blue"
              style={{ flex: 1, padding: 12, borderRadius: 10 }}>
              Continuar →
            </button>
          </div>
        </form>
      )}

      {/* ── Paso 2: Pago ─────────────────────────────────── */}
      {step === 2 && (
        <form className="card" onSubmit={handlePagar}>
          <h2 style={{ marginBottom: 6, fontSize: 18 }}>Datos de pago</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
            Solo guardamos los últimos 4 dígitos. El CVV nunca se almacena.
          </p>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label>Número de tarjeta *</label>
              <input className="input" required
                placeholder="4242 4242 4242 4242" maxLength={19}
                value={numTarjeta}
                onChange={e => setNumTarjeta(e.target.value)} />
            </div>
            <div className="grid-2">
              <div>
                <label>CVV *</label>
                <input className="input" required placeholder="123" maxLength={4}
                  value={cvv} onChange={e => setCvv(e.target.value)} />
              </div>
              <div>
                <label>Nombre en la tarjeta *</label>
                <input className="input" required placeholder="JUAN GARCIA"
                  value={nombreCard}
                  onChange={e => setNombreCard(e.target.value.toUpperCase())} />
              </div>
            </div>
            <div>
              <label>Dirección de cobro *</label>
              <input className="input" required
                placeholder="Zona 10, Ciudad de Guatemala"
                value={direccion} onChange={e => setDireccion(e.target.value)} />
            </div>

            {captcha && (
              <div style={{
                background: "var(--brand-light)",
                border: "1.5px solid var(--brand-mid)",
                borderRadius: 12, padding: 16,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "var(--brand-dark)",
                  marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  🛡️ Verificación de seguridad
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 700,
                  color: "var(--brand-dark)", marginBottom: 10,
                }}>
                  {captcha.pregunta}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" type="number" required
                    placeholder="Tu respuesta"
                    value={captchaAnswer}
                    onChange={e => setCaptchaAnswer(e.target.value)}
                    style={{ maxWidth: 160 }} />
                  <button type="button" className="btn" title="Nueva pregunta"
                    style={{ borderRadius: 10 }}
                    onClick={async () => {
                      const r = await api.get("/auth/captcha");
                      setCaptcha(r.data); setCaptchaAnswer("");
                    }}>
                    🔄
                  </button>
                </div>
              </div>
            )}

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 16px",
              background: "var(--brand-light)", borderRadius: 10,
              border: "1px solid var(--border)",
            }}>
              <span style={{ fontWeight: 700 }}>Total a cobrar</span>
              <span style={{ fontWeight: 900, fontSize: 22, color: "var(--brand-dark)" }}>
                {data?.moneda} ${total}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button type="button" className="btn" style={{ borderRadius: 10 }}
              onClick={() => setStep(1)}>
              ← Atrás
            </button>
            <button type="submit" className="btn-blue" disabled={loading}
              style={{ flex: 1, padding: 12, fontSize: 15, borderRadius: 10 }}>
              {loading ? "Procesando..." : `💳 Confirmar y pagar $${total}`}
            </button>
          </div>
        </form>
      )}

      {/* ── Paso 3: Confirmación ─────────────────────────── */}
      {step === 3 && (
        <div className="card" style={{ textAlign: "center" }}>
          {confirm ? (
            <>
              <div style={{ fontSize: 60, marginBottom: 14 }}>🎉</div>
              <h2 style={{ color: "var(--success)", marginBottom: 8, fontSize: 24 }}>
                ¡Reserva confirmada!
              </h2>
              <p style={{ color: "var(--text-2)", marginBottom: 24, fontSize: 14 }}>
                Revisa tu correo — te enviamos la confirmación con el PDF adjunto.
              </p>

              {/* Código de reserva */}
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontSize: 11, color: "var(--muted)", marginBottom: 8,
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  Código de reserva
                </div>
                <div style={{
                  display: "inline-block",
                  background: "var(--brand-light)",
                  border: "2px dashed var(--brand)",
                  borderRadius: 10, padding: "10px 24px",
                  fontSize: 22, fontWeight: 900,
                  color: "var(--brand-dark)", letterSpacing: 3,
                  fontFamily: "monospace",
                }}>
                  {confirm.provider_booking_code}
                </div>
              </div>

              {/* Detalle */}
              <div style={{
                background: "var(--surface-2)", borderRadius: 12,
                padding: "4px 16px", textAlign: "left", marginBottom: 24,
                border: "1px solid var(--border)",
              }}>
                <Row label="Hotel"       value={confirm.hotel_nombre      || cartSnapshot?.hotel_nombre} />
                <Row label="Habitación"  value={confirm.habitacion_tipo   || cartSnapshot?.habitacion_tipo} />
                <Row label="Destino"     value={confirm.destino           || cartSnapshot?.destino} />
                <Row label="Check-in"   value={String(confirm.check_in   || cartSnapshot?.check_in)} />
                <Row label="Check-out"  value={String(confirm.check_out  || cartSnapshot?.check_out)} />
                <Row label="Noches"     value={confirm.noches            || noches} />
                <Row label="Huéspedes"  value={confirm.huespedes         || cartSnapshot?.huespedes} />
                <Row label="Total pagado"
                  value={`${confirm.moneda || cartSnapshot?.moneda} $${confirm.total || total}`}
                  highlight />
              </div>

              {/* ── Componente SAT ─────────────────────────────────── */}
              {confirm.reservation_id && (
                <div style={{ marginTop: 32, marginBottom: 32 }}>
                  <SatFacturacion 
                    reservationId={confirm.reservation_id}
                    onSuccess={() => alert('✅ Factura emitida en SAT')}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                {confirm.provider_booking_code && (
                  <button className="btn-blue" style={{ borderRadius: 10 }}
                    onClick={() => downloadReservaPdf(confirm.provider_booking_code)}>
                    📄 Descargar PDF
                  </button>
                )}
                <Link to="/mis-reservas">
                  <button className="btn" style={{ borderRadius: 10 }}>📋 Mis reservas</button>
                </Link>
                <Link to="/">
                  <button className="btn" style={{ borderRadius: 10 }}>🏠 Inicio</button>
                </Link>
              </div>
            </>
          ) : (
            <div>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h2 style={{ color: "var(--success)", marginBottom: 8 }}>Pago procesado</h2>
              <p className="muted" style={{ marginBottom: 20 }}>
                Tu reserva fue creada. Revisa tu correo para los detalles.
              </p>
              <Link to="/mis-reservas">
                <button className="btn-blue" style={{ borderRadius: 10 }}>📋 Ver mis reservas</button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
