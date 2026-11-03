// LaunchBuilder v3 — parts.jsx
// Shared pieces: Modal, Thumb, Sidebar, NewModal, PublishModal, Preview
import { useState, useEffect, useMemo, useRef } from "react";
import { LIMIT, slugify, TEMPLATES, loadProjects, readToken, addLead, previewUrl, addEvent, findForm } from "../lib.js";
import { finalize, formPageHtml } from "./tools.js";
import { Icon } from "./Inspector.jsx";

/* ==================== Modal, Thumb, Sidebar, NewModal, PublishModal ==================== */
// Shared pieces: Modal, Thumb, Sidebar, NewModal, PublishModal


export function Modal({ children, onClose }) {
  return <div className="ov" onClick={onClose}><div className="md" onClick={(e) => e.stopPropagation()}>{children}</div></div>;
}

// Small live preview of a page (no scripts run inside it)
export function Thumb({ html }) {
  return <div className="thumb"><iframe title="preview" srcDoc={html} sandbox="" tabIndex={-1} /></div>;
}


const NAV = [["pages", "▦", "My pages"], ["templates", "▤", "Templates"], ["forms", "☰", "Forms"], ["leads", "✉", "Leads"], ["analytics", "📈", "Analytics"], ["domains", "◍", "Domains"], ["settings", "⚙", "Settings"]];

export function Sidebar({ view, onView, count, user, onLogout, badges = {} }) {
  return (
    <nav>
      <div className="brand"><span>✎</span>LaunchBuilder</div>
      {NAV.map(([k, ic, nm]) => (
        <div key={k} className={"nv" + (view === k || (k === "pages" && view === "import") ? " on" : "")} onClick={() => onView(k)}><i>{ic}</i>{nm}{badges[k] ? <em className="nvb">{badges[k]}</em> : null}</div>
      ))}
      <div className="grow" />
      <div className="plan"><b>Free plan</b><div className="bar"><div style={{ width: (count / LIMIT) * 100 + "%" }} /></div><span>{count} of {LIMIT} projects used</span></div>
      <div className="user"><div className="av">{user.name[0].toUpperCase()}</div><div><b>{user.name}</b><span>{user.email}</span></div></div>
      <button onClick={onLogout}>Log out</button>
    </nav>
  );
}


export function NewModal({ onCreate, onImport, onClose }) {
  const [type, setType] = useState("landing"), [name, setName] = useState(""), [t, setT] = useState(0);
  const list = TEMPLATES.filter((x) => x.type === type);
  return (
    <Modal onClose={onClose}>
      <h3>Create new</h3>
      <div className="opts">
        <div className={"opt" + (type === "landing" ? " on" : "")} onClick={() => { setType("landing"); setT(0); }}><b>Landing page</b><span>One focused page: offer, signup, webinar, waitlist.</span></div>
        <div className={"opt" + (type === "website" ? " on" : "")} onClick={() => { setType("website"); setT(0); }}><b>Website</b><span>Several pages (Home, About, Contact…) with a shared menu.</span></div>
      </div>
      <label>Name<input autoFocus value={name} placeholder="e.g. Autumn Sale Offer" onChange={(e) => setName(e.target.value)} /></label>
      <label>Start from</label>
      <div className="opts">{list.map((x, i) => <div key={x.name} className={"opt" + (t === i ? " on" : "")} onClick={() => setT(i)}><b>{x.name}</b><span>{x.note}</span></div>)}</div>
      <div className="mrow"><button onClick={onImport}>Import HTML instead</button><div className="grow" /><button onClick={onClose}>Cancel</button>
        <button className="pri" onClick={() => { const n = name.trim() || "Untitled"; onCreate(n, list[t].make(n), type); }}>Create</button></div>
    </Modal>
  );
}


