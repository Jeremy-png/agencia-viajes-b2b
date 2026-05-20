import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";

const ROOM_TYPES = [
  { id: null, label: "Todos los tipos" },
  { id: 1,    label: "Doble" },
  { id: 2,    label: "Junior Suite" },
  { id: 3,    label: "Suite" },
  { id: 4,    label: "Gran Suite" },
];

export default function SearchResults() {
  const [params]      = useSearchParams();
  const nav           = useNavigate();
  const { addToCart } = useCart();
  const { user }      = useAuth();

  const [destino,   setDestino]   = useState(params.get("destino")   || "");
  const [checkIn,   setCheckIn]   = useState(params.get("check_in")  || "");
  const [checkOut,  setCheckOut]  = useState(params.get("check_out") || "");
  const [huespedes, setHuespedes] = useState(Number(params.get("huespedes")) || 1);

  const [minPrice,    setMinPrice]    = useState("");
  const [maxPrice,    setMaxPrice]    = useState("");
  const [roomTypeId,  setRoomTypeId]  = useState(null);
  const [minRating,   setMinRating]   = useState("");
  const [filterChain, setFilterChain] = useState("");

  const [resultados, setResultados] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState("");
  const [searched,   setSearched]   = useState(false);

  useEffect(() => {
    if (destino && checkIn && checkOut) buscar();
  }, []);

  async function buscar(e) {
    e?.preventDefault();
    setErr(""); setLoading(true); setResultados([]); setSearched(true);
    try {
      const res = await api.post("/hoteles/buscar", {
        destino,
        check_in    : checkIn,
        check_out   : checkOut,
        huespedes   : Number(huespedes),
        min_price   : minPrice    ? Number(minPrice)    : null,
        max_price   : maxPrice    ? Number(maxPrice)    : null,
        room_type_id: roomTypeId  || null,
        min_rating  : minRating   ? Number(minRating)   : null,
      });
      setResultados(res.data.resultados || []);
    } catch (e) {
      const d = e?.response?.data?.detail;
      setErr(typeof d === "string" ? d : JSON.stringify(d ?? e.message));
    } finally { setLoading(false); }
  }

  function handleReservar(r) {
    if (!user) { nav("/login"); return; }
    addToCart({
      provider_id        : r.provider_id,
      room_id            : r.room_id,
      hotel_id           : r.hotel_id,
      hotel_nombre       : r.hotel_nombre,
      habitacion_tipo    : r.room_type,
      cadena_hotel       : r.cadena_hotel,
      destino,
      check_in           : checkIn,
      check_out          : checkOut,
      huespedes          : Number(huespedes),
      precio_final_noche : r.precio_final_noche,
      moneda             : r.moneda,
    });
    nav("/checkout");
  }

  function handleVerDetalle(r) {
    nav(`/hotel/${r.hotel_id}/${r.provider_id}`, {
      state: {
        checkIn,
        checkOut,
        huespedes : Number(huespedes),
        noches    : checkIn && checkOut
          ? Math.max((new Date(checkOut) - new Date(checkIn)) / 86400000, 1)
          : 1,
        room      : r,
      }
    });
  }

  const filtrados = resultados.filter(r =>
    !filterChain || r.cadena_hotel.toLowerCase().includes(filterChain.toLowerCase())
  );

  const noches = checkIn && checkOut
    ? Math.max((new Date(checkOut) - new Date(checkIn)) / 86400000, 0)
    : 0;

  // Agrupar por hotel para mostrar un card por hotel (no por habitación)
  const hotelesMapa = {};
  filtrados.forEach(r => {
    const key = `${r.provider_id}-${r.hotel_id}`;
    if (!hotelesMapa[key]) {
      hotelesMapa[key] = {
        ...r,
        habitaciones: [],
        precio_min: r.precio_final_noche,
      };
    }
    hotelesMapa[key].habitaciones.push(r);
    if (r.precio_final_noche < hotelesMapa[key].precio_min) {
      hotelesMapa[key].precio_min = r.precio_final_noche;
    }
  });
  const hoteles = Object.values(hotelesMapa);

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <h1 style={{ margin: "0 0 20px" }}>🔍 Buscar hoteles</h1>

      {/* Formulario */}
      <form onSubmit={buscar} className="card" style={{ marginBottom: 20 }}>
        <div className="grid-2" style={{ gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Destino</label>
            <input className="input" value={destino}
              onChange={e => setDestino(e.target.value)}
              placeholder="Paris, Nueva York, Tokyo..." required />
          </div>
          <div>
            <label>Check-in</label>
            <input className="input" type="date" value={checkIn}
              onChange={e => setCheckIn(e.target.value)} required />
          </div>
          <div>
            <label>Check-out</label>
            <input className="input" type="date" value={checkOut}
              min={checkIn} onChange={e => setCheckOut(e.target.value)} required />
          </div>
          <div>
            <label>Huéspedes</label>
            <input className="input" type="number" min={1} max={10}
              value={huespedes} onChange={e => setHuespedes(e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn-blue" type="submit" disabled={loading}
              style={{ width: "100%", padding: 11, borderRadius: 10 }}>
              {loading ? "Buscando..." : "🔍 Buscar"}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="hr" />
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Filtros
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 10 }}>
          <div>
            <label>Precio mín/noche</label>
            <input className="input" type="number" min={0} placeholder="$0"
              value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          </div>
          <div>
            <label>Precio máx/noche</label>
            <input className="input" type="number" min={0} placeholder="$999"
              value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          </div>
          <div>
            <label>Tipo de habitación</label>
            <select className="input" value={roomTypeId ?? ""}
              onChange={e => setRoomTypeId(e.target.value ? Number(e.target.value) : null)}>
              {ROOM_TYPES.map(t => (
                <option key={t.id ?? "all"} value={t.id ?? ""}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Cadena hotelera</label>
            <input className="input" placeholder="Nombre de cadena..."
              value={filterChain} onChange={e => setFilterChain(e.target.value)} />
          </div>
        </div>
      </form>

      {err && (
        <div style={{
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          color: "var(--danger)", fontSize: 13,
        }}>
          ⚠️ {err}
        </div>
      )}

      {searched && !loading && (
        <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span className="badge">{hoteles.length} hotel{hoteles.length !== 1 ? "es" : ""}</span>
          {noches > 0 && <span className="badge">{noches} noche{noches !== 1 ? "s" : ""}</span>}
          <span className="muted" style={{ fontSize: 13 }}>ordenados por precio</span>
        </div>
      )}

      {loading && (
        <div className="card card-sm muted">Consultando proveedores...</div>
      )}

      {!loading && searched && hoteles.length === 0 && !err && (
        <div className="card card-sm muted">
          No se encontraron hoteles. Prueba otras fechas o amplía los filtros.
        </div>
      )}

      {/* Resultados agrupados por hotel */}
      <div style={{ display: "grid", gap: 16 }}>
        {hoteles.map(h => (
          <div key={`${h.provider_id}-${h.hotel_id}`} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
                  {h.hotel_nombre}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>
                    🏢 {h.cadena_hotel}
                  </span>
                  <span className="badge" style={{ fontSize: 11 }}>
                    🛏️ {h.habitaciones.length} habitacion{h.habitaciones.length !== 1 ? "es" : ""} disponible{h.habitaciones.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                  Tipos: {[...new Set(h.habitaciones.map(hab => hab.room_type))].join(", ")}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div className="muted" style={{ fontSize: 12 }}>Desde</div>
                <div style={{ fontWeight: 900, fontSize: 24, color: "var(--brand-dark)" }}>
                  ${h.precio_min}
                </div>
                <div className="muted" style={{ fontSize: 11 }}>USD/noche</div>
                {noches > 0 && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    Total: ${(h.precio_min * noches).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <div className="hr" />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" style={{ fontSize: 13, borderRadius: 10 }}
                onClick={() => handleVerDetalle(h)}>
                🏨 Ver detalle y habitaciones
              </button>
              {/* Botón reservar rápido con la habitación más barata */}
              <button className="btn-blue" style={{ fontSize: 13, borderRadius: 10 }}
                onClick={() => handleReservar(h.habitaciones[0])}>
                🛒 Reservar desde ${h.precio_min}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
