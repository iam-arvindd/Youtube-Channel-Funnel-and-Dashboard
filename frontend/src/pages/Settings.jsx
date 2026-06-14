import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, formatErr } from "@/lib/api";
import Shell from "@/components/Shell";
import { Key, CheckCircle, Trash, ShieldCheck, Sparkle, YoutubeLogo, EnvelopeSimple, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";

function KeyCard({ title, subtitle, keyType, placeholder, helpUrl, icon: Icon, accent }) {
  const [info, setInfo] = useState(null);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const path = keyType === "anthropic" ? "/settings/anthropic-key" : `/settings/keys/${keyType}`;
  const load = () => api.get(path).then(r=>setInfo(r.data));
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, []);
  const save = async () => {
    if (val.length < 8) return toast.error("Key too short");
    setBusy(true);
    try { await api.post(path, { api_key: val.trim() }); toast.success(`${title} connected ✓`); setVal(""); load(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Remove ${title} key?`)) return;
    await api.delete(path); load(); toast.success("Removed");
  };
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-7">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl grid place-items-center shadow-md" style={{background: accent}}>
          <Icon weight="fill" size={20} color="white"/>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
          <p className="text-xs text-[#5C5C5C]">{subtitle}</p>
        </div>
        {info?.configured && (
          <span className="pill" style={{background: "#10B98122", color:"#10B981"}}>
            <CheckCircle size={11} weight="fill"/> Linked
          </span>
        )}
      </div>
      {info?.configured ? (
        <div className="mt-4 flex items-center gap-2">
          <code className="font-mono text-xs flex-1 px-3 py-2 bg-black/[0.03] rounded-lg">{info.preview}</code>
          <button data-testid={`remove-${keyType}`} onClick={remove} className="btn-ghost !p-2 text-[#EF4444]"><Trash size={14}/></button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-[#8A8A8A]">Not connected. Get yours at <a href={helpUrl} target="_blank" rel="noreferrer" className="text-[#00594C] underline font-semibold">{new URL(helpUrl).hostname}</a></p>
      )}
      <div className="mt-3 flex gap-2">
        <input data-testid={`input-${keyType}`} type="password" placeholder={placeholder} value={val} onChange={(e)=>setVal(e.target.value)} className="input-base font-mono text-xs"/>
        <button data-testid={`save-${keyType}`} onClick={save} disabled={busy || !val} className="btn-primary !px-4 disabled:opacity-50">
          {busy ? "…" : info?.configured ? "Update" : "Link"}
        </button>
      </div>
    </motion.div>
  );
}

function YTConnectCard() {
  const [status, setStatus] = useState({ connected: false });
  const [busy, setBusy] = useState(false);
  const load = () => api.get("/youtube/oauth/status").then(r => setStatus(r.data));
  useEffect(() => { load(); }, []);
  const connect = async () => {
    setBusy(true);
    try {
      const r = await api.get("/youtube/oauth/start");
      const w = window.open(r.data.auth_url, "yt_oauth", "width=600,height=720");
      const timer = setInterval(() => {
        if (w?.closed) { clearInterval(timer); load(); setBusy(false); }
      }, 1000);
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); setBusy(false); }
  };
  const disconnect = async () => {
    if (!window.confirm("Disconnect YouTube Analytics?")) return;
    await api.delete("/youtube/oauth"); load(); toast.success("Disconnected");
  };
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-7">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#DC2626] grid place-items-center shadow-md">
          <YoutubeLogo weight="fill" size={20} color="white"/>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold tracking-tight">Connect YouTube Channel</h3>
          <p className="text-xs text-[#5C5C5C]">Authorize once → unlock retention curves & traffic-source breakdowns.</p>
        </div>
        {status.connected && <span className="pill" style={{background:"#10B98122", color:"#10B981"}}><CheckCircle size={11} weight="fill"/> Connected</span>}
      </div>
      <div className="mt-4">
        {status.connected ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#5C5C5C]">Authorized {status.connected_at ? new Date(status.connected_at).toLocaleDateString() : ""}</span>
            <button data-testid="yt-disconnect" onClick={disconnect} className="btn-ghost text-[#EF4444] text-xs">Disconnect</button>
          </div>
        ) : (
          <button data-testid="yt-connect" onClick={connect} disabled={busy} className="btn-accent disabled:opacity-50">
            {busy ? "Opening Google…" : "Connect YouTube Analytics"}
          </button>
        )}
        <p className="text-[10px] text-[#8A8A8A] mt-3">Requires Client ID & Secret above. Add this redirect URI in your Google Cloud OAuth client: <code className="font-mono text-[#00594C]">{`${process.env.REACT_APP_BACKEND_URL}/api/youtube/oauth/callback`}</code></p>
      </div>
    </motion.div>
  );
}


function DigestCard() {
  const [d, setD] = useState({ enabled: false, email: "" });
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const load = () => api.get("/settings/digest").then(r=>setD(r.data));
  useEffect(()=>{ load(); }, []);
  const save = async () => {
    setBusy(true);
    try { await api.post("/settings/digest", d); toast.success("Digest settings saved"); load(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  const sendNow = async () => {
    setSending(true);
    try { await api.post("/settings/digest/send-now"); toast.success("Digest sent! Check your inbox."); load(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setSending(false); }
  };
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-7">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#00594C] grid place-items-center shadow-md">
          <EnvelopeSimple weight="fill" size={20} color="white"/>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold tracking-tight">Weekly Email Digest</h3>
          <p className="text-xs text-[#5C5C5C]">RPM, views & affiliate income summary every week. Requires Resend key above.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input data-testid="digest-toggle" type="checkbox" checked={d.enabled} onChange={(e)=>setD({...d, enabled:e.target.checked})} className="sr-only peer"/>
          <div className="w-11 h-6 bg-black/10 rounded-full peer peer-checked:bg-[#00594C] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"/>
        </label>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2 items-center">
        <input data-testid="digest-email" type="email" placeholder="you@example.com" value={d.email || ""} onChange={(e)=>setD({...d, email:e.target.value})} className="input-base"/>
        <button data-testid="digest-save" onClick={save} disabled={busy} className="btn-primary !px-4 disabled:opacity-50">{busy ? "…" : "Save"}</button>
        <button data-testid="digest-send" onClick={sendNow} disabled={sending || !d.email} className="btn-accent !px-4 !py-[10px] disabled:opacity-50 flex items-center gap-1.5">
          <PaperPlaneTilt size={14}/> {sending ? "Sending…" : "Send now"}
        </button>
      </div>
      {d.last_sent_at && <p className="text-[10px] text-[#8A8A8A] mt-2 font-mono">Last sent: {new Date(d.last_sent_at).toLocaleString()}</p>}
    </motion.div>
  );
}

export default function Settings() {
  return (
    <Shell title="Settings" subtitle="Connect integrations. Configure your studio.">
      <Toaster richColors position="top-right"/>
      <div className="max-w-2xl space-y-5">
        <KeyCard title="Anthropic Claude" subtitle="Powers script writing chat (Claude Sonnet 4.6)." keyType="anthropic"
          placeholder="sk-ant-api03-..." helpUrl="https://console.anthropic.com/" icon={Sparkle} accent="#00594C"/>

        <KeyCard title="YouTube Data API" subtitle="Auto-fetch views & stats once a video is live." keyType="youtube"
          placeholder="AIzaSy..." helpUrl="https://console.cloud.google.com/apis/library/youtube.googleapis.com" icon={YoutubeLogo} accent="#FF0000"/>

        <KeyCard title="Resend (Email)" subtitle="Used to send weekly digest emails." keyType="resend"
          placeholder="re_..." helpUrl="https://resend.com/api-keys" icon={EnvelopeSimple} accent="#FF6B4A"/>

        <KeyCard title="YouTube OAuth Client ID" subtitle="Step 1 of YouTube Analytics (retention + traffic sources)." keyType="yt_oauth_client_id"
          placeholder="123-xxxxx.apps.googleusercontent.com" helpUrl="https://console.cloud.google.com/apis/credentials" icon={YoutubeLogo} accent="#DC2626"/>

        <KeyCard title="YouTube OAuth Client Secret" subtitle="Step 2 of YouTube Analytics." keyType="yt_oauth_client_secret"
          placeholder="GOCSPX-..." helpUrl="https://console.cloud.google.com/apis/credentials" icon={YoutubeLogo} accent="#DC2626"/>

        <YTConnectCard/>

        <DigestCard/>

        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-7">
          <h3 className="font-display text-lg font-bold tracking-tight flex items-center gap-2"><ShieldCheck size={18} className="text-[#00594C]"/> Security</h3>
          <p className="text-sm text-[#5C5C5C] mt-2">All API keys are encrypted with Fernet on the server and never returned to the browser in full — only the masked preview above.</p>
        </motion.div>
      </div>
    </Shell>
  );
}
