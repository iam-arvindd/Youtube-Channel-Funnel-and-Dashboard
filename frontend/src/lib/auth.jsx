import React, { createContext, useContext, useEffect, useState } from "react";
import { api, formatErr } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined=loading, null=anon, obj=auth
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("fyt_token");
    if (!token) { setUser(null); return; }
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("fyt_token", data.token);
      setUser(data.user);
      return true;
    } catch (e) {
      setError(formatErr(e.response?.data?.detail) || e.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("fyt_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
