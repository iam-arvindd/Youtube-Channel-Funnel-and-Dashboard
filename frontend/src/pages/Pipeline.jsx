import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { api, formatErr, API } from "@/lib/api";
import Shell from "@/components/Shell";
import { Plus, Sparkle, X, Trash, ChatCircleDots, FloppyDisk, PaperPlaneRight, Robot, ArrowsClockwise, UploadSimple, DownloadSimple, Image as ImageIcon, Microphone } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";
import ReactMarkdown from "react-markdown";

const STAGES = [
  { id: "idea", label: "Idea", color: "#94A3B8" },
  { id: "script", label: "Script", color: "#00594C" },
  { id: "voiceover", label: "Voiceover", color: "#FF6B4A" },
  { id: "video", label: "Video", color: "#0EA5E9" },
  { id: "thumbnail", label: "Thumbnail", color: "#F59E0B" },
  { id: "scheduled", label: "Scheduled", color: "#A855F7" },
  { id: "published", label: "Published", color: "#10B981" },
];

export default function Pipeline() {
  const [videos, setVideos] = useState([]);
  const [active, setActive] = useState(null); // selected video for drawer
  const [showNew, setShowNew] = useState(false);

  const load = () => api.get("/videos").then((r) => setVideos(r.data));
  useEffect(() => { load(); }, []);

  const grouped = STAGES.reduce((acc, s) => { acc[s.id] = videos.filter(v=>v.stage===s.id); return acc; }, {});

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination, source } = result;
    if (destination.droppableId === source.droppableId) return;
    setVideos((prev) => prev.map(v => v.id === draggableId ? { ...v, stage: destination.droppableId } : v));
    try {
      await api.patch(`/videos/${draggableId}`, { stage: destination.droppableId });
    } catch (e) { toast.error("Failed to move"); load(); }
  };

  return (
    <Shell title="Pipeline" subtitle="Drag cards across stages. Click any card to write script with Claude."
      action={<button data-testid="new-video-btn" onClick={()=>setShowNew(true)} className="btn-primary flex items-center gap-2"><Plus size={16} weight="bold"/> New Video</button>}>
      <Toaster richColors position="top-right" />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 min-h-[60vh]">
          {STAGES.map((stage) => (
            <Droppable droppableId={stage.id} key={stage.id}>
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}
                  className={`shrink-0 w-[300px] rounded-2xl p-3 transition-colors ${snapshot.isDraggingOver ? "bg-[#00594C]/8" : "bg-white/40"} border border-black/5`}>
                  <div className="flex items-center justify-between px-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{background: stage.color}}/>
                      <span className="text-[11px] uppercase tracking-[0.12em] font-bold text-[#5C5C5C]">{stage.label}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#0A0A0A] bg-white px-2 py-0.5 rounded-full border border-black/5">{grouped[stage.id].length}</span>
                  </div>
                  <div className="space-y-2.5 min-h-[40px]">
                    {grouped[stage.id].map((v, idx) => (
                      <Draggable key={v.id} draggableId={v.id} index={idx}>
                        {(p, snap) => (
                          <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                            data-testid={`video-card-${v.id}`}
                            onClick={() => setActive(v)}
                            className={`bg-white rounded-xl p-4 border border-black/5 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${snap.isDragging ? "shadow-xl rotate-1" : ""}`}>
                            <div className="font-display font-semibold text-sm leading-snug">{v.title}</div>
                            {v.hook && <div className="text-[11px] text-[#8A8A8A] mt-1.5 line-clamp-2">{v.hook}</div>}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
                              <span className="pill !py-[2px] !px-2 text-[9px]" style={{ background: stage.color+"22", color: stage.color }}>{v.sub_niche?.replace("_"," ")}</span>
                              {v.script && <span className="text-[10px] font-mono text-[#00594C] font-bold">SCRIPT ✓</span>}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <AnimatePresence>
        {active && <VideoDrawer video={active} onClose={(reloadIt)=>{ setActive(null); if (reloadIt) load(); }} />}
      </AnimatePresence>

      {showNew && <NewVideoModal onClose={()=>{setShowNew(false); load();}}/>}
    </Shell>
  );
}

function NewVideoModal({ onClose }) {
  const [form, setForm] = useState({ title:"", sub_niche:"investing", stage:"idea", hook:"" });
  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    try { await api.post("/videos", form); toast.success("Video added"); onClose(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} onClick={(e)=>e.stopPropagation()} className="glass rounded-2xl p-8 w-full max-w-lg">
        <h3 className="font-display font-bold text-2xl">New Video</h3>
        <div className="space-y-4 mt-6">
          <input data-testid="new-video-title" placeholder="Title" className="input-base" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
          <input placeholder="Hook" className="input-base" value={form.hook} onChange={(e)=>setForm({...form,hook:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <select className="input-base" value={form.sub_niche} onChange={(e)=>setForm({...form, sub_niche:e.target.value})}>
              <option value="personal_finance">Personal Finance</option>
              <option value="investing">Investing</option>
              <option value="psychology">Psychology</option>
              <option value="case_study">Case Study</option>
              <option value="side_hustle">Side Hustle</option>
            </select>
            <select className="input-base" value={form.stage} onChange={(e)=>setForm({...form, stage:e.target.value})}>
              {STAGES.map(s=> <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button data-testid="save-video" onClick={save} className="btn-primary">Create</button>
        </div>
      </motion.div>
    </div>
  );
}

function VideoDrawer({ video, onClose }) {
  const [v, setV] = useState(video);
  const [tab, setTab] = useState("chat"); // chat | details
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuf, setStreamBuf] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    api.get(`/videos/${video.id}/messages`).then((r)=>setMessages(r.data));
  }, [video.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamBuf]);

  const saveField = async (patch) => {
    const r = await api.patch(`/videos/${v.id}`, patch);
    setV(r.data);
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(""); setStreaming(true); setStreamBuf("");

    try {
      const token = localStorage.getItem("fyt_token");
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          video_id: v.id,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        toast.error(`Claude error: ${txt.slice(0, 200)}`);
        setStreaming(false); return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setStreamBuf(full);
      }
      setMessages((prev)=>[...prev, { role: "assistant", content: full }]);
      setStreamBuf("");
    } catch (e) {
      toast.error("Stream failed: " + e.message);
    } finally {
      setStreaming(false);
    }
  };

  const useAsScript = (content) => {
    saveField({ script: content }).then(()=>toast.success("Saved as script ✓"));
  };

  const clearChat = async () => {
    await api.delete(`/videos/${v.id}/messages`);
    setMessages([]); toast.success("Chat cleared");
  };

  const del = async () => {
    if (!window.confirm("Delete this video card permanently?")) return;
    await api.delete(`/videos/${v.id}`); toast.success("Deleted"); onClose(true);
  };

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="fixed top-0 right-0 h-screen w-full md:w-[720px] bg-white shadow-2xl z-40 flex flex-col border-l border-black/10">
      {/* Header */}
      <div className="px-6 py-5 border-b border-black/5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <input data-testid="drawer-title" value={v.title}
            onChange={(e)=>setV({...v, title:e.target.value})}
            onBlur={()=>saveField({title: v.title})}
            className="font-display text-2xl font-bold tracking-tight w-full outline-none focus:bg-black/[0.02] rounded px-1 -mx-1"/>
          <div className="flex items-center gap-2 mt-2">
            <select className="text-xs bg-white border border-black/10 rounded-full px-3 py-1 font-semibold"
              value={v.stage} onChange={(e)=>{ saveField({stage: e.target.value}); setV({...v, stage:e.target.value}); }}>
              {STAGES.map(s=> <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <span className="pill" style={{background:"#00594C22", color:"#00594C"}}>{v.sub_niche?.replace("_"," ")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button data-testid="delete-video" onClick={del} className="btn-ghost !p-2 text-[#EF4444]"><Trash size={16}/></button>
          <button data-testid="close-drawer" onClick={()=>onClose(true)} className="btn-ghost !p-2"><X size={18}/></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-1 border-b border-black/5">
        {[{id:"chat", label:"Claude Chat", icon: Robot},{id:"details", label:"Details", icon: FloppyDisk}].map(t => (
          <button key={t.id} data-testid={`tab-${t.id}`}
            onClick={()=>setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${tab===t.id ? "border-[#00594C] text-[#00594C]" : "border-transparent text-[#5C5C5C] hover:text-[#0A0A0A]"}`}>
            <t.icon size={15} weight="duotone"/> {t.label}
          </button>
        ))}
      </div>

      {tab === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-5 bg-[#FAFAFA] space-y-4">
            {messages.length === 0 && !streamBuf && (
              <div className="text-center mt-10">
                <Sparkle size={28} weight="fill" className="text-[#00594C] inline-block mb-2"/>
                <p className="text-[#5C5C5C] text-sm">Ask Claude to write a script, draft a hook, or brainstorm a thumbnail.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 text-left">
                  {["Write a 1300-word YouTube script for this topic.",
                    "Give me 5 punchy thumbnail text options.",
                    "Write a powerful 30-second hook.",
                    "Suggest 10 SEO-optimized title variations."].map((p,i)=>(
                    <button key={i} onClick={()=>setInput(p)} className="text-xs text-left p-3 bg-white border border-black/5 rounded-lg hover:border-[#00594C]/30 transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <MessageBubble key={i} msg={m} onUseAsScript={useAsScript}/>
            ))}
            {streamBuf && <MessageBubble msg={{role:"assistant", content: streamBuf}} streaming onUseAsScript={useAsScript}/>}
            <div ref={endRef}/>
          </div>

          <div className="border-t border-black/5 p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#8A8A8A]">Claude Sonnet 4.6 · Streaming</span>
              {messages.length > 0 && (
                <button onClick={clearChat} className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#8A8A8A] hover:text-[#EF4444] flex items-center gap-1">
                  <ArrowsClockwise size={11}/> Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 items-end">
              <textarea data-testid="chat-input" value={input} onChange={(e)=>setInput(e.target.value)}
                onKeyDown={(e)=>{ if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendMessage(); }}}
                rows={2} placeholder="Type your prompt… (Shift+Enter for new line)"
                className="input-base resize-none"/>
              <button data-testid="chat-send" onClick={sendMessage} disabled={streaming || !input.trim()}
                className="btn-primary !px-4 !py-3 disabled:opacity-50">
                {streaming ? <span className="pulse-dot">●</span> : <PaperPlaneRight size={16} weight="fill"/>}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <ExportButtons videoId={v.id} hasScript={!!v.script}/>
          <YouTubeSync videoId={v.id} youtubeUrl={v.youtube_url}/>
          <ThumbnailGen videoId={v.id} title={v.title} onDone={(url)=>setV({...v, thumbnail_url:url})}/>
          <UploadRow videoId={v.id} kind="thumbnail" label="Thumbnail (PNG/JPG/WEBP)" accept="image/png,image/jpeg,image/webp" currentUrl={v.thumbnail_url} onDone={(url)=>setV({...v, thumbnail_url:url})}/>
          <UploadRow videoId={v.id} kind="voiceover" label="Voiceover (MP3/WAV)" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav" currentUrl={v.voiceover_url} onDone={(url)=>setV({...v, voiceover_url:url})}/>
          <Field label="Hook" value={v.hook} onSave={(val)=>saveField({hook:val})} testid="field-hook"/>
          <Field label="Script (auto-saved when you paste from Claude)" multiline value={v.script} onSave={(val)=>saveField({script:val})} testid="field-script"/>
          <Field label="Voiceover URL (ElevenLabs MP3)" value={v.voiceover_url} onSave={(val)=>saveField({voiceover_url:val})} testid="field-vo"/>
          <Field label="Video URL (InVideo export)" value={v.video_url} onSave={(val)=>saveField({video_url:val})} testid="field-vid"/>
          <Field label="Thumbnail URL (Canva PNG)" value={v.thumbnail_url} onSave={(val)=>saveField({thumbnail_url:val})} testid="field-thumb"/>
          <Field label="YouTube URL (live)" value={v.youtube_url} onSave={(val)=>saveField({youtube_url:val})} testid="field-yt"/>
          <Field label="Scheduled date" type="date" value={v.scheduled_date?.slice(0,10) || ""} onSave={(val)=>saveField({scheduled_date:val})} testid="field-sched"/>
          <Field label="Notes" multiline value={v.notes} onSave={(val)=>saveField({notes:val})} testid="field-notes"/>
        </div>
      )}
    </motion.div>
  );
}

function Field({ label, value, onSave, multiline, testid, type="text" }) {
  const [val, setVal] = useState(value || "");
  useEffect(()=>setVal(value||""), [value]);
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C]">{label}</label>
      {multiline ? (
        <textarea data-testid={testid} className="input-base mt-1 min-h-[120px] font-mono text-[13px] leading-relaxed" value={val} onChange={(e)=>setVal(e.target.value)} onBlur={()=>val !== value && onSave(val)}/>
      ) : (
        <input data-testid={testid} type={type} className="input-base mt-1" value={val} onChange={(e)=>setVal(e.target.value)} onBlur={()=>val !== value && onSave(val)}/>
      )}
    </div>
  );
}

function MessageBubble({ msg, streaming, onUseAsScript }) {  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-[#00594C] text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] text-sm leading-relaxed">{msg.content}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-start group">
      <div className="bg-white border border-black/5 rounded-2xl rounded-tl-md px-4 py-3 max-w-[92%] text-sm shadow-sm">
        <div className="markdown-body"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
        {streaming && <span className="pulse-dot text-[#00594C] font-bold ml-1">▌</span>}
        {!streaming && msg.content && msg.content.length > 200 && (
          <button onClick={()=>onUseAsScript(msg.content)}
            className="mt-3 text-[10px] uppercase tracking-[0.1em] font-bold text-[#00594C] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <FloppyDisk size={11}/> Save as script
          </button>
        )}
      </div>
    </div>
  );
}

function UploadRow({ videoId, kind, label, accept, currentUrl, onDone }) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);
  const upload = async (file) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("fyt_token");
      const res = await fetch(`${API}/videos/${videoId}/upload?kind=${kind}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const t = await res.text();
        toast.error(`Upload failed: ${t.slice(0,150)}`);
        return;
      }
      const data = await res.json();
      onDone(data.url);
      toast.success(`${label.split(" ")[0]} uploaded ✓`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  const token = localStorage.getItem("fyt_token");
  const viewUrl = currentUrl ? `${process.env.REACT_APP_BACKEND_URL}${currentUrl}?auth=${token}` : null;
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#5C5C5C] flex items-center gap-2">
        {kind === "thumbnail" ? <ImageIcon size={13}/> : <Microphone size={13}/>} {label}
      </label>
      <div className="mt-2 flex items-center gap-3">
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          data-testid={`upload-${kind}`}
          onChange={(e)=>e.target.files?.[0] && upload(e.target.files[0])}/>
        <button onClick={()=>inputRef.current?.click()} disabled={busy}
          className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2 disabled:opacity-50">
          <UploadSimple size={14}/> {busy ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
        </button>
        {viewUrl && (kind === "thumbnail" ? (
          <img src={viewUrl} alt="thumb" className="w-20 h-12 object-cover rounded-lg border border-black/5"/>
        ) : (
          <audio controls src={viewUrl} className="h-9"/>
        ))}
      </div>
    </div>
  );
}

function ExportButtons({ videoId, hasScript }) {
  const download = async (fmt) => {
    if (!hasScript) return toast.error("Save a script first (use Claude chat)");
    const token = localStorage.getItem("fyt_token");
    const res = await fetch(`${API}/videos/${videoId}/export?fmt=${fmt}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { toast.error("Export failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script.${fmt}`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E5F2F0] border border-[#00594C]/15">
      <DownloadSimple size={16} className="text-[#00594C]"/>
      <span className="text-xs font-semibold text-[#00594C] flex-1">Export script for ElevenLabs / Docs:</span>
      <button data-testid="export-txt" onClick={()=>download("txt")} className="text-xs font-bold text-[#00594C] hover:text-[#004036] uppercase tracking-[0.1em]">.txt</button>
      <span className="text-[#00594C]/30">|</span>
      <button data-testid="export-docx" onClick={()=>download("docx")} className="text-xs font-bold text-[#00594C] hover:text-[#004036] uppercase tracking-[0.1em]">.docx</button>
    </div>
  );
}


function YouTubeSync({ videoId, youtubeUrl }) {
  const [busy, setBusy] = React.useState(false);
  const sync = async () => {
    if (!youtubeUrl) return toast.error("Add a YouTube URL on this card first");
    setBusy(true);
    try {
      const r = await api.post(`/videos/${videoId}/youtube/sync`);
      toast.success(`Synced ✓ ${r.data.views.toLocaleString()} views, ${r.data.likes} likes`);
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FFF3F0] border border-[#FF6B4A]/20">
      <span className="text-xs font-bold text-[#FF6B4A] flex-1">📺 Live on YouTube? Auto-fetch stats:</span>
      <button data-testid="yt-sync" onClick={sync} disabled={busy}
        className="btn-accent !py-2 !px-4 text-xs disabled:opacity-50">
        {busy ? "Syncing…" : "Sync from YouTube"}
      </button>
    </div>
  );
}

function ThumbnailGen({ videoId, title, onDone }) {
  const [open, setOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const generate = async () => {
    setBusy(true);
    try {
      const r = await api.post(`/videos/${videoId}/thumbnail/generate`, {
        prompt: prompt || `Punchy thumbnail for: ${title}`
      });
      onDone(r.data.url);
      toast.success("AI thumbnail generated ✓");
      setOpen(false); setPrompt("");
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <div className="p-3 rounded-xl bg-gradient-to-br from-[#FFF9E5] to-[#FFE9D6] border border-[#F59E0B]/25">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#92400E] flex-1">✨ Optional: Generate thumbnail with Gemini Nano Banana</span>
        <button data-testid="ai-thumb-toggle" onClick={()=>setOpen(!open)} className="text-xs font-bold text-[#92400E] uppercase tracking-[0.1em]">
          {open ? "Cancel" : "Try it"}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <textarea data-testid="ai-thumb-prompt" rows={2} value={prompt} onChange={(e)=>setPrompt(e.target.value)}
            placeholder="Extra details (e.g., 'rupee coins falling, shocked face, red & yellow')"
            className="input-base text-sm"/>
          <button data-testid="ai-thumb-generate" onClick={generate} disabled={busy}
            className="btn-primary w-full disabled:opacity-50">
            {busy ? "Generating… (15-30s)" : "Generate Thumbnail"}
          </button>
        </div>
      )}
    </div>
  );
}

