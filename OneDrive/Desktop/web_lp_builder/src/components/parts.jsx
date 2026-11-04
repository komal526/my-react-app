// LaunchBuilder v8 — parts.jsx
// Shared pieces: Modal, Thumb, Sidebar, NewModal, PublishModal, Preview
import { useState, useEffect, useMemo, useRef } from "react";
import { LIMIT, slugify, TEMPLATES, loadProjects, readToken, addLead, previewUrl, addEvent, findForm, payLead, loadInteg, aiWebsite, AI_PROVIDERS, pg, ago, serverCall, publishReady, blobToBase64 } from "../lib.js";
import { finalize, formPageHtml, buildSite, makeZip } from "./tools.js";
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


const NAV = [["pages", "grid", "My pages"], ["templates", "card", "Templates"], ["forms", "form", "Forms"], ["leads", "inbox", "Leads"], ["analytics", "chart", "Analytics"], ["domains", "globe", "Domains"], ["integrations", "share", "Integrations"], ["settings", "gear", "Settings"]];

export function Sidebar({ view, onView, count, user, onLogout, badges = {} }) {
  return (
    <nav>
      <div className="brand"><span><Icon n="logo" s={18} w={2.2} /></span><div>LaunchBuilder<small>Studio</small></div></div>
      <div className="nv-h">Workspace</div>
      {NAV.map(([k, ic, nm]) => (
        <div key={k} className={"nv" + (view === k || (k === "pages" && view === "import") ? " on" : "")} onClick={() => onView(k)}><i><Icon n={ic} s={17} /></i>{nm}{badges[k] ? <em className="nvb">{badges[k]}</em> : null}</div>
      ))}
      <div className="grow" />
      <div className="plan"><b>Free plan</b><div className="bar"><div style={{ width: (count / LIMIT) * 100 + "%" }} /></div><span>{count} of {LIMIT} projects used</span></div>
      <div className="user"><div className="av">{user.name[0].toUpperCase()}</div><div><b>{user.name}</b><span>{user.email}</span></div></div>
      <button onClick={onLogout}>Log out</button>
    </nav>
  );
}


