import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { downloadReservaPdf } from "../../api/pdfDownload";

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

export default function AdminReservas() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [ok,      setOk]      = useState("");

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
      setItems((await api.get("/reservas/hotel", { params })).data);
    } catch (e) { setErr(e?.response?.data?.detail || "Error cargando"); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  function flash(msg) { setOk(msg); setTimeout(() => setOk(""), 3500); }

  async function cancelar(id, codigo) {
    if (!confirm(`¿Cancelar la reserva ${codigo}?\nSe enviará email de cancelación al cliente.`)) return;
    try {
      await api.post(`/reservas/hotel/${id}/cancelar`);
      flash(`✓ Reserva ${codigo} cancelada. Email enviado al cliente.`);
      await cargar();
    } catch (e) { setErr(e?.response?.data?.detail || "Error cancelando"); }
  }

  const totalActivo = items
    .filter(r => r.provider_status !== "CANCELLED")
    .reduce((s, r) => s + (r.total || 0), 0);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <h1 style={{ marginBottom: 6 }}>📋 Todas las Reservas</h1>
      <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
        Como admin puedes ver y cancelar cualquier reserva de tu agencia.
      </p>

      {ok && (
        <div style={{
          background: "var(--success-bg)", border: "1px solid var(--success-border)",
          borderRadius: "var(--radius)", padding: "10px 16px", marginBottom: 14,
          color: "var(--success)", fontSize: 13, fontWeight: 600,
        }}>
          {ok}
        </div>
      )}
      {err && (
        <div style={{
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          borderRadius: "var(--radius)", padding: "10px 16px", marginBottom: 14,
          color: "var(--danger)", fontSize: 13,
        }}>
          ⚠️ {err}
        </div>
      )}

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
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="PENDING">Pendiente</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <div>
            <label>Destino</label>
            <input className="input" value={destino}
              onChange={e => setDestino(e.target.value)} placeholder="Guatemala..." />
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

      {/* Stats rápidas */}
      {items.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <span className="badge">{items.length} reserva{items.length !== 1 ? "s" : ""}</span>
          <span className="badge badge-ok">
            ${totalActivo.toFixed(2)} USD activo
          </span>
          <span className="badge badge-danger">
            {items.filter(r => r.provider_status === "CANCELLED").length} cancelada{items.filter(r => r.provider_status === "CANCELLED").length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {loading && (
        <div className="card card-sm muted" style={{ textAlign: "center" }}>Cargando...</div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map(r => (
          <div key={r.reservation_id} className="card card-sm">
            <div style={{
              display: "flex", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap", alignItems: "flex-start",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontWeight: 800 }}>
                    #{r.reservation_id} · {r.hotel_nombre || "Hotel"}
                  </span>
                  <span className={`badge ${STATUS_CLASS[r.provider_status] || "badge"}`}>
                    {STATUS_LABEL[r.provider_status] || r.provider_status}
                  </span>
                  {r.habitacion_tipo && (
                    <span className="badge">{r.habitacion_tipo}</span>
                  )}
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  📍 {r.destino} · 📅 {r.check_in} → {r.check_out}
                  {r.noches && ` · ${r.noches} noche${r.noches !== 1 ? "s" : ""}`}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-2)" }}>
                  Usuario #{r.user_id}
                  {r.provider_booking_code && (
                    <> · Código: <span style={{
                      fontFamily: "monospace", fontWeight: 700,
                      background: "var(--brand-light)", padding: "1px 6px",
                      borderRadius: 4, color: "var(--brand-dark)",
                    }}>
                      {r.provider_booking_code}
                    </span></>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontWeight: 900, fontSize: 18,
                  color: r.provider_status === "CANCELLED"
                    ? "var(--muted)" : "var(--brand-dark)",
                  textDecoration: r.provider_status === "CANCELLED"
                    ? "line-through" : "none",
                }}>
                  ${r.total} {r.moneda}
                </div>
              </div>
            </div>

            <div className="hr" />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {r.provider_booking_code && (
                <button className="btn" style={{ fontSize: 12 }}
                  onClick={() => downloadReservaPdf(r.provider_booking_code)}>
                  📄 PDF
                </button>
              )}
              {r.provider_status !== "CANCELLED" && (
                <button className="btn btn-danger" style={{ fontSize: 12 }}
                  onClick={() => cancelar(r.reservation_id, r.provider_booking_code)}>
                  ❌ Cancelar
                </button>
              )}
            </div>
          </div>
        ))}

        {!loading && items.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <div className="muted">No hay reservas con esos filtros.</div>
          </div>
        )}
      </div>
    </div>
  );
}
