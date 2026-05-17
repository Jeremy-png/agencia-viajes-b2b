import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { cart }         = useCart();
  const nav              = useNavigate();
  const location         = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    nav("/");
    setMenuOpen(false);
  }

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  const navLinkStyle = (path) => ({
    padding: "6px 13px",
    borderRadius: "var(--radius-pill)",
    color: isActive(path) ? "var(--brand-dark)" : "var(--text-2)",
    background: isActive(path) ? "var(--brand-light)" : "transparent",
    fontSize: 13,
    fontWeight: 600,
    transition: "all var(--transition)",
    textDecoration: "none",
    display: "inline-block",
    border: isActive(path) ? "1px solid var(--brand-mid)" : "1px solid transparent",
  });

  return (
    <header className="nav">
      <div className="nav-inner">

        {/* Logo */}
        <Link to="/" className="brand">
          <div className="brand-badge">✈️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.1 }}>ViajesB2B</div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500 }}>
              Agencia multi-proveedor
            </div>
          </div>
        </Link>

        {/* Nav centro */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}>
          <Link to="/"       style={navLinkStyle("/")}>Inicio</Link>
          <Link to="/buscar" style={navLinkStyle("/buscar")}>Buscar hoteles</Link>
          <Link to="/info/hoteles-afiliados" style={navLinkStyle("/info/hoteles-afiliados")}>Hoteles</Link>
          <Link to="/info/cancelaciones"     style={navLinkStyle("/info/cancelaciones")}>Cancelaciones</Link>
          {user?.role === "ADMIN" && (
            <Link to="/admin" style={{
              ...navLinkStyle("/admin"),
              background: "var(--warn-bg)",
              color: "var(--warn)",
              borderColor: "var(--warn-border)",
            }}>
              ⚙️ Admin
            </Link>
          )}
        </nav>

        {/* Derecha */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Carrito */}
          <Link to="/checkout" style={{ position: "relative" }}>
            <button className="btn" style={{ padding: "7px 12px", fontSize: 16 }}>
              🛒
              {cart && (
                <span style={{
                  position: "absolute", top: -5, right: -5,
                  background: "var(--brand)", color: "white",
                  borderRadius: "50%", fontSize: 9, fontWeight: 800,
                  width: 17, height: 17, display: "grid", placeItems: "center",
                }}>
                  1
                </span>
              )}
            </button>
          </Link>

          {user ? (
            <div style={{ position: "relative" }}>
              <button
                className="btn"
                onClick={() => setMenuOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px" }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--brand), var(--accent))",
                  display: "grid", placeItems: "center",
                  fontSize: 12, fontWeight: 800, color: "white", flexShrink: 0,
                }}>
                  {user.nombres?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </span>
                <span style={{
                  maxWidth: 110, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontSize: 13, fontWeight: 600,
                }}>
                  {user.nombres || user.email}
                </span>
                <span style={{ fontSize: 9, color: "var(--muted)" }}>▼</span>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <>
                  {/* Overlay para cerrar */}
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 90 }}
                    onClick={() => setMenuOpen(false)}
                  />
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)", padding: 10,
                    minWidth: 210, zIndex: 100,
                    boxShadow: "var(--shadow-lg)",
                  }}>
                    {/* Info del usuario */}
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {user.nombres} {user.apellidos}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>{user.email}</div>
                      <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                        <span className={`badge ${user.role === "ADMIN" ? "badge-warn" : "badge-ok"}`}
                          style={{ fontSize: 10 }}>
                          {user.role}
                        </span>
                        <span className="badge" style={{ fontSize: 10 }}>
                          Agencia {user.agency_id}
                        </span>
                      </div>
                    </div>

                    <div className="hr" style={{ margin: "6px 0" }} />

                    {[
                      { to: "/mis-reservas", label: "📋 Mis reservas" },
                      ...(user.role === "ADMIN" ? [
                        { to: "/admin",          label: "⚙️ Panel admin" },
                        { to: "/admin/reservas", label: "📊 Todas las reservas" },
                      ] : []),
                    ].map(item => (
                      <Link key={item.to} to={item.to}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "block", padding: "8px 10px",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-2)", fontSize: 13, fontWeight: 500,
                          transition: "all var(--transition)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--brand-light)"; e.currentTarget.style.color = "var(--brand-dark)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; }}
                      >
                        {item.label}
                      </Link>
                    ))}

                    <div className="hr" style={{ margin: "6px 0" }} />

                    <button onClick={handleLogout} className="btn btn-danger"
                      style={{ width: "100%", fontSize: 13 }}>
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/login">
                <button className="btn" style={{ fontSize: 13 }}>Iniciar sesión</button>
              </Link>
              <Link to="/register">
                <button className="btn-blue" style={{ fontSize: 13, padding: "8px 16px" }}>
                  Registrarse
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
