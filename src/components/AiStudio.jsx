// LaunchBuilder v78 — AiStudio.jsx
// A full window for creating with AI: describe it (type or speak), add pictures and documents, then "Create page".
// Opened from: Create new → Create with AI · the AI Consultant's plan · the editor's "Build with AI" button.
import { useEffect, useRef, useState } from "react";
import { aiWebsite, aiSection, aiEditPage, callAI, browserAi, serverAiReady, AI_PROVIDERS, pg, aiTts, TTS_VOICES } from "../lib.js";
import { BRAND } from "../brand.js";
import Robot from "./Robot.jsx";

const IDEAS = [
  "A landing page for my ₹499 astrology workshop on Sunday, with booking form and WhatsApp button",
  "A website for my dental clinic in Mohali — services, doctors, reviews, appointment form",
  "A webinar sign-up page for an AI course — countdown, trainer bio, FAQ",
  "A real-estate project page with gallery, price list and site-visit form",
];
const MAX_FILES = 6;
/* speaking languages (Chrome / Edge understand all of these) */
export const LANGS = [["en-IN", "EN", "English"], ["hi-IN", "हिं", "हिन्दी · Hindi"], ["pa-IN", "ਪੰ", "ਪੰਜਾਬੀ · Punjabi"], ["bn-IN", "বা", "বাংলা · Bengali"], ["mr-IN", "मरा", "मराठी · Marathi"],
  ["gu-IN", "ગુ", "ગુજરાતી · Gujarati"], ["ta-IN", "த", "தமிழ் · Tamil"], ["te-IN", "తె", "తెలుగు · Telugu"], ["kn-IN", "ಕ", "ಕನ್ನಡ · Kannada"], ["ml-IN", "മ", "മലയാളം · Malayalam"],
  ["ur-IN", "اُر", "اردو · Urdu"], ["or-IN", "ଓ", "ଓଡ଼ିଆ · Odia"], ["as-IN", "অ", "অসমীয়া · Assamese"]];
const langName = (l) => ((LANGS.find((x) => x[0] === l) || LANGS[0])[2].split("·").pop() || "English").trim();
/* uploaded pictures are huge data: links — hide them from the AI while it edits, put them back after */
const slimPics = (h) => { const imgs = []; const t = h.replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, (m) => { imgs.push(m); return `lb-pic:${imgs.length - 1}`; }); return [t, (o) => imgs.reduce((x, m, i) => x.split(`lb-pic:${i}`).join(m), o)]; };

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
const I_TALK = <><path d="M4 12a8 8 0 0114.9-4" /><path d="M20 12a8 8 0 01-14.9 4" /><path d="M9 10v4M12 8v8M15 10v4" /></>;
const I_SPK = <><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11" /></>;
const I_MUTE = <><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M17 9l5 6M22 9l-5 6" /></>;
const I_SEND = <path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" />;
const I_STOP = <rect x="7" y="7" width="10" height="10" rx="2" />;

/* mode "new"    → creates a new landing page / website (onCreate)
   mode "editor" → builds into the page that's open: replace the page, or add a section (onApply) */
