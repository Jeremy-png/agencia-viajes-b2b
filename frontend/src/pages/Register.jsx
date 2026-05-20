import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();

  const [agencies, setAgencies] = useState([]);
  const [captcha,  setCaptcha]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState("");
  const [success,  setSuccess]  = useState(false);

  const [form, setForm] = useState({
    email            : "",
    password         : "",
    nombres          : "",
    apellidos        : "",
    edad             : "",
    pais_origen      : "Guatemala",
    numero_pasaporte : "",
    agency_id        : 1,
    captcha_answer   : "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [ag, cap] = await Promise.all([
          api.get("/agencies"),
          api.get("/auth/captcha"),
        ]);
        setAgencies(ag.data);
        setCaptcha(cap.data);
        if (ag.data.length) setForm(f => ({ ...f, agency_id: ag.data[0].agency_id }));
      } catch {
        setErr("Error cargando datos. Verifica que el backend esté corriendo.");
      }
    })();
  }, []);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function refreshCaptcha() {
    try {
      const res = await api.get("/auth/captcha");
      setCaptcha(res.data);
      setForm(f => ({ ...f, captcha_answer: "" }));
    } catch { /* silencioso */ }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await api.post("/auth/register", {
        email            : form.email,
        password         : form.password,
        nombres          : form.nombres,
        apellidos        : form.apellidos,
        edad             : Number(form.edad),
        pais_origen      : form.pais_origen,
        numero_pasaporte : form.numero_pasaporte,
        agency_id        : Number(form.agency_id),
        captcha_id       : captcha?.captcha_id,
        captcha_answer   : Number(form.captcha_answer),
      });
      setSuccess(true);
      setTimeout(() => nav("/login"), 2000);
    } catch (e) {
      const d = e?.response?.data?.detail;
      setErr(typeof d === "string" ? d : JSON.stringify(d ?? e.message));
      if (String(d).toLowerCase().includes("captcha")) refreshCaptcha();
    } finally { setLoading(false); }
  }

  if (success) return (
    <div style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="confirm-box" style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div className="h2" style={{ color: "var(--success)", marginBottom: 8 }}>
          ¡Cuenta creada!
        </div>
        <p className="muted">Redirigiendo al login...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "32px 16px" }}>
      <div style={{ maxWidth: 580, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link to="/" style={{ color: "var(--brand)", fontSize: 13, fontWeight: 600 }}>
            ← Volver al inicio
          </Link>
          <h1 style={{ marginTop: 16, marginBottom: 6 }}>Crear cuenta</h1>
          <p className="muted">
            Únete a VIAJEXPRESS y reserva hoteles en todo el mundo
          </p>
        </div>

        {err && (
          <div style={{
            background: "var(--danger-bg)", border: "1px solid #f5c6c3",
            borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: 16,
            color: "var(--danger)", fontSize: 13,
          }}>
            ⚠️ {err}
          </div>
        )}

        <form onSubmit={onSubmit}>

          {/* ── Sección 1: Datos personales ─── */}
          <div className="form-section">
            <div className="form-section-title">👤 Datos personales</div>
            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div>
                <label>Nombres <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  className="input" required
                  value={form.nombres} onChange={set("nombres")}
                  placeholder="Juan Carlos"
                />
              </div>
              <div>
                <label>Apellidos <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  className="input" required
                  value={form.apellidos} onChange={set("apellidos")}
                  placeholder="García López"
                />
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div>
                <label>Edad <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  className="input" type="number" required
                  min={1} max={120}
                  value={form.edad} onChange={set("edad")}
                  placeholder="28"
                />
              </div>
              <div>
                <label>País de origen <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  className="input" required
                  value={form.pais_origen} onChange={set("pais_origen")}
                  placeholder="Guatemala"
                />
              </div>
            </div>
            <div>
              <label>Número de pasaporte <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                className="input" required
                value={form.numero_pasaporte} onChange={set("numero_pasaporte")}
                placeholder="GT123456"
              />
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                Este dato es requerido para las reservaciones de hotel
              </div>
            </div>
          </div>

          {/* ── Sección 2: Cuenta ─── */}
          <div className="form-section">
            <div className="form-section-title">🔐 Datos de acceso</div>
            <div style={{ marginBottom: 12 }}>
              <label>Correo electrónico <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                className="input" type="email" required
                value={form.email} onChange={set("email")}
                placeholder="juan@correo.com"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Contraseña <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                className="input" type="password" required minLength={8}
                value={form.password} onChange={set("password")}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label>Agencia <span style={{ color: "var(--danger)" }}>*</span></label>
              <select
                className="input"
                value={form.agency_id}
                onChange={e => setForm(f => ({ ...f, agency_id: Number(e.target.value) }))}
              >
                {agencies.map(a => (
                  <option key={a.agency_id} value={a.agency_id}>{a.name}</option>
                ))}
              </select>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                Tu cuenta quedará asociada a esta agencia
              </div>
            </div>
          </div>

          {/* ── Sección 3: Captcha ─── */}
          {captcha && (
            <div className="captcha-box" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                🛡️ Verificación de seguridad
              </div>
              <div className="captcha-question">{captcha.pregunta}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input" type="number" required
                  placeholder="Tu respuesta"
                  value={form.captcha_answer}
                  onChange={set("captcha_answer")}
                  style={{ maxWidth: 160 }}
                />
                <button type="button" className="btn" onClick={refreshCaptcha}
                  style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                  🔄 Nueva pregunta
                </button>
              </div>
            </div>
          )}

          {/* ── Botón ─── */}
          <button
            type="submit"
            className="btn-search"
            disabled={loading}
            style={{ width: "100%", marginBottom: 16 }}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta →"}
          </button>

        </form>

        {/* Footer del form */}
        <div style={{
          textAlign: "center", fontSize: 13, color: "var(--muted)",
          borderTop: "1px solid var(--border)", paddingTop: 16,
        }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={{ color: "var(--brand)", fontWeight: 700 }}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
