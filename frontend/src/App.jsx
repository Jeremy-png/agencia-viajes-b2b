import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

import Header       from "./components/Header";
import Footer       from "./components/Footer";
import ProtectedRoute from "./auth/ProtectedRoute";

// Páginas públicas
import Home          from "./pages/Home";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import SearchResults from "./pages/SearchResults";
import HotelDetail   from "./pages/HotelDetail";
import InfoPage      from "./pages/InfoPage";

// Páginas autenticadas
import Checkout      from "./pages/Checkout";
import Reservations  from "./pages/Reservations";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminUsers     from "./pages/admin/AdminUsers";
import AdminReservas  from "./pages/admin/AdminReservas";

export default function App() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Públicas */}
          <Route path="/"              element={<Home />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/buscar"        element={<SearchResults />} />
          <Route path="/hotel/:hotelId/:providerId" element={<HotelDetail />} />
          <Route path="/info/:seccion" element={<InfoPage />} />

          {/* Autenticadas */}
          <Route path="/checkout"      element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/mis-reservas"  element={<ProtectedRoute><Reservations /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"          element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/providers"element={<ProtectedRoute adminOnly><AdminProviders /></ProtectedRoute>} />
          <Route path="/admin/usuarios" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/reservas" element={<ProtectedRoute adminOnly><AdminReservas /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
