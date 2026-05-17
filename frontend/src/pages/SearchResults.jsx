import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";

const ROOM_TYPES = [
  { id: null, label: "Todos los tipos" },
  { id: 1, label: "Doble" },
  { id: 2, label: "Junior Suite" },
  { id: 3, label: "Suite" },
  { id: 4, label: "Gran Suite" },
];

function StarRating({ rating }) {
  return (
    <span style={{ color: "#fbbf24", fontSize: 13 }}>
      {"★".repeat(Math.round(rating || 0))}{"☆".repeat(5 - Math.round(rating || 0))}
      <span className="muted" style={{ marginLeft: 4 }}>{rating || "—"}</span>
    </span>
  );
}

export default function SearchResults() {
  const [params]  = useSearchParams();
  const nav       = useNavigate();
  const { addToCart } = useCart();
  const { user }  = useAuth();

  const [destino,   setDestino]   = useState(params.get("destino") || "");
  const [checkIn,   setCheckIn]   = useState(params.get("check_in") || "");
  const [checkOut,  setCheckOut]  = useState(params.get("check_out") || "");
  const [huespedes, setHuespedes] = useState(Number(params.get("huespedes")) || 1);

  // Filtros
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
        destino, check_in: checkIn, check_out: checkOut,
        huespedes: Number(huespedes),
        min_price   : minPrice   ? Number(minPrice)   : null,
        max_price   : maxPrice   ? Number(maxPrice)   : null,
        room_type_id: roomTypeId || null,
        min_rating  : minRating  ? Number(minRating)  : null,
      });
      setResultados(res.data.resultados || []);
    } catch (e) {
      const d = e?.response?.data?.detail;
      setErr(typeof d === "string" ? d : JSON.stringify(d ?? e.message));
    } finally {
      setLoading(false);
    }
  }

  function handleReservar(r) {
    if (!user) { nav("/login"); return; }
    addToCart({
      provider_id: r.provider_id, room_id: r.room_id,
      hotel_id: r.hotel_id, hotel_nombre: r.hotel_nombre,
      habitacion_tipo: r.room_type, cadena_hotel: r.cadena_hotel,
      destino, check_in: checkIn, check_out: checkOut,
      huespedes: Number(huespedes),
      precio_final_noche: r.precio_final_noche, moneda: r.moneda,
    });
    nav("/checkout");
  }

  const filtrados = resultados.filter(r =>
    !filterChain || r.cadena_hotel.toLowerCase().includes(filterChain.toLowerCase())
  );

  const noches = checkIn && checkOut
    ? Math.max((new Date(checkOut) - new Date(checkIn)) / 86400000, 0)
    : 0;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ margin: "0 0 20px" }}>🔍 Buscar hoteles</h1>

      {/* Formulario de búsqueda */}
      <form onSubmit={buscar} className="card" style={{ marginBottom: 20 }}>
        <div className="grid-2" style={{ gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Destino</div>
            <input className="input" value={destino}
              onChange={e => setDestino(e.target.value)}
              placeholder="Guatemala, Antigua..." required />
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Check-in</div>
            <input className="input" type="date" value={checkIn}
              onChange={e => setCheckIn(e.target.value)} required />
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Check-out</div>
            <input className="input" type="date" value={checkOut}
              min={checkIn} onChange={e => setCheckOut(e.target.value)} required />
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Huéspedes</div>
            <input className="input" type="number" min={1} max={10}
              value={huespedes} onChange={e => setHuespedes(e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: "100%", padding: 12 }}>
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="hr" />
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Filtros</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 10 }}>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Precio mín/noche</div>
            <input className="input" type="number" min={0} placeholder="$0"
              value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Precio máx/noche</div>
            <input className="input" type="number" min={0} placeholder="$999"
              value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Tipo de habitación</div>
            <select className="input" value={roomTypeId ?? ""}
              onChange={e => setRoomTypeId(e.target.value ? Number(e.target.value) : null)}>
              {ROOM_TYPES.map(t => (
                <option key={t.id ?? "all"} value={t.id ?? ""}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Rating mínimo</div>
            <input className="input" type="number" min={0} max={5} step={0.5}
              placeholder="0-5" value={minRating}
              onChange={e => setMinRating(e.target.value)} />
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Cadena hotelera</div>
            <input className="input" placeholder="Nombre de cadena..."
              value={filterChain} onChange={e => setFilterChain(e.target.value)} />
          </div>
        </div>
      </form>

      {err && <div className="card card-sm" style={{ marginBottom: 16 }}>
        <span className="badge badge-danger">Error</span>
        <p style={{ margin: "8px 0 0" }}>{err}</p>
      </div>}

      {/* Resumen */}
      {searched && !loading && (
        <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge badge-ok">{filtrados.length} resultados</span>
          {noches > 0 && <span className="badge">{noches} noche{noches !== 1 ? "s" : ""}</span>}
          <span className="muted" style={{ fontSize: 13 }}>ordenados por precio</span>
        </div>
      )}

      {loading && <div className="card card-sm muted">Consultando proveedores...</div>}

      {!loading && searched && filtrados.length === 0 && !err && (
        <div className="card card-sm muted">
          No se encontraron habitaciones con esos parámetros. Prueba otras fechas o amplía los filtros.
        </div>
      )}

      {/* Resultados */}
      <div className="grid-2">
        {filtrados.map(r => (
          <div key={`${r.provider_id}-${r.room_id}`} className="card card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{r.hotel_nombre}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  {r.cadena_hotel}
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge">{r.room_type}</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    👥 Max {r.max_guests} huéspedes
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: "#22c55e" }}>
                  ${r.precio_final_noche}
                </div>
                <div className="muted" style={{ fontSize: 11 }}>{r.moneda}/noche</div>
                {noches > 0 && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    Total: ${(r.precio_final_noche * noches).toFixed(2)}
                  </div>
                )}
                <div className="muted" style={{ fontSize: 11, textDecoration: "line-through" }}>
                  base ${r.precio_base_noche}
                </div>
              </div>
            </div>

            <div className="hr" />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link to={`/hotel/${r.hotel_id}/${r.provider_id}`}
                state={{ room: r, checkIn, checkOut, huespedes, noches }}>
                <button className="btn" style={{ fontSize: 13 }}>Ver detalle</button>
              </Link>
              <button className="btn btn-primary" style={{ fontSize: 13 }}
                onClick={() => handleReservar(r)}>
                🛒 Reservar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
