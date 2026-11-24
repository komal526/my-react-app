// LaunchBuilder v66 — Dashboard.jsx
import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { Sidebar, NewModal, PublishModal, republishLive } from "./parts.jsx";
import MyPages from "./MyPages.jsx";
import Leads from "./Leads.jsx";
import { Icon } from "./icons.jsx";
import { RailView, RI } from "./Rail.jsx";
import { BRAND } from "../brand.js";
import { LIMIT, uid, slugify, pg, loadProjects, saveProjects, loadLeads, loadForms, saveForms, loadEvents, previewToken, previewUrl, loadInteg, saveInteg, syncServerLeads, serverOn, loadCal, saveCal, saveLeads, loadMyTpl, saveMyTpl, loadTemplateHtml, syncServerEvents, fuDue, myAccount, FILE_TEMPLATES } from "../lib.js";
import { formHtml, bookingWidget } from "./tools.js";
import { resolveEvents } from "./insights.js";
const Editor = lazy(() => import("./Editor.jsx"));
const Templates = lazy(() => import("./Templates.jsx"));
const Domains = lazy(() => import("./Domains.jsx"));
const Forms = lazy(() => import("./Forms.jsx"));
const Analytics = lazy(() => import("./Analytics.jsx"));
const Integrations = lazy(() => import("./Integrations.jsx"));
const Calendar = lazy(() => import("./Calendar.jsx"));
const Settings = lazy(() => import("./Settings.jsx"));
const Pixels = lazy(() => import("./Pixels.jsx"));
const LMS = lazy(() => import("./LMS.jsx"));
const ImportPage = lazy(() => import("./ImportPage.jsx"));
const FollowUps = lazy(() => import("./FollowUps.jsx"));
const Consultant = lazy(() => import("./Consultant.jsx"));
/* AI Studio: one loader for both screens · opened as #/studio in a new tab → start loading it right away (no dashboard flash) */
const loadStudio = () => import("./AiStudio.jsx");
const AiStudio = lazy(loadStudio);
const AdminPanel = lazy(() => import("./Admin.jsx"));
const LeadFinder = lazy(() => import("./LeadFinder.jsx"));
const AiEditor = lazy(() => loadStudio().then((m) => ({ default: m.AiEditor })));
if (/^#\/studio/.test(location.hash)) { loadStudio(); }

/* replace every copy of a linked calendar inside a page with its latest version */
/* a quick fingerprint of a project's pages, to know whether a new project was changed */
const pagesHash = (pages) => { const t = (pages || []).map((x) => x.html || "").join("\u0001"); let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h + ":" + t.length; };
const syncCalInHtml = (html, ev, integ) => {
  if (!html.includes(ev.id)) return html;
  const d = new DOMParser().parseFromString(html, "text/html"); let n = 0;
  d.querySelectorAll(`[data-lb-calendar="${ev.id}"]`).forEach((w) => { w.innerHTML = bookingWidget(ev, integ); w.setAttribute("data-lb-name", "Calendar: " + ev.name); n++; });
  d.querySelectorAll(`[data-lb-event="${ev.id}"]`).forEach((w) => { if (w.closest("[data-lb-calendar]")) return; const t = d.createElement("template"); t.innerHTML = bookingWidget(ev, integ); w.replaceWith(t.content.firstElementChild); n++; });
  return n ? "<!DOCTYPE html>\n" + d.documentElement.outerHTML : html;
};
/* replace every copy of a linked form inside a page with its latest version */
const syncFormInHtml = (html, f, integ) => {
  if (!html.includes(`data-lb-formbox="${f.id}"`)) return html;
  const d = new DOMParser().parseFromString(html, "text/html");
  d.querySelectorAll(`[data-lb-formbox="${f.id}"]`).forEach((n) => {
    const t = d.createElement("template"); t.innerHTML = formHtml(f, integ); const nn = t.content.firstElementChild;
    if (n.getAttribute("data-lb-id")) nn.setAttribute("data-lb-id", n.getAttribute("data-lb-id"));
    n.replaceWith(nn);
  });
  return "<!DOCTYPE html>\n" + d.documentElement.outerHTML;
};

/* greeting · search · notifications · account */
/* search across projects, forms, calendars and pages */
const PAGES = [["pages", "grid", "Dashboard"], ["projects", "globe", "Projects"], ["templates", "card", "Templates"], ["landings", "pages", "Landing Pages"], ["followups", "clock", "Follow-ups"], ["lms", "pages", "Courses (Academy)"], ["forms", "form", "Forms"], ["calendar", "calendar", "Calendar"], ["leads", "users", "Leads"], ["domains", "share", "Domains"], ["integrations", "apps", "Integrations"], ["analytics", "chart", "Analytics"], ["pixels", "eye", "Tracking Pixels"], ["settings", "gear", "Settings"]];
function Search({ projects, forms, cal, onOpenProject, onGo }) {
  const [q, setQ] = useState(""), [open, setOpen] = useState(false), [hi, setHi] = useState(0), ref = useRef(null), box = useRef(null);
  useEffect(() => {
    const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ref.current && ref.current.focus(); setOpen(true); } };
    const out = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    window.addEventListener("keydown", k); document.addEventListener("mousedown", out);
    return () => { window.removeEventListener("keydown", k); document.removeEventListener("mousedown", out); };
  }, []);
  const t = q.trim().toLowerCase(), has = (x) => (x || "").toLowerCase().includes(t);
  const groups = !t ? [] : [
    ["Projects", projects.filter((p) => has(p.name) || has(p.domain)).slice(0, 5).map((p) => ({ ic: p.type === "website" ? "globe" : "pages", t: p.name, s: (p.type === "website" ? "Website" : "Landing page") + " · " + (p.status === "published" ? "Published" : "Draft"), go: () => onOpenProject(p.id) }))],
    ["Forms", forms.filter((f) => has(f.name)).slice(0, 4).map((f) => ({ ic: "form", t: f.name, s: "Form", go: () => onGo("forms") }))],
    ["Calendars", cal.filter((c) => has(c.name)).slice(0, 4).map((c) => ({ ic: "calendar", t: c.name, s: "Calendar · " + (c.duration || 30) + " min", go: () => onGo("calendar") }))],
    ["Pages", PAGES.filter(([, , n]) => has(n)).slice(0, 4).map(([k, ic, n]) => ({ ic, t: n, s: "Go to page", go: () => onGo(k) }))],
  ].filter(([, list]) => list.length);
  const flat = groups.flatMap(([, list]) => list);
  const pick = (r) => { if (!r) return; r.go(); setQ(""); setOpen(false); ref.current && ref.current.blur(); };
  const key = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(flat.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === "Enter") pick(flat[hi]);
    else if (e.key === "Escape") { setOpen(false); ref.current.blur(); }
  };
  let n = -1;
  return (
    <div className={"sx" + (open ? " on" : "")} ref={box}>
      <label className="sx-in"><Icon n="search" s={16} />
        <input ref={ref} value={q} placeholder="Search projects, forms, pages…" onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setHi(0); setOpen(true); }} onKeyDown={key} aria-label="Search" />
        {q ? <button className="sx-x" onClick={() => { setQ(""); ref.current.focus(); }} aria-label="Clear">✕</button> : <kbd>Ctrl K</kbd>}
      </label>
      {open && t && <div className="sx-dd">
        {flat.length ? groups.map(([g, list]) => <div key={g} className="sx-g"><small>{g}</small>{list.map((r) => { n++; const i = n; return (
          <button key={g + r.t + i} className={"sx-r" + (i === hi ? " hi" : "")} onMouseEnter={() => setHi(i)} onClick={() => pick(r)}><span className="sx-ic"><Icon n={r.ic} s={15} /></span><span className="sx-t"><b>{r.t}</b><em>{r.s}</em></span><span className="sx-go">↵</span></button>); })}</div>)
          : <div className="sx-none">No results for “{q}”</div>}
        <div className="sx-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
      </div>}
    </div>
  );
}

