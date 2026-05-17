import React, { useEffect, useState } from "react";
import api from "../api/client";
import { downloadReservaPdf } from "../api/pdfDownload";

const STATUS_CLASS = {
  CONFIRMED: "badge-ok",
  PENDING  : "badge-warn",
  CANCELLED: "badge-danger",
};

const STATUS_LABEL = {
  CONFIRMED: "Confirmada",
  PENDING  : "Pendiente",
  CANCELLED: "Cancelada",
};

export default function Reservations() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  const [status,   setStatus]   = useState("");
  const [destino,  setDestino]  = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  async function cargar() {
    setErr(""); setLoading(true);
    try {
      const params = {};
      if (status)   params.status    = status;
      if (destino)  params.destino   = destino;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
      const res = await api.get("/reservas/hotel", { params });
      setItems(res.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Error cargando reservas");
    } finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function cancelar(id) {
    if (!confirm("¿Seguro que deseas cancelar esta reserva?")) return;
    try {
      await api.post(`/reservas/hotel/${id}/cancelar`);
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.detail || "Error cancelando");
    }
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <h1 style={{ marginBottom: 6 }}>📋 Mis Reservas</h1>
      <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
        Historial de todas tus reservaciones
      </p>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Filtros</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}>
          <div>
            <label>Estado</label>
            <select className="input" value={status}
              onChange={e => setStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="PENDING">Pendiente</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <div>
            <label>Destino</label>
            <input className="input" value={destino}
              onChange={e => setDestino(e.target.value)}
              placeholder="Guatemala..." />
          </div>
          <div>
            <label>Desde</label>
            <input className="input" type="date" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label>Hasta</label>
            <input className="input" type="date" value={dateTo}
              onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <button className="btn-blue" onClick={cargar} disabled={loading}
          style={{ marginTop: 14 }}>
          {loading ? "Cargando..." : "Aplicar filtros"}
        </button>
      </div>

      {err && (
        <div style={{
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: 16,
          color: "var(--danger)", fontSize: 13,
        }}>
          ⚠️ {err}
        </div>
      )}

      {/* Contador */}
      {!loading && items.length > 0 && (
        <div style={{ marginBottom: 14, display: "flex", gap: 8 }}>
          <span className="badge">{items.length} reserva{items.length !== 1 ? "s" : ""}</span>
          <span className="badge badge-ok">
            ${items.filter(r => r.provider_status !== "CANCELLED")
              .reduce((s, r) => s + (r.total || 0), 0).toFixed(2)} activo
          </span>
        </div>
      )}

      {loading && (
        <div className="card card-sm muted" style={{ textAlign: "center" }}>
          Cargando reservas...
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
          <div className="h2" style={{ marginBottom: 8 }}>Sin reservas</div>
          <p className="muted">No hay reservas con esos filtros.</p>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {items.map(r => (
          <div key={r.reservation_id} className="card">
            <div style={{
              display: "flex", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap",
            }}>
              {/* Info izquierda */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                  display: "flex", alignItems: "center",
                  gap: 10, marginBottom: 6, flexWrap: "wrap",
                }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>
                    {r.hotel_nombre || `Reserva #${r.reservation_id}`}
                  </span>
                  <span className={`badge ${STATUS_CLASS[r.provider_status] || "badge"}`}>
                    {STATUS_LABEL[r.provider_status] || r.provider_status}
                  </span>
                </div>

                {r.habitacion_tipo && (
                  <div style={{ marginBottom: 4 }}>
                    <span className="badge" style={{ fontSize: 11 }}>
                      🛏️ {r.habitacion_tipo}
                    </span>
                  </div>
                )}

                <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                  📍 {r.destino}
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  📅 {r.check_in} → {r.check_out}
                  {r.noches && ` · ${r.noches} noche${r.noches !== 1 ? "s" : ""}`}
                  {r.huespedes && ` · ${r.huespedes} huésped${r.huespedes !== 1 ? "es" : ""}`}
                </div>
                {r.provider_booking_code && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-2)" }}>
                    Código: <span style={{
                      fontFamily: "monospace", fontWeight: 700,
                      background: "var(--brand-light)", padding: "2px 8px",
                      borderRadius: 4, color: "var(--brand-dark)",
                    }}>
                      {r.provider_booking_code}
                    </span>
                  </div>
                )}
              </div>

              {/* Precio derecha */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontWeight: 900, fontSize: 22,
                  color: r.provider_status === "CANCELLED"
                    ? "var(--muted)"
                    : "var(--brand-dark)",
                  textDecoration: r.provider_status === "CANCELLED"
                    ? "line-through" : "none",
                }}>
                  ${r.total}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {r.moneda} · ${r.precio_final_noche}/noche
                </div>
              </div>
            </div>

            <div className="hr" />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {r.provider_booking_code && (
                <button className="btn" style={{ fontSize: 13 }}
                  onClick={() => downloadReservaPdf(r.provider_booking_code)}>
                  📄 Descargar PDF
                </button>
              )}
              {r.provider_status !== "CANCELLED" && (
                <button className="btn btn-danger" style={{ fontSize: 13 }}
                  onClick={() => cancelar(r.reservation_id)}>
                  ❌ Cancelar reserva
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
