import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";

// ── Componente de reseñas recursivas ─────────────────────────────
function Review({ r, depth = 0 }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginLeft: depth * 20, marginBottom: 10 }}>
      <div className="card card-sm" style={{
        background: depth > 0 ? "var(--surface-2)" : undefined,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            {r.userName || r.author || "Usuario"}
          </span>
          {r.rating > 0 && (
            <span style={{ color: "#f59e0b", fontSize: 13 }}>
              {"★".repeat(Math.round(r.rating))}
              {"☆".repeat(5 - Math.round(r.rating))}
              <span className="muted" style={{ marginLeft: 4 }}>{r.rating}</span>
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
          {r.comment}
        </div>
        {r.replies?.length > 0 && (
          <button className="btn" style={{ marginTop: 8, fontSize: 11, padding: "3px 10px" }}
            onClick={() => setOpen(o => !o)}>
            {open
              ? "Ocultar respuestas"
              : `Ver ${r.replies.length} respuesta${r.replies.length !== 1 ? "s" : ""}`}
          </button>
        )}
      </div>
      {open && r.replies?.map((rep, i) => (
        <Review key={i} r={rep} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function HotelDetail() {
  const { hotelId, providerId } = useParams();
  const location  = useLocation();
  const navigate  = useNavigate();
  const { addToCart } = useCart();
  const { user }  = useAuth();

  const state      = location.state || {};
  const checkIn    = state.checkIn   || "";
  const checkOut   = state.checkOut  || "";
  const huespedes  = state.huespedes || 1;
  const noches     = state.noches    || 1;

  const [hotel,   setHotel]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");
  const [imgIdx,  setImgIdx]  = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // Llamamos al backend de la agencia que a su vez llama al hotel
        // Esto respeta la regla del spec: el FE solo llama a su propio backend
        const res = await api.get(`/hoteles/detalle/${providerId}/${hotelId}`, {
          params: {
            check_in : checkIn  || undefined,
            check_out: checkOut || undefined,
            guests   : huespedes || undefined,
          }
        });
        setHotel(res.data);
      } catch (e) {
        setErr(e?.response?.data?.detail || "Error cargando el hotel");
      } finally {
        setLoading(false);
      }
    })();
  }, [hotelId, providerId]);

  function handleReservar(room) {
    if (!user) { navigate("/login"); return; }
    addToCart({
      provider_id        : Number(providerId),
      room_id            : room.id || room.roomId,
      hotel_id           : Number(hotelId),
      hotel_nombre       : hotel.name,
      habitacion_tipo    : room.roomType,
      cadena_hotel       : hotel.cadenaHotel || "HotelChain",
      destino            : hotel.address || hotel.city || "",
      check_in           : checkIn,
      check_out          : checkOut,
      huespedes          : Number(huespedes),
      precio_final_noche : room.priceWithMarkup || room.basePricePerNight,
      moneda             : "USD",
    });
    navigate("/checkout");
  }

  // ── Estados de carga ──────────────────────────────────────────
  if (loading) return (
    <div className="container" style={{ paddingTop: 60, textAlign: "center" }}>
      <div className="muted">Cargando hotel...</div>
    </div>
  );

  if (err) return (
    <div className="container" style={{ paddingTop: 40 }}>
      <div className="card card-sm">
        <span className="badge badge-danger">Error</span>
        <p style={{ margin: "8px 0 0", fontSize: 13 }}>{err}</p>
      </div>
    </div>
  );

  if (!hotel) return null;

  const images = hotel.images || (hotel.mainImageUrl ? [hotel.mainImageUrl] : []);
  const reviews = hotel.reviews || [];
  const rooms   = hotel.roomOptions || hotel.rooms || [];

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 920 }}>

      {/* Galería */}
      {images.length > 0 && (
        <div style={{
          position: "relative", borderRadius: 16,
          overflow: "hidden", height: 340, marginBottom: 24,
        }}>
          <img src={images[imgIdx]} alt={hotel.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"; }}
          />
          {images.length > 1 && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%",
              transform: "translateX(-50%)", display: "flex", gap: 6,
            }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)} style={{
                  width: 10, height: 10, borderRadius: "50%", border: "none",
                  cursor: "pointer",
                  background: i === imgIdx ? "white" : "rgba(255,255,255,0.4)",
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header hotel */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: "0 0 6px" }}>{hotel.name}</h1>
          <div className="muted" style={{ fontSize: 14 }}>
            📍 {hotel.address}{hotel.city ? ` · ${hotel.city}` : ""}
          </div>
          {hotel.averageRating > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ color: "#f59e0b", fontSize: 20 }}>
                {"★".repeat(Math.round(hotel.averageRating))}
                {"☆".repeat(5 - Math.round(hotel.averageRating))}
              </span>
              <span className="muted" style={{ fontSize: 14, marginLeft: 6 }}>
                {hotel.averageRating} / 5
                {hotel.reviewCount > 0 && ` · ${hotel.reviewCount} reseñas`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Descripción */}
      {hotel.description && (
        <p style={{ color: "var(--text-2)", lineHeight: 1.7, marginBottom: 24, fontSize: 14 }}>
          {hotel.description}
        </p>
      )}

      {/* Amenidades */}
      {hotel.amenities && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Amenidades</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(typeof hotel.amenities === "string"
              ? hotel.amenities.split(",")
              : hotel.amenities
            ).map(a => (
              <span key={a} className="badge badge-ok" style={{ fontSize: 12 }}>
                ✓ {a.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Habitaciones */}
      {rooms.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Tipos de habitación</h2>
          <div className="grid-2">
            {rooms.map((room, i) => (
              <div key={room.id || room.roomId || i} className="card card-sm" style={{
                border: "1px solid var(--border)",
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>
                  {room.roomType}
                </div>
                {room.bedType && (
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                    🛏️ {room.bedType}
                  </div>
                )}
                {room.areaSquareMeters && (
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                    📐 {room.areaSquareMeters} m²
                  </div>
                )}
                {room.shortDescription && (
                  <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 8, lineHeight: 1.5 }}>
                    {room.shortDescription}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div>
                    <span className="muted" style={{ fontSize: 12 }}>
                      👥 Máx {room.maxGuests} huéspedes
                    </span>
                    {room.availableCount > 0 && (
                      <span className="badge badge-ok" style={{ marginLeft: 8, fontSize: 11 }}>
                        {room.availableCount} disponibles
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, color: "var(--brand-dark)", fontSize: 18 }}>
                      ${room.priceWithMarkup || room.basePricePerNight}
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>USD/noche</div>
                  </div>
                </div>
                {noches > 0 && (
                  <div className="muted" style={{ fontSize: 12, textAlign: "right", marginTop: 2 }}>
                    Total {noches} noches: ${((room.priceWithMarkup || room.basePricePerNight) * noches).toFixed(2)}
                  </div>
                )}
                {checkIn && checkOut && (
                  <button className="btn-blue"
                    style={{ width: "100%", marginTop: 10, padding: "9px", borderRadius: 10 }}
                    onClick={() => handleReservar(room)}>
                    🛒 Reservar esta habitación
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reseñas */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>
          Reseñas {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {reviews.length === 0 ? (
          <div className="card card-sm muted" style={{ fontSize: 13 }}>
            Este hotel aún no tiene reseñas.
          </div>
        ) : (
          reviews.map((r, i) => <Review key={i} r={r} />)
        )}
        {!user && (
          <div className="card card-sm" style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
            <a href="/login" style={{ color: "var(--brand-dark)" }}>Inicia sesión</a> para dejar una reseña.
          </div>
        )}
      </div>
    </div>
  );
}
