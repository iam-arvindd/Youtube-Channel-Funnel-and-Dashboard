import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Vault from "@/pages/Vault";
import Pipeline from "@/pages/Pipeline";
import Analytics from "@/pages/Analytics";
import Affiliates from "@/pages/Affiliates";
import CalendarPage from "@/pages/Calendar";
import Settings from "@/pages/Settings";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === undefined) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="mesh-bg" />
        <div className="font-display text-sm text-[#5C5C5C] pulse-dot">Loading studio…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/vault" element={<Protected><Vault /></Protected>} />
            <Route path="/pipeline" element={<Protected><Pipeline /></Protected>} />
            <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
            <Route path="/affiliates" element={<Protected><Affiliates /></Protected>} />
            <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}
