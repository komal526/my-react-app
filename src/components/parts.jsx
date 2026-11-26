// LaunchBuilder v45 — parts.jsx
// Shared pieces: Modal, Thumb, Sidebar, NewModal, PublishModal, Preview
import { useState, useEffect, useMemo, useRef } from "react";
import { appPath } from "../route.js";
import { serverAiReady, LIMIT, projLimit, limitText, slugify, TEMPLATES, loadProjects, readToken, addLead, previewUrl, addEvent, findForm, payLead, loadInteg, aiWebsite, AI_PROVIDERS, pg, ago, serverCall, publishReady, blobToBase64, serverOn, phpCall, filesForServer, defaultServerUrl, lovableUrl, boltText, autoServer, findEvent, serverUrlFrom, SERVER_HELP, subUrl, pixelsFor, asTemplate, formFetch } from "../lib.js";
import { finalize, formPageHtml, buildSite, makeZip, bookingPageHtml } from "./tools.js";
import { cloudOn, lastStatus } from "../cloud.js";
import { Icon } from "./icons.jsx";
import { RailView, RI } from "./Rail.jsx";
import { BRAND } from "../brand.js";
/* small "saved to cloud" indicator in the sidebar */
function CloudStatus() {
  const [st, setSt] = useState(lastStatus.s), [why, setWhy] = useState(lastStatus.why);
  useEffect(() => { const f = (e) => { setSt(e.detail); setWhy(lastStatus.why || ""); }; window.addEventListener("lb-cloud", f); return () => window.removeEventListener("lb-cloud", f); }, []);
  if (!cloudOn()) return null;
  const M = { saved: ["☁", "Saved to cloud"], saving: ["⟳", "Saving…"], loading: ["⟳", "Loading…"], offline: ["⚠", "Not saved to cloud"] }[st] || ["☁", "Saved to cloud"];
  return <div className={"cloud-st " + st}><div><span>{M[0]}</span> {M[1]}</div>{st === "offline" && why && <small>{why}</small>}</div>;
}

/* ==================== Modal, Thumb, Sidebar, NewModal, PublishModal ==================== */
// Shared pieces: Modal, Thumb, Sidebar, NewModal, PublishModal


export function Modal({ children, onClose }) {
  return <div className="ov" onClick={onClose}><div className="md" onClick={(e) => e.stopPropagation()}>{children}</div></div>;
}

// Small live preview of a page (no scripts run inside it)
/* images further down a preview only load if they come into view */
/* ---------- fast project previews ----------
   · scripts, web fonts and animations are removed (not needed at thumbnail size)
   · at most 2 previews load at the same time, top ones first
   · a template picture (or a light skeleton) shows instantly while the real page draws */
