import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, formatErr } from "@/lib/api";
import Shell from "@/components/Shell";
import { Key, CheckCircle, Trash, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";

export default function Settings() {
  const [info, setInfo] = useState(null);
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/settings/anthropic-key").then(r=>setInfo(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!key.startsWith("sk-")) return toast.error("Key must start with sk-");
    setSaving(true);
    try {
      await api.post("/settings/anthropic-key", { api_key: key.trim() });
      toast.success("Claude API key linked ✓");
      setKey(""); load();
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!window.confirm("Remove your Claude API key?")) return;
    await api.delete("/settings/anthropic-key");
    toast.success("Key removed"); load();
  };

  return (
    <Shell title="Settings" subtitle="Connect Claude. Configure your studio.">
      <Toaster richColors position="top-right"/>

      <div className="max-w-2xl">
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#00594C] grid place-items-center shadow-[0_8px_22px_rgba(0,89,76,0.25)]">
              <Sparkle weight="fill" size={22} color="#00E599"/>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold tracking-tight">Anthropic API Key</h3>
              <p className="text-sm text-[#5C5C5C]">Powers the Claude Sonnet 4.6 chat for script writing.</p>
            </div>
          </div>

          {info?.configured ? (
            <div className="mt-6 bg-[#E5F2F0] border border-[#00594C]/20 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <CheckCircle size={22} weight="fill" className="text-[#00594C]"/>
                <div className="flex-1">
                  <div className="font-semibold text-[#00594C]">Connected</div>
                  <div className="text-xs font-mono text-[#5C5C5C] mt-1">{info.preview}</div>
                </div>
                <button data-testid="remove-key" onClick={remove} className="btn-ghost !p-2 text-[#EF4444]">
                  <Trash size={16}/>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-[#FCEEEA] border border-[#FF6B4A]/30 rounded-xl p-4 text-sm text-[#5C5C5C]">
              No key connected. Add yours below to start writing scripts with Claude.
            </div>
          )}

          <div className="mt-6">
            <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C] flex items-center gap-2">
              <Key size={12}/> Paste your Anthropic API Key
            </label>
            <input
              data-testid="api-key-input"
              type="password"
              placeholder="sk-ant-api03-..."
              value={key}
              onChange={(e)=>setKey(e.target.value)}
              className="input-base mt-2 font-mono"
            />
            <p className="text-xs text-[#8A8A8A] mt-2 flex items-start gap-1.5">
              <ShieldCheck size={12} className="mt-0.5 text-[#00594C]"/>
              Stored encrypted (Fernet) on the server. Never exposed to the browser after save.
              Get a key at <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-[#00594C] underline font-semibold">console.anthropic.com</a>.
            </p>
            <button data-testid="save-key" onClick={save} disabled={saving || !key} className="btn-primary mt-4 disabled:opacity-50">
              {saving ? "Linking…" : info?.configured ? "Update Key" : "Link Claude"}
            </button>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass rounded-2xl p-8 mt-5">
          <h3 className="font-display text-xl font-bold tracking-tight">Workflow Reminders</h3>
          <ul className="mt-4 space-y-2 text-sm text-[#5C5C5C]">
            <li className="flex gap-2"><span className="text-[#00594C] font-bold">1.</span> Script in Claude chat (this dashboard) → save as script field.</li>
            <li className="flex gap-2"><span className="text-[#00594C] font-bold">2.</span> Generate voiceover at <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="text-[#00594C] underline">ElevenLabs</a> → paste MP3 URL in card.</li>
            <li className="flex gap-2"><span className="text-[#00594C] font-bold">3.</span> Build video at <a href="https://invideo.io" target="_blank" rel="noreferrer" className="text-[#00594C] underline">InVideo AI</a> → paste link.</li>
            <li className="flex gap-2"><span className="text-[#00594C] font-bold">4.</span> Thumbnail in <a href="https://canva.com" target="_blank" rel="noreferrer" className="text-[#00594C] underline">Canva</a> → upload PNG URL.</li>
            <li className="flex gap-2"><span className="text-[#00594C] font-bold">5.</span> Schedule & publish on YouTube → log analytics weekly.</li>
          </ul>
        </motion.div>
      </div>
    </Shell>
  );
}
