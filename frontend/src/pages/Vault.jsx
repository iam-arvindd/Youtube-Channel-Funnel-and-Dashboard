import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, formatErr } from "@/lib/api";
import Shell from "@/components/Shell";
import { MagnifyingGlass, Plus, Star, Trash, Rocket } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";

const NICHES = [
  { id: "all", label: "All", color: "#0A0A0A" },
  { id: "personal_finance", label: "Personal Finance", color: "#00594C" },
  { id: "investing", label: "Investing", color: "#0EA5E9" },
  { id: "psychology", label: "Psychology", color: "#A855F7" },
  { id: "case_study", label: "Case Studies", color: "#FF6B4A" },
  { id: "side_hustle", label: "Side Hustles", color: "#10B981" },
];

export default function Vault() {
  const [ideas, setIdeas] = useState([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const nav = useNavigate();

  const load = () => api.get("/ideas").then((r) => setIdeas(r.data));
  useEffect(() => { load(); }, []);

  const filtered = ideas.filter((i) =>
    (filter === "all" || i.sub_niche === filter) &&
    (q === "" || i.title.toLowerCase().includes(q.toLowerCase()))
  );

  const promote = async (id) => {
    try {
      await api.post(`/ideas/${id}/promote`);
      toast.success("Promoted to pipeline → Script stage");
      setTimeout(()=>nav("/pipeline"), 600);
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };

  const del = async (id) => {
    await api.delete(`/ideas/${id}`); load();
    toast.success("Idea deleted");
  };

  return (
    <Shell title="Idea Vault" subtitle={`${ideas.length} topics ready to script.`}
      action={<button data-testid="new-idea-btn" onClick={()=>setShowNew(true)} className="btn-primary flex items-center gap-2"><Plus size={16} weight="bold"/> New Idea</button>}>
      <Toaster richColors position="top-right" />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input data-testid="vault-search" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search topics…" className="input-base pl-9"/>
        </div>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <button key={n.id} data-testid={`niche-${n.id}`}
              onClick={()=>setFilter(n.id)}
              className={`pill border transition-all ${filter===n.id ? "text-white" : "text-[#5C5C5C] bg-white border-black/5 hover:border-black/20"}`}
              style={filter===n.id ? { background: n.color, borderColor: n.color } : {}}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.03 }}}}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((idea) => (
          <motion.div key={idea.id}
            variants={{ hidden:{opacity:0,y:14}, visible:{opacity:1,y:0}}}
            data-testid={`idea-card-${idea.id}`}
            whileHover={{ y: -3 }}
            className="bg-white border border-black/5 rounded-xl p-5 hover:border-[#00594C]/30 hover:shadow-[0_10px_30px_rgba(0,89,76,0.08)] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="pill" style={{ background: nicheColor(idea.sub_niche)+"22", color: nicheColor(idea.sub_niche) }}>
                {nicheLabel(idea.sub_niche)}
              </span>
              <RatingStars rating={idea.rating}/>
            </div>
            <h3 className="font-display font-bold text-base leading-snug tracking-tight">{idea.title}</h3>
            {idea.hook && <p className="text-xs text-[#5C5C5C] mt-2">{idea.hook}</p>}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-black/5">
              <button data-testid={`promote-${idea.id}`} onClick={()=>promote(idea.id)}
                className="text-xs font-semibold text-[#00594C] flex items-center gap-1.5 hover:gap-2 transition-all">
                <Rocket size={14} weight="bold"/> Promote to pipeline
              </button>
              <button data-testid={`delete-idea-${idea.id}`} onClick={()=>del(idea.id)} className="text-[#8A8A8A] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100">
                <Trash size={14}/>
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {showNew && <NewIdeaModal onClose={()=>{setShowNew(false); load();}}/>}
    </Shell>
  );
}

const nicheColor = (n) => (NICHES.find(x=>x.id===n)?.color || "#5C5C5C");
const nicheLabel = (n) => (NICHES.find(x=>x.id===n)?.label || n);

const RatingStars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    <Star size={12} weight="fill" className="text-[#F59E0B]"/>
    <span className="text-xs font-mono font-semibold">{rating}</span>
  </div>
);

function NewIdeaModal({ onClose }) {
  const [form, setForm] = useState({ title: "", sub_niche: "investing", hook: "", rating: 7 });
  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    try { await api.post("/ideas", form); toast.success("Idea added"); onClose(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}}
        onClick={(e)=>e.stopPropagation()}
        className="glass rounded-2xl p-8 w-full max-w-lg">
        <h3 className="font-display font-bold text-2xl">New Idea</h3>
        <div className="space-y-4 mt-6">
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">Title</label>
            <input data-testid="new-idea-title" className="input-base mt-1" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})}/>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">Sub-niche</label>
            <select className="input-base mt-1" value={form.sub_niche} onChange={(e)=>setForm({...form, sub_niche:e.target.value})}>
              {NICHES.filter(n=>n.id!=="all").map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">Hook / one-liner</label>
            <input className="input-base mt-1" value={form.hook} onChange={(e)=>setForm({...form, hook:e.target.value})}/>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">Rating (1-10)</label>
            <input type="number" min="1" max="10" className="input-base mt-1" value={form.rating} onChange={(e)=>setForm({...form, rating:parseInt(e.target.value||0)})}/>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button data-testid="save-idea" onClick={save} className="btn-primary">Save Idea</button>
        </div>
      </motion.div>
    </div>
  );
}
