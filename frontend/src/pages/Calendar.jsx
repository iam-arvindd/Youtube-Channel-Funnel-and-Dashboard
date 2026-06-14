import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import Shell from "@/components/Shell";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

const STAGE_COLOR = {
  idea:"#94A3B8", script:"#00594C", voiceover:"#FF6B4A",
  video:"#0EA5E9", thumbnail:"#F59E0B", scheduled:"#A855F7", published:"#10B981",
};

export default function Calendar() {
  const [videos, setVideos] = useState([]);
  const [cursor, setCursor] = useState(new Date());

  useEffect(() => { api.get("/videos").then(r=>setVideos(r.data)); }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleDateString("en-US",{month:"long", year:"numeric"});
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const days = lastDay.getDate();

  const grid = [];
  for (let i = 0; i < startWeekday; i++) grid.push(null);
  for (let d = 1; d <= days; d++) grid.push(new Date(year, month, d));

  const byDate = videos.reduce((acc, v) => {
    const d = v.published_date || v.scheduled_date;
    if (!d) return acc;
    const key = d.slice(0,10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  return (
    <Shell title="Calendar" subtitle="Publishing schedule at a glance.">
      <div className="glass rounded-2xl p-7">
        <div className="flex items-center justify-between mb-6">
          <button data-testid="cal-prev" onClick={()=>setCursor(new Date(year, month-1, 1))} className="btn-ghost !p-2"><CaretLeft size={18}/></button>
          <h2 className="font-display text-2xl font-bold tracking-tight">{monthName}</h2>
          <button data-testid="cal-next" onClick={()=>setCursor(new Date(year, month+1, 1))} className="btn-ghost !p-2"><CaretRight size={18}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-[0.15em] font-bold text-[#8A8A8A] mb-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=> <div key={d} className="text-center py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((day, i) => {
            if (!day) return <div key={i} className="aspect-square rounded-lg bg-black/[0.02]"/>;
            const key = day.toISOString().slice(0,10);
            const items = byDate[key] || [];
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <motion.div key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.005}}
                className={`aspect-square rounded-lg p-2 bg-white border ${isToday ? "border-[#00594C]" : "border-black/5"} relative overflow-hidden hover:shadow-sm transition-all`}>
                <div className={`text-xs font-mono font-bold ${isToday ? "text-[#00594C]" : "text-[#0A0A0A]"}`}>{day.getDate()}</div>
                <div className="space-y-0.5 mt-1">
                  {items.slice(0,2).map(v => (
                    <div key={v.id} data-testid={`cal-event-${v.id}`} className="text-[9px] truncate font-semibold px-1.5 py-0.5 rounded"
                         style={{background: STAGE_COLOR[v.stage]+"22", color: STAGE_COLOR[v.stage]}}>{v.title}</div>
                  ))}
                  {items.length > 2 && <div className="text-[9px] text-[#8A8A8A]">+{items.length-2} more</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