const AI_IDEAS = ["AI ad-creation workshop for beginners, ₹21 registration, Hindi + English audience, dark modern style", "Dental clinic in Hamirpur: services, doctors, timings, book appointment form, Google map", "Digital marketing agency: services, case studies, pricing plans, contact form", "Online yoga classes: batches, trainer bio, testimonials, WhatsApp signup"];
export function NewModal({ onCreate, onImport, onClose, ai, onSetupAI }) {
  const [type, setType] = useState("landing"), [name, setName] = useState(""), [t, setT] = useState(0), [src, setSrc] = useState("tpl");
  const [brief, setBrief] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const list = TEMPLATES.filter((x) => x.type === type);
  const prov = AI_PROVIDERS.find((p) => p.id === (ai && ai.provider)) || AI_PROVIDERS[0], hasKey = ai && ai.keys && ai.keys[prov.id];
  const gen = async () => {
    if (brief.trim().length < 15) return setErr("Describe your business in a sentence or two (what, who for, what you want visitors to do).");
    setErr(""); setBusy(true);
    try {
      const n = name.trim() || brief.trim().split(/[,.:]/)[0].slice(0, 40) || "AI website";
      const pages = await aiWebsite(ai, `Business / page name: ${n}\nBrief: ${brief.trim()}`, type === "website");
      onCreate(n, pages.map((p) => pg(p.name, p.file, p.html)), type);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <Modal onClose={busy ? () => {} : onClose}>
      <h3>Create new</h3>
      <div className="opts">
        <div className={"opt" + (type === "landing" ? " on" : "")} onClick={() => { setType("landing"); setT(0); }}><b>Landing page</b><span>One focused page: offer, signup, webinar, waitlist.</span></div>
        <div className={"opt" + (type === "website" ? " on" : "")} onClick={() => { setType("website"); setT(0); }}><b>Website</b><span>Several pages (Home, About, Contact…) with a shared menu.</span></div>
      </div>
      <label>Name<input autoFocus value={name} placeholder="e.g. Autumn Sale Offer" onChange={(e) => setName(e.target.value)} /></label>
      <div className="chips nm-src"><button className={src === "tpl" ? "on" : ""} onClick={() => setSrc("tpl")}>Start from a template</button><button className={src === "ai" ? "on" : ""} onClick={() => setSrc("ai")}>✨ Create with AI</button></div>
      {src === "tpl" ? <div className="opts">{list.map((x, i) => <div key={x.name} className={"opt" + (t === i ? " on" : "")} onClick={() => setT(i)}><b>{x.name}</b><span>{x.note}</span></div>)}</div> : <div className="nm-ai">
        {!hasKey ? <div className="nm-warn">Connect an AI first (Claude, ChatGPT, Gemini or DeepSeek) with your own API key. <button className="pri" onClick={onSetupAI}>Open Integrations</button></div> : <>
          <label>Describe the {type === "website" ? "website" : "page"}<textarea rows={4} value={brief} disabled={busy} onChange={(e) => setBrief(e.target.value)} placeholder="What is it, who is it for, what should visitors do (register, call, buy)? Mention price, city, language, colours, sections you want…" /></label>
          <div className="nm-ideas">{AI_IDEAS.map((x) => <button key={x} disabled={busy} onClick={() => setBrief(x)}>{x.slice(0, 48)}…</button>)}</div>
          <p className="mut">Using <b>{prov.name}</b> · {(ai.models || {})[prov.id] || prov.model}. {type === "website" ? "Creates 3–5 linked pages." : "Creates one landing page."} Takes about 20–90 seconds. You can edit everything afterwards.</p>
        </>}
        {err && <p className="red">{err}</p>}
      </div>}
      <div className="mrow"><button onClick={onImport} disabled={busy}>Import HTML instead</button><div className="grow" /><button onClick={onClose} disabled={busy}>Cancel</button>
        {src === "tpl" ? <button className="pri" onClick={() => { const n = name.trim() || "Untitled"; onCreate(n, list[t].make(n), type); }}>Create</button>
          : <button className="pri" disabled={busy || !hasKey} onClick={gen}>{busy ? "✨ Generating… please wait" : "✨ Generate"}</button>}</div>
    </Modal>
  );
}


export function PublishModal({ page, onDone, onClose, integ, onSetup, onDomains }) {
  const ready = !!integ && publishReady(integ), live = page.netlify && page.netlify.url;
  const [busy, setBusy] = useState(""), [err, setErr] = useState(""), [copied, setCopied] = useState(false);
  const [target, setTarget] = useState("new"), [sites, setSites] = useState(null), [siteId, setSiteId] = useState("");
  const loadSites = async () => { setSites("loading"); try { const r = await serverCall(integ, { event: "sites" }); setSites(r.sites || []); } catch (e) { setSites([]); setErr(e.message); } };
  const own = page.domain && page.domainStatus === "connected" ? "https://" + page.domain : "";
  const url = own || live;
  const publish = async () => {
    setErr("");
    try {
      setBusy("Building your pages…");
      const zip = makeZip(await buildSite(page.pages, url || ""));
      if (zip.size > 35e6) throw new Error("Your site is bigger than 35 MB. Use smaller videos or YouTube links, then try again.");
      setBusy("Uploading to the internet…");
      const r = await serverCall(integ, { event: "publish", siteId: (page.netlify && page.netlify.siteId) || (target === "existing" ? siteId : undefined), zip: await blobToBase64(zip) });
      onDone({ status: "published", netlify: { siteId: r.siteId, name: r.name, url: r.url, admin: r.admin, ts: Date.now() }, versions: [...(page.versions || []), { ts: Date.now(), pages: page.pages }].slice(-5) }, true);
    } catch (e) { setErr(e.message); }
    setBusy("");
  };
  const copy = () => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }, () => window.prompt("Copy:", url));
  return (
    <Modal onClose={busy ? () => {} : onClose}>
      <div className="pub-h"><span className="pub-ic">🚀</span><div><h3>Publish {page.type === "website" ? "website" : "page"}</h3><p className="mut">{page.name} · {page.pages.length} page{page.pages.length > 1 ? "s" : ""}</p></div></div>
      {!ready ? <div className="pub-setup">
        <b>Put your site on the internet — free</b>
        <p className="mut">Publishing uses a free Netlify account and the same free Google Apps Script that sends your Gmail emails. One-time setup, about 5 minutes. After that it's one click.</p>
        <button className="pri" onClick={onSetup}>Set up free publishing →</button>
      </div> : busy ? <div className="pub-busy"><span className="pub-spin" /><b>{busy}</b><p className="mut">Please keep this window open (usually 10–40 seconds).</p></div>
        : url ? <div className="pub-live">
          <span className="badge published">● Live</span>
          <a className="pub-url" href={url} target="_blank" rel="noopener">{url.replace(/^https?:\/\//, "")} ↗</a>
          <p className="mut">Anyone with this link can see your site. Last published {ago(page.netlify.ts)}.</p>
          <div className="mrow" style={{ marginTop: 6 }}><button onClick={copy}>{copied ? "✓ Copied" : "Copy link"}</button><a className="btn" href={url} target="_blank" rel="noopener">Open site</a><div className="grow" /><button className="pri" onClick={publish}>Update live site</button></div>
          <div className="pub-dom"><div><b>{own ? "✓ Custom domain connected" : "Use your own domain"}</b><span className="mut">{own ? page.domain : "e.g. mybrand.com — connect with DNS records or nameservers"}</span></div><button onClick={onDomains}>{own ? "Manage" : "Connect domain →"}</button></div>
        </div> : <div className="pub-first">
          <p>Your {page.type === "website" ? "website" : "page"} will go live at a free public link like <code>brave-otter-12ab.netlify.app</code> with free HTTPS. You can connect your own domain right after.</p>
          <div className="pub-tg">
            <button className={target === "new" ? "on" : ""} onClick={() => setTarget("new")}><b>✨ New Netlify site</b><span>Get a fresh free link</span></button>
            <button className={target === "existing" ? "on" : ""} onClick={() => { setTarget("existing"); if (!sites) loadSites(); }}><b>▲ My existing site</b><span>Replace a site you already have on Netlify</span></button>
          </div>
          {target === "existing" && (sites === "loading" ? <p className="mut">Loading your Netlify sites…</p> : Array.isArray(sites) && (sites.length ? <select value={siteId} onChange={(e) => setSiteId(e.target.value)}><option value="">Choose a site…</option>{sites.map((x) => <option key={x.id} value={x.id}>{x.name} — {(x.domain || x.url || "").replace(/^https?:\/\//, "")}</option>)}</select> : <p className="mut">No sites found on your Netlify account.</p>))}
          {target === "existing" && siteId && <p className="red sm" style={{ margin: 0 }}>⚠️ This replaces everything currently on that site.</p>}
          <button className="pri big" disabled={target === "existing" && !siteId} onClick={publish}>🚀 Publish now</button>
        </div>}
      {err && <div className="pub-err"><b>Couldn't publish.</b> {err}</div>}
      {!busy && <div className="mrow"><div className="grow" /><button onClick={onClose}>Close</button></div>}
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
      if (e.data.lb === "lead-pay" && info) { payLead(info.email, e.data.lid, e.data.payment); flash(e.data.payment.status === "paid" ? "✓ Payment received — lead marked Paid" : "✓ Payment claim saved to Leads"); }
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
        <iframe ref={ifr} title="preview" srcDoc={html} style={{ width: W[dev] }} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" allow="payment; autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write; accelerometer; gyroscope; geolocation" />
      </div>
      {note && <div className="toast pv-toast">{note}</div>}
    </div>
  );
}


/* ==================== Form share link: #/form/<id> ==================== */
export function FormPage({ id }) {
  const found = useMemo(() => findForm(id), [id]);
  const [html, setHtml] = useState(""), [done, setDone] = useState(false), ifr = useRef();
  useEffect(() => { if (found) { finalize(formPageHtml(found.form, loadInteg(found.email)), { mode: "blob", preview: true, page: "form" }).then((r) => setHtml(r.html)); document.title = found.form.name; addEvent(found.email, { t: "fview", formId: id, page: "form link" }); } }, [found, id]);
  useEffect(() => {
    const f = (e) => {
      if (!found || !ifr.current || e.source !== ifr.current.contentWindow || !e.data) return;
      if (e.data.lb === "lead") { addLead(found.email, { ...e.data.lead, formId: id, projectId: "", projectName: "Form link", page: "share link", source: "form-link" }); addEvent(found.email, { t: "lead", formId: id, form: found.form.name }); setDone(true); }
      if (e.data.lb === "lead-pay") payLead(found.email, e.data.lid, e.data.payment);
      if (e.data.lb === "nav" && /^https?:/.test(e.data.href)) location.href = e.data.href;
    };
    window.addEventListener("message", f); return () => window.removeEventListener("message", f);
  }, [found, id]);
  if (!found) return <div className="pv-dead"><div><h2>This form isn't available</h2><p>The link may be wrong, or the form was deleted. Form links work in the browser where the form was created until a backend is added.</p></div></div>;
  return <div className="fpage"><iframe ref={ifr} title={found.form.name} srcDoc={html} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" allow="payment" />{done && <div className="toast pv-toast">✓ Submission saved to Leads</div>}</div>;
}