const TH_CACHE = new Map();
const THUMB_CSS = "<style>*,*::before,*::after{animation-duration:.001s!important;animation-delay:0s!important;animation-iteration-count:1!important;animation-fill-mode:both!important;transition:none!important;scroll-behavior:auto!important}[class*=reveal],[class*=fade],[class*=animate],[class*=stagger]>*,[data-aos],[data-anim],[data-r],.in-view,.hidden-up,.hero-in,.hero h1 .w,.letter,[class*=hero-title],[class*=hero-sub],[class*=hero-eyebrow],[class*=hero-button],[class*=hero-cta],[class*=hero-search],.search,.bento-card,.timeline-item{opacity:1!important;transform:none!important;visibility:visible!important;clip-path:none!important}html,body{overflow:hidden!important}</style>";
/* a preview only needs the top of the page: keep the first ~2 screens, drop scripts, videos, embeds and most images */
const trimBody = (h) => {
  try {
    const d = new DOMParser().parseFromString(h, "text/html"), body = d.body; if (!body) return h;
    let root = body; while (root.children.length === 1 && root.firstElementChild.children.length > 1 && !/^(SECTION|HEADER)$/.test(root.firstElementChild.tagName)) root = root.firstElementChild;
    /* loading screens, progress bars and cursor effects are hidden by the page's own script — remove them */
    d.querySelectorAll("[id*=loader i],[class*=loader i],[id*=preload i],[class*=preload i],[class*=splash i],#progress,.progress,.cursor-glow,[class*=cursor] ").forEach((n) => n.remove());
    /* keep the first 4 real content blocks (decorations like canvases don't count) */
    const deco = (k) => !/^(SECTION|MAIN|HEADER|NAV|DIV|ARTICLE|FOOTER|ASIDE|FORM)$/i.test(k.tagName) || k.getAttribute("aria-hidden") === "true" || /mobile|modal|toast|to-?top|back-?to|scrim|overlay/i.test((k.getAttribute("class") || "") + " " + k.id);
    const keep = (list, max) => { let n = 0; list.forEach((k) => { if (deco(k)) return; if (++n > max) k.remove(); }); };
    const main = [...root.children].find((k) => k.tagName === "MAIN");
    if (main) { let past = false; [...root.children].forEach((k) => { if (k === main) { past = true; return; } if (past && !deco(k)) k.remove(); }); keep([...main.children], 3); }
    else keep([...root.children], 5);
    d.querySelectorAll("script,noscript,iframe,video,audio,object,embed").forEach((n) => { if (/^(IFRAME|VIDEO)$/.test(n.tagName)) { const g = d.createElement("div"); g.style.cssText = "background:#1f2340;width:100%;aspect-ratio:16/9;border-radius:12px"; n.replaceWith(g); } else n.remove(); });
    d.querySelectorAll("img").forEach((im, i) => { if (i > 5) { im.removeAttribute("srcset"); im.src = "data:image/gif;base64,R0lGODlhAQABAAAAACw="; im.style.background = "#d9dce8"; } else { im.loading = "eager"; im.decoding = "async"; } });
    d.querySelectorAll('link[rel="stylesheet"]').forEach((l) => { if (/fonts\.googleapis|fontawesome|font-awesome|unpkg|aos/i.test(l.href)) l.remove(); });
    d.querySelectorAll("link[rel=preconnect],link[rel=preload],link[rel=dns-prefetch]").forEach((l) => l.remove());
    return "<!doctype html>" + d.documentElement.outerHTML;
  } catch { return h; }
};
export const thumbHtml = (h) => {
  h = String(h || ""); const k = h.length + ":" + h.slice(0, 80) + h.slice(-80);
  if (TH_CACHE.has(k)) return TH_CACHE.get(k);
  const out = trimBody(h).replace(/@import\s+url\([^)]*fonts\.googleapis[^)]*\);?/gi, "").replace(/<\/head>/i, THUMB_CSS + "</head>");
  if (TH_CACHE.size > 60) TH_CACHE.delete(TH_CACHE.keys().next().value);
  TH_CACHE.set(k, out); return out;
};
const TQ = { busy: 0, wait: [] };
const tqNext = () => { while (TQ.busy < 3 && TQ.wait.length) { TQ.wait.sort((a, b) => a.y() - b.y()); const j = TQ.wait.shift(); TQ.busy++; j.go(); } };
const tqDone = () => { TQ.busy = Math.max(0, TQ.busy - 1); tqNext(); };
export function Thumb({ html, img }) {
  const ref = useRef(null), [on, setOn] = useState(false), done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el || on) return;
    let job = null;
    const start = () => { job = { y: () => (ref.current ? ref.current.getBoundingClientRect().top : 1e9), go: () => setOn(true) }; TQ.wait.push(job); tqNext(); };
    if (!("IntersectionObserver" in window)) { start(); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => { io.disconnect(); if (job) { const i = TQ.wait.indexOf(job); if (i >= 0) TQ.wait.splice(i, 1); } };
  }, [on]);
  useEffect(() => () => { if (on && !done.current) tqDone(); }, [on]);
  const fr = useRef(null);
  const loaded = () => { if (fr.current) fr.current.classList.add("on"); if (!done.current) { done.current = true; tqDone(); } };
  /* the preview is drawn long before every photo arrives — show it after a moment instead of waiting for "load" */
  useEffect(() => { if (!on) return; const t = setTimeout(loaded, 350); return () => clearTimeout(t); }, [on]); // eslint-disable-line react-hooks/exhaustive-deps
  const src = useMemo(() => (on ? thumbHtml(html) : ""), [on, html]);
  return <div className="thumb" ref={ref}>{img ? <img className="thumb-img" src={img} alt="" decoding="async" /> : <div className="thumb-ph" />}{on && <iframe ref={fr} title="preview" srcDoc={src} sandbox="" tabIndex={-1} loading="eager" onLoad={loaded} />}</div>;
}


const NAV = [["pages", "grid", "Dashboard"], ["templates", "card", "Templates"], ["forms", "form", "Forms"], ["calendar", "calendar", "Calendar"], ["leads", "inbox", "Leads"], ["analytics", "chart", "Analytics"], ["domains", "globe", "Domains"], ["integrations", "share", "Integrations"], ["settings", "gear", "Settings"]];

