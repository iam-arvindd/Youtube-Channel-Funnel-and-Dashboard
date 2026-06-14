import React, { useEffect, useState } from "react";

import { motion } from "framer-motion";
import { api, formatErr } from "@/lib/api";
import Shell from "@/components/Shell";
import { Plus, Trash, YoutubeLogo } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function Analytics() {
  const [entries, setEntries] = useState([]);
  const [videos, setVideos] = useState([]);
  const [show, setShow] = useState(false);

  const load = () => Promise.all([api.get("/analytics"), api.get("/videos")]).then(([a, v])=>{
    setEntries(a.data); setVideos(v.data);
  });
  useEffect(() => { load(); }, []);

  const totals = entries.reduce((acc, e)=>({
    views: acc.views + (e.views||0),
    earnings: acc.earnings + (e.adsense_earnings||0),
    subs: acc.subs + (e.subscribers_gained||0),
    hours: acc.hours + (e.watch_hours||0),
  }), { views:0, earnings:0, subs:0, hours:0 });

  const sorted = [...entries].sort((a,b)=>a.date.localeCompare(b.date));

  const del = async (id) => { await api.delete(`/analytics/${id}`); load(); toast.success("Deleted"); };

  return (
    <Shell title="Analytics" subtitle="Manually log per-video stats. Visualize wins."
      action={
        <div className="flex gap-2">
          <BulkSyncButton onDone={load}/>
          <button data-testid="add-analytics" onClick={()=>setShow(true)} className="btn-primary flex items-center gap-2"><Plus size={16} weight="bold"/> Log Entry</button>
        </div>
      }>
      <Toaster richColors position="top-right"/>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Mini label="Total Views" value={totals.views.toLocaleString("en-IN")} accent="#FF6B4A"/>
        <Mini label="AdSense Earnings" value={`₹${totals.earnings.toLocaleString("en-IN")}`} accent="#00594C"/>
        <Mini label="Subs Gained" value={`+${totals.subs}`} accent="#00E599"/>
        <Mini label="Watch Hours" value={totals.hours.toFixed(0)} accent="#A855F7"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Views Over Time">
          <ResponsiveContainer>
            <LineChart data={sorted}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(0,0,0,0.06)"/>
              <XAxis dataKey="date" tick={{fontSize:11, fill:'#8A8A8A'}} tickFormatter={(d)=>d?.slice(5)}/>
              <YAxis tick={{fontSize:11, fill:'#8A8A8A'}}/>
              <Tooltip contentStyle={{background:'rgba(255,255,255,0.95)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:10}}/>
              <Line type="monotone" dataKey="views" stroke="#00594C" strokeWidth={2.5} dot={{ r: 3, fill: "#00594C" }}/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Earnings vs CTR">
          <ResponsiveContainer>
            <BarChart data={sorted}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(0,0,0,0.06)"/>
              <XAxis dataKey="date" tick={{fontSize:11, fill:'#8A8A8A'}} tickFormatter={(d)=>d?.slice(5)}/>
              <YAxis tick={{fontSize:11, fill:'#8A8A8A'}}/>
              <Tooltip contentStyle={{background:'rgba(255,255,255,0.95)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:10}}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
              <Bar dataKey="adsense_earnings" fill="#00594C" radius={[6,6,0,0]} name="AdSense ₹"/>
              <Bar dataKey="ctr" fill="#FF6B4A" radius={[6,6,0,0]} name="CTR %"/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="glass rounded-2xl mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.02] text-[11px] uppercase tracking-[0.1em] text-[#5C5C5C]">
            <tr>
              <th className="px-5 py-3 text-left">Video</th>
              <th className="px-3 py-3 text-left">Date</th>
              <th className="px-3 py-3 text-right">Views</th>
              <th className="px-3 py-3 text-right">CTR</th>
              <th className="px-3 py-3 text-right">Retention</th>
              <th className="px-3 py-3 text-right">RPM</th>
              <th className="px-3 py-3 text-right">AdSense</th>
              <th className="px-3 py-3 text-right">Subs</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} data-testid={`analytics-row-${e.id}`} className="border-t border-black/5 hover:bg-black/[0.015]">
                <td className="px-5 py-3 font-medium">{e.video_title}</td>
                <td className="px-3 py-3 font-mono text-xs text-[#5C5C5C]">{e.date}</td>
                <td className="px-3 py-3 text-right font-mono">{e.views.toLocaleString("en-IN")}</td>
                <td className="px-3 py-3 text-right font-mono">{e.ctr}%</td>
                <td className="px-3 py-3 text-right font-mono">{e.retention}%</td>
                <td className="px-3 py-3 text-right font-mono">₹{e.rpm}</td>
                <td className="px-3 py-3 text-right font-mono text-[#00594C] font-semibold">₹{e.adsense_earnings}</td>
                <td className="px-3 py-3 text-right font-mono">+{e.subscribers_gained}</td>
                <td className="px-3 py-3 text-right">
                  <button onClick={()=>del(e.id)} className="text-[#8A8A8A] hover:text-[#EF4444]"><Trash size={14}/></button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12 text-[#8A8A8A] text-sm">No data yet. Click &quot;Log Entry&quot; to start tracking.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {show && <NewAnalyticsModal videos={videos} onClose={()=>{setShow(false); load();}}/>}
    </Shell>
  );
}

const Mini = ({ label, value, accent }) => (
  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-5">
    <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#8A8A8A]">{label}</div>
    <div className="kpi-number text-3xl mt-2" style={{color: accent}}>{value}</div>
  </motion.div>
);

function BulkSyncButton({ onDone }) {
  const [busy, setBusy] = React.useState(false);
  const sync = async () => {
    setBusy(true);
    try {
      const r = await api.post("/youtube/sync-all");
      toast.success(`Synced ${r.data.synced}/${r.data.total} videos from YouTube`);
      onDone();
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <button data-testid="bulk-sync-yt" onClick={sync} disabled={busy} className="btn-accent flex items-center gap-2 disabled:opacity-60">
      <YoutubeLogo size={16} weight="fill"/> {busy ? "Syncing all…" : "Sync all from YouTube"}
    </button>
  );
}

const ChartCard = ({ title, children }) => (
  <div className="glass rounded-2xl p-6">
    <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A8A8A] font-semibold mb-4">{title}</div>
    <div className="h-64">{children}</div>
  </div>
);

function NewAnalyticsModal({ videos, onClose }) {
  const [form, setForm] = useState({
    video_title: videos[0]?.title || "", video_id: videos[0]?.id || "",
    date: new Date().toISOString().slice(0,10),
    views: 0, ctr: 0, retention: 0, watch_hours: 0, adsense_earnings: 0, subscribers_gained: 0, rpm: 0,
  });
  const save = async () => {
    if (!form.video_title) return toast.error("Video required");
    try { await api.post("/analytics", form); toast.success("Logged"); onClose(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };
  const num = (k) => (e)=>setForm({...form, [k]: parseFloat(e.target.value||0)});
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} onClick={(e)=>e.stopPropagation()} className="glass rounded-2xl p-8 w-full max-w-2xl">
        <h3 className="font-display font-bold text-2xl">Log Analytics</h3>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">Video</label>
            {videos.length > 0 ? (
              <select className="input-base mt-1" value={form.video_id} onChange={(e)=>{
                const v = videos.find(x=>x.id===e.target.value);
                setForm({...form, video_id: e.target.value, video_title: v?.title || form.video_title});
              }}>
                {videos.map(v=> <option key={v.id} value={v.id}>{v.title}</option>)}
              </select>
            ) : <input className="input-base mt-1" placeholder="Video title" value={form.video_title} onChange={(e)=>setForm({...form, video_title:e.target.value})}/>}
          </div>
          <FInput label="Date" type="date" value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})}/>
          <FInput label="Views" type="number" value={form.views} onChange={num("views")}/>
          <FInput label="CTR %" type="number" step="0.1" value={form.ctr} onChange={num("ctr")}/>
          <FInput label="Retention %" type="number" step="0.1" value={form.retention} onChange={num("retention")}/>
          <FInput label="Watch Hours" type="number" step="0.1" value={form.watch_hours} onChange={num("watch_hours")}/>
          <FInput label="RPM ₹" type="number" step="0.01" value={form.rpm} onChange={num("rpm")}/>
          <FInput label="AdSense ₹" type="number" step="0.01" value={form.adsense_earnings} onChange={num("adsense_earnings")}/>
          <FInput label="Subs Gained" type="number" value={form.subscribers_gained} onChange={num("subscribers_gained")}/>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button data-testid="save-analytics" onClick={save} className="btn-primary">Save</button>
        </div>
      </motion.div>
    </div>
  );
}

const FInput = ({label, ...p}) => (
  <div>
    <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">{label}</label>
    <input className="input-base mt-1" {...p}/>
  </div>
);
