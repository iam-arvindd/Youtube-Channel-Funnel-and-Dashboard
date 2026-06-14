import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, formatErr } from "@/lib/api";
import Shell from "@/components/Shell";
import { Plus, Trash, Link as LinkIcon } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const PARTNERS = [
  { name: "Groww", color: "#00B386", link: "https://groww.in/partners", info: "₹100–₹150 per active KYC" },
  { name: "Zerodha", color: "#387ED1", link: "https://zerodha.com/partner", info: "₹300–₹500/referral + 10% brokerage" },
  { name: "Upstox", color: "#7B1FA2", link: "https://upstox.com/affiliate", info: "10-20% lifetime revenue share" },
  { name: "Angel One", color: "#E91E63", link: "https://angelone.in", info: "₹300–₹500 per account" },
  { name: "Amazon", color: "#FF9900", link: "https://affiliate-program.amazon.in", info: "3-8% on books/products" },
];

export default function Affiliates() {
  const [entries, setEntries] = useState([]);
  const [show, setShow] = useState(false);

  const load = () => api.get("/affiliates").then(r=>setEntries(r.data));
  useEffect(() => { load(); }, []);

  const byPartner = entries.reduce((acc, e) => {
    acc[e.partner] = (acc[e.partner] || 0) + (e.earnings || 0);
    return acc;
  }, {});
  const pieData = Object.entries(byPartner).map(([name, value]) => ({ name, value }));
  const total = entries.reduce((s,e)=>s + (e.earnings||0), 0);
  const conv = entries.reduce((s,e)=>s + (e.conversions||0), 0);
  const clicks = entries.reduce((s,e)=>s + (e.clicks||0), 0);

  const del = async (id) => { await api.delete(`/affiliates/${id}`); load(); };

  return (
    <Shell title="Affiliates" subtitle="Track your partner income, month by month."
      action={<button data-testid="add-affiliate" onClick={()=>setShow(true)} className="btn-primary flex items-center gap-2"><Plus size={16} weight="bold"/> Log Income</button>}>
      <Toaster richColors position="top-right"/>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-6">
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#8A8A8A]">Lifetime Affiliate Earnings</div>
          <div className="kpi-number text-4xl mt-2 text-[#00594C]">₹{total.toLocaleString("en-IN")}</div>
          <div className="text-xs text-[#8A8A8A] mt-2">{conv} conversions · {clicks} clicks</div>
        </motion.div>
        <div className="glass rounded-2xl p-6 md:col-span-2">
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#8A8A8A] mb-2">Earnings split by partner</div>
          <div className="h-48">
            {pieData.length === 0 ? (
              <div className="grid place-items-center h-full text-sm text-[#8A8A8A]">No data yet.</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {pieData.map((d,i)=>{
                      const p = PARTNERS.find(p=>p.name===d.name);
                      return <Cell key={i} fill={p?.color || "#5C5C5C"} stroke="white" strokeWidth={2}/>;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{background:'rgba(255,255,255,0.95)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:10}} formatter={(v)=>`₹${v}`}/>
                  <Legend wrapperStyle={{ fontSize: 11 }}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <h3 className="font-display text-lg font-bold mb-3">Partner Programs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {PARTNERS.map((p) => (
          <motion.a key={p.name} href={p.link} target="_blank" rel="noreferrer"
            whileHover={{ y: -2 }}
            className="bg-white border border-black/5 rounded-xl p-5 group hover:border-[#00594C]/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display font-bold text-base" style={{color: p.color}}>{p.name}</div>
                <div className="text-xs text-[#5C5C5C] mt-1">{p.info}</div>
              </div>
              <LinkIcon size={16} className="text-[#8A8A8A] group-hover:text-[#00594C]"/>
            </div>
            <div className="mt-3 pt-3 border-t border-black/5">
              <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#8A8A8A]">Earned: </span>
              <span className="font-mono font-bold text-sm text-[#0A0A0A]">₹{(byPartner[p.name]||0).toLocaleString("en-IN")}</span>
            </div>
          </motion.a>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.02] text-[11px] uppercase tracking-[0.1em] text-[#5C5C5C]">
            <tr>
              <th className="px-5 py-3 text-left">Partner</th>
              <th className="px-3 py-3 text-left">Month</th>
              <th className="px-3 py-3 text-right">Clicks</th>
              <th className="px-3 py-3 text-right">Conversions</th>
              <th className="px-3 py-3 text-right">Earnings</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e)=>(
              <tr key={e.id} className="border-t border-black/5 hover:bg-black/[0.015]">
                <td className="px-5 py-3 font-semibold">{e.partner}</td>
                <td className="px-3 py-3 font-mono text-xs text-[#5C5C5C]">{e.month}</td>
                <td className="px-3 py-3 text-right font-mono">{e.clicks}</td>
                <td className="px-3 py-3 text-right font-mono">{e.conversions}</td>
                <td className="px-3 py-3 text-right font-mono text-[#00594C] font-bold">₹{e.earnings}</td>
                <td className="px-3 py-3 text-right"><button onClick={()=>del(e.id)} className="text-[#8A8A8A] hover:text-[#EF4444]"><Trash size={14}/></button></td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-[#8A8A8A] text-sm">No entries yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {show && <NewModal onClose={()=>{setShow(false); load();}}/>}
    </Shell>
  );
}

function NewModal({ onClose }) {
  const [form, setForm] = useState({
    partner: "Groww", month: new Date().toISOString().slice(0,7),
    clicks: 0, conversions: 0, earnings: 0, notes: "",
  });
  const save = async () => {
    try { await api.post("/affiliates", form); toast.success("Logged"); onClose(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} onClick={(e)=>e.stopPropagation()} className="glass rounded-2xl p-8 w-full max-w-lg">
        <h3 className="font-display font-bold text-2xl">Log Affiliate Income</h3>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">Partner</label>
            <select className="input-base mt-1" value={form.partner} onChange={(e)=>setForm({...form, partner:e.target.value})}>
              {PARTNERS.map(p=> <option key={p.name}>{p.name}</option>)}
              <option>Other</option>
            </select>
          </div>
          <Fin label="Month (YYYY-MM)" value={form.month} onChange={(e)=>setForm({...form, month:e.target.value})}/>
          <Fin label="Earnings ₹" type="number" step="0.01" value={form.earnings} onChange={(e)=>setForm({...form, earnings:parseFloat(e.target.value||0)})}/>
          <Fin label="Clicks" type="number" value={form.clicks} onChange={(e)=>setForm({...form, clicks:parseInt(e.target.value||0)})}/>
          <Fin label="Conversions" type="number" value={form.conversions} onChange={(e)=>setForm({...form, conversions:parseInt(e.target.value||0)})}/>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button data-testid="save-affiliate" onClick={save} className="btn-primary">Save</button>
        </div>
      </motion.div>
    </div>
  );
}

const Fin = ({label, ...p}) => (
  <div>
    <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">{label}</label>
    <input className="input-base mt-1" {...p}/>
  </div>
);