function TopBar({ full = true, title = "", onHome = () => {}, user, newLeads, onLeads, onSettings, onLogout, um, setUm, onGo = () => {}, projects = [], forms = [], cal = [], onOpenProject = () => {} }) {
  const h = new Date().getHours(), hi = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const first = (user.name || "").split(" ")[0] || "there";
  return (
    <div className={"tb2" + (full ? "" : " slim")}>
      {full ? <div className="tb2-hi">
        <h1>{hi}, <span className="tb2-name">{first}</span> <span className="tb2-wave">👋</span></h1>
      </div> : <div className="tb2-hi tb2-crumb">
        <button className="tb2-home" onClick={onHome}><Icon n="grid" s={15} /><span>Dashboard</span></button>
        {title && <><i className="tb2-sl">/</i><b>{title}</b></>}
      </div>}
      <span className="tb2-date"><Icon n="calendar" s={15} /><b>{new Date().toLocaleDateString("en-IN", { weekday: "long" })}</b><span>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></span>
      <Search projects={projects} forms={forms} cal={cal} onOpenProject={onOpenProject} onGo={onGo} />
      <button className="tb2-bell" onClick={onLeads} title="Leads"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg></button>
      <div className="tb2-me" onClick={(e) => { e.stopPropagation(); setUm(!um); }}><span className="av">{(user.name || "U")[0].toUpperCase()}</span><b>{first}</b><Icon n="chevd" s={14} />
        {um && <div className="tb2-dd" role="menu" onClick={(e) => e.stopPropagation()}>
          <div className="tb2-ddh"><span className="av">{(user.name || "U")[0].toUpperCase()}</span><div><b>{user.name}</b><small>{user.email}</small></div></div>
          {[["gear", "Settings", onSettings], ["eye", "Tracking Pixels", () => onGo("pixels")], ["apps", "Integrations", () => onGo("integrations")]].map(([ic, l, fn]) => (
            <button key={l} role="menuitem" onClick={() => { setUm(false); fn(); }}><Icon n={ic} s={16} /><span>{l}</span></button>))}
          <i className="tb2-sep" />
          <button role="menuitem" className="out" onClick={() => { setUm(false); onLogout(); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg><span>Log out</span></button>
        </div>}</div>
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  const E = user.email;
  /* new projects (from scratch, a template or AI) stay "unsaved" until you press Save — they live in lb_drafts_ (this browser only).
     After a reload, a draft you changed comes back marked "Not saved"; an untouched one is dropped. */
  const DK = "lb_drafts_" + E;
  const [projects, setProjects] = useState(() => { let d = []; try { d = JSON.parse(localStorage.getItem(DK) || "[]"); } catch { d = []; } return [...d.filter((p) => p.kept || pagesHash(p.pages) !== p.orig).map((p) => ({ ...p, recovered: true })), ...loadProjects(E)]; });
  const [toast, setToast] = useState(""); useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3500); return () => clearTimeout(t); }, [toast]);
  const [forms, setForms] = useState(() => loadForms(E)), [leads, setLeads] = useState(() => loadLeads(E)), [events, setEvents] = useState(() => loadEvents(E));
  const [view, setView] = useState(() => (/\/admin\/?$/.test(location.pathname) || /^#\/admin/.test(location.hash) ? "admin" : "pages")), [openId, setOpenId] = useState(null), [modal, setModal] = useState(null);
  const syncT = useRef(0);
  const [integ, setInteg] = useState(() => loadInteg(E));
  const onInteg = (v) => { setInteg(v); saveInteg(E, v); };
  const [igTile, setIgTile] = useState(""), [navOpen, setNavOpen] = useState(false), [um, setUm] = useState(false), [mini, setMini] = useState(() => localStorage.getItem("lb_nav_mini") === "1");
  /* tablets & phones always get the normal (full) menu */
  const [wide, setWide] = useState(() => window.innerWidth > 900);
  useEffect(() => { const f = () => setWide(window.innerWidth > 900); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const [cal, setCal] = useState(() => loadCal(E));
  const [myTpl, setMyTpl] = useState(() => loadMyTpl(E));
  const [ai, setAi] = useState(null);
  const consultOpen = (o = {}) => setAi({ ...o, nonce: Date.now() });
  /* AI Studio opens in its own browser tab: #/studio (the brief is handed over through this browser's storage) */
  /* Admin panel has its own address: crecapo.tech/admin */
  useEffect(() => {
    const base = location.pathname.replace(/\/admin\/?$/, "/") || "/";
    if (view === "admin") { if (!/\/admin\/?$/.test(location.pathname)) history.replaceState(null, "", base.replace(/\/$/, "") + "/admin"); }
    else if (/\/admin\/?$/.test(location.pathname) || /^#\/admin/.test(location.hash)) history.replaceState(null, "", base);
  }, [view]);
  useEffect(() => { const g = (e) => { const d = e.detail; if (d && typeof d === "object") { setIgTile(d.card || ""); setView(d.view); } else setView(d); }; window.addEventListener("lb-go", g); return () => window.removeEventListener("lb-go", g); }, []);   /* other screens can jump to a view */
  useEffect(() => { const h = () => { if (/^#\/admin/.test(location.hash)) setView("admin"); }; window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); }, []);
  const [studio, setStudio] = useState(() => { if (!/^#\/studio/.test(location.hash)) return null; let o = {}; try { o = JSON.parse(localStorage.getItem("lb_studio_go") || "{}"); localStorage.removeItem("lb_studio_go"); } catch { o = {}; } return { type: o.type || "landing", name: o.name || "", prompt: o.prompt || "", tab: true }; });
  const studioTab = (o = {}) => { try { localStorage.setItem("lb_studio_go", JSON.stringify(o)); } catch { /* ignore */ } const w = window.open(location.origin + location.pathname + "#/studio", "_blank"); if (!w) setStudio(o); };
  /* the studio finished: save → your projects · editor → opens it (kept in Drafts until saved) · draft → Drafts */
  const studioDone = (n, pages, t, how = "editor") => {
    if (studio && studio.tab) history.replaceState(null, "", location.pathname + location.search);
    setStudio(null);
    if (how === "save") { if (full()) return; create(n, pages, t, undefined, { save: true, open: false }); setView("projects"); setPjKind({ k: "all" }); setToast("✓ “" + n + "” saved to your projects"); }
    else if (how === "draft") { create(n, pages, t, undefined, { open: false, kept: true }); setView("projects"); setPjKind({ k: "drafts" }); setToast("📝 “" + n + "” kept in Drafts"); }
    else create(n, pages, t, undefined, { ask: false, kept: true });
  };
  const closeStudio = () => { if (studio && studio.tab) { history.replaceState(null, "", location.pathname + location.search); if (window.opener) { window.close(); } } setStudio(null); };
  /* my account on the server: role (admin / workspace owner / user), free-subdomain limit, paused accounts */
  const [me, setMe] = useState(null), [blocked, setBlocked] = useState(null), [domFocus, setDomFocus] = useState(null);
  useEffect(() => {
    myAccount().then(setMe).catch((e) => { if (e.code === "ACCOUNT_PAUSED" || e.code === "WRONG_WORKSPACE") setBlocked({ code: e.code, msg: e.message }); });
    const f = (e) => setBlocked(e.detail); window.addEventListener("lb-blocked", f); return () => window.removeEventListener("lb-blocked", f);
  }, []);
  /* warm up the builder in the background — skipped when the browser asks to save data */
  useEffect(() => { const c = navigator.connection; if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) return; const t = setTimeout(() => { import("./Editor.jsx"); import("./Templates.jsx"); import("./Domains.jsx"); }, 700); return () => clearTimeout(t); }, []);
  /* pause every animation while the tab is in the background */
  useEffect(() => { const f = () => document.documentElement.classList.toggle("lb-hidden", document.visibilityState === "hidden"); document.addEventListener("visibilitychange", f); return () => document.removeEventListener("visibilitychange", f); }, []);
  /* live updates from your other devices — refresh what's on screen (projects wait while the editor is open) */
  const openRef = useRef(null);
  useEffect(() => {
    const f = (e) => {
      const k = e.detail || [], all = k.includes("all"), has = (x) => all || k.includes(x);
      if (has("lb_pages_") && !openRef.current) setProjects((ps) => [...ps.filter((p) => p.unsaved), ...loadProjects(E)]);
      if (has("lb_forms_")) setForms(loadForms(E));
      if (has("lb_leads_")) setLeads(loadLeads(E));
      if (has("lb_events_")) setEvents(loadEvents(E));
      if (has("lb_cal_")) setCal(loadCal(E));
      if (has("lb_integrations_")) setInteg(loadInteg(E));
      if (has("lb_mytpl_")) setMyTpl(loadMyTpl(E));
    };
    window.addEventListener("lb-cloud-pull", f); return () => window.removeEventListener("lb-cloud-pull", f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const putTpl = (list) => { setMyTpl(list); saveMyTpl(E, list); };
  const saveAsTpl = (p) => {
    const n = window.prompt("Template name", p.name); if (!n || !n.trim()) return;
    putTpl([{ id: uid(), name: n.trim(), type: p.type === "website" ? "website" : "landing", note: p.type === "website" ? `${p.pages.length} pages · saved by you` : "Saved by you", pages: p.pages.map((x) => ({ name: x.name, file: x.file, html: x.html })), created: Date.now() }, ...myTpl]);
    window.alert(`"${n.trim()}" saved — find it in Templates → My templates, and in Create new.`);
  };
  const calT = useRef(0);
  const onSaveCal = (list) => {
    const changed = list.filter((e) => { const o = cal.find((x) => x.id === e.id); return o && o.updated !== e.updated; });
    setCal(list); saveCal(E, list);
    if (!changed.length) return;
    clearTimeout(calT.current);
    calT.current = setTimeout(() => setProjects((ps) => ps.map((p) => ({ ...p, pages: p.pages.map((x) => ({ ...x, html: changed.reduce((h, e) => syncCalInHtml(h, e, integ), x.html) })) }))), 500);
  };
  const patchPage = (pid, pageId, o) => patchPages(pid, (pages) => pages.map((x) => (x.id === pageId ? { ...x, ...o } : x)));
  const patchLead = (id, o) => setLeads((ls) => { const list = ls.map((l) => (l.id === id ? { ...l, ...o } : l)); saveLeads(E, list); return list; });
  const deleteLead = (id) => setLeads((ls) => { const list = ls.filter((l) => l.id !== id); saveLeads(E, list); return list; });
  /* leads from live sites on your own server → CRM (on load + every minute) */
  const projRef = useRef(projects); projRef.current = projects;
  const srv = serverOn(integ);
  useEffect(() => {
    if (!srv) return;
    const run = () => syncServerLeads(E, integ, projRef.current).then((n) => { if (n) setLeads(loadLeads(E)); }).catch(() => {});
    run(); const t = setInterval(run, 60000); return () => clearInterval(t);
  }, [srv, E]); // eslint-disable-line react-hooks/exhaustive-deps
  /* Smart Insights: views, clicks and form starts from your live sites (every 2 minutes) */
  useEffect(() => {
    if (/^(localhost|127\.)/.test(location.hostname) && !srv) return;
    const run = () => syncServerEvents(E, integ, projRef.current).then((n) => { if (n) setEvents(loadEvents(E)); }).catch(() => {});
    const t0 = setTimeout(run, 1500), t = setInterval(run, 60000); return () => { clearTimeout(t0); clearInterval(t); };
  }, [srv, E]); // eslint-disable-line react-hooks/exhaustive-deps
  /* saving is batched: big projects are written once after you pause (not on every keystroke) — and always before the tab closes */
  const saveNow = useRef(null), dirty = useRef(false);
  saveNow.current = () => {
    if (!dirty.current) return; dirty.current = false;   /* nothing changed here → never overwrite what another tab saved */
    if (!saveProjects(E, projects.filter((p) => !p.unsaved))) alert("Browser storage is full. Delete some projects or use smaller images.");
    try { localStorage.setItem(DK, JSON.stringify(projects.filter((p) => p.unsaved).map(({ recovered, ...p }) => p))); } catch { /* storage full: the draft just isn't kept after a reload */ }
  };
  const firstSave = useRef(true);
  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }   /* just loaded — nothing changed */
    dirty.current = true; const t = setTimeout(() => saveNow.current(), 350); return () => clearTimeout(t);
  }, [projects, E]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = () => saveNow.current(); window.__lbSave = f; window.addEventListener("pagehide", f); window.addEventListener("beforeunload", f); return () => { window.removeEventListener("pagehide", f); window.removeEventListener("beforeunload", f); f(); }; }, []);
  /* what the lists show: saved projects + drafts you changed but haven't saved */
  const listed = useMemo(() => projects.filter((p) => !p.unsaved), [projects]);
  /* new projects you changed but never saved (e.g. the browser was closed) — shown apart, never counted as projects */
  const drafts = useMemo(() => projects.filter((p) => p.unsaved && (p.recovered || p.kept) && p.id !== openId), [projects, openId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pjKind, setPjKind] = useState({ k: "all" });
  /* leads / visits arrive from preview & form-link tabs */
  useEffect(() => {
    const f = (e) => { if (!e || !e.key || e.key === "lb_leads_" + E) setLeads(loadLeads(E)); if (!e || !e.key || e.key === "lb_events_" + E) setEvents(loadEvents(E)); };
    const g = () => f(); window.addEventListener("storage", f); window.addEventListener("lb-leads", g);
    return () => { window.removeEventListener("storage", f); window.removeEventListener("lb-leads", g); };
  }, [E]);
  const openPreview = (p) => saveNow.current() || window.open(previewUrl(previewToken(E, p.id)), "_blank");

  /* ---- project actions ---- */
  const patch = (id, o) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...o, updated: Date.now() } : p)));
  const patchHtml = (id, pid, html) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, updated: Date.now(), pages: p.pages.map((x) => (x.id === pid ? { ...x, html } : x)) } : p)));
  const patchPages = (id, fn) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, updated: Date.now(), pages: fn(p.pages) } : p)));
  const full = () => projects.filter((p) => !p.unsaved).length >= LIMIT && (alert(`Free plan allows ${LIMIT} projects. Delete one to add another.`), true);
  /* save = true → goes straight into your projects (import, duplicate, "Save to my projects"); otherwise it opens as an unsaved draft */
  /* ask = true → right after it opens: "Save to projects" or "Keep as draft" */
  const create = (name, pages, type, tpl, { save = false, open = true, ask = true, kept = false } = {}) => {
    const p = { id: uid(), name, type, status: "draft", slug: slugify(name), domain: "", pages, updated: Date.now(), created: Date.now(), versions: [], ...(tpl ? { tpl } : {}), ...(save ? {} : { unsaved: true, orig: pagesHash(pages), ...(kept ? { kept: true } : {}) }) };
    setProjects((ps) => [p, ...ps]); setModal(!save && open && ask ? { type: "askSave", id: p.id } : null); if (open) { setOpenId(p.id); setView("pages"); }
    return p;
  };
  /* a saved project can go back to Drafts (not counted as a project; save it again any time) */
  const toDraft = (p) => {
    if (p.status === "published" && !window.confirm(`"${p.name}" is live. Move it to Drafts? The live website stays online — unpublish it first if you want it offline.`)) return;
    setProjects((ps) => ps.map((x) => (x.id === p.id ? { ...x, unsaved: true, kept: true, orig: pagesHash(x.pages) } : x)));
    setToast("📝 “" + p.name + "” moved to Drafts — open Drafts to save it back");
  };
  const keepDraft = (id) => { setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, kept: true } : p))); setToast("📝 Kept in Drafts — save it to your projects any time"); };
  const saveDraft = (id) => { if (projects.filter((p) => !p.unsaved).length >= LIMIT) return alert(`Free plan allows ${LIMIT} projects. Delete one to save this one.`), false; setProjects((ps) => ps.map(({ recovered, ...p }) => (p.id === id ? { ...p, unsaved: false, orig: undefined, kept: undefined, updated: Date.now() } : { ...p, ...(recovered ? { recovered } : {}) }))); setToast("✓ Saved to your projects"); return true; };
  const discardDraft = (id) => setProjects((ps) => ps.filter((p) => p.id !== id));
  /* leaving the editor: an untouched new project just disappears; a changed one asks Save / Don't save */

  const leaveEditor = (p0) => { const p = projRef.current.find((x) => x.id === p0.id) || p0; if (!p.unsaved || p.kept) return setOpenId(null); if (pagesHash(p.pages) === p.orig) { discardDraft(p.id); return setOpenId(null); } setModal({ type: "unsaved", id: p.id }); };
  const [peek, setPeek] = useState(null);   /* project preview window (click on a project card) */
  const startNew = (kind) => !full() && setModal({ type: "new", kind: kind === "website" ? "website" : "landing" });
  const duplicate = (p) => !full() && create(p.name + " copy", p.pages.map((x) => ({ ...x, id: uid() })), p.type, undefined, { save: true });
  const remove = (p) => window.confirm(`Delete "${p.name}"?`) && setProjects((ps) => ps.filter((x) => x.id !== p.id));
  const rename = (p) => { const n = window.prompt("Name", p.name); if (n && n.trim()) patch(p.id, { name: n.trim() }); };
  const importFile = async (f) => {
    if (!f) return;
    if (!/\.html?$/i.test(f.name)) return "Please choose a .html file.";
    if (f.size > 20 * 1024 * 1024) return "File is larger than 20 MB.";
    if (full()) return "Free plan limit reached.";
    create(f.name.replace(/\.html?$/i, ""), [pg("Home", "index.html", await f.text())], "landing");
  };

  /* ---- forms: save + keep every page that uses a form up to date ---- */
  const onSaveForms = (list) => {
    const changed = list.filter((f) => { const o = forms.find((x) => x.id === f.id); return o && o.updated !== f.updated; });
    setForms(list); saveForms(E, list);
    if (!changed.length) return;
    clearTimeout(syncT.current);
    syncT.current = setTimeout(() => setProjects((ps) => ps.map((p) => ({ ...p, pages: p.pages.map((x) => ({ ...x, html: changed.reduce((h, f) => syncFormInHtml(h, f, integ), x.html) })) }))), 500);
  };
  const addHtmlToPage = (html, pid, pageId) => patchPages(pid, (pages) => pages.map((x) => {
    if (x.id !== pageId) return x;
    const d = new DOMParser().parseFromString(x.html, "text/html"), t = d.createElement("template");
    t.innerHTML = html;
    const sec = t.content.firstElementChild, foot = [...d.body.children].reverse().find((n) => n.tagName === "FOOTER");
    foot ? foot.before(sec) : d.body.appendChild(sec);
    return { ...x, html: "<!DOCTYPE html>\n" + d.documentElement.outerHTML };
  }));
  const addFormToPage = (form, pid, pageId) => addHtmlToPage(`<section data-lb-name="Form section" style="padding:64px 24px">${formHtml(form, integ)}</section>`, pid, pageId);
  const visits7 = events.filter((e) => e.t === "view" && Date.now() - e.ts < 7 * 864e5).length;

  /* template → "Edit" opens it as an unsaved draft · "Save to my projects" keeps it without opening the editor */
  const applyTpl = async (t, save = false) => {
    if (save && full()) return;
    const o = save ? { save: true, open: false } : {};
    if (t.file) { try { create(t.name, [pg("Home", "index.html", await loadTemplateHtml(t))], t.type, t.key, o); } catch (e) { return alert(e.message); } }
    else create(t.mine ? t.name + " (copy)" : t.name, t.make(t.name), t.type, undefined, o);
    if (save) { setToast("✓ “" + t.name + "” saved to your projects"); }
  };
  /* ---- Edit with AI: a project or a template opens in the AI preview, where you ask for changes ---- */
  const [aiEdit, setAiEdit] = useState(null);
  const aiProject = (p) => { setPeek(null); setAiEdit({ kind: "project", pid: p.id, name: p.name, type: p.type, pages: p.pages }); };
  const aiTpl = async (t) => {
    try { const pages = t.file ? [pg("Home", "index.html", await loadTemplateHtml(t))] : t.make(t.mine ? t.name + " (copy)" : t.name); setAiEdit({ kind: "tpl", tpl: t.key, name: t.name, type: t.type, pages }); }
    catch (e) { alert(e.message); }
  };
  const aiDone = (how, r) => {
    const a = aiEdit; setAiEdit(null);
    if (a.kind === "tpl") return studioDone(r.name, r.pages, r.type, how);
    const p = projects.find((x) => x.id === a.pid); if (!p) return;
    if (how === "copy") { if (full()) return; create(r.name + " (AI copy)", r.pages.map((x) => ({ ...x, id: uid() })), r.type, undefined, { save: true, open: false }); setToast("✓ Saved as a new project"); return; }
    if (r.hist.length) setProjects((ps) => ps.map((x) => (x.id === p.id ? { ...x, name: r.name || x.name, pages: r.pages, updated: Date.now() } : x)));
    else if (r.name !== p.name) patch(p.id, { name: r.name });
    if (how === "editor") setOpenId(p.id);
    else setToast(r.hist.length ? (p.status === "published" ? "✓ Changes saved — press Update to put them on your live site" : "✓ Changes saved") : "No changes to save");
  };
  const aiClose = (r) => { if (r && r.hist && r.hist.length && !window.confirm("Close without saving the AI changes?")) return; setAiEdit(null); };
  /* "Use" / "Edit with AI" pressed in a template or preview opened in its own tab */
  useEffect(() => {
    let k = "", ai = "", pid = ""; try { k = localStorage.getItem("lb_tpl_go") || ""; ai = localStorage.getItem("lb_tpl_ai") || ""; pid = localStorage.getItem("lb_ai_go") || ""; ["lb_tpl_go", "lb_tpl_ai", "lb_ai_go"].forEach((x) => localStorage.removeItem(x)); } catch { /* ignore */ }
    const t = k && FILE_TEMPLATES.find((x) => x.key === k); if (t) { if (ai) aiTpl(t); else if (!full()) applyTpl(t); }
    const p = pid && projects.find((x) => x.id === pid); if (p) aiProject(p);
    /* "Edit" pressed in a project preview opened in its own tab */
    let eg = ""; try { eg = localStorage.getItem("lb_edit_go") || ""; localStorage.removeItem("lb_edit_go"); } catch { /* ignore */ }
    if (eg && projects.some((x) => x.id === eg)) setOpenId(eg);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const evs = useMemo(() => resolveEvents(events, projects), [events, projects]);
  const open = projects.find((p) => p.id === openId);
  openRef.current = openId;
  const pub = modal && modal.type === "publish" && projects.find((p) => p.id === modal.id);
  const goView = (v, tile = "") => { setModal(null); setOpenId(null); setIgTile(tile); setView(v); };
  const pubModal = pub && <PublishModal page={pub} projects={projects} integ={integ} onInteg={onInteg} onClose={() => setModal(null)} onDone={(o, keep) => { patch(pub.id, o); if (!keep) setModal(null); }} onSetup={(tile) => goView("integrations", typeof tile === "string" ? tile : "server")} onDomains={() => goView("domains")} />;

  if (open) return (
    <Suspense fallback={<div className="boot"><span className="pub-spin" />Opening the editor…</div>}>
      <Editor key={open.id} page={open} user={user} forms={forms} events={cal} integ={integ} onSave={(pid, h) => patchHtml(open.id, pid, h)} onPages={(fn) => patchPages(open.id, fn)} onType={(t) => patch(open.id, { type: t })}
        unsaved={!!open.unsaved} onSaveProject={() => saveDraft(open.id)}
        onBack={() => { const o = open; setTimeout(() => leaveEditor(o), 30); }} onPublish={() => { if (open.unsaved && !saveDraft(open.id)) return; setModal({ type: "publish", id: open.id }); }}
        onUpdate={open.status === "published" && open.host && open.host.slug && !open.unsaved ? async () => { const p = projRef.current.find((x) => x.id === open.id) || open; try { const o = await republishLive(p, integ); patch(p.id, o); } catch (e) { if (e.message === "NOT_LIVE") { setModal({ type: "publish", id: p.id }); return; } throw e; } } : undefined} />
      {pubModal}
      {modal && modal.type === "askSave" && <div className="uv-ov"><div className="uv-box">
        <span className="uv-ic">✨</span><h3>“{open.name}” is ready</h3>
        <p>Save it to your projects now, or keep it in Drafts (drafts aren't counted as projects — save them any time).</p>
        <div className="uv-row"><button className="uv-save" onClick={() => { if (saveDraft(open.id)) setModal(null); }}>💾 Save to projects</button>
          <button className="uv-keep" onClick={() => { keepDraft(open.id); setModal(null); }}>📝 Keep as draft</button></div></div></div>}
      {modal && modal.type === "unsaved" && <div className="uv-ov"><div className="uv-box">
        <span className="uv-ic">💾</span><h3>Save “{open.name}” to your projects?</h3>
        <p>You made changes to this new {open.type === "website" ? "website" : "page"}. If you don't save it, it's deleted.</p>
        <div className="uv-row"><button className="uv-save" onClick={() => { if (saveDraft(open.id)) { setModal(null); setOpenId(null); } }}>💾 Save to projects</button>
          <button className="uv-no" onClick={() => { discardDraft(open.id); setModal(null); setOpenId(null); }}>Don't save</button>
          <button className="uv-keep" onClick={() => setModal(null)}>Keep editing</button></div></div></div>}
      {toast && <div className="dash-toast">{toast}</div>}
    </Suspense>
  );

  /* AI Studio in its own browser tab: only the studio, nothing else first */
  if (studio && studio.tab) return (
    <Suspense fallback={<div className="ais-boot"><span className="pub-spin" /></div>}>
      <AiStudio {...studio} integ={integ} onClose={closeStudio} onSetupAI={() => { closeStudio(); setView("integrations"); setIgTile("ai"); }} onCreate={studioDone} />
      {toast && <div className="dash-toast">{toast}</div>}
    </Suspense>
  );

  if (blocked) return (
    <div className="acct-block"><div><span className="acct-ic">{blocked.code === "WRONG_WORKSPACE" ? "↪" : "⏸"}</span>
      <h2>{blocked.code === "WRONG_WORKSPACE" ? "This account belongs to another workspace" : "Your account is paused"}</h2>
      <p>{blocked.msg}</p>
      {BRAND.email && <p>Help: <a href={"mailto:" + BRAND.email}>{BRAND.email}</a></p>}
      <button className="pri" onClick={onLogout}>Log out</button></div></div>
  );

  return (
    <div className={"dash" + (mini && wide ? " mini" : "")} onClick={() => um && setUm(false)}>
      <Sidebar role={me ? me.role : ""} mini={mini && wide} onMini={() => { const v = !mini; setMini(v); localStorage.setItem("lb_nav_mini", v ? "1" : "0"); }} open={navOpen} onClose={() => setNavOpen(false)} view={view} onView={setView} count={listed.length} user={user} onLogout={onLogout} badges={{ leads: leads.filter((l) => l.status === "new").length, followups: leads.filter((l) => l.fu && l.fu.at).length,   /* every follow-up still to do (due now + upcoming) */ forms: forms.length, calendar: cal.length }} />
      {navOpen && <div className="nv-ov" onClick={() => setNavOpen(false)} />}
      <section><Suspense fallback={<div className="lazy-load"><span className="pub-spin" /></div>}>
        <div className="mbar"><button className="mbar-btn" onClick={() => setNavOpen(true)} aria-label="Open menu"><span /><span /><span /></button>
          <div className="mbar-brand">{BRAND.logo ? <img className="mbar-img" src={BRAND.logo} alt="" /> : <span className="mbar-logo">⬡</span>}{BRAND.product}</div>
          {["pages", "websites", "landings", "projects"].includes(view) && <button className="mbar-new" onClick={() => startNew(view === "websites" ? "website" : "landing")} aria-label="Create new">＋</button>}</div>
        <TopBar full={view === "pages"} title={({ projects: "All projects", websites: "Websites", import: "Import HTML", lms: "Academy · Courses", finder: "Lead Finder", admin: "Admin panel" })[view] || (PAGES.find(([k]) => k === view) || [])[2] || ""} onHome={() => setView("pages")} user={user} newLeads={leads.filter((l) => l.status === "new").length}
          onLeads={() => setView("leads")} onSettings={() => setView("settings")} onLogout={onLogout} um={um} setUm={setUm} onGo={setView} projects={listed} forms={forms} cal={cal} onOpenProject={setOpenId} />
        {["pages", "websites", "landings", "projects"].includes(view) && <MyPages onView={(p) => (p.unsaved ? setPeek(p) : openPreview(p))} onViewAll={(w) => setView(w || "projects")} mode={view === "websites" ? "website" : view === "landings" ? "landing" : view === "projects" ? "all" : "dash"} query="" projects={listed} drafts={drafts} kind0={pjKind} onSaveDraft={(p) => saveDraft(p.id)} onToDraft={toDraft} onDiscardDraft={(p) => window.confirm(`Delete the draft "${p.name}"?`) && discardDraft(p.id)} leads={leads} events={evs} user={user}
          onOpen={setOpenId} onNew={startNew} onImport={() => setView("import")} onRename={rename} onDuplicate={duplicate}
          onPublish={(p) => setModal({ type: "publish", id: p.id })} onUnpublish={(p) => patch(p.id, { status: "draft" })} onDelete={remove} onPreview={openPreview} onSaveTpl={saveAsTpl}
          onLeads={() => setView("leads")} onAnalytics={() => setView("analytics")} onTemplates={() => setView("templates")} onConsult={consultOpen} onUseTpl={applyTpl} onDomain={(p) => { setDomFocus({ id: p.id, ts: Date.now() }); setView("domains"); }} />}
        {view === "import" && <ImportPage onBack={() => setView("pages")} onFile={importFile} />}
        {view === "templates" && <Templates mine={myTpl} onDeleteMine={(id) => putTpl(myTpl.filter((x) => x.id !== id))} onUse={(t) => applyTpl(t)} onSave={(t) => applyTpl(t, true)} />}
        {view === "forms" && <Forms forms={forms} onSave={onSaveForms} projects={listed} leads={leads} onAddToPage={addFormToPage} onLeads={() => setView("leads")} integ={integ} onIntegrations={() => setView("integrations")} />}
        {view === "calendar" && <Calendar events={cal} onSave={onSaveCal} leads={leads} projects={listed} integ={integ} onInteg={onInteg} onAddToPage={addHtmlToPage} onPatchLead={patchLead} onDeleteLead={deleteLead} />}
        {view === "integrations" && <Integrations key={igTile} initial={igTile} integ={integ} onChange={onInteg} />}
        {view === "followups" && <FollowUps leads={leads} setLeads={(list) => { setLeads(list); saveLeads(E, list); }} onPipeline={() => { localStorage.setItem("lb_leads_view", "pipeline"); setView("leads"); }} />}
        {view === "finder" && <Suspense fallback={<div className="lazy-load"><span className="pub-spin" /></div>}><LeadFinder user={user} integ={integ} me={me} onLeads={() => setLeads(loadLeads(E))} /></Suspense>}
        {view === "leads" && <Leads user={user} projects={listed} forms={forms} leads={leads} setLeads={setLeads} integ={integ} />}
        {view === "analytics" && <Analytics projects={listed} events={evs} leads={leads} onOpenProject={setOpenId} />}
        {view === "admin" && (me && (me.role === "admin" || me.role === "owner") ? <Suspense fallback={<div className="lazy-load"><span className="pub-spin" /></div>}><AdminPanel me={me} page /></Suspense>
          : <div className="panel adm-locked"><b>🔒 Admin panel</b><p className="mut">{me ? "Only the admin can open this page." : "Loading…"}</p></div>)}
        {view === "domains" && <Domains projects={listed} onPatch={patch} onPatchPage={patchPage} onInteg={onInteg} onOpen={setOpenId} integ={integ} onSetup={(tile) => goView("integrations", typeof tile === "string" ? tile : "server")} onPublish={(p) => setModal({ type: "publish", id: p.id })} me={me} focus={domFocus} />}
        {view === "lms" && <LMS user={user} />}
        {view === "pixels" && <Pixels integ={integ} onChange={onInteg} projects={listed} />}
        {view === "settings" && <Settings user={user} count={listed.length} onDeleteAll={() => setProjects([])} />}
      </Suspense></section>
      {modal && modal.type === "new" && <NewModal mine={myTpl} kind={modal.kind || "landing"} onClose={() => setModal(null)} onCreate={create} onImport={() => { setModal(null); setView("import"); }} ai={integ.ai} onSetupAI={() => { setModal(null); setView("integrations"); }} onStudio={(o) => { setModal(null); studioTab(o); }} />}
      {pubModal}
      {ai && <Suspense fallback={null}><Consultant open={!!ai} initial={ai} onClose={() => setAi(null)} projects={listed} events={evs} leads={leads} integ={integ} user={user} onCreate={(n, pages, t) => { if (!full()) create(n, pages, t); }} onStudio={(o) => { setAi(null); studioTab(o); }} /></Suspense>}
      {peek && (() => { const p = projects.find((x) => x.id === peek.id); return p ? <ProjectPeek p={p} onAi={() => aiProject(p)} onClose={() => setPeek(null)} onEdit={() => { setPeek(null); setOpenId(p.id); }} onTab={() => openPreview(p)}
        onSave={p.unsaved ? () => { if (saveDraft(p.id)) setPeek(null); } : null} onDiscard={p.unsaved ? () => { if (window.confirm(`Delete the unsaved "${p.name}"?`)) { discardDraft(p.id); setPeek(null); } } : null} onPublish={() => { setPeek(null); setModal({ type: "publish", id: p.id }); }} /> : null; })()}
      {aiEdit && <Suspense fallback={<div className="ais-boot"><span className="pub-spin" /></div>}><AiEditor integ={integ} item={aiEdit} onClose={aiClose} onDone={aiDone}
        badge={aiEdit.kind === "project" ? "Edit with AI" : "Template · edit with AI"}
        acts={aiEdit.kind === "project" ? [["save", "💾", "Save changes", "aip-save"], ["editor", "✏️", "Open in editor", "aip-edit"], ["copy", "📄", "Save as a new copy", "aip-draft"]] : undefined} /></Suspense>}
      {toast && <div className="dash-toast">{toast}</div>}
      {studio && <Suspense fallback={null}><AiStudio {...studio} integ={integ} onClose={closeStudio} onSetupAI={() => { closeStudio(); setView("integrations"); setIgTile("ai"); }} onCreate={studioDone} /></Suspense>}
    </div>
  );
}

/* preview of a project, full screen — exactly as visitors see it, with the action bar on the right */
function ProjectPeek({ p, onClose, onEdit, onSave, onDiscard, onTab, onPublish, onAi }) {
  const [i, setI] = useState("0"), [dev, setDev] = useState("desktop");
  const page = p.pages[Math.min(+i, p.pages.length - 1)];
  return (
    <RailView dev={dev} setDev={setDev} onClose={onClose} pages={p.pages.map((x, k) => ({ v: String(k), l: x.name }))} page={i} setPage={setI}
      actions={[{ ic: RI.edit, l: "Edit", cls: "k-pri", fn: onEdit }, onSave && { ic: RI.save, l: "Save", cls: "k-ok", fn: onSave },
        !onSave && { ic: RI.pub, l: p.status === "published" ? "Republish" : "Publish", fn: onPublish }, { ic: RI.tab, l: "New tab", fn: onTab },
        onDiscard && { ic: RI.del, l: "Delete", cls: "k-del", fn: onDiscard }]}>
      <iframe title={p.name} srcDoc={page.html} sandbox="allow-scripts allow-forms" />
    </RailView>
  );
}
