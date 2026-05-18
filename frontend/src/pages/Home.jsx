import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const HIGHLIGHTS = [
  { icon: "🏨", title: "Múltiples cadenas",     desc: "Compara habitaciones de varias cadenas hoteleras en un solo lugar, con precios actualizados." },
  { icon: "💳", title: "Pago seguro",            desc: "Proceso de pago simplificado con confirmación inmediata y comprobante PDF descargable." },
  { icon: "📧", title: "Confirmación por email",  desc: "Recibe todos los detalles de tu reserva directamente en tu correo electrónico." },
  { icon: "❌", title: "Cancelación flexible",    desc: "Cancela hasta 24 horas antes del check-in." },
  { icon: "⭐", title: "Ratings y reseñas",       desc: "Lee opiniones reales de otros viajeros para elegir el hotel perfecto." },
];

const DESTINATIONS = [
  { name: "Guatemala",         img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80", desc: "Capital y corazón del país" },
  { name: "Antigua Guatemala", img: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=500&q=80", desc: "Patrimonio de la Humanidad" },  
  { name: "Quetzaltenango",    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80", desc: "La ciudad de los altos" },
  { name: "Flores",            img: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=500&q=80", desc: "Puerta a Tikal" },
];

export default function Home() {
  const nav      = useNavigate();
  const { user } = useAuth();

  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [destino,   setDestino]   = useState("");
  const [checkIn,   setCheckIn]   = useState(today);
  const [checkOut,  setCheckOut]  = useState(tomorrow);
  const [huespedes, setHuespedes] = useState(1);

  function buscar(e) {
    e.preventDefault();
    if (!destino.trim()) return;
    nav(`/buscar?destino=${encodeURIComponent(destino)}&check_in=${checkIn}&check_out=${checkOut}&huespedes=${huespedes}`);
  }

  function buscarDestino(nombre) {
    nav(`/buscar?destino=${encodeURIComponent(nombre)}&check_in=${checkIn}&check_out=${checkOut}&huespedes=1`);
  }

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(150deg, #eef2fe 0%, #f3f0ff 45%, #fce7f3 100%)",
        padding: "52px 20px 40px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>

          {/* Chip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "white", border: "1px solid var(--border)",
            borderRadius: 999, padding: "5px 14px",
            fontSize: 12, fontWeight: 600, color: "var(--brand-dark)",
            marginBottom: 20, boxShadow: "var(--shadow-xs)",
          }}>
            ✈️ Agencia de viajes multi-proveedor · Guatemala
          </div>

          <h1 style={{
            fontSize: 42, fontWeight: 900, color: "var(--text)",
            marginBottom: 12, lineHeight: 1.15, letterSpacing: "-0.5px",
          }}>
            Encuentra el hotel perfecto<br />
            <span style={{ color: "var(--brand-dark)" }}>en Guatemala</span>
          </h1>
          <p style={{
            color: "var(--text-2)", fontSize: 16, marginBottom: 32,
            fontWeight: 400, maxWidth: 520, margin: "0 auto 32px",
          }}>
            Compara precios de múltiples cadenas hoteleras y reserva en segundos.
          </p>

          {/* Caja de búsqueda — redondeada */}
          <form onSubmit={buscar} style={{
            background: "white",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 8px 32px rgba(124,158,245,0.18), 0 2px 8px rgba(0,0,0,0.06)",
            border: "1px solid var(--border)",
            maxWidth: 860,
            margin: "0 auto",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 80px 110px",
              gap: 10,
              alignItems: "flex-end",
            }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  🏙️ Destino
                </label>
                <input
                  className="input" required
                  value={destino} onChange={e => setDestino(e.target.value)}
                  placeholder="Guatemala, Antigua..."
                  style={{ borderRadius: 10 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  📅 Check-in
                </label>
                <input className="input" type="date" min={today}
                  value={checkIn} onChange={e => setCheckIn(e.target.value)}
                  style={{ borderRadius: 10 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  📅 Check-out
                </label>
                <input className="input" type="date" min={checkIn}
                  value={checkOut} onChange={e => setCheckOut(e.target.value)}
                  style={{ borderRadius: 10 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  👥
                </label>
                <input className="input" type="number" min={1} max={10}
                  value={huespedes} onChange={e => setHuespedes(e.target.value)}
                  style={{ borderRadius: 10, textAlign: "center" }} />
              </div>
              <div>
                <label style={{ visibility: "hidden", display: "block", fontSize: 11, marginBottom: 5 }}>.</label>
                <button type="submit" style={{
                  width: "100%", padding: "10px 0",
                  background: "var(--brand)", color: "white",
                  border: "none", borderRadius: 10,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  transition: "background 0.16s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--brand-dark)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--brand)"}
                >
                  🔍 Buscar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="container" style={{ padding: "40px 20px" }}>

        {/* ── Destinos ───────────────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ marginBottom: 4 }}>Destinos populares</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
            Los destinos más reservados por nuestros clientes
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {DESTINATIONS.map(d => (
              <div key={d.name} onClick={() => buscarDestino(d.name)}
                style={{
                  borderRadius: 16, overflow: "hidden",
                  border: "1px solid var(--border)", cursor: "pointer",
                  background: "white", boxShadow: "var(--shadow-sm)",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <img src={d.img} alt={d.name}
                  style={{ width: "100%", height: 145, objectFit: "cover" }}
                  onError={e => { e.target.style.display = "none"; }} />
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Por qué elegirnos ──────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ marginBottom: 4 }}>¿Por qué elegirnos?</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
            Tu agencia digital con acceso a múltiples proveedores
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(196px, 1fr))",
            gap: 14,
          }}>
            {HIGHLIGHTS.map(h => (
              <div key={h.title} className="card card-sm">
                <div style={{ fontSize: 26, marginBottom: 10 }}>{h.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{h.title}</div>
                <div className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Cadenas afiliadas ──────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ marginBottom: 4 }}>Cadenas afiliadas</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
            Trabajamos con las mejores cadenas hoteleras de Guatemala
          </p>
          <div className="card" style={{
            display: "flex", gap: 20, flexWrap: "wrap",
            alignItems: "center", justifyContent: "center", padding: "24px 28px",
          }}>
            {["HotelChain A", "HotelChain B"].map(name => (
              <div key={name} style={{
                padding: "12px 24px", borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--brand-light)",
                fontWeight: 700, fontSize: 15,
                color: "var(--brand-dark)",
              }}>
                🏨 {name}
              </div>
            ))}
            <span className="muted" style={{ fontSize: 13 }}>
              + más cadenas disponibles
            </span>
          </div>
        </section>

        {/* ── CTA condicional ────────────────────────────── */}
        {!user ? (
          <section>
            <div className="card" style={{
              background: "linear-gradient(135deg, var(--brand-light), #fce7f3)",
              textAlign: "center", padding: "40px 24px",
              border: "1px solid var(--brand-mid)",
            }}>
              <h2 style={{ marginBottom: 8 }}>¿Listo para reservar?</h2>
              <p className="muted" style={{ marginBottom: 24, maxWidth: 440, margin: "0 auto 24px" }}>
                Crea tu cuenta gratis y empieza a comparar precios de hoteles en segundos.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/register">
                  <button className="btn-blue" style={{ padding: "11px 28px", fontSize: 14 }}>
                    Crear cuenta gratis →
                  </button>
                </Link>
                <Link to="/buscar">
                  <button className="btn" style={{ padding: "11px 28px", fontSize: 14 }}>
                    Ver hoteles disponibles
                  </button>
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="card" style={{
              background: "linear-gradient(135deg, var(--brand-light), #ecfdf5)",
              padding: "24px 28px",
              border: "1px solid var(--brand-mid)",
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 16,
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>
                  ¡Hola, {user.nombres}! 👋
                </div>
                <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  ¿A dónde viajas hoy? Busca tu próximo destino.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Link to="/buscar">
                  <button className="btn-blue" style={{ padding: "10px 22px" }}>
                    🔍 Buscar hoteles
                  </button>
                </Link>
                <Link to="/mis-reservas">
                  <button className="btn" style={{ padding: "10px 22px" }}>
                    📋 Mis reservas
                  </button>
                </Link>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
