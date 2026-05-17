import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const ROLE_COLORS = {
  ADMIN     : "badge-warn",
  USER      : "badge-ok",
  WEBSERVICE: "badge-blue",
};

const ROLE_LABELS = {
  ADMIN     : "Administrador",
  USER      : "Usuario registrado",
  WEBSERVICE: "WebService",
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState("");
  const [ok,       setOk]       = useState("");
  const [savingId, setSavingId] = useState(null); // ID del usuario que se está guardando

  const [filterRole,     setFilterRole]     = useState("");
  const [filterActive,   setFilterActive]   = useState("");

  async function load() {
    setLoading(true); setErr("");
    try {
      const params = {};
      if (filterRole)   params.role      = filterRole;
      if (filterActive) params.is_active = filterActive === "true";
      const res = await api.get("/auth/users", { params });
      setUsers(res.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Error cargando usuarios");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function flash(msg) {
    setOk(msg);
    setTimeout(() => setOk(""), 3500);
  }

  async function changeRole(userId, newRole) {
    setSavingId(userId); setErr("");
    try {
      await api.post(`/auth/users/${userId}/role`, { role: newRole });
      flash(`✓ Rol actualizado a ${newRole}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Error cambiando rol");
    } finally { setSavingId(null); }
  }

  async function toggleActive(u) {
    setSavingId(u.user_id); setErr("");
    try {
      const endpoint = u.is_active
        ? `/auth/users/${u.user_id}/deactivate`
        : `/auth/users/${u.user_id}/activate`;
      await api.post(endpoint);
      flash(`✓ Usuario ${u.is_active ? "desactivado" : "activado"}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Error actualizando usuario");
    } finally { setSavingId(null); }
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <h1 style={{ marginBottom: 6 }}>👥 Gestión de Usuarios</h1>
      <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
        Agencia {me?.agency_id} — {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
      </p>

      {/* Feedback */}
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
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label>Rol</label>
            <select className="input" style={{ width: 170 }} value={filterRole}
              onChange={e => setFilterRole(e.target.value)}>
              <option value="">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="USER">Usuario</option>
              <option value="WEBSERVICE">WebService</option>
            </select>
          </div>
          <div>
            <label>Estado</label>
            <select className="input" style={{ width: 150 }} value={filterActive}
              onChange={e => setFilterActive(e.target.value)}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <button className="btn-blue" onClick={load} disabled={loading}>
            {loading ? "Cargando..." : "Filtrar"}
          </button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      {loading && (
        <div className="card card-sm muted" style={{ textAlign: "center" }}>
          Cargando usuarios...
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <div className="muted">No hay usuarios con esos filtros.</div>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {users.map(u => {
          const isMe    = u.user_id === me?.user_id;
          const isSaving = savingId === u.user_id;

          return (
            <div key={u.user_id} className="card card-sm" style={{
              opacity: isSaving ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                gap: 16, flexWrap: "wrap", alignItems: "center",
              }}>
                {/* Info del usuario */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 8, flexWrap: "wrap", marginBottom: 4,
                  }}>
                    {/* Avatar inicial */}
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: isMe
                        ? "linear-gradient(135deg, var(--brand), var(--accent))"
                        : "var(--surface-2)",
                      border: "1px solid var(--border)",
                      display: "grid", placeItems: "center",
                      fontSize: 13, fontWeight: 800,
                      color: isMe ? "white" : "var(--text-2)",
                      flexShrink: 0,
                    }}>
                      {u.nombres?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {u.nombres} {u.apellidos}
                        {isMe && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: "var(--muted)", fontWeight: 500 }}>
                            (tú)
                          </span>
                        )}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>{u.email}</div>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <span className={`badge ${ROLE_COLORS[u.role] || "badge"}`}>
                        {u.role}
                      </span>
                      {!u.is_active && (
                        <span className="badge badge-danger">Inactivo</span>
                      )}
                    </div>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    ID #{u.user_id}
                  </div>
                </div>

                {/* Controles — solo si NO soy yo */}
                {!isMe && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Cambiar rol */}
                    <div>
                      <label style={{ fontSize: 11 }}>Cambiar rol</label>
                      <select
                        className="input"
                        style={{ width: 170, padding: "7px 32px 7px 10px" }}
                        value={u.role}
                        disabled={isSaving}
                        onChange={e => {
                          if (e.target.value !== u.role) {
                            changeRole(u.user_id, e.target.value);
                          }
                        }}
                      >
                        <option value="USER">Usuario registrado</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="WEBSERVICE">WebService</option>
                      </select>
                    </div>

                    {/* Activar / Desactivar */}
                    <div>
                      <label style={{ fontSize: 11 }}>Estado</label>
                      <button
                        className={`btn ${u.is_active ? "btn-danger" : "btn-blue"}`}
                        style={{ display: "flex", fontSize: 13, padding: "7px 14px" }}
                        disabled={isSaving}
                        onClick={() => toggleActive(u)}
                      >
                        {isSaving ? "..." : u.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Si soy yo, mensaje explicativo */}
                {isMe && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    No puedes editar tu propia cuenta
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda de roles */}
      <div className="card card-sm" style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
          Descripción de roles
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`badge ${ROLE_COLORS[role]}`} style={{ width: 90, justifyContent: "center" }}>
                {role}
              </span>
              <span className="muted" style={{ fontSize: 13 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
