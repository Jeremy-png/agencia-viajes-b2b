import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  async function login(email, password) {
    // /auth/login usa OAuth2 form-data (x-www-form-urlencoded)
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);

    const res = await api.post("/auth/login", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    localStorage.setItem("access_token", res.data.access_token);
    await fetchMe();
  }

  function logout() {
    localStorage.removeItem("access_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}