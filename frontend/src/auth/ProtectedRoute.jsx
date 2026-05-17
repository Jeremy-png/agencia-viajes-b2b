import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
      Cargando...
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && user.role !== "ADMIN") return <Navigate to="/" replace />;

  return children;
}
