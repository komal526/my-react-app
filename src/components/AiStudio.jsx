// LaunchBuilder v78 — AiStudio.jsx
// A full window for creating with AI: describe it (type or speak), add pictures and documents, then "Create page".
// Opened from: Create new → Create with AI · the AI Consultant's plan · the editor's "Build with AI" button.
import { useEffect, useRef, useState } from "react";
import { aiWebsite, aiSection, browserAi, serverAiReady, AI_PROVIDERS, pg } from "../lib.js";
import { BRAND } from "../brand.js";
import Robot from "./Robot.jsx";

const IDEAS = [
  "A landing page for my ₹499 astrology workshop on Sunday, with booking form and WhatsApp button",
  "A website for my dental clinic in Mohali — services, doctors, reviews, appointment form",
  "A webinar sign-up page for an AI course — countdown, trainer bio, FAQ",
  "A real-estate project page with gallery, price list and site-visit form",
];
const MAX_FILES = 6;

/* ---------- reading the files people attach ---------- */
const readBuf = (f) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error("Couldn't read " + f.name)); r.readAsArrayBuffer(f); });
const toB64 = (buf) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
/* a picture → a smaller copy for the AI to look at (1024 px) + one for the page itself (1600 px) */
function shrink(file) {
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const make = (max, q) => { const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k)); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); const png = /png|svg|gif|webp/.test(file.type) && c.width * c.height < 700000; return c.toDataURL(png ? "image/png" : "image/jpeg", q); };
      const forAi = make(1024, 0.82), forPage = make(1600, 0.85); URL.revokeObjectURL(url);
      ok({ forAi, forPage });
    };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error(file.name + " can't be opened as a picture.")); };
    img.src = url;
  });
}
/* the text inside a Word (.docx) file — it's a zip; read word/document.xml with the browser's own unzip */
async function docxText(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf); let e = u8.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("This Word file looks damaged.");
  let p = dv.getUint32(e + 16, true); const n = dv.getUint16(e + 10, true);
  for (let i = 0; i < n; i++) {
    const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
    if (name !== "word/document.xml") continue;
    const st = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), data = u8.subarray(st, st + size);
    const xml = method === 0 ? new TextDecoder().decode(data) : await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
    return xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, " ").replace(/<w:br\/>/g, "\n").replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
  }
  throw new Error("No text found in this Word file.");
}
async function readDoc(f) {
  const ext = (f.name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf" || f.type === "application/pdf") {
    if (f.size > 10 * 1024 * 1024) throw new Error(f.name + " is bigger than 10 MB.");
    return { kind: "pdf", name: f.name, mime: "application/pdf", b64: toB64(await readBuf(f)) };
  }
  if (ext === "docx") return { kind: "doc", name: f.name, text: (await docxText(await readBuf(f))).slice(0, 30000) };
  if (/^(txt|md|csv|tsv|json|rtf)$/.test(ext) || /^text\//.test(f.type)) return { kind: "doc", name: f.name, text: (await f.text()).slice(0, 30000) };
  if (ext === "doc") throw new Error("Old .doc files can't be read — save it as .docx or PDF first.");
  throw new Error(f.name + ": use PDF, Word (.docx) or a text file.");
}

const Ico = ({ d, s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const I_IMG = <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="1.8" /><path d="M21 15l-5-5L5 21" /><path d="M17 3v4M15 5h4" /></>;
const I_DOC = <path d="M21 12.5l-8.2 8.2a5.3 5.3 0 01-7.5-7.5l8.6-8.6a3.5 3.5 0 015 5l-8.6 8.6a1.8 1.8 0 01-2.5-2.5l7.9-7.9" />;
const I_MIC = <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></>;
const I_ARROW = <path d="M5 12h14M13 6l6 6-6 6" />;

/* mode "new"    → creates a new landing page / website (onCreate)
   mode "editor" → builds into the page that's open: replace the page, or add a section (onApply) */
export default function AiStudio({ mode = "new", type: type0 = "landing", name: name0 = "", prompt: prompt0 = "", integ = {}, onClose, onCreate, onApply, onSetupAI }) {
  const [type, setType] = useState(type0), [name, setName] = useState(name0), [prompt, setPrompt] = useState(prompt0), [how, setHow] = useState("section");
  const [files, setFiles] = useState([]), [busy, setBusy] = useState(""), [err, setErr] = useState(""), [step, setStep] = useState(0);
  const [listen, setListen] = useState(false), [lang, setLang] = useState("en-IN"), [srv, setSrv] = useState(null);
  const ai = browserAi(integ), taRef = useRef(null), rec = useRef(null), imgIn = useRef(null), docIn = useRef(null);
  useEffect(() => { if (!ai) serverAiReady().then(setSrv).catch(() => setSrv(false)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = taRef.current; if (!t) return; t.style.height = "auto"; t.style.height = Math.min(Math.max(t.scrollHeight, 120), 320) + "px"; t.scrollTop = t.scrollHeight; }, [prompt]);
  useEffect(() => { const k = (e) => { if (e.key === "Escape" && !busy) onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [busy, onClose]);
  useEffect(() => () => { try { rec.current && rec.current.stop(); } catch { /* ignore */ } }, []);
  const provName = ai ? (AI_PROVIDERS.find((p) => p.id === ai.provider) || {}).name : srv ? BRAND.product + " AI" : "";
  const ready = !!ai || srv === true;

  /* ---- attachments ---- */
  const addImages = async (list) => {
    setErr("");
    for (const f of [...list]) {
      if (files.length >= MAX_FILES) { setErr(`Up to ${MAX_FILES} files.`); break; }
      try { const r = await shrink(f); setFiles((x) => (x.length >= MAX_FILES ? x : [...x, { kind: "image", name: f.name, mime: r.forAi.slice(5, r.forAi.indexOf(";")), b64: r.forAi.split(",")[1], page: r.forPage, thumb: r.forAi }])); }
      catch (e) { setErr(e.message); }
    }
  };
  const addDocs = async (list) => {
    setErr("");
    for (const f of [...list]) {
      if (files.length >= MAX_FILES) { setErr(`Up to ${MAX_FILES} files.`); break; }
      try { const d = await readDoc(f); setFiles((x) => (x.length >= MAX_FILES ? x : [...x, d])); } catch (e) { setErr(e.message); }
    }
  };
  const onDrop = (e) => { e.preventDefault(); const l = [...e.dataTransfer.files]; addImages(l.filter((f) => /^image\//.test(f.type))); addDocs(l.filter((f) => !/^image\//.test(f.type))); };

  /* ---- speak instead of typing ---- */
  const mic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return setErr("Speaking isn't supported in this browser — use Chrome or Edge.");
    if (listen) { try { rec.current.stop(); } catch { /* ignore */ } return; }
    const r = new SR(); r.lang = lang; r.interimResults = true; r.continuous = true; rec.current = r;
    const base = prompt ? prompt.replace(/\s*$/, " ") : ""; let fin = "";
    r.onresult = (e) => { let inter = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t + " "; else inter += t; } setPrompt(base + fin + inter); };
    r.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") setErr(e.error === "not-allowed" ? "Allow the microphone for this site (lock icon in the address bar)." : "Mic: " + e.error); };
    r.onend = () => setListen(false);
    try { r.start(); setListen(true); setErr(""); } catch { setListen(false); }
  };

  /* ---- create ---- */
  const STEPS = ["Reading your brief and files…", "Planning the sections…", "Writing the words…", "Designing the layout…", "Making it mobile-friendly…", "Almost there…"];
  useEffect(() => { if (!busy) return; setStep(0); const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000); return () => clearInterval(t); }, [busy]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = async () => {
    if (listen) { try { rec.current.stop(); } catch { /* ignore */ } }
    if (prompt.trim().length < 12 && !files.some((f) => f.kind !== "image")) return setErr("Describe what you want in a sentence or two — or attach a document about your business.");
    if (!ready) return setErr("Connect an AI first.");
    setErr(""); setBusy(mode === "editor" && how === "section" ? "Building your section…" : "Building your " + (type === "website" ? "website" : "page") + "…");
    try {
      const imgs = files.filter((f) => f.kind === "image"), docs = files.filter((f) => f.kind === "doc"), send = files.filter((f) => f.kind !== "doc").map((f) => ({ kind: f.kind, mime: f.mime, b64: f.b64, name: f.name }));
      const n = name.trim() || prompt.trim().split(/[,.:\n]/)[0].slice(0, 40) || (docs[0] && docs[0].name.replace(/\.\w+$/, "")) || "AI page";
      let brief = (mode === "new" ? `Business / page name: ${n}\n` : "") + `Brief: ${prompt.trim() || "Use the attached information."}`;
      docs.forEach((d) => { brief += `\n\nInformation from the user's document "${d.name}" (use it for real content — names, prices, dates, services):\n${d.text}`; });
      if (files.some((f) => f.kind === "pdf")) brief += `\n\nThe attached PDF is the user's own material — use its real details.`;
      if (imgs.length) brief += `\n\nThe user attached ${imgs.length} picture(s), in this order: ${imgs.map((f, i) => `${i + 1}) ${f.name}`).join(", ")}. Look at them for content and colours. Put them into the page where they fit (logo, hero, product, gallery, team): use exactly <img src="lb-img:1">, <img src="lb-img:2"> … (or url('lb-img:1') in CSS). Use every picture once.`;
      const put = (h) => imgs.reduce((x, f, i) => x.split(`lb-img:${i + 1}`).join(f.page), h);
      if (mode === "editor") {
        if (how === "section") { const h = await aiSection(ai || {}, brief, send); onApply({ how: "section", html: put(h) }); }
        else { const pages = await aiWebsite(ai || {}, brief, false, send); onApply({ how: "page", html: put(pages[0].html) }); }
      } else {
        const pages = await aiWebsite(ai || {}, brief, type === "website", send);
        onCreate(n, pages.map((p) => pg(p.name, p.file, put(p.html))), type);
      }
    } catch (e) { setErr(e.message === "NO_AI_KEY" ? "Connect an AI first." : e.message); setBusy(""); }
  };

  return (
    <div className="ais" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <i className="ais-blob b1" /><i className="ais-blob b2" /><i className="ais-blob b3" /><i className="ais-dots d1" /><i className="ais-dots d2" />
      <i className="ais-star s1">✦</i><i className="ais-star s2">✦</i><i className="ais-star s3">✦</i><i className="ais-star s4">✦</i>
      {/* floating cards on the right: picture · document · code */}
      <div className="ais-deco" aria-hidden="true"><i className="ais-ring" /><span className="ais-cd c1"><Ico d={I_IMG} s={34} /></span><span className="ais-cd c2"><b /><b /><b /><b /></span><span className="ais-cd c3">&lt;/&gt;</span></div>
      <header className="ais-top">
        <button className="ais-back" onClick={onClose} disabled={!!busy}>← Back</button>
        <span className="ais-brand">{BRAND.logo ? <img src={BRAND.logo} alt="" /> : <i className="ais-hex">⬡</i>}{BRAND.product} AI Studio</span>
        <span className={"ais-ai " + (ready ? "on" : srv === null && !ai ? "" : "off")}>{ready ? <><i />{provName}</> : srv === null ? "Checking AI…" : "No AI connected"}</span>
      </header>

      <main className="ais-main">
        <h1>{mode === "editor" ? <>What should AI <em>build</em> here?</> : <>What do you want to <em>create</em>?</>}</h1>
        <p className="ais-sub">Describe it, add pictures or documents about your business, or just speak — AI builds it and you can edit everything after.</p>

        <div className="ais-opts">
          {mode === "new" ? <>
            <div className="ais-seg">{[["landing", "✦", "Landing page"], ["website", "🌐", "Website"]].map(([k, ic, l]) => <button key={k} className={type === k ? "on" : ""} onClick={() => setType(k)} disabled={!!busy}><span>{ic}</span>{l}</button>)}
              <label className="ais-name"><span>👤</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" disabled={!!busy} /></label></div>
          </> : <div className="ais-seg">{[["section", "Add a new section"], ["page", "Replace the whole page"]].map(([k, l]) => <button key={k} className={how === k ? "on" : ""} onClick={() => setHow(k)} disabled={!!busy}>{l}</button>)}</div>}
        </div>

        <div className={"ais-box" + (listen ? " rec" : "") + (busy ? " busy" : "")}>
          <div className="ais-bot"><Robot mood={busy ? "alert" : "happy"} /></div>
          <textarea ref={taRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={!!busy} autoFocus
            placeholder={listen ? "Listening… speak now" : mode === "editor" ? "e.g. A pricing section with 3 plans: ₹499 basic, ₹999 pro, ₹1,999 premium — with a Book now button" : "Describe your page — what is it, who is it for, what should visitors do (register, call, buy)? Price, city, colours…"}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) go(); }} />
          {files.length > 0 && <div className="ais-files">{files.map((f, i) => (
            <span key={i} className={"ais-file " + f.kind}>{f.kind === "image" ? <img src={f.thumb} alt="" /> : <b>{f.kind === "pdf" ? "PDF" : "DOC"}</b>}<small>{f.name}</small>
              {!busy && <button onClick={() => setFiles((x) => x.filter((_, k) => k !== i))} aria-label="Remove">✕</button>}</span>))}</div>}
          <div className="ais-bar">
            <span className="ais-hint"><i><Ico d={I_DOC} s={15} /></i>{files.length ? `${files.length}/${MAX_FILES} files` : "Drop pictures or documents here"}</span>
            <div className="grow" />
            <button className="ais-ic" title="Add pictures (logo, products, photos)" onClick={() => imgIn.current.click()} disabled={!!busy}><Ico d={I_IMG} /></button>
            <button className="ais-ic" title="Add a document (PDF, Word, text) about your business" onClick={() => docIn.current.click()} disabled={!!busy}><Ico d={I_DOC} /></button>
            <button className={"ais-ic mic" + (listen ? " on" : "")} title={listen ? "Stop" : "Speak"} onClick={mic} disabled={!!busy}><Ico d={I_MIC} /></button>
            <select className="ais-lang" value={lang} onChange={(e) => setLang(e.target.value)} disabled={listen || !!busy} title="Speaking language"><option value="en-IN">EN</option><option value="hi-IN">हिं</option></select>
            <button className="ais-go" onClick={go} disabled={!!busy || !ready}>{mode === "editor" ? (how === "section" ? "Add section" : "Rebuild page") : "Create " + (type === "website" ? "website" : "page")} <Ico d={I_ARROW} s={16} /></button>
            <input ref={imgIn} type="file" hidden multiple accept="image/*" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
            <input ref={docIn} type="file" hidden multiple accept=".pdf,.docx,.txt,.md,.csv,application/pdf,text/plain" onChange={(e) => { addDocs(e.target.files); e.target.value = ""; }} />
          </div>
          {busy && <div className="ais-busy"><div className="ais-spark">✦</div><b>{busy}</b><span>{STEPS[step]}</span><div className="ais-prog"><i style={{ width: Math.min(95, 12 + step * 16) + "%" }} /></div><small>Usually 20–90 seconds. Keep this window open.</small></div>}
        </div>

        {err && <div className="ais-err">{err}{!ready && <button onClick={onSetupAI}>Connect an AI</button>}</div>}
        {!ready && srv === false && !err && <div className="ais-err soft">Connect an AI first — paste a free Gemini key in Integrations → AI builders. <button onClick={onSetupAI}>Connect an AI</button></div>}

        {mode === "new" && !busy && <div className="ais-ideas">{IDEAS.map((x) => <button key={x} onClick={() => setPrompt(x)}><span>✦</span>{x.length > 50 ? x.slice(0, 48) + "…" : x}</button>)}</div>}
        <p className="ais-foot"><i>⬡</i>Pictures go into your page · documents give AI your real details (prices, services, dates) · Ctrl+Enter to create</p>
      </main>
    </div>
  );
}
