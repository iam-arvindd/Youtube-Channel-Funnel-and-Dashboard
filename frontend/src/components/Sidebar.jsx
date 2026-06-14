import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  House, Lightbulb, Kanban, ChartLineUp, Handshake, CalendarBlank, GearSix, SignOut, Sparkle,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Dashboard", icon: House, testid: "nav-dashboard" },
  { to: "/vault", label: "Idea Vault", icon: Lightbulb, testid: "nav-vault" },
  { to: "/pipeline", label: "Pipeline", icon: Kanban, testid: "nav-pipeline" },
  { to: "/analytics", label: "Analytics", icon: ChartLineUp, testid: "nav-analytics" },
  { to: "/affiliates", label: "Affiliates", icon: Handshake, testid: "nav-affiliates" },
  { to: "/calendar", label: "Calendar", icon: CalendarBlank, testid: "nav-calendar" },
  { to: "/settings", label: "Settings", icon: GearSix, testid: "nav-settings" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="w-[260px] shrink-0 border-r border-black/5 bg-white/40 backdrop-blur-xl h-screen sticky top-0 flex flex-col">
      <div className="px-6 py-7">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00594C] grid place-items-center shadow-[0_6px_20px_rgba(0,89,76,0.3)]">
            <Sparkle weight="fill" size={20} color="#00E599" />
          </div>
          <div>
            <div className="font-display font-bold text-[15px] leading-none tracking-tight">Wealth Studio</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A8A8A] mt-1">Command Center</div>
          </div>
        </div>
      </div>

      <nav className="px-3 flex-1 space-y-1">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            data-testid={n.testid}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <n.icon size={18} weight="duotone" />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-black/5">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00594C] to-[#00E599] grid place-items-center text-white font-bold text-sm shadow-md">
            {(user?.name || "C").slice(0,1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{user?.name || "Creator"}</div>
            <div className="text-[11px] text-[#8A8A8A] truncate">{user?.email}</div>
          </div>
          <button data-testid="logout-btn" onClick={logout} className="btn-ghost !p-2" title="Logout">
            <SignOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