/* grouped menu · collapses to an icon-only rail */
const SHORT = { build: "Build", collect: "Collect", grow: "Grow", reports: "Reports" };
const MINI = { followups: "Follow-ups", projects: "Projects", templates: "Templates", landings: "Landing", lms: "Courses", leads: "Leads", forms: "Forms", calendar: "Calendar", domains: "Domains", integrations: "Apps", analytics: "Analytics", pixels: "Pixels", settings: "Settings" };
const GROUPS = [
  ["build", "layers", "Build & Manage", [["projects", "globe", "Projects"], ["templates", "card", "Templates"]]],
  ["collect", "form", "Create & Collect", [["leads", "users", "Leads"], ["finder", "search", "Lead Finder"], ["followups", "clock", "Follow-ups"], ["forms", "form", "Forms"], ["calendar", "calendar", "Calendar"]]],
  ["academy", "star", "Academy", [["lms", "pages", "Courses"]]],
  ["grow", "share", "Connect & Grow", [["domains", "share", "Domains"], ["integrations", "apps", "Integrations"]]],
  ["reports", "gear", "Reports & Settings", [["analytics", "chart", "Analytics"], ["pixels", "eye", "Tracking Pixels"], ["settings", "gear", "Settings"]]],
];
export function Sidebar({ view, onView, count, user, onLogout, badges = {}, open = false, onClose = () => {}, mini = false, onMini = () => {}, role = "" }) {
  /* the collapsed menu stays short: the main pages only */
  const HIDE_MINI = ["followups", "analytics", "pixels", "lms"];
  /* admin (you) and white-label owners get an "Admin panel" link — it opens the panel at the bottom of Domains */
  const groups = GROUPS;   /* Admin panel: only on the Domains page (and at /admin) — not in the menu */
  const [shut, setShut] = useState(() => { try { return JSON.parse(localStorage.getItem("lb_nav_shut") || "[]"); } catch { return []; } }), [fly, setFly] = useState("");
  const toggle = (g) => { const n = shut.includes(g) ? shut.filter((x) => x !== g) : [...shut, g]; setShut(n); localStorage.setItem("lb_nav_shut", JSON.stringify(n)); };
  const go = (k) => { onView(k); onClose(); };
  const isOn = (k) => view === k || (k === "pages" && view === "import");
  const Item = ({ k, ic, nm, sub }) => (
    <div className={"sb3-item" + (sub && !mini ? " sub" : "") + (isOn(k) ? " on" : "")} onClick={() => go(k)} title={mini ? nm : undefined}>
      {sub && !mini ? <i className="sb3-node" /> : <Icon n={ic} s={17} />}<span className="sb3-l">{nm}</span>{k === "lms" ? <em className="sb3-beta">Beta</em> : badges[k] ? <em className="sb3-b">{badges[k]}</em> : null}
    </div>);
  return (
    <nav className={"sb3" + (open ? " open" : "") + (mini ? " mini" : "")}>
      <button className="nv-x" onClick={onClose} aria-label="Close menu">✕</button>
      <div className="sb3-top">
        <span className={"sb3-logo" + (BRAND.logo ? " img" : "")}>{BRAND.logo ? <img src={BRAND.logo} alt="" /> : <Icon n="logo" s={17} w={2.2} />}</span>
        <div className="sb3-name"><b>{BRAND.product}</b><small>Studio</small></div>
        <button className="sb3-mini" onClick={onMini} title={mini ? "Expand menu" : "Collapse menu"} aria-label="Toggle menu"><Icon n={mini ? "chev" : "back"} s={15} /></button>
      </div>
      {mini ? <div className="sb3-scroll sb3-rail">
        {/* collapsed: every page as an icon with a small name */}
        <div className={"sb3-m" + (isOn("pages") ? " on" : "")} onClick={() => go("pages")} title="Dashboard"><Icon n="grid" s={24} /><small>Home</small></div>
        {groups.flatMap(([, , , items]) => items).filter(([k]) => !HIDE_MINI.includes(k)).map(([k, ic, nm]) => (
          <div key={k} className={"sb3-m" + (isOn(k) ? " on" : "")} onClick={() => go(k)} title={nm}><Icon n={ic} s={24} /><small>{MINI[k] || nm}</small>{badges[k] ? <i className="sb3-dotb" /> : null}</div>))}
      </div> : <div className="sb3-scroll">
        <Item k="pages" ic="grid" nm="Dashboard" />
        {groups.map(([g, gic, label, items]) => {
          const closed = false; // groups always stay open
          return <div key={g} className={"sb3-grp" + (closed ? " shut" : "")}>
            {!mini ? <div className="sb3-gh"><Icon n={gic} s={16} /><span>{label}</span></div> : <div className="sb3-sep" />}
            {!closed && <div className={mini ? "" : "sb3-tree"}>{items.map(([k, ic, nm]) => <Item key={k} k={k} ic={ic} nm={nm} sub />)}</div>}
          </div>;
        })}
      </div>}
      <button className="sb3-up" onClick={() => go("settings")} title={mini ? `Upgrade to Pro · ${count}/${limitText(projLimit())} projects` : undefined}>
        <span className="sb3-crown">👑</span><span className="sb3-l"><b>Upgrade to Pro</b><small>{count}/{limitText(projLimit())} projects used</small></span></button>
      <CloudStatus />
      <div className="sb3-user" title={mini ? user.email : undefined}><span className="av">{(user.name || "U")[0].toUpperCase()}</span>
        <span className="sb3-l"><b>{user.name}</b><small>{user.email}</small></span>
        <button title="Log out" onClick={onLogout}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg><small className="sb3-lo">Logout</small></button></div>
    </nav>
  );
}

