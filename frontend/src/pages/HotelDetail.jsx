import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";

function StarRating({ rating, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          style={{ fontSize: 24, cursor: onRate ? "pointer" : "default",
            color: s <= (hover || Math.round(rating)) ? "#fbbf24" : "rgba(255,255,255,0.2)" }}
          onMouseEnter={() => onRate && setHover(s)}
          onMouseLeave={() => onRate && setHover(0)}
          onClick={() => onRate?.(s)}>
          ★
        </span>
      ))}
      {rating > 0 && <span className="muted" style={{ fontSize: 14, marginLeft: 6 }}>{Number(rating).toFixed(1)}</span>}
    </div>
  );
}

function Review({ r, depth = 0 }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginLeft: depth * 20, marginBottom: 10 }}>
      <div className="card card-sm" style={{ background: depth > 0 ? "rgba(255,255,255,0.04)" : undefined }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{r.author || "Usuario"}</span>
          {r.rating && <StarRating rating={r.rating} />}
        </div>
        <div style={{ fontSize: 14, color: "var(--muted)" }}>{r.comment}</div>
        {r.replies?.length > 0 && (
          <button className="btn" style={{ marginTop: 8, fontSize: 12, padding: "4px 10px" }}
            onClick={() => setOpen(o => !o)}>
            {open ? "Ocultar" : `Ver ${r.replies.length} respuesta${r.replies.length !== 1 ? "s" : ""}`}
          </button>
        )}
      </div>
      {open && r.replies?.map((rep, i) => <Review key={i} r={rep} depth={depth + 1} />)}
    </div>
  );
}

export default function HotelDetail() {
  const { hotelId, providerId } = useParams();
  const location = useLocation();
  const navigate  = useNavigate();
  const { addToCart } = useCart();
  const { user }  = useAuth();

  const state     = location.state || {};
  const checkIn   = state.checkIn   || "";
  const checkOut  = state.checkOut  || "";
  const huespedesInit = state.huespedes || 1;
  const noches    = state.noches    || 1;

  const [hotel,    setHotel]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState("");
  const [imgIdx,   setImgIdx]   = useState(0);
  const [selRoom,  setSelRoom]  = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Llama al endpoint público del hotel (no requiere auth)
        const res = await fetch(`http://localhost:8081/api/public/hotels/${hotelId}`);
        if (!res.ok) throw new Error("Hotel no encontrado");
        setHotel(await res.json());
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [hotelId]);

  function handleReservar(room) {
    if (!user) { navigate("/login"); return; }
    addToCart({
      provider_id        : Number(providerId),
      room_id            : room.id,
      hotel_id           : Number(hotelId),
      hotel_nombre       : hotel.name,
      habitacion_tipo    : room.roomType,
      cadena_hotel       : "HotelChain",
      destino            : hotel.address || "",
      check_in           : checkIn,
      check_out          : checkOut,
      huespedes          : huespedesInit,
      precio_final_noche : room.basePricePerNight,
      moneda             : "USD",
    });
    navigate("/checkout");
  }

  if (loading) return <div className="container" style={{ paddingTop: 40, textAlign: "center" }} className="muted">Cargando hotel...</div>;
  if (err)     return <div className="container" style={{ paddingTop: 40 }}><div className="card card-sm"><span className="badge badge-danger">Error</span><p>{err}</p></div></div>;
  if (!hotel)  return null;

  const images = hotel.images || [];

  return (
    <div className="container" style={{ paddingTop: 24, maxWidth: 900 }}>
      {/* Galería */}
      {images.length > 0 && (
        <div style={{ position: "relative", marginBottom: 24, borderRadius: 16, overflow: "hidden", height: 320 }}>
          <img src={images[imgIdx]} alt={hotel.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 8 }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                style={{ width: 10, height: 10, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: i === imgIdx ? "white" : "rgba(255,255,255,0.4)" }} />
            ))}
          </div>
        </div>
      )}

      {/* Info hotel */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: "0 0 6px" }}>{hotel.name}</h1>
          <div className="muted" style={{ fontSize: 14 }}>📍 {hotel.address}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ color: "#fbbf24", fontSize: 18 }}>
              {"★".repeat(Math.round(hotel.rating || 0))}
            </span>
            <span className="muted" style={{ fontSize: 14, marginLeft: 6 }}>{hotel.rating} / 5</span>
          </div>
        </div>
      </div>

      {hotel.description && (
        <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: 20 }}>{hotel.description}</p>
      )}

      {/* Amenidades */}
      {hotel.amenities?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Amenidades</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {hotel.amenities.map(a => (
              <span key={a} className="badge" style={{ fontSize: 13 }}>✓ {a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Habitaciones */}
      {hotel.rooms?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Tipos de habitación</h2>
          <div className="grid-2">
            {hotel.rooms.map(room => (
              <div key={room.id} className={`card card-sm ${selRoom?.id === room.id ? "card-selected" : ""}`}
                style={{ cursor: "pointer", border: selRoom?.id === room.id ? "1px solid var(--brand)" : undefined }}
                onClick={() => setSelRoom(room)}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{room.roomType}</div>
                <div className="muted" style={{ fontSize: 13 }}>Habitación {room.nameOrNumber}</div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span className="muted" style={{ fontSize: 13 }}>👥 Máx {room.maxGuests}</span>
                  <span style={{ fontWeight: 800, color: "#22c55e" }}>${room.basePricePerNight}/noche</span>
                </div>
                {noches > 0 && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 4, textAlign: "right" }}>
                    Total {noches} noches: ${(room.basePricePerNight * noches).toFixed(2)}
                  </div>
                )}
                <button className="btn btn-primary" style={{ width: "100%", marginTop: 10 }}
                  onClick={e => { e.stopPropagation(); handleReservar(room); }}>
                  🛒 Reservar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reseñas */}
      {hotel.reviews?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>
            Reseñas ({hotel.reviews.length})
          </h2>
          {hotel.reviews.map((r, i) => <Review key={i} r={r} />)}
          {!user && (
            <div className="card card-sm muted" style={{ fontSize: 13 }}>
              <a href="/login" style={{ color: "var(--brand)" }}>Inicia sesión</a> para dejar una reseña.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