export function PublishModal({ page, onDone, onClose }) {
  const [mode, setMode] = useState(page.domain ? "own" : "sub"), [slug, setSlug] = useState(page.slug), [domain, setDomain] = useState(page.domain || "");
  const url = mode === "own" ? domain || "your-domain.com" : `${slugify(slug)}.launchbuilder.com`;
  return (
    <Modal onClose={onClose}>
      <h3>Publish your {page.type === "website" ? "website" : "page"}</h3>
      <p className="mut">Pick where it lives. You can change this later without losing your edits.</p>
      <div className="opts">
        <div className={"opt" + (mode === "sub" ? " on" : "")} onClick={() => setMode("sub")}><b>Free subdomain</b><code>{slugify(slug)}.launchbuilder.com</code><span>Live instantly. Nothing to configure.</span></div>
        <div className={"opt" + (mode === "own" ? " on" : "")} onClick={() => setMode("own")}><b>Your own domain</b><code>{domain || "offer.yourbusiness.com"}</code><span>Needs one DNS record and a quick check.</span></div>
      </div>
      {mode === "sub" ? <label>Subdomain<input value={slug} onChange={(e) => setSlug(e.target.value)} /></label> : <label>Domain<input value={domain} placeholder="offer.yourbusiness.com" onChange={(e) => setDomain(e.target.value.trim())} /></label>}
      <p className="mut">Each publish saves an immutable version you can roll back to. Versions so far: {page.versions.length}. Pages included: {page.pages.length}.</p>
      <div className="mrow"><div className="grow" /><button onClick={onClose}>Cancel</button>
        <button className="go" onClick={() => onDone({ status: "published", slug: slugify(slug), domain: mode === "own" ? domain : "", versions: [...page.versions, { ts: Date.now(), pages: page.pages }] })}>Publish now</button></div>
      <p className="mut">Will be marked live at <b>{url}</b>. Real hosting needs the backend step; until then use Export in the editor.</p>
    </Modal>
  );
}

/* ==================== Preview page (temporary link) ==================== */
/* ================= Temporary preview link: #/preview/<token>/<page.html> =================
   Renders the live draft, makes links between pages work, and saves form submissions to Leads. */
const W = { desktop: "100%", tablet: "768px", mobile: "390px" };
const notFound = (file, pages) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f7f6ff;color:#16142b;text-align:center;padding:24px}a{color:#4f46e5;font-weight:600}h1{font-size:64px;margin:0;color:#4f46e5}</style></head><body><div><h1>404</h1><p style="font-size:18px">The link points to <b>${file.replace(/</g, "&lt;")}</b>, which isn't a page in this project.</p><p style="color:#5f5b7d">Pages you have: ${pages.map((p) => `<a href="${p.file}">${p.name}</a>`).join(" · ")}</p><p style="color:#5f5b7d;font-size:14px">Fix it in the editor: select the button or menu item → Link → “Go to a page of this site”.</p></div></body></html>`;