const AI_IDEAS = ["AI ad-creation workshop for beginners, ₹21 registration, Hindi + English audience, dark modern style", "Dental clinic in Hamirpur: services, doctors, timings, book appointment form, Google map", "Digital marketing agency: services, case studies, pricing plans, contact form", "Online yoga classes: batches, trainer bio, testimonials, WhatsApp signup"];
export function NewModal({ onCreate, onImport, onClose, ai, onSetupAI, kind = "landing", mine = [], onStudio = () => {} }) {
  const [type, setType] = useState(kind), [name, setName] = useState(""), [src, setSrc] = useState("scratch");
  const [brief, setBrief] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const blank = TEMPLATES.find((x) => x.type === type && /^blank/.test(x.key || "")) || TEMPLATES.find((x) => x.type === type);
  const list = [...TEMPLATES.filter((x) => x.type === type && x.hidden).sort((a, b) => (/^blank/.test(b.key) ? 1 : 0) - (/^blank/.test(a.key) ? 1 : 0)), ...mine.map(asTemplate).filter((x) => x.type === type), ...TEMPLATES.filter((x) => x.type === type && !x.hidden)];
  const prov = AI_PROVIDERS.find((p) => p.id === (ai && ai.provider)) || AI_PROVIDERS[0], hasKey0 = ai && ai.keys && ai.keys[prov.id], [srvAi, setSrvAi] = useState(false), hasKey = hasKey0 || srvAi;
  useEffect(() => { if (!hasKey0) serverAiReady().then(setSrvAi); }, [hasKey0]);
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
        <div className={"opt" + (type === "landing" ? " on" : "")} onClick={() => setType("landing")}><b>Landing page</b><span>One focused page: offer, signup, webinar, waitlist.</span></div>
        <div className={"opt" + (type === "website" ? " on" : "")} onClick={() => setType("website")}><b>Website</b><span>Several pages (Home, About, Contact…) with a shared menu.</span></div>
      </div>
      <label>Name<input autoFocus value={name} placeholder="e.g. Autumn Sale Offer" onChange={(e) => setName(e.target.value)} /></label>
      <span className="nm-lbl">How do you want to start?</span>
      <div className="nm-ways">
        {[["scratch", "✏️", "Start from scratch", type === "website" ? "A blank website — add pages and sections yourself" : "A blank page — drag in sections and elements"], ["import", "📥", "Import HTML", "Bring in a page you already have (.html file or code)"], ["ai", "✨", "Create with AI", "Describe it in a sentence — AI builds the first draft"]].map(([k, ic, t, d]) => (
          <button key={k} className={"nm-way" + (src === k ? " on" : "")} onClick={() => (k === "import" ? onImport() : setSrc(k))}><span className="nm-wic">{ic}</span><b>{t}</b><small>{d}</small></button>))}
      </div>
      {src === "scratch" ? <p className="mut sm nm-tip">Want a ready design instead? Pick one in <b>Templates</b>.</p>
        : <div className="nm-ai nm-ai2"><b>✨ AI Studio opens in a full window</b><span className="mut sm">Describe your {type === "website" ? "website" : "page"} by typing or speaking, add pictures (logo, products) and documents (PDF, Word) about your business — AI builds the first draft.</span></div>}
      <div className="mrow"><div className="grow" /><button onClick={onClose}>Cancel</button>
        {src === "scratch" ? <button className="pri" onClick={() => { const n = name.trim() || "Untitled"; onCreate(n, blank.make(n), type); }}>Create {type === "website" ? "website" : "page"}</button>
          : <button className="pri" onClick={() => onStudio({ type, name: name.trim() })}>✨ Open AI Studio →</button>}</div>
    </Modal>
  );
}


