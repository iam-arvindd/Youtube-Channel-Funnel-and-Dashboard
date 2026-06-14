import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import Shell from "@/components/Shell";
import { Eye, CurrencyInr, Users, FilmStrip as Film, ArrowUpRight, Lightning, Sparkle, ArrowRight } from "@phosphor-icons/react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const STAGE_COLORS = {
  idea: "#94A3B8", script: "#00594C", voiceover: "#FF6B4A",
  video: "#0EA5E9", thumbnail: "#F59E0B", scheduled: "#A855F7", published: "#10B981",
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const nav = useNavigate();

  useEffect(() => { api.get("/dashboard/summary").then((r) => setSummary(r.data)); }, []);

  const k = summary || { total_videos:0, by_stage:{}, total_views:0, total_adsense:0, total_affiliate:0, total_earnings:0, total_subscribers_gained:0, avg_ctr:0, avg_retention:0, trend:[] };

  return (
    <Shell
      title="Today, you build wealth."
      subtitle="Your finance channel — at a glance."
      action={
        <button data-testid="dash-new-video" onClick={() => nav("/pipeline")} className="btn-primary flex items-center gap-2">
          <Sparkle weight="fill" size={16}/> New Video
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Kpi icon={CurrencyInr} label="Total Earnings" value={`₹${k.total_earnings.toLocaleString("en-IN")}`}
             accent="#00594C" delta={`${k.total_adsense.toFixed(0)} AdSense + ${k.total_affiliate.toFixed(0)} Affiliate`} testid="kpi-earnings"/>
        <Kpi icon={Eye} label="Total Views" value={k.total_views.toLocaleString("en-IN")}
             accent="#FF6B4A" delta={`Avg CTR ${k.avg_ctr}%`} testid="kpi-views"/>
        <Kpi icon={Users} label="Subs Gained" value={`+${k.total_subscribers_gained}`}
             accent="#00E599" delta={`Avg retention ${k.avg_retention}%`} testid="kpi-subs"/>
        <Kpi icon={Film} label="Videos in Flight" value={k.total_videos}
             accent="#0EA5E9" delta={`${k.by_stage.published || 0} published`} testid="kpi-videos"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        {/* Trend chart */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass rounded-2xl p-7 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A8A8A] font-semibold">Views Trend · Last 30 days</div>
              <div className="font-display text-2xl font-bold mt-1">{k.total_views.toLocaleString("en-IN")} views</div>
            </div>
            <Lightning size={20} weight="duotone" className="text-[#00594C]" />
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={k.trend}>
                <defs>
                  <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E599" stopOpacity={0.45}/>
                    <stop offset="100%" stopColor="#00E599" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8A8A8A' }} tickFormatter={(d)=>d?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#8A8A8A' }} />
                <Tooltip contentStyle={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', border:'1px solid rgba(0,0,0,0.06)', borderRadius: 10 }} />
                <Area type="monotone" dataKey="views" stroke="#00594C" strokeWidth={2.5} fill="url(#vGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pipeline breakdown */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="glass rounded-2xl p-7">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A8A8A] font-semibold mb-1">Pipeline Status</div>
          <div className="font-display text-2xl font-bold">By stage</div>
          <div className="mt-6 space-y-3">
            {Object.entries({
              idea:"Idea", script:"Script", voiceover:"Voiceover",
              video:"Video", thumbnail:"Thumbnail", scheduled:"Scheduled", published:"Published",
            }).map(([key, label]) => {
              const count = k.by_stage[key] || 0;
              const max = Math.max(1, ...Object.values(k.by_stage));
              const pct = (count / max) * 100;
              return (
                <div key={key} data-testid={`stage-row-${key}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#5C5C5C]">{label}</span>
                    <span className="font-mono font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: STAGE_COLORS[key] }}/>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={()=>nav("/pipeline")} className="mt-6 text-sm font-semibold text-[#00594C] flex items-center gap-1.5 hover:gap-2.5 transition-all">
            Open pipeline <ArrowRight size={14} weight="bold"/>
          </button>
        </motion.div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        <QuickLink testid="ql-vault" title="Idea Vault" desc="50 finance topics curated. Rate, tag, promote." onClick={()=>nav("/vault")} accent="#FF6B4A"/>
        <QuickLink testid="ql-claude" title="Write with Claude" desc="Generate a 10-minute script in 90 seconds." onClick={()=>nav("/pipeline")} accent="#00594C"/>
        <QuickLink testid="ql-affiliate" title="Track Affiliates" desc="Groww, Zerodha, Upstox & Amazon income." onClick={()=>nav("/affiliates")} accent="#00E599"/>
      </div>
    </Shell>
  );
}

const Kpi = ({ icon: Icon, label, value, delta, accent, testid }) => (
  <motion.div
    data-testid={testid}
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: "easeOut" }}
    className="glass rounded-2xl p-6 relative overflow-hidden"
  >
    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10" style={{ background: accent }} />
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#8A8A8A] font-semibold">
      <Icon size={14} weight="duotone" style={{ color: accent }}/> {label}
    </div>
    <div className="kpi-number text-4xl mt-3" style={{ color: "#0A0A0A" }}>{value}</div>
    <div className="text-xs text-[#8A8A8A] mt-2 font-medium">{delta}</div>
  </motion.div>
);

const QuickLink = ({ title, desc, onClick, accent, testid }) => (
  <motion.button
    data-testid={testid}
    onClick={onClick}
    whileHover={{ y: -2 }}
    className="glass rounded-2xl p-6 text-left group"
  >
    <div className="flex items-center justify-between">
      <div className="font-display font-bold text-lg">{title}</div>
      <ArrowUpRight size={18} className="text-[#8A8A8A] group-hover:text-[#00594C] transition-colors" weight="bold"/>
    </div>
    <p className="text-sm text-[#5C5C5C] mt-2">{desc}</p>
    <div className="h-1 w-12 rounded-full mt-4 group-hover:w-20 transition-all" style={{ background: accent }}/>
  </motion.button>
);
