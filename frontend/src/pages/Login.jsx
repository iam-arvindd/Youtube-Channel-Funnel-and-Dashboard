import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Sparkle, ArrowRight, TrendUp } from "@phosphor-icons/react";

export default function Login() {
  const { user, login, error } = useAuth();
  const [email, setEmail] = useState("admin@dashboard.local");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) nav("/");
  };

  return (
    <div className="min-h-screen flex items-stretch">
      <div className="mesh-bg" />

      {/* Left — brand panel */}
      <div className="hidden lg:flex w-1/2 p-12 flex-col justify-between relative">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#00594C] grid place-items-center shadow-[0_8px_24px_rgba(0,89,76,0.3)]">
            <Sparkle weight="fill" size={22} color="#00E599" />
          </div>
          <div>
            <div className="font-display font-bold text-base leading-none">Wealth Studio</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A8A8A] mt-1">Command Center</div>
          </div>
        </div>

        <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.7 }}>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#00594C] font-semibold mb-4">
            ◆ Faceless Finance Channel OS
          </div>
          <h1 className="font-display text-6xl font-bold tracking-[-0.04em] leading-[0.95]">
            Run a 7-figure<br/>finance channel <br/>
            <span className="text-[#00594C]">from one screen.</span>
          </h1>
          <p className="text-[#5C5C5C] mt-6 text-lg max-w-md leading-relaxed">
            Idea vault, Claude-powered script writing, pipeline kanban,
            analytics & affiliate income — all in one studio.
          </p>
          <div className="flex gap-6 mt-10 text-sm">
            <Stat label="Avg RPM" value="₹320" />
            <Stat label="Tools unified" value="7" />
            <Stat label="Topics preloaded" value="50" />
          </div>
        </motion.div>

        <div className="text-xs text-[#8A8A8A]">Built for solo creators · Single-user secure</div>
      </div>

      {/* Right — form */}
      <div className="flex-1 grid place-items-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-10 w-full max-w-md"
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8A8A8A] font-semibold">
            <TrendUp size={14} /> Sign in
          </div>
          <h2 className="font-display text-3xl font-bold mt-3 tracking-tight">Welcome back, creator.</h2>
          <p className="text-sm text-[#5C5C5C] mt-2">Default password: <code className="font-mono text-[#00594C]">finance2026</code></p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">Email</label>
              <input
                data-testid="login-email"
                type="email"
                className="input-base mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">Password</label>
              <input
                data-testid="login-password"
                type="password"
                className="input-base mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div data-testid="login-error" className="text-sm text-[#EF4444] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "Signing in…" : (<>Enter Studio <ArrowRight weight="bold" size={16}/></>)}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div>
    <div className="font-display text-2xl font-bold text-[#00594C]">{value}</div>
    <div className="text-[10px] uppercase tracking-[0.15em] text-[#8A8A8A] mt-1">{label}</div>
  </div>
);
