import React, { useEffect, useState } from "react";
import api from "../../api/client";

const EMPTY = { name: "", provider_type: "HOTEL", base_url: "", is_active: true, agency_markup_percent: 0.10, ws_email: "", ws_password: "" };

export default function AdminProviders() {
  const [items, setItems]   = useState([]);
  const [form,  setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [err,   setErr]     = useState("");
  const [ok,    setOk]      = useState("");

  async function load() {
    try { setItems((await api.get("/providers")).data); }
    catch { setErr("Error cargando providers"); }
  }
  useEffect(() => { load(); }, []);

  function flash(msg) { setOk(msg); setTimeout(() => setOk(""), 3000); }

  async function save() {
    setErr("");
    try {
      if (editing) {
        await api.put(`/providers/${editing}`, form);
        flash("Provider actualizado ✓");
      } else {
        await api.post("/providers", form);
        flash("Provider creado ✓");
      }
      setForm(EMPTY); setEditing(null); await load();
    } catch (e) { setErr(e?.response?.data?.detail || "Error guardando"); }
  }

  async function toggle(p) {
    await api.post(`/providers/${p.provider_id}/${p.is_active ? "deactivate" : "activate"}`);
    await load();
  }

  function startEdit(p) {
    setEditing(p.provider_id);
    setForm({ name: p.name, provider_type: p.provider_type, base_url: p.base_url,
      is_active: p.is_active, agency_markup_percent: p.agency_markup_percent,
      ws_email: p.ws_email || "", ws_password: "" });
  }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ margin: "0 0 4px" }}>🏢 Proveedores</h1>
      <p className="muted" style={{ margin: "0 0 20px", fontSize: 14 }}>
        Cadenas hoteleras configuradas para esta agencia.
      </p>

      {err && <div className="card card-sm" style={{ marginBottom: 12 }}><span className="badge badge-danger">Error</span> {err}</div>}
      {ok  && <div className="card card-sm" style={{ marginBottom: 12 }}><span className="badge badge-ok">{ok}</span></div>}

      {/* Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>
          {editing ? "✏️ Editar provider" : "➕ Nuevo provider"}
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div className="grid-2">
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Nombre</div>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="HotelChain A" />
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>URL base</div>
              <input className="input" value={form.base_url} onChange={e => setForm({...form, base_url: e.target.value})} placeholder="http://localhost:8081" />
            </div>
          </div>
          <div className="grid-2">
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Email WS</div>
              <input className="input" value={form.ws_email} onChange={e => setForm({...form, ws_email: e.target.value})} placeholder="ws@hotel.com" />
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Password WS</div>
              <input className="input" type="password" value={form.ws_password} onChange={e => setForm({...form, ws_password: e.target.value})} placeholder="••••••••" />
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Markup agencia (0.0 - 1.0) — ej: 0.15 = 15% adicional
            </div>
            <input className="input" type="number" step="0.01" min={0} max={1}
              value={form.agency_markup_percent}
              onChange={e => setForm({...form, agency_markup_percent: Number(e.target.value)})} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={save}>{editing ? "Guardar cambios" : "Crear"}</button>
            {editing && <button className="btn" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancelar</button>}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: "grid", gap: 12 }}>
        {items.map(p => (
          <div key={p.provider_id} className="card card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {p.name}
                  <span className={`badge ${p.is_active ? "badge-ok" : "badge-danger"}`} style={{ marginLeft: 10, fontSize: 11 }}>
                    {p.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>{p.base_url}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Markup: {(p.agency_markup_percent * 100).toFixed(0)}% · WS: {p.ws_email || "—"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ fontSize: 13 }} onClick={() => startEdit(p)}>✏️ Editar</button>
                <button className={`btn ${p.is_active ? "btn-danger" : ""}`} style={{ fontSize: 13 }} onClick={() => toggle(p)}>
                  {p.is_active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="card card-sm muted">No hay providers configurados.</div>}
      </div>
    </div>
  );
}