export default function AiStudio({ mode = "new", type: type0 = "landing", name: name0 = "", prompt: prompt0 = "", integ = {}, onClose, onCreate, onApply, onSetupAI }) {
  const [type, setType] = useState(type0), [name, setName] = useState(name0), [prompt, setPrompt] = useState(prompt0), [how, setHow] = useState("section");
  const [files, setFiles] = useState([]), [busy, setBusy] = useState(""), [err, setErr] = useState(""), [step, setStep] = useState(0);
  const [listen, setListen] = useState(""), [lang, setLang0] = useState(() => { try { return localStorage.getItem("lb_ai_lang") || "en-IN"; } catch { return "en-IN"; } }), [srv, setSrv] = useState(null);
  const setLang = (v) => { setLang0(v); try { localStorage.setItem("lb_ai_lang", v); } catch { /* ignore */ } };
  /* after AI builds: a preview you can keep changing by asking, then Save / Open in editor */
  const [res, setRes] = useState(null), [talk, setTalk] = useState(false);
  const [voiceOn, setVoice0] = useState(() => { try { return localStorage.getItem("lb_ai_voice") !== "0"; } catch { return true; } });
  const setVoice = (v) => { setVoice0(v); try { localStorage.setItem("lb_ai_voice", v ? "1" : "0"); } catch { /* ignore */ } };
  const firstImg = files.find((f) => f.kind === "image");
  const prompt0Ref = useRef(prompt0);
  const ai = browserAi(integ), taRef = useRef(null), rec = useRef(null), imgIn = useRef(null), docIn = useRef(null);
  useEffect(() => { if (!ai) serverAiReady().then(setSrv).catch(() => setSrv(false)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  prompt0Ref.current = prompt;
  useEffect(() => { const t = taRef.current; if (!t) return; t.style.height = "auto"; t.style.height = Math.min(Math.max(t.scrollHeight, 120), 320) + "px"; t.scrollTop = t.scrollHeight; }, [prompt]);
  useEffect(() => { const k = (e) => { if (e.key === "Escape" && !busy && !res && !talk) onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [busy, onClose, res, talk]);
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
  /* where = "brief" (the big box) or "edit" (the change box on the preview) */
  const mic = (where = "brief", cur = prompt, set = setPrompt) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return setErr("Speaking isn't supported in this browser — use Chrome or Edge.");
    if (listen) { try { rec.current.stop(); } catch { /* ignore */ } return; }
    const r = new SR(); r.lang = lang; r.interimResults = true; r.continuous = true; rec.current = r;
    const base = cur ? cur.replace(/\s*$/, " ") : ""; let fin = "";
    r.onresult = (e) => { let inter = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t + " "; else inter += t; } set(base + fin + inter); };
    r.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") setErr(e.error === "not-allowed" ? "Allow the microphone for this site (lock icon in the address bar)." : "Mic: " + e.error); };
    r.onend = () => setListen("");
    try { r.start(); setListen(where); setErr(""); } catch { setListen(""); }
  };
  const stopMic = () => { try { rec.current && rec.current.stop(); } catch { /* ignore */ } };

  /* ---- create ---- */
  const STEPS = ["Reading your brief and files…", "Planning the sections…", "Writing the words…", "Designing the layout…", "Making it mobile-friendly…", "Almost there…"];
  useEffect(() => { if (!busy) return; setStep(0); const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000); return () => clearInterval(t); }, [busy]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = async (said) => {
    const prompt = typeof said === "string" ? said : prompt0Ref.current;
    if (listen) stopMic();
    if (prompt.trim().length < 12 && !files.some((f) => f.kind !== "image")) return setErr("Describe what you want in a sentence or two — or attach a document about your business.");
    if (!ready) return setErr("Connect an AI first.");
    setErr(""); setBusy(mode === "editor" && how === "section" ? "Building your section…" : "Building your " + (type === "website" ? "website" : "page") + "…");
    try {
      const imgs = files.filter((f) => f.kind === "image"), docs = files.filter((f) => f.kind === "doc"), send = files.filter((f) => f.kind !== "doc").map((f) => ({ kind: f.kind, mime: f.mime, b64: f.b64, name: f.name }));
      const bn = (prompt.match(/Business name:\s*([^\n.]{2,50})/i) || [])[1];
      const n = name.trim() || (bn && bn.trim()) || prompt.trim().split(/[,.:\n]/)[0].slice(0, 40) || (docs[0] && docs[0].name.replace(/\.\w+$/, "")) || "AI page";
      let brief = (mode === "new" ? `Business / page name: ${n}\n` : "") + `Brief: ${prompt.trim() || "Use the attached information."}`;
      docs.forEach((d) => { brief += `\n\nInformation from the user's document "${d.name}" (use it for real content — names, prices, dates, services):\n${d.text}`; });
      if (files.some((f) => f.kind === "pdf")) brief += `\n\nThe attached PDF is the user's own material — use its real details.`;
      if (imgs.length) brief += `\n\nThe user attached ${imgs.length} picture(s), in this order: ${imgs.map((f, i) => `${i + 1}) ${f.name}`).join(", ")}. Look at them for content and colours. These are the user's REAL pictures — you MUST use every one of them in the page instead of stock photos: put each where it fits best (logo in the header, the main photo in the hero, products/services cards, gallery, team, about). Write exactly <img src="lb-img:1">, <img src="lb-img:2"> … (or background-image:url('lb-img:1') in CSS). Do not use any other image URLs for those spots.`;
      /* put YOUR pictures into the page: where the AI placed them (lb-img:N) — and any it forgot replace its stock / placeholder
         pictures in order, or (if there are none) go into a gallery before the footer. So every uploaded picture is used. */
      const put = (h) => imgs.reduce((x, f, i) => x.split(`lb-img:${i + 1}`).join(f.page), h);
      const useAll = (htmls, sectionOnly = false) => {
        const left = imgs.filter((f, i) => !htmls.some((h) => h.includes(`lb-img:${i + 1}`)));
        let out = htmls.map(put); if (!left.length) return out;
        const d = new DOMParser().parseFromString(sectionOnly ? `<!DOCTYPE html><html><body>${out[0]}</body></html>` : out[0], "text/html");
        const stock = [...d.querySelectorAll("img")].filter((im) => { const src = im.getAttribute("src") || ""; return !/^data:image/.test(src) && !/logo|icon|avatar/i.test((im.getAttribute("alt") || "") + " " + (im.className || "")); });
        const rest = [];
        left.forEach((f, k) => { if (stock[k]) { stock[k].setAttribute("src", f.page); stock[k].removeAttribute("srcset"); if (!stock[k].getAttribute("alt")) stock[k].setAttribute("alt", f.name.replace(/\.\w+$/, "")); stock[k].style.objectFit = stock[k].style.objectFit || "cover"; } else rest.push(f); });
        /* background placeholders: url(https://…unsplash/placehold…) */
        if (rest.length) [...d.querySelectorAll("[style*='url(']")].forEach((el) => { if (rest.length && /url\((['"]?)https?:\/\/[^)]*(unsplash|placehold|picsum|pexels|via\.placeholder|dummyimage)/i.test(el.getAttribute("style"))) el.setAttribute("style", el.getAttribute("style").replace(/url\((['"]?)https?:\/\/[^)]*\)/i, `url('${rest.shift().page}')`)); });
        if (rest.length) {
          const g = d.createElement("section"); g.setAttribute("data-lb-name", "Gallery"); g.setAttribute("style", "padding:56px 24px");
          g.innerHTML = `<div style="max-width:1140px;margin:0 auto"><h2 style="text-align:center;margin:0 0 24px">Gallery</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">${rest.map((f) => `<img src="${f.page}" alt="${f.name.replace(/\.\w+$/, "").replace(/"/g, "")}" style="width:100%;height:240px;object-fit:cover;border-radius:16px" loading="lazy">`).join("")}</div></div>`;
          const foot = [...d.body.children].reverse().find((x) => x.tagName === "FOOTER"); foot ? foot.before(g) : d.body.appendChild(g);
        }
        out[0] = sectionOnly ? d.body.innerHTML : "<!DOCTYPE html>\n" + d.documentElement.outerHTML;
        return out;
      };
      if (mode === "editor") {
        if (how === "section") { const h = await aiSection(ai || {}, brief, send); onApply({ how: "section", html: useAll([h], true)[0] }); }
        else { const pages = await aiWebsite(ai || {}, brief, false, send); onApply({ how: "page", html: useAll([pages[0].html])[0] }); }
      } else {
        const pages = await aiWebsite(ai || {}, brief, type === "website", send);
        const done = useAll(pages.map((p) => p.html)); setRes({ name: n, type, pages: pages.map((p, i) => pg(p.name, p.file, done[i])), hist: [] }); setBusy("");
      }
    } catch (e) { setErr(e.message === "NO_AI_KEY" ? "Connect an AI first." : e.message); setBusy(""); }
  };

  if (res) return <StudioPreview res={res} setRes={setRes} ai={ai} lang={lang} mic={mic} listen={listen} stopMic={stopMic} err={err} setErr={setErr}
    onBack={() => { setRes(null); setErr(""); }} onDone={(how) => onCreate(res.name, res.pages, res.type, how)} />;

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

        <div className="ais-wrap">
          <div className="ais-walk"><div className="ais-bot2"><Robot mood={busy ? "alert" : "happy"} /></div></div>
          <div className={"ais-box v87" + (listen ? " rec" : "") + (busy ? " busy" : "")}>
            <div className="ais-in">
              <button className="ais-drop" onClick={() => imgIn.current.click()} disabled={!!busy} title="Add pictures (logo, products, photos)">
                {firstImg ? <img src={firstImg.thumb} alt="" /> : <Ico d={I_IMG} s={34} />}<span className="ais-plus">+</span></button>
              <div className="ais-txt"><span className="ais-sp">✦</span>
                <textarea ref={taRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={!!busy} autoFocus
                  placeholder={listen ? "Listening… speak now" : mode === "editor" ? "e.g. A pricing section with 3 plans: ₹499 basic, ₹999 pro, ₹1,999 premium — with a Book now button" : "Describe your page — what is it, who is it for, what should visitors do (register, call, buy)? Price, city, colours…"}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) go(); }} /></div>
            </div>
            {files.length > 0 && <div className="ais-files">{files.map((f, i) => (
              <span key={i} className={"ais-file " + f.kind}>{f.kind === "image" ? <img src={f.thumb} alt="" /> : <b>{f.kind === "pdf" ? "PDF" : "DOC"}</b>}<small>{f.name}</small>
                {!busy && <button onClick={() => setFiles((x) => x.filter((_, k) => k !== i))} aria-label="Remove">✕</button>}</span>))}</div>}
            <div className="ais-bar">
              <span className="ais-hint"><i />{files.length ? `${files.length}/${MAX_FILES} files added` : "Drop pictures or documents here"}<i /></span>
              <div className="grow" />
              <button className="ais-ic" title="Add pictures (logo, products, photos)" onClick={() => imgIn.current.click()} disabled={!!busy}><Ico d={I_IMG} /></button>
              <button className="ais-ic" title="Add a document (PDF, Word, text) about your business" onClick={() => docIn.current.click()} disabled={!!busy}><Ico d={I_DOC} /></button>
              <button className={"ais-ic mic" + (listen === "brief" ? " on" : "")} title={listen ? "Stop" : "Speak"} onClick={() => mic("brief")} disabled={!!busy}><Ico d={listen === "brief" ? I_STOP : I_MIC} /></button>
              <label className="ais-langw" title="Speaking language"><span className="ais-flag">{(LANGS.find((x) => x[0] === lang) || LANGS[0])[1]}</span>
                <select className="ais-lang" value={lang} onChange={(e) => setLang(e.target.value)} disabled={!!listen || !!busy}>{LANGS.map(([v, , full]) => <option key={v} value={v}>{full.split("·").reverse().map((x) => x.trim()).join(" · ")}</option>)}</select></label>
              {mode === "new" && <button className="ais-ic talk" title="Talk with AI — it asks you a few questions by voice, then builds" onClick={() => { stopMic(); setTalk(true); }} disabled={!!busy || !ready}><Ico d={I_TALK} /></button>}
              <input ref={imgIn} type="file" hidden multiple accept="image/*" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
              <input ref={docIn} type="file" hidden multiple accept=".pdf,.docx,.txt,.md,.csv,application/pdf,text/plain" onChange={(e) => { addDocs(e.target.files); e.target.value = ""; }} />
            </div>
            {listen === "brief" && <div className="ais-listen" onClick={stopMic}><span className="ais-wave"><i /><i /><i /><i /><i /></span><b>Listening… speak in {langName(lang)}</b><small>Tap to stop</small></div>}
            {busy && <div className="ais-busy"><div className="ais-spark">✦</div><b>{busy}</b><span>{STEPS[step]}</span><div className="ais-prog"><i style={{ width: Math.min(95, 12 + step * 16) + "%" }} /></div><small>Usually 20–90 seconds. Keep this window open.</small></div>}
          </div>
          <div className="ais-under">
            {mode === "new" && <button className={"ais-voice" + (voiceOn ? " on" : "")} onClick={() => setVoice(!voiceOn)} title="The AI's voice in voice chat"><Ico d={voiceOn ? I_SPK : I_MUTE} s={20} />Voice {voiceOn ? "on" : "off"}<i /></button>}
            <div className="grow" />
            <button className="ais-go big" onClick={go} disabled={!!busy || !ready}><span className="ais-gsp">✦</span>{mode === "editor" ? (how === "section" ? "Add section" : "Rebuild page") : "Create " + (type === "website" ? "website" : "page")} <Ico d={I_ARROW} s={18} /></button>
          </div>
        </div>

        {err && <div className="ais-err">{err}{!ready && <button onClick={onSetupAI}>Connect an AI</button>}</div>}
        {!ready && srv === false && !err && <div className="ais-err soft">Connect an AI first — paste a free Gemini key in Integrations → AI builders. <button onClick={onSetupAI}>Connect an AI</button></div>}

        {mode === "new" && !busy && <div className="ais-ideas">{IDEAS.map((x) => <button key={x} onClick={() => setPrompt(x)}><span>✦</span>{x.length > 50 ? x.slice(0, 48) + "…" : x}</button>)}</div>}
        {talk && <VoiceChat ai={ai} integ={integ} lang={lang} voiceOn={voiceOn} setVoice={setVoice} onClose={() => setTalk(false)} onBrief={(b) => { setTalk(false); setPrompt(b); go(b); }} />}
        <p className="ais-foot"><i>⬡</i>Pictures go into your page · documents give AI your real details (prices, services, dates) · Ctrl+Enter to create</p>
      </main>
    </div>
  );
}

/* ---------- the finished page: preview it, keep asking for changes, then Save / Open in editor ---------- */
const QUICK = [["🎨", "Make the colours brighter"], [<svg key="w" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#25d366" /><path d="M7.2 17.6l.8-2.8a5.6 5.6 0 112.1 2.1zM10 8.6c-.3 0-.6.1-.8.4-.5.6-.5 1.5.2 2.6.8 1.2 2 2.2 3.3 2.6.8.2 1.5 0 1.8-.6l.1-.6-1.3-.6-.6.7c-.8-.3-1.5-1-1.9-1.8l.6-.6-.6-1.3z" fill="#fff" /></svg>, "Add a WhatsApp button"], ["⭐", "Add customer reviews"], [<b key="t" className="aip-T">T</b>, "Shorter text, bigger headings"], [<b key="q" className="aip-Q">?</b>, "Add an FAQ section"]];
const DEV = { desktop: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>, tablet: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M11 18h2" /></>, mobile: <><rect x="7" y="2.5" width="10" height="19" rx="2.2" /><path d="M11 18.5h2" /></> };
const I_UNDO = <path d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3" />;
/* acts: [[how, icon, label, cls]] — the buttons at the bottom · badge: the green line at the top */
function StudioPreview({ res, setRes, ai, lang, mic, listen, stopMic, err, setErr, onBack, onDone, acts, badge, backTitle = "Back to the brief" }) {
  const [i, setI] = useState(0), [dev, setDev] = useState("desktop"), [ask, setAsk] = useState(""), [busy, setBusy] = useState(false);
  const page = res.pages[Math.min(i, res.pages.length - 1)];
  const apply = async (txt) => {
    const t = (typeof txt === "string" ? txt : ask).trim(); if (!t || busy) return;
    if (listen) stopMic();
    setErr(""); setBusy(true);
    try {
      const [slim, back] = slimPics(page.html);
      const out = back(await aiEditPage(ai || {}, slim, t + "\n(Keep every image link written like lb-pic:N exactly as it is.)"));
      setRes((r) => ({ ...r, hist: [...r.hist, r.pages].slice(-10), pages: r.pages.map((x, k) => (k === Math.min(i, r.pages.length - 1) ? { ...x, html: out } : x)) }));
      setAsk("");
    } catch (e) { setErr(e.message === "NO_AI_KEY" ? "Connect an AI first." : e.message); }
    setBusy(false);
  };
  const undo = () => setRes((r) => (r.hist.length ? { ...r, pages: r.hist[r.hist.length - 1], hist: r.hist.slice(0, -1) } : r));
  return (
    <div className="aip">
      <div className="aip-stage"><div className={"aip-frame " + dev}>
        <iframe title="Preview" srcDoc={page.html} sandbox="allow-scripts allow-forms" />
        {busy && <div className="aip-busy"><div className="ais-spark">✦</div><b>Updating your {res.type === "website" ? "page" : "page"}…</b><small>Usually 20–60 seconds</small></div>}
      </div></div>
      <aside className="aip-side v88">
        <i className="aip-wv w1" /><i className="aip-wv w2" /><i className="aip-wv w3" />
        <button className="aip-x" onClick={onBack} disabled={busy} title={backTitle}>✕</button>
        <div className="aip-hero">
          <div className="aip-bot"><Robot mood="happy" /></div>
          <div className="aip-ht"><span className="aip-ready"><i>✓</i>{badge || <>Your {res.type === "website" ? "website" : "page"} is ready</>} <em>✦</em></span>
            <textarea className="aip-name" rows={2} value={res.name} onChange={(e) => setRes((r) => ({ ...r, name: e.target.value.replace(/\n/g, " ") }))} title="Name — click to change" /></div>
        </div>
        <div className="aip-row">
          {res.pages.length > 1 && <select className="aip-pg" value={i} onChange={(e) => setI(+e.target.value)}>{res.pages.map((x, k) => <option key={k} value={k}>{x.name}</option>)}</select>}
          <div className="aip-dev">{[["desktop", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobile"]].map(([d, l]) => <button key={d} className={dev === d ? "on" : ""} onClick={() => setDev(d)} title={l}><Ico d={DEV[d]} s={22} /></button>)}</div>
        </div>
        <div className="aip-ask">
          <div className="aip-ah"><span className="aip-spk">✦</span><b>Want changes? Just ask</b>{res.hist.length > 0 && <button className="aip-undo" onClick={undo} disabled={busy} title="Undo the last change"><Ico d={I_UNDO} s={20} /></button>}</div>
          <textarea value={ask} onChange={(e) => setAsk(e.target.value)} disabled={busy} placeholder={listen === "edit" ? "Listening… speak now" : "e.g. Make the header dark blue, change the price to ₹999, add a photo gallery…"}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); apply(); } }} />
          <div className="aip-askbar">
            <button className={"aip-mic" + (listen === "edit" ? " on" : "")} onClick={() => mic("edit", ask, setAsk)} disabled={busy} title={listen ? "Stop" : "Speak (" + langName(lang) + ")"}><Ico d={listen === "edit" ? I_STOP : I_MIC} s={22} /></button>
            {listen === "edit" ? <span className="aip-live"><span className="ais-wave"><i /><i /><i /><i /><i /></span>Listening…</span>
              : <button className="aip-apply" onClick={apply} disabled={busy || !ask.trim()}>{busy ? "Updating…" : <>Apply <em>✦</em></>}</button>}
          </div>
          {err && <div className="aip-err">{err}</div>}
        </div>
        <div className="aip-qa"><b><em>⚡</em>Quick Actions</b>
          {QUICK.map(([ic, q]) => <button key={q} onClick={() => apply(q)} disabled={busy}><span className="aip-qi">{ic}</span>{q}<i>›</i></button>)}</div>
        <div className="aip-acts">
          {(acts || [["save", "💾", "Save to projects", "aip-save"], ["editor", "✏️", "Open in editor", "aip-edit"], ["draft", "📝", "Keep as draft", "aip-draft"]]).map(([how, ic, l, cls]) => (
            <button key={how} className={cls} onClick={() => onDone(how, res)} disabled={busy}><span>{ic}</span>{l}{cls === "aip-save" && <i>›</i>}</button>))}
        </div>
      </aside>
    </div>
  );
}

/* ---------- voice conversation, like ChatGPT voice: hands-free, a natural human voice, and an AI that thinks and advises ---------- */
const GREET = {
  en: "Hi! I'm your website consultant. Tell me about your business — what you do and who your customers are — and we'll plan the perfect page together.",
  hi: "नमस्ते! मैं आपका वेबसाइट कंसल्टेंट हूँ। अपने बिज़नेस के बारे में बताइए — आप क्या करते हैं और आपके ग्राहक कौन हैं — फिर हम साथ मिलकर बढ़िया पेज प्लान करेंगे।",
};
const VSYS = (ln) => `You are a warm, smart, experienced website and marketing consultant having a natural VOICE conversation with a small-business owner in India — like a real expert on a phone call, not a form.
How to talk: speak ${ln} (if they mix English words, mix naturally too). Sound human: short natural sentences, contractions, a little warmth ("Got it", "That's a great idea", "Hmm, I'd suggest…"). No lists, no markdown, no emojis, no headings — it is read aloud. Usually 2 to 4 sentences; never more than 6.
How to think: actually THINK about what they said before answering. React to it, give your expert view — what will work for their customers, ideas they haven't thought of (offers, trust proof, the best main button, WhatsApp vs form, pricing display, sections), and gently point out problems. Answer any question they ask fully, then, only if needed, ask ONE useful follow-up question. Don't fire a checklist of questions; let the conversation flow.
Understand over the conversation: the business and what the page is for, audience and city, the offer / price / dates, what visitors should do, and the style. Fill gaps with smart suggestions instead of asking everything.
After your spoken reply, on a NEW line, write NOTES: followed by a one-line summary of everything you know so far (this is shown, not spoken).
Build: when the owner says to build / create / start / "bana do" / ho gaya — or after you have suggested a full plan and they agree — reply with ONE short sentence in ${ln} saying you're building it now, then the word READY: and after it a complete, detailed brief in English for a web designer, starting with "Business name: <name>." (purpose, audience, sections in order, offer, prices, main button / contact, colours and style, language for the page text, and your best ideas from the talk). Never write READY: before that.`;
const THINK = ["Thinking…", "Understanding your business…", "Thinking about ideas…", "Planning the best answer…"];
/* the most natural voice this computer has (Edge "Natural", Google, Apple "Enhanced"…) */
const bestVoice = (lang) => {
  const vs = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [], base = lang.split("-")[0];
  const ok = vs.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(base));
  const score = (v) => (/natural|neural/i.test(v.name) ? 40 : 0) + (/online/i.test(v.name) ? 15 : 0) + (/google/i.test(v.name) ? 20 : 0) + (/enhanced|premium/i.test(v.name) ? 25 : 0) + (v.lang.replace("_", "-") === lang ? 10 : 0) + (/female|aria|jenny|neerja|swara|kore/i.test(v.name) ? 3 : 0);
  return ok.sort((a, b) => score(b) - score(a))[0] || null;
};
/* ask(hist) → the reply text (used by the AI Consultant) · greet = first line · onClose(hist) gets the conversation */
export function VoiceChat({ ai, integ = {}, lang, voiceOn = true, setVoice = () => {}, onBrief, onClose, ask, greet }) {
  const [msgs, setMsgs] = useState([]), [st, setSt] = useState("thinking"), [live, setLive] = useState(""), [err, setErr] = useState(""), [notes, setNotes] = useState(""), [tk, setTk] = useState(0);
  const [vname, setVname0] = useState(() => { try { return localStorage.getItem("lb_ai_vname") || "Kore"; } catch { return "Kore"; } }), [natural, setNatural] = useState(true);
  const setVname = (v) => { setVname0(v); try { localStorage.setItem("lb_ai_vname", v); } catch { /* ignore */ } };
  const mute = !voiceOn;
  const rec = useRef(null), alive = useRef(true), hist = useRef([]), muteRef = useRef(false), endRef = useRef(null), audio = useRef(null), orb = useRef(null), raf = useRef(0), misses = useRef(0), vref = useRef(vname);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, ln = langName(lang);
  muteRef.current = mute; vref.current = vname;
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: "end" }); }, [msgs, live]);
  useEffect(() => { if (st !== "thinking") return; const t = setInterval(() => setTk((k) => k + 1), 1800); return () => clearInterval(t); }, [st]);
  /* made right after your click, so the browser lets it play sound */
  const actx = useRef(null);
  useEffect(() => { if (window.speechSynthesis) window.speechSynthesis.getVoices(); try { const C = window.AudioContext || window.webkitAudioContext; if (C) { actx.current = new C(); actx.current.resume().catch(() => {}); } } catch { /* ignore */ } return () => { try { actx.current && actx.current.close(); } catch { /* ignore */ } }; }, []);
  const push = (who, t) => { hist.current = [...hist.current, { who, t }]; setMsgs(hist.current); };
  /* the orb moves with the voice */
  const pulse = (el) => {
    cancelAnimationFrame(raf.current);
    let an = null; try { const cx = actx.current; if (el && cx && cx.state === "running") { const src = cx.createMediaElementSource(el); an = cx.createAnalyser(); an.fftSize = 256; src.connect(an); an.connect(cx.destination); } } catch { an = null; }
    const d = new Uint8Array(128);
    const tick = () => { let lv = 0.35 + Math.sin(Date.now() / 160) * 0.15; if (an) { an.getByteFrequencyData(d); lv = Math.min(1, d.reduce((a, b) => a + b, 0) / d.length / 90); } if (orb.current) orb.current.style.setProperty("--lv", lv.toFixed(2)); raf.current = requestAnimationFrame(tick); };
    tick();
  };
  const calm = () => { cancelAnimationFrame(raf.current); if (orb.current) orb.current.style.setProperty("--lv", "0"); };
  const stopTalk = () => { try { audio.current && audio.current.pause(); } catch { /* ignore */ } audio.current = null; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* ignore */ } calm(); };
  const say = async (t) => {
    if (muteRef.current || !alive.current || !t) return;
    setSt("speaking");
    /* 1) natural AI voice */
    const url = await aiTts(integ, t, vref.current, "Say this in a warm, natural, friendly conversational voice" + (lang.startsWith("en") ? " with an Indian English accent" : " in " + ln));
    if (!alive.current) return;
    if (url) {
      setNatural(true);
      await new Promise((ok) => { const a = new Audio(url); audio.current = a; a.onended = ok; a.onerror = ok; a.onpause = ok; pulse(a); a.play().catch(ok); });
      calm(); URL.revokeObjectURL(url); return;
    }
    /* 2) the best voice this browser has */
    setNatural(false);
    await new Promise((ok) => {
      const S = window.speechSynthesis; if (!S) return ok();
      S.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lang; u.rate = 1.02; u.pitch = 1;
      const v = bestVoice(lang); if (v) u.voice = v; u.onend = ok; u.onerror = ok; pulse(null); S.speak(u);
      setTimeout(ok, 3000 + t.length * 150);   /* some browsers never fire "end" */
    });
    calm();
  };
  const listen = () => {
    if (!alive.current) return;
    if (!SR) { setErr("Voice needs Chrome or Edge. You can still type below."); setSt("idle"); return; }
    stopTalk();
    const r = new SR(); r.lang = lang; r.interimResults = true; r.continuous = false; rec.current = r; let fin = "";
    r.onresult = (e) => { let it = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t + " "; else it += t; } setLive(fin + it); };
    r.onerror = (e) => { if (e.error === "not-allowed") { setErr("Allow the microphone for this site (lock icon in the address bar)."); misses.current = 9; } };
    r.onend = () => {
      if (rec.current !== r) return; rec.current = null; setLive(""); if (!alive.current) return;
      if (fin.trim()) { misses.current = 0; send(fin.trim()); }
      else if (++misses.current <= 2) setTimeout(listen, 250);   /* hands-free: keep listening a little longer */
      else setSt("idle");
    };
    try { r.start(); setSt("listening"); setErr(""); } catch { setSt("idle"); }
  };
  const halt = () => { const r = rec.current; rec.current = null; setLive(""); try { r && r.abort(); } catch { /* ignore */ } };
  const split = (out) => { const k = out.search(/\n?\s*NOTES:/i); return k >= 0 ? [out.slice(0, k).trim(), out.slice(k).replace(/^\s*NOTES:\s*/i, "").trim()] : [out.trim(), ""]; };
  const send = async (text, first = false) => {
    if (!first) push("me", text);
    setSt("thinking"); setTk(0);
    try {
      if (ask) { const a = String(await ask(hist.current)).replace(/[*#_`]/g, "").replace(/\n{2,}/g, "\n").trim(); if (!alive.current) return; push("ai", a); await say(a); listen(); return; }
      const tr = hist.current.map((x) => (x.who === "ai" ? "Consultant: " : "Owner: ") + x.t).join("\n");
      const out = (await callAI(ai || {}, VSYS(ln), (first ? "(Start the conversation: greet warmly in one or two lines and invite them to tell you about their business.)" : tr) + "\nConsultant:", 2500)).replace(/^\s*Consultant:\s*/i, "").replace(/[*#_`]/g, "").trim();
      if (!alive.current) return;
      const k = out.search(/READY:/i);
      if (k >= 0 && onBrief) { const bye = split(out.slice(0, k))[0], brief = out.slice(k + 6).trim(); if (bye) { push("ai", bye); await say(bye); } if (alive.current) onBrief(brief + (notes ? "\n\nSummary: " + notes : "") + "\n\nConversation:\n" + hist.current.filter((x) => x.who === "me").map((x) => "- " + x.t).join("\n")); return; }
      const [spoken, n] = split(out); if (n) setNotes(n);
      push("ai", spoken); await say(spoken); listen();
    } catch (e) { if (alive.current) { setErr(e.message === "NO_AI_KEY" ? "Connect an AI first." : e.message); setSt("idle"); } }
  };
  useEffect(() => {
    const g = greet || GREET[lang.split("-")[0]];
    if (g) { push("ai", g); say(g).then(listen); } else send("", true);
    return () => { alive.current = false; halt(); stopTalk(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [typed, setTyped] = useState("");
  const LBL = { speaking: "AI is speaking… tap to interrupt", listening: "Listening — just talk", thinking: THINK[tk % THINK.length], idle: "Tap the circle to talk" };
  const tapOrb = () => { if (st === "listening") { rec.current && rec.current.stop(); } else if (st === "speaking") { stopTalk(); misses.current = 0; listen(); } else if (st === "idle") { misses.current = 0; listen(); } };
  const ROBO = <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M16 4v4M16 3.5h.01" /><rect x="5" y="9" width="22" height="17" rx="7" /><path d="M11 16.5c1-1.4 2.6-1.4 3.4 0M17.6 16.5c1-1.4 2.6-1.4 3.4 0M12 21c2.4 1.8 5.6 1.8 8 0" /><path d="M3 15v5M29 15v5" /></svg>;
  const USER = <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4.2" /><path d="M3.5 21c.8-4.6 4.3-7 8.5-7s7.7 2.4 8.5 7z" /></svg>;
  return (
    <div className="vc-ov" onClick={(e) => e.target === e.currentTarget && onClose(hist.current)}>
      <div className="vc-box v87 v93">
        <i className="vc-wave w1" /><i className="vc-wave w2" /><i className="vc-wave w3" />
        <button className="vc-x" onClick={() => onClose(hist.current)} title="End">✕</button>
        <div className="vc-top">
          <div className="vc-bot"><Robot mood={st === "thinking" ? "alert" : "happy"} /></div>
          <div ref={orb} className={"vc-orb " + st} onClick={tapOrb} title={LBL[st]}>
            <i /><i /><span>{st === "listening" ? <Ico d={I_MIC} s={34} /> : st === "thinking" ? <b className="vc-think"><em /><em /><em /></b> : <b className="vc-bars">{[0, 1, 2, 3, 4, 5, 6].map((k) => <em key={k} style={{ "--k": k }} />)}</b>}</span></div>
          <b className="vc-st">{LBL[st]}</b>
          <small className="vc-lang">Talking in {ln} · {voiceOn ? (natural ? "natural AI voice" : "browser voice") : "voice off"}</small>
          <div className="vc-dots">{["speaking", "listening", "thinking"].map((x) => <i key={x} className={st === x ? "on" : ""} />)}</div>
        </div>
        {notes && <div className="vc-notes"><b>✦ What I understood</b><span>{notes}</span></div>}
        <div className="vc-log">{msgs.map((m, k) => <div key={k} className={"vc-m " + m.who}><span className="vc-av">{m.who === "ai" ? ROBO : USER}</span><p>{m.t}</p></div>)}
          {live && <div className="vc-m me live"><span className="vc-av">{USER}</span><p>{live}</p></div>}<i ref={endRef} /></div>
        {err && <div className="aip-err">{err}</div>}
        <form className="vc-type" onSubmit={(e) => { e.preventDefault(); if (typed.trim() && st !== "thinking") { halt(); stopTalk(); send(typed.trim()); setTyped(""); } }}>
          <label><span>✦</span><input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="…or type your answer" /></label>
          <button disabled={!typed.trim() || st === "thinking"}><Ico d={I_SEND} s={18} />Send</button></form>
        <div className="vc-acts">
          <button className={"vc-voice" + (voiceOn ? " on" : "")} onClick={() => { if (voiceOn) stopTalk(); setVoice(!voiceOn); }}><Ico d={voiceOn ? I_SPK : I_MUTE} s={20} />Voice {voiceOn ? "on" : "off"}<i /></button>
          {voiceOn && <select className="vc-vsel" value={vname} onChange={(e) => setVname(e.target.value)} title="AI voice">{TTS_VOICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
          {onBrief && <button className="vc-go" disabled={st === "thinking" || hist.current.filter((x) => x.who === "me").length < 1} onClick={() => { halt(); stopTalk(); send("That's enough — please build it now."); }}><span>✦</span>Build it now <Ico d={I_ARROW} s={18} /></button>}</div>
      </div>
    </div>
  );
}

/* ---------- "Edit with AI" for an existing project or a template: preview + ask for changes ---------- */
export function AiEditor({ integ = {}, item, onClose, onDone, acts, badge }) {
  const [res, setRes] = useState(() => ({ name: item.name, type: item.type || "landing", pages: item.pages, hist: [] }));
  const [listen, setListen] = useState(""), [err, setErr] = useState(""), rec = useRef(null);
  const lang = (() => { try { return localStorage.getItem("lb_ai_lang") || "en-IN"; } catch { return "en-IN"; } })();
  const ai = browserAi(integ);
  useEffect(() => () => { try { rec.current && rec.current.stop(); } catch { /* ignore */ } }, []);
  useEffect(() => { const k = (e) => { if (e.key === "Escape" && !listen) onClose(res); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [listen, res, onClose]);
  const stopMic = () => { try { rec.current && rec.current.stop(); } catch { /* ignore */ } };
  const mic = (where, cur, set) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return setErr("Speaking isn't supported in this browser — use Chrome or Edge.");
    if (listen) return stopMic();
    const r = new SR(); r.lang = lang; r.interimResults = true; r.continuous = true; rec.current = r;
    const base = cur ? cur.replace(/\s*$/, " ") : ""; let fin = "";
    r.onresult = (e) => { let inter = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t + " "; else inter += t; } set(base + fin + inter); };
    r.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") setErr(e.error === "not-allowed" ? "Allow the microphone for this site (lock icon in the address bar)." : "Mic: " + e.error); };
    r.onend = () => setListen("");
    try { r.start(); setListen(where); setErr(""); } catch { setListen(""); }
  };
  return <StudioPreview res={res} setRes={setRes} ai={ai} lang={lang} mic={mic} listen={listen} stopMic={stopMic} err={err} setErr={setErr}
    onBack={() => onClose(res)} backTitle="Close" onDone={onDone} acts={acts} badge={badge} />;
}