export function Preview({ token, file: initFile }) {
  const info = useMemo(() => readToken(token), [token]);
  const [ver, setVer] = useState(0), [file, setFile] = useState(initFile || "index.html"), [hash, setHash] = useState(""), [dev, setDev] = useState("desktop");
  const [html, setHtml] = useState(""), [note, setNote] = useState(""), [pulse, setPulse] = useState(false);
  const ifr = useRef();
  const proj = useMemo(() => (info && !info.expired ? loadProjects(info.email).find((p) => p.id === info.pid) : null), [info, ver]);
  const pg = proj && proj.pages.find((p) => p.file === file);
  const flash = (t) => { setNote(t); setTimeout(() => setNote(""), 3200); };

  /* live: re-render when the editor saves (other tab) */
  useEffect(() => {
    if (!info) return;
    const f = (e) => { if (e.key === "lb_pages_" + info.email) { setVer((v) => v + 1); setPulse(true); setTimeout(() => setPulse(false), 900); } };
    window.addEventListener("storage", f); return () => window.removeEventListener("storage", f);
  }, [info]);
  useEffect(() => {
    if (!proj) return; let gone = false;
    if (!pg) { setHtml(notFound(file, proj.pages)); return; }
    finalize(pg.html, { mode: "blob", preview: true, page: file, hash }).then((r) => !gone && setHtml(r.html));
    return () => { gone = true; };
  }, [proj, pg, file, hash]);
  useEffect(() => { document.title = proj ? `Preview · ${proj.name}` : "Preview"; }, [proj]);
  /* analytics: one page view each time a page is opened */
  const pid = proj && proj.id;
  useEffect(() => { if (info && !info.expired && pid) addEvent(info.email, { t: "view", pid, page: file, dev: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1025 ? "tablet" : "desktop" }); }, [file, pid, info]);

  /* messages from the page: navigation + leads */
  useEffect(() => {
    const f = (e) => {
      if (!ifr.current || e.source !== ifr.current.contentWindow || !e.data || !e.data.lb) return;
      if (e.data.lb === "nav") {
        const [f0, h0 = ""] = String(e.data.href).split("#"), target = decodeURIComponent((f0 || file).split("?")[0].split("/").pop() || "index.html");
        if (e.data.blank) return window.open(previewUrl(token, target) + (h0 ? "" : ""), "_blank");
        setHash(h0); setFile(target); window.history.pushState(null, "", `#/preview/${token}/${target}`);
      }
      if (e.data.lb === "lead" && proj) { addLead(info.email, { ...e.data.lead, projectId: proj.id, projectName: proj.name, source: "preview" }); addEvent(info.email, { t: "lead", pid: proj.id, page: file, form: e.data.lead.form }); flash("✓ Submission saved to Leads"); }
    };
    window.addEventListener("message", f); return () => window.removeEventListener("message", f);
  }, [file, proj, info, token]);
  useEffect(() => {
    const f = () => { const m = location.hash.match(/^#\/preview\/[^/]+\/?(.*)$/); if (m) { setHash(""); setFile(decodeURIComponent(m[1]) || "index.html"); } };
    window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f);
  }, []);

  if (!info || info.expired || !proj) return (
    <div className="pv-dead"><div><Icon n="link" s={34} w={1.4} /><h2>{!info ? "This preview link doesn't exist" : info.expired ? "This preview link has expired" : "This project was deleted"}</h2>
      <p>Open the project in the editor and click <b>Preview</b> to get a fresh link. Preview links work in the browser where you're signed in to LaunchBuilder.</p>
      <a href={location.pathname}>Go to dashboard</a></div></div>
  );
  const hrs = Math.max(0, Math.round((info.exp - Date.now()) / 3600e3));
  const copy = async () => { const u = previewUrl(token, file); try { await navigator.clipboard.writeText(u); flash("Link copied"); } catch { window.prompt("Copy this link", u); } };

  return (
    <div className="pv">
      <div className="pv-bar">
        <div className="pv-l"><span className="pv-logo"><Icon n="logo" s={16} /></span><b>{proj.name}</b>
          <select value={file} onChange={(e) => { setHash(""); setFile(e.target.value); window.history.pushState(null, "", `#/preview/${token}/${e.target.value}`); }}>
            {proj.pages.map((p) => <option key={p.id} value={p.file}>{p.name} — {p.file}</option>)}{!pg && <option value={file}>{file} (missing)</option>}</select>
          <span className={"pv-live" + (pulse ? " pulse" : "")}><i />Live draft</span></div>
        <div className="pv-dev">{Object.keys(W).map((k) => <button key={k} className={dev === k ? "on" : ""} onClick={() => setDev(k)} title={k}><Icon n={k} s={16} /></button>)}</div>
        <div className="pv-r"><span className="pv-exp" title="Preview links are temporary">Link expires in {hrs} h</span><button onClick={copy}><Icon n="link" s={14} /> Copy link</button><button onClick={() => setVer((v) => v + 1)} title="Reload"><Icon n="redo" s={14} /></button></div>
      </div>
      <div className={"pv-stage " + dev}>
        <iframe ref={ifr} title="preview" srcDoc={html} style={{ width: W[dev] }} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write; accelerometer; gyroscope; geolocation" />
      </div>
      {note && <div className="toast pv-toast">{note}</div>}
    </div>
  );
}


/* ==================== Form share link: #/form/<id> ==================== */
export function FormPage({ id }) {
  const found = useMemo(() => findForm(id), [id]);
  const [html, setHtml] = useState(""), [done, setDone] = useState(false), ifr = useRef();
  useEffect(() => { if (found) { finalize(formPageHtml(found.form), { mode: "blob", preview: true, page: "form" }).then((r) => setHtml(r.html)); document.title = found.form.name; addEvent(found.email, { t: "fview", formId: id, page: "form link" }); } }, [found, id]);
  useEffect(() => {
    const f = (e) => {
      if (!found || !ifr.current || e.source !== ifr.current.contentWindow || !e.data) return;
      if (e.data.lb === "lead") { addLead(found.email, { ...e.data.lead, formId: id, projectId: "", projectName: "Form link", page: "share link", source: "form-link" }); addEvent(found.email, { t: "lead", formId: id, form: found.form.name }); setDone(true); }
      if (e.data.lb === "nav" && /^https?:/.test(e.data.href)) location.href = e.data.href;
    };
    window.addEventListener("message", f); return () => window.removeEventListener("message", f);
  }, [found, id]);
  if (!found) return <div className="pv-dead"><div><h2>This form isn't available</h2><p>The link may be wrong, or the form was deleted. Form links work in the browser where the form was created until a backend is added.</p></div></div>;
  return <div className="fpage"><iframe ref={ifr} title={found.form.name} srcDoc={html} sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />{done && <div className="toast pv-toast">✓ Submission saved to Leads</div>}</div>;
}