/* one click "Update": put the latest edits on the live site (same steps as Publish → Update live site) */
export async function republishLive(page, integ) {
  if (!page.host || !page.host.slug || !integ || !integ.server) throw new Error("NOT_LIVE");
  const own = page.domain && page.domainStatus === "connected" ? "https://" + page.domain : "";
  const base = ((integ.server.base) || location.origin).replace(/\/$/, ""), sl = page.host.slug;
  const files = await buildSite(page.pages, own || `${base}/sites/${sl}`, { leadUrl: (integ.server.url || defaultServerUrl()), site: sl, pixels: pixelsFor(integ, page) });
  const payload = filesForServer(files);
  if (payload.reduce((n, f) => n + f.b64.length, 0) > 60e6) throw new Error("Your site is bigger than 45 MB. Use smaller videos or YouTube links.");
  const r = await phpCall(integ.server, { action: "publish", slug: sl, files: payload });
  return { status: "published", host: { ...page.host, url: r.url || page.host.url, folder: r.folder || page.host.folder, ts: Date.now() }, versions: [...(page.versions || []), { ts: Date.now(), pages: page.pages }].slice(-3) };
}
export function PublishModal({ page, onDone, onClose, integ, onSetup, onDomains, onInteg, projects = [] }) {
  /* link names your OTHER projects already use — publishing with one of them would replace that project's live site */
  const usedBy = (sl) => projects.find((x) => x.id !== page.id && x.host && x.host.slug === sl);
  const srvOk = serverOn(integ), netOk = !!integ && publishReady(integ);
  const [dest, setDest] = useState(page.host ? "server" : page.netlify ? "netlify" : srvOk ? "server" : netOk ? "netlify" : "");
  /* your own hosting connects by itself the first time (no setup screen) */
  const [auto, setAuto] = useState(srvOk ? "ok" : "checking"), [pkey, setPkey] = useState(""), [rurl, setRurl] = useState(""), [rbusy, setRbusy] = useState(false), [diag, setDiag] = useState(null), [ownDiag, setOwnDiag] = useState(""), [autoErr, setAutoErr] = useState("");
  /* publish from anywhere (even localhost) to your Hostinger: just type its address */
  const connectRemote = async () => {
    const url = serverUrlFrom(rurl); if (!url) return;
    setErr(""); setDiag(null); setRbusy(true);
    const a = await autoServer(integ, onInteg, url);
    setRbusy(false);
    if (a.ok) { setAuto("ok"); setDest("server"); }
    else if (a.reason === "key") { onInteg({ ...integ, server: { ...(integ.server || {}), url, ok: false } }); setAuto("key"); }
    else setDiag({ url, text: SERVER_HELP[a.diag] || SERVER_HELP.missing });
  };
  useEffect(() => {
    if (srvOk || !onInteg) { if (!srvOk) setAuto("none"); return; }
    autoServer(integ, onInteg).then((a) => { setAuto(a.ok ? "ok" : a.reason); setOwnDiag(a.diag || ""); setAutoErr(a.error || ""); if (a.ok && !page.netlify) setDest("server"); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const useKey = async () => {
    setErr("");
    try { const url = serverUrlFrom(rurl) || (integ.server && integ.server.url) || defaultServerUrl(), r = await phpCall({ url, key: pkey.trim() }, { action: "ping" }); onInteg({ ...integ, server: { url, key: pkey.trim(), ok: true, ip: r.ip || "", base: r.base || "" } }); setAuto("ok"); setDest("server"); }
    catch (e) { setErr(e.message); }
  };
  const [busy, setBusy] = useState(""), [err, setErr] = useState(""), [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState(() => { if (page.host && page.host.slug) return page.host.slug; const b = slugify(page.slug || page.name) || "my-site"; let s = b, i = 2; while (usedBy(s)) s = b + "-" + i++; return s; });
  const [target, setTarget] = useState("new"), [sites, setSites] = useState(null), [siteId, setSiteId] = useState("");
  const own = page.domain && page.domainStatus === "connected" ? "https://" + page.domain : "";
  const liveUrl = dest === "server" ? page.host && (subUrl(integ, page.host.slug) || page.host.url) : page.netlify && page.netlify.url;
  const sd = integ && integ.server && integ.server.sitesDomain;
  const url = own || liveUrl;
  const base = ((integ && integ.server && integ.server.base) || location.origin).replace(/\/$/, "");
  const versions = [...(page.versions || []), { ts: Date.now(), pages: page.pages }].slice(-5);
  const run = async (fn) => { setErr(""); try { await fn(); } catch (e) { setErr(e.message); } setBusy(""); };
  const pubServer = () => run(async () => {
    const sl = slugify(slug); if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(sl)) throw new Error("Link name: use 2+ lowercase letters, numbers or dashes.");
    const other = usedBy(sl); if (other) throw new Error(`The link name “${sl}” is already used by your project “${other.name}”. Choose another link name, otherwise it would replace that website.`);
    setBusy("Building your pages…");
    const files = await buildSite(page.pages, own || `${base}/sites/${sl}`, { leadUrl: (integ.server.url || defaultServerUrl()), site: sl, pixels: pixelsFor(integ, page) });
    const payload = filesForServer(files), size = payload.reduce((n, f) => n + f.b64.length, 0);
    if (size > 60e6) throw new Error("Your site is bigger than 45 MB. Use smaller videos or YouTube links.");
    setBusy("Uploading to your hosting…");
    const r = await phpCall(integ.server, { action: "publish", slug: sl, files: payload });
    onDone({ status: "published", host: { slug: sl, url: r.url, folder: r.folder, ts: Date.now() }, versions }, true);
  });
  const unpublish = () => { if (window.confirm("Take this site offline? The link will stop working.")) run(async () => { setBusy("Taking it offline…"); await phpCall(integ.server, { action: "unpublish", slug: page.host.slug }); onDone({ status: "draft", host: null }, true); }); };
  const pubNetlify = () => run(async () => {
    setBusy("Building your pages…");
    const zip = makeZip(await buildSite(page.pages, url || "", { pixels: pixelsFor(integ, page) }));
    if (zip.size > 35e6) throw new Error("Your site is bigger than 35 MB. Use smaller videos or YouTube links, then try again.");
    setBusy("Uploading to Netlify…");
    const r = await serverCall(integ, { event: "publish", siteId: (page.netlify && page.netlify.siteId) || (target === "existing" ? siteId : undefined), zip: await blobToBase64(zip) });
    onDone({ status: "published", netlify: { siteId: r.siteId, name: r.name, url: r.url, admin: r.admin, ts: Date.now() }, versions }, true);
  });
  const loadSites = async () => { setSites("loading"); try { const r = await serverCall(integ, { event: "sites" }); setSites(r.sites || []); } catch (e) { setSites([]); setErr(e.message); } };
  const copy = () => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }, () => window.prompt("Copy:", url));
  const live = <div className="pub-live">
    <span className="badge published">● Live — anyone can open it</span>
    <a className="pub-url" href={url} target="_blank" rel="noopener">{url && url.replace(/^https?:\/\//, "")} ↗</a>
    <p className="mut">Last published {ago(((dest === "server" ? page.host : page.netlify) || {}).ts || Date.now())}. Edits appear after you click Update.</p>
    <div className="mrow" style={{ marginTop: 6 }}><button onClick={copy}>{copied ? "✓ Copied" : "Copy link"}</button><a className="btn" href={url} target="_blank" rel="noopener">Open site</a>
      {dest === "server" && <button className="red" onClick={unpublish}>Unpublish</button>}<div className="grow" /><button className="pri" onClick={dest === "server" ? pubServer : pubNetlify}>Update live site</button></div>
    {dest === "server" && integ.server && <details className="pub-adv"><summary>Hosting key (to publish from another computer)</summary><div className="row"><code>{integ.server.key}</code><button className="xs" onClick={() => navigator.clipboard.writeText(integ.server.key)}>Copy</button></div></details>}
    <div className="pub-dom"><div><b>{own ? "✓ Custom domain connected" : "Connect a domain or subdomain"}</b><span className="mut">{own ? page.domain : "e.g. mybrand.com or offer.mybrand.com"}</span></div><button onClick={onDomains}>{own ? "Manage" : "Connect domain →"}</button></div>
  </div>;
  return (
    <Modal onClose={busy ? () => {} : onClose}>
      <div className="pub-h"><span className="pub-ic">🚀</span><div><h3>Publish {page.type === "website" ? "website" : "page"}</h3><p className="mut">{page.name} · {page.pages.length} page{page.pages.length > 1 ? "s" : ""}</p></div></div>
      {!srvOk && !netOk ? <div className="pub-setup">
        {auto === "checking" ? <div className="pub-busy" style={{ border: 0, padding: 10 }}><span className="pub-spin" /><b>Connecting to your hosting…</b></div>
          : auto === "key" ? <>
            <b>Your hosting was connected earlier from another browser</b>
            <p className="mut">From now on this is automatic — the connection comes from your {BRAND.product} login. Just do this once:</p>
            <div className="pub-fix">
              <div><span className="dm-n">1</span><div><b>Reset the old connection (1 minute)</b>
                <p className="mut sm">hPanel → <b>Websites</b> → <b>{(serverUrlFrom(rurl) || (integ.server && integ.server.url) || defaultServerUrl()).replace(/^https?:\/\//, "").replace(/\/lb-server\.php$/, "")}</b> → <b>File Manager</b> → open <code>public_html</code> → open <code>lb-data</code> → delete only the file <code>config.json</code>.<br />Your published websites and leads are <b>not</b> touched.</p>
                <a className="btn" href="https://hpanel.hostinger.com/websites" target="_blank" rel="noopener">Open hPanel ↗</a></div></div>
              <div><span className="dm-n">2</span><div><b>Press Connect again</b>
                <div className="row" style={{ marginTop: 6 }}><button className="pri" disabled={rbusy} onClick={async () => { setErr(""); setRbusy(true); const a = await autoServer({ ...integ, server: { ...(integ.server || {}), ok: false } }, onInteg, serverUrlFrom(rurl) || (integ.server && integ.server.url) || defaultServerUrl()); setRbusy(false); if (a.ok) { setAuto("ok"); setDest("server"); } else setErr(a.reason === "key" ? "Still connected to the old key — make sure config.json inside lb-data is deleted, then try again." : SERVER_HELP[a.diag] || "Couldn't connect."); }}>{rbusy ? "Connecting…" : "Connect again"}</button></div></div></div>
            </div>
            <details className="pub-adv"><summary>Or paste the old hosting key instead</summary>
              <p className="mut sm">On the first computer/browser: Publish → (live site) → “Hosting key”.</p>
              <div className="row"><input value={pkey} onChange={(e) => setPkey(e.target.value)} placeholder="lbk_…" style={{ flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 10, font: "inherit" }} /><button disabled={pkey.trim().length < 16} onClick={useKey}>Use key</button></div></details>
          </> : <>
            {location.hostname === "localhost" || location.hostname === "127.0.0.1" ? <>
              <b>You're working on your computer</b>
              <p className="mut">Publishing happens on your live builder. Open your builder's real address (for example <b>https://crecapo.tech</b>) and publish there — or connect it below.</p>
            </> : <>
              <b>Publishing isn't switched on yet</b>
              <p className="mut">This builder needs a one-time server setup by the person who installed it. After that, Publish works in one click — no addresses to type.</p>
              <div className="pub-diag"><b>What's wrong:</b> {autoErr || {
                missing: "The builder's server file isn't on this server. Upload the latest build (the dist folder) again — it includes it.",
                nophp: "The server can't run PHP yet. Run the VPS setup script once (it installs everything).",
                unreachable: "The builder couldn't reach its own server.",
                blocked: "The server didn't answer. The setup script probably hasn't finished — run it once on the VPS.",
              }[ownDiag] || "The server isn't set up yet. Run the VPS setup script once, then upload the builder."}
                <div className="row" style={{ marginTop: 8 }}><button className="pri" onClick={() => window.location.reload()}>↻ Check again</button><a className="btn" href={defaultServerUrl()} target="_blank" rel="noopener">Test the server ↗</a></div></div>
            </>}
            <details className="pub-adv"><summary>Advanced: publish to a different server</summary>
              <p className="mut sm">Only if your builder files live on another server. This is <b>not</b> where you put a customer's domain — connect domains after publishing, in <b>Domains</b>.</p>
              <div className="row"><input value={rurl} onChange={(e) => setRurl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && connectRemote()} placeholder="e.g. crecapo.tech" style={{ flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 10, font: "inherit" }} />
                <button disabled={!rurl.trim() || rbusy} onClick={connectRemote}>{rbusy ? "Connecting…" : "Connect"}</button></div>
              {diag && <div className="pub-diag" style={{ marginTop: 8 }}><b>Not connected.</b> {diag.text}</div>}
              <div className="pub-tg" style={{ marginTop: 10 }}><button onClick={() => onSetup("host")}><b>▲ Use Netlify instead</b><span>Free external hosting with a link like my-page.netlify.app</span></button></div>
            </details>
          </>}
      </div> : busy ? <div className="pub-busy"><span className="pub-spin" /><b>{busy}</b><p className="mut">Please keep this window open (usually 5–30 seconds).</p></div> : <>
        {srvOk && netOk && !page.host && !page.netlify && <div className="pub-dest">{[["server", "🏠 My hosting"], ["netlify", "▲ Netlify"]].map(([k, l]) => <button key={k} className={dest === k ? "on" : ""} onClick={() => setDest(k)}>{l}</button>)}</div>}
        {liveUrl ? live : dest === "server" ? <div className="pub-first">
          <label className="pub-slug">{sd ? "Your free subdomain" : "Link name"}<div className="pub-urlrow">{sd ? <><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /><span>.{sd}</span></> : <><span>{base.replace(/^https?:\/\//, "")}/sites/</span><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /><span>/</span></>}</div></label>
          <p className="mut" style={{ margin: 0 }}>Anyone with this link can see your site immediately. Later you can connect your own domain or subdomain.</p>
          <button className="pri big" onClick={pubServer}>🚀 Publish now</button>
        </div> : <div className="pub-first">
          <p>Your site goes live at a free link like <code>brave-otter-12ab.netlify.app</code>.</p>
          <div className="pub-tg">
            <button className={target === "new" ? "on" : ""} onClick={() => setTarget("new")}><b>✨ New Netlify site</b><span>Get a fresh free link</span></button>
            <button className={target === "existing" ? "on" : ""} onClick={() => { setTarget("existing"); if (!sites) loadSites(); }}><b>▲ My existing site</b><span>Replace a site you already have</span></button>
          </div>
          {target === "existing" && (sites === "loading" ? <p className="mut">Loading your Netlify sites…</p> : Array.isArray(sites) && (sites.length ? <select value={siteId} onChange={(e) => setSiteId(e.target.value)}><option value="">Choose a site…</option>{sites.map((x) => <option key={x.id} value={x.id}>{x.name} — {(x.domain || x.url || "").replace(/^https?:\/\//, "")}</option>)}</select> : <p className="mut">No sites found on your Netlify account.</p>))}
          <button className="pri big" disabled={target === "existing" && !siteId} onClick={pubNetlify}>🚀 Publish now</button>
        </div>}
      </>}
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

export function Preview({ token, file: initFile, dev: initDev }) {
  const info = useMemo(() => readToken(token), [token]);
  const [ver, setVer] = useState(0), [file, setFile] = useState(initFile || "index.html"), [hash, setHash] = useState(""), [dev, setDev] = useState(initDev || "desktop");
  const [html, setHtml] = useState(""), [note, setNote] = useState(""), [pulse, setPulse] = useState(false);
  const ifr = useRef();
  /* saved projects first, then drafts (drafts live in this browser only) */
  const proj = useMemo(() => {
    if (!info || info.expired) return null;
    const p = loadProjects(info.email).find((x) => x.id === info.pid); if (p) return p;
    try { return (JSON.parse(localStorage.getItem("lb_drafts_" + info.email) || "[]") || []).find((x) => x.id === info.pid) || null; } catch { return null; }
  }, [info, ver]);
  const pg = proj && proj.pages.find((p) => p.file === file);
  const flash = (t) => { setNote(t); setTimeout(() => setNote(""), 3200); };

  /* live: re-render when the editor saves (other tab) */
  useEffect(() => {
    if (!info) return;
    const f = (e) => { if (e.key === "lb_pages_" + info.email || e.key === "lb_drafts_" + info.email) { setVer((v) => v + 1); setPulse(true); setTimeout(() => setPulse(false), 900); } };
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
      if (e.data.lb === "ev" && info && proj && /^(cta|fstart)$/.test(e.data.t)) addEvent(info.email, { t: e.data.t, pid: proj.id, page: file, label: String(e.data.label || "").slice(0, 60) });
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
      <p>Open the project in the editor and click <b>Preview</b> to get a fresh link. Preview links work in the browser where you're signed in to {BRAND.product}.</p>
      <a href={appPath()}>Go to dashboard</a></div></div>
  );
  const hrs = Math.max(0, Math.round((info.exp - Date.now()) / 3600e3));
  const copy = async () => { const u = previewUrl(token, file); try { await navigator.clipboard.writeText(u); flash("Link copied"); } catch { window.prompt("Copy this link", u); } };

  return (
    <>
      <RailView dev={dev} setDev={setDev} url={(proj.host && (proj.host.domain || proj.host.url)) || (proj.slug || "yourpage") + ".crecapo.tech"} pages={[...proj.pages.map((p) => ({ v: p.file, l: p.name })), ...(!pg ? [{ v: file, l: file + " (missing)" }] : [])]} page={file}
        setPage={(v) => { setHash(""); setFile(v); window.history.pushState(null, "", `#/preview/${token}/${v}`); }}
        actions={[{ ic: RI.edit, l: "Edit", cls: "k-pri", fn: () => { try { localStorage.setItem("lb_edit_go", proj.id); } catch { /* ignore */ } location.href = appPath(); } }, { ic: RI.link, l: "Copy link", fn: copy }, { ic: RI.reload, l: "Reload", fn: () => setVer((v) => v + 1) }, { ic: RI.home, l: "Dashboard", cls: "k-dash", fn: () => { location.href = appPath(); } }]}
        note={<><i className={"pv-dot" + (pulse ? " pulse" : "")} />Live draft · link expires in {hrs} h</>}>
        <iframe ref={ifr} title="preview" srcDoc={html} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" allow="payment; autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write; accelerometer; gyroscope; geolocation" />
      </RailView>
      {note && <div className="toast pv-toast">{note}</div>}
    </>
  );
}


/* ==================== Form share link: #/form/<id> ==================== */
export function FormPage({ id }) {
  /* v114: in the owner's browser the latest form is used; anyone else gets the copy kept on the server.
     Either way every submission goes to the server → Google Sheet, WhatsApp and email automations run. */
  const found = useMemo(() => findForm(id), [id]);
  const [html, setHtml] = useState(""), [done, setDone] = useState(false), [miss, setMiss] = useState(false), ifr = useRef();
  useEffect(() => {
    let gone = false; const opt = { mode: "blob", preview: true, live: true, page: "form", leadUrl: defaultServerUrl(), site: "" };
    if (found) { finalize(formPageHtml(found.form, loadInteg(found.email)), opt).then((r) => !gone && setHtml(r.html)); document.title = found.form.name; addEvent(found.email, { t: "fview", formId: id, page: "form link" }); }
    else formFetch(id).then((j) => { document.title = j.name || "Form"; return finalize(j.html, opt); }).then((r) => !gone && setHtml(r.html)).catch(() => !gone && setMiss(true));
    return () => { gone = true; };
  }, [found, id]);
  useEffect(() => {
    const f = (e) => {
      if (!ifr.current || e.source !== ifr.current.contentWindow || !e.data) return;
      if (e.data.lb === "lead") { if (found) { addLead(found.email, { ...e.data.lead, formId: id, projectId: "", projectName: "Form link", page: "share link", source: "form-link" }); addEvent(found.email, { t: "lead", formId: id, form: found.form.name }); } setDone(true); }
      if (e.data.lb === "lead-pay" && found) payLead(found.email, e.data.lid, e.data.payment);
      if (e.data.lb === "nav" && /^https?:/.test(e.data.href)) location.href = e.data.href;
    };
    window.addEventListener("message", f); return () => window.removeEventListener("message", f);
  }, [found, id]);
  if (miss) return <div className="pv-dead"><div><h2>This form isn't available</h2><p>The link may be wrong, or the form was deleted. (Form owner: open the form in the builder once, so its link is saved on the server.)</p></div></div>;
  if (!html) return <div className="lazy-load"><span className="pub-spin" /></div>;
  /* someone else's form runs sandboxed (no access to this site's storage) */
  const sb = found ? "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" : "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals";
  return <div className="fpage"><iframe ref={ifr} title="Form" srcDoc={html} sandbox={sb} allow="payment" />{done && <div className="toast pv-toast">✓ Submission saved{found ? " to Leads" : ""}</div>}</div>;
}


/* ==================== Booking link (this browser): #/book/<id> ==================== */
export function BookPage({ id }) {
  const found = useMemo(() => findEvent(id), [id]);
  const [html, setHtml] = useState(""), ifr = useRef();
  useEffect(() => { if (found) { finalize(bookingPageHtml(found.ev, loadInteg(found.email)), { mode: "blob", preview: true, page: "booking" }).then((r) => setHtml(r.html)); document.title = found.ev.name; } }, [found]);
  useEffect(() => {
    const f = (e) => {
      if (!found || !ifr.current || e.source !== ifr.current.contentWindow || !e.data) return;
      if (e.data.lb === "lead") addLead(found.email, { ...e.data.lead, formId: id, projectId: "", projectName: "Booking link", page: "booking link", source: "booking-link" });
      if (e.data.lb === "lead-pay") payLead(found.email, e.data.lid, e.data.payment);
    };
    window.addEventListener("message", f); return () => window.removeEventListener("message", f);
  }, [found, id]);
  if (!found) return <div className="pv-dead"><div><h2>This booking link isn't available</h2><p>Ask the organiser for the public booking link.</p></div></div>;
  return <div className="fpage"><iframe ref={ifr} title={found.ev.name} srcDoc={html} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" allow="payment" /></div>;
}
