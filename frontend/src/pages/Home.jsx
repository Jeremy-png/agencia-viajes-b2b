import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const HIGHLIGHTS = [
  { icon: "🌍", title: "Destinos internacionales", desc: "Hoteles en Europa, América, Asia y Medio Oriente. París, Tokyo, Nueva York, Dubai y más." },
  { icon: "🏨", title: "Múltiples cadenas",        desc: "Accede a habitaciones de distintas cadenas hoteleras en un solo lugar, con precios comparados." },
  { icon: "💳", title: "Pago seguro",               desc: "Proceso de pago simplificado con confirmación inmediata y comprobante PDF descargable." },
  { icon: "📧", title: "Confirmación por email",    desc: "Recibe todos los detalles de tu reserva directamente en tu correo electrónico." },
  { icon: "❌", title: "Cancelación flexible",      desc: "Cancela tu reserva hasta 24 horas antes del check-in sin complicaciones." },
];

const DESTINATIONS = [
  {
    name: "Paris",
    label: "París, Francia",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80",
    desc: "La ciudad de la luz",
  },
  {
    name: "Nueva York",
    label: "Nueva York, EE.UU.",
    img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=500&q=80",
    desc: "La ciudad que nunca duerme",
  },
  {
    name: "Tokyo",
    label: "Tokyo, Japón",
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&q=80",
    desc: "Tradición y modernidad",
  },
  {
    name: "Dubai",
    label: "Dubai, EAU",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&q=80",
    desc: "Lujo en el desierto",
  },
  {
    name: "Barcelona",
    label: "Barcelona, España",
    img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=500&q=80",
    desc: "Arte y mar Mediterráneo",
  },
  {
    name: "Cancun",
    label: "Cancún, México",
    img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500&q=80",
    desc: "Paraíso caribeño",
  },
  {
    name: "Roma",
    label: "Roma, Italia",
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&q=80",
    desc: "La ciudad eterna",
  },
  {
    name: "Buenos Aires",
    label: "Buenos Aires, Argentina",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80",
    desc: "El París de Sudamérica",
  },
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
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "white", border: "1px solid var(--border)",
            borderRadius: 999, padding: "5px 16px",
            fontSize: 12, fontWeight: 600, color: "var(--brand-dark)",
            marginBottom: 20, boxShadow: "var(--shadow-xs)",
          }}>
            ✈️ Agencia de viajes B2B · Multi-proveedor · Internacional
          </div>

          <h1 style={{
            fontSize: 42, fontWeight: 900, color: "var(--text)",
            marginBottom: 12, lineHeight: 1.15, letterSpacing: "-0.5px",
          }}>
            Hoteles en todo el mundo,<br />
            <span style={{ color: "var(--brand-dark)" }}>
              comparados en un solo lugar
            </span>
          </h1>
          <p style={{
            color: "var(--text-2)", fontSize: 16, fontWeight: 400,
            maxWidth: 560, margin: "0 auto 32px",
          }}>
            Conectamos con múltiples cadenas hoteleras en tiempo real.
            Europa, América, Asia y Medio Oriente al mejor precio.
          </p>

          {/* Caja de búsqueda */}
          <form onSubmit={buscar} style={{
            background: "white",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 8px 32px rgba(124,158,245,0.18), 0 2px 8px rgba(0,0,0,0.06)",
            border: "1px solid var(--border)",
            maxWidth: 920,
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
                  🌍 Destino
                </label>
                <input
                  className="input" required
                  value={destino} onChange={e => setDestino(e.target.value)}
                  placeholder="París, Nueva York, Tokyo, Dubai..."
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

        {/* ── Destinos populares ────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ marginBottom: 4 }}>Destinos populares</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
            Los destinos internacionales más reservados por nuestros clientes
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: 14,
          }}>
            {DESTINATIONS.map(d => (
              <div key={d.name} onClick={() => buscarDestino(d.name)}
                style={{
                  borderRadius: 14, overflow: "hidden",
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
                <img src={d.img} alt={d.label}
                  style={{ width: "100%", height: 130, objectFit: "cover" }}
                  onError={e => { e.target.style.display = "none"; }} />
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{d.label}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Por qué elegirnos ─────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ marginBottom: 4 }}>¿Por qué elegir VIAJEXPRESS?</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
            Tu agencia digital con acceso a múltiples proveedores internacionales
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
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

        {/* ── Cadenas afiliadas ─────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ marginBottom: 4 }}>Cadenas hoteleras afiliadas</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
            Integración B2B con cadenas internacionales vía servicios REST
          </p>
          <div className="card" style={{ padding: "28px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              {[
                { nombre: "HotelChain Europa & Asia", destinos: "París · Roma · Tokyo · Barcelona", emoji: "🇪🇺" },
                { nombre: "HotelChain Americas",      destinos: "Nueva York · Cancún · Buenos Aires · Dubai", emoji: "🌎" },
              ].map(c => (
                <div key={c.nombre} style={{
                  padding: "16px 20px", borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--brand-light)",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{c.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand-dark)", marginBottom: 4 }}>
                    {c.nombre}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>{c.destinos}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA condicional ───────────────────────────── */}
        {!user ? (
          <section>
            <div className="card" style={{
              background: "linear-gradient(135deg, var(--brand-light), #fce7f3)",
              textAlign: "center", padding: "40px 24px",
              border: "1px solid var(--brand-mid)",
            }}>
              <h2 style={{ marginBottom: 8 }}>¿Listo para explorar el mundo?</h2>
              <p className="muted" style={{ marginBottom: 24, maxWidth: 460, margin: "0 auto 24px" }}>
                Crea tu cuenta gratis y reserva hoteles en más de 8 destinos internacionales.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/register">
                  <button className="btn-blue" style={{ padding: "11px 28px", fontSize: 14, borderRadius: 10 }}>
                    Crear cuenta gratis →
                  </button>
                </Link>
                <Link to="/buscar">
                  <button className="btn" style={{ padding: "11px 28px", fontSize: 14, borderRadius: 10 }}>
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
                  ¿A dónde viajas hoy? Busca tu próximo destino internacional.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to="/buscar">
                  <button className="btn-blue" style={{ padding: "10px 22px", borderRadius: 10 }}>
                    🔍 Buscar hoteles
                  </button>
                </Link>
                <Link to="/mis-reservas">
                  <button className="btn" style={{ padding: "10px 22px", borderRadius: 10 }}>
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
