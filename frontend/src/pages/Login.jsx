import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(email, password);
      nav("/");
    } catch (e) {
      const d = e?.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Credenciales inválidas");
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      background: "var(--bg)", minHeight: "100vh",
      display: "grid", placeItems: "center", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✈️</div>
          <h1 style={{ marginBottom: 6, color: "var(--brand)" }}>ViajesB2B</h1>
          <p className="muted">Inicia sesión para gestionar tus reservas</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          {err && (
            <div style={{
              background: "var(--danger-bg)", border: "1px solid #f5c6c3",
              borderRadius: "var(--radius-sm)", padding: "10px 14px",
              color: "var(--danger)", fontSize: 13, marginBottom: 16,
            }}>
              ⚠️ {err}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--text-2)" }}>
                Correo electrónico
              </label>
              <input
                className="input" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--text-2)" }}>
                Contraseña
              </label>
              <input
                className="input" type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn-search"
              disabled={loading}
              style={{ width: "100%", marginTop: 4 }}
            >
              {loading ? "Ingresando..." : "Iniciar sesión →"}
            </button>
          </form>

          <div style={{
            borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 16,
            textAlign: "center", fontSize: 13, color: "var(--muted)",
          }}>
            ¿No tienes cuenta?{" "}
            <Link to="/register" style={{ color: "var(--brand)", fontWeight: 700 }}>
              Regístrate gratis
            </Link>
          </div>
        </div>

        {/* Cuentas de prueba */}
        <div style={{
          marginTop: 16, padding: "12px 16px",
          background: "var(--brand-light)", borderRadius: "var(--radius)",
          border: "1px solid #b8c9f0", fontSize: 12, color: "var(--brand)",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>🔑 Cuentas de prueba</div>
          <div><b>Admin A:</b> admin@agencia-a.com / Admin1234!</div>
          <div><b>Admin B:</b> admin@agencia-b.com / Admin1234!</div>
        </div>
      </div>
    </div>
  );
}
