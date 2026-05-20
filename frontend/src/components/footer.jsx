import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{
      background: "#f0f4ff",
      borderTop: "1px solid var(--border)",
      marginTop: 48,
    }}>
      <div className="container" style={{ padding: "36px 20px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 32,
          marginBottom: 28,
        }}>

          {/* Logo */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: "var(--brand-light)",
                border: "1px solid var(--border)",
                display: "grid", placeItems: "center", fontSize: 17,
              }}>
                ✈️
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>
                VIAJEXPRESS
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-2)", margin: 0 }}>
              Agencia de viajes. Hoteles en Europa, América, Asia y Medio Oriente.
              UNIS Guatemala.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 14 }}>
              Servicios
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { to: "/buscar",                 label: "Buscar hoteles" },
                { to: "/info/hoteles-afiliados", label: "Hoteles afiliados" },
                { to: "/info/cancelaciones",     label: "Proceso de cancelación" },
              ].map(l => (
                <Link key={l.to} to={l.to} style={{ fontSize: 13, color: "var(--text-2)", transition: "color var(--transition)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--brand-dark)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-2)"}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Destinos */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 14 }}>
              Destinos
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Paris", "Nueva York", "Tokyo", "Dubai", "Barcelona", "Cancun"].map(d => (
                <Link key={d} to={`/buscar?destino=${d}&check_in=${new Date().toISOString().split("T")[0]}&check_out=${new Date(Date.now()+86400000).toISOString().split("T")[0]}&huespedes=1`}
                  style={{ fontSize: 13, color: "var(--text-2)", transition: "color var(--transition)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--brand-dark)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-2)"}>
                  {d}
                </Link>
              ))}
            </div>
          </div>

          {/* Empresa */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 14 }}>
              Empresa
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { to: "/info/nosotros",   label: "Quiénes somos" },
                { to: "/info/terminos",   label: "Términos y condiciones" },
                { to: "/info/privacidad", label: "Política de privacidad" },
              ].map(l => (
                <Link key={l.to} to={l.to} style={{ fontSize: 13, color: "var(--text-2)", transition: "color var(--transition)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--brand-dark)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-2)"}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 14 }}>
              Contacto
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "📞", text: "+502 2345-6789" },
                { icon: "📧", text: "info@viajes.gt" },
                { icon: "📍", text: "Ciudad de Guatemala, Guatemala" },
                { icon: "🎓", text: "UNIS — Ingeniería en Sistemas" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "0 0 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            © {new Date().getFullYear()} VIAJEXPRESS — Sistema académico UNIS · Todos los derechos reservados
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { to: "/info/terminos",      label: "Términos" },
              { to: "/info/privacidad",    label: "Privacidad" },
              { to: "/info/cancelaciones", label: "Cancelaciones" },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{ fontSize: 12, color: "var(--muted)", transition: "color var(--transition)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--brand-dark)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
