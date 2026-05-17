import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ reservas: 0, providers: 0, usuarios: 0 });

  useEffect(() => {
    Promise.all([
      api.get("/reservas/hotel"),
      api.get("/providers"),
      api.get("/auth/users"),
    ]).then(([r, p, u]) => setStats({
      reservas : r.data.length,
      providers: p.data.length,
      usuarios : u.data.length,
    })).catch(() => {});
  }, []);

  const CARDS = [
    { icon: "🏢", label: "Proveedores",     value: stats.providers, to: "/admin/providers", color: "#7c3aed" },
    { icon: "👥", label: "Usuarios",         value: stats.usuarios,  to: "/admin/usuarios",  color: "#2563eb" },
    { icon: "📋", label: "Todas las reservas",value: stats.reservas, to: "/admin/reservas",  color: "#059669" },
  ];

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px" }}>⚙️ Panel de Administración</h1>
        <div className="muted" style={{ fontSize: 14 }}>
          Agencia {user?.agency_id} · {user?.nombres} {user?.apellidos}
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {CARDS.map(c => (
          <Link key={c.to} to={c.to} style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: c.color }}>{c.value}</div>
              <div className="muted" style={{ fontSize: 14 }}>{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid-2">
        {[
          { to: "/admin/providers", icon: "🏢", title: "Gestión de Proveedores",
            desc: "Agregar, editar, activar o desactivar cadenas hoteleras. Configurar markup de precio." },
          { to: "/admin/usuarios", icon: "👥", title: "Gestión de Usuarios",
            desc: "Ver todos los usuarios, cambiar roles (USER / ADMIN / WEBSERVICE), activar o desactivar." },
          { to: "/admin/reservas", icon: "📋", title: "Todas las Reservas",
            desc: "Ver y cancelar cualquier reserva de la agencia. Filtra por estado, destino o fechas." },
        ].map(c => (
          <Link key={c.to} to={c.to} style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", height: "100%" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
