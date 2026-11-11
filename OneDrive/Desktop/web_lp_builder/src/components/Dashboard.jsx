// LaunchBuilder v27 — Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import Editor from "./Editor.jsx";
import { Sidebar, NewModal, PublishModal } from "./parts.jsx";
import MyPages from "./MyPages.jsx";
import Templates from "./Templates.jsx";
import Domains from "./Domains.jsx";
import Leads from "./Leads.jsx";
import Forms from "./Forms.jsx";
import Analytics from "./Analytics.jsx";
import Integrations from "./Integrations.jsx";
import Calendar from "./Calendar.jsx";
import { Icon } from "./Inspector.jsx";
import Settings from "./Settings.jsx";
import Pixels from "./Pixels.jsx";
import ImportPage from "./ImportPage.jsx";
import { LIMIT, uid, slugify, pg, loadProjects, saveProjects, loadLeads, loadForms, saveForms, loadEvents, previewToken, previewUrl, loadInteg, saveInteg, syncServerLeads, serverOn, loadCal, saveCal, saveLeads } from "../lib.js";
import { formHtml, bookingWidget } from "./tools.js";

/* replace every copy of a linked calendar inside a page with its latest version */
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
function TopBar({ user, q, setQ, newLeads, onLeads, onSettings, onLogout, um, setUm }) {
  const h = new Date().getHours(), hi = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const first = (user.name || "").split(" ")[0] || "there";
  return (
    <div className="tb2">
      <div className="tb2-hi"><h1>{hi}, <span>{first}</span> 👋</h1><p>Build high-converting landing pages and websites in minutes.</p></div>
      <label className="tb2-search"><Icon n="search" s={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search websites, landing pages…" /></label>
      <button className="tb2-bell" onClick={onLeads} title={newLeads ? newLeads + " new leads" : "Notifications"}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>{newLeads > 0 && <i>{newLeads > 9 ? "9+" : newLeads}</i>}</button>
      <div className="tb2-me" onClick={(e) => { e.stopPropagation(); setUm(!um); }}><span className="av">{(user.name || "U")[0].toUpperCase()}</span><b>{first}</b><Icon n="chevd" s={14} />
        {um && <div className="menu tb2-menu" onClick={(e) => e.stopPropagation()}><div onClick={() => { setUm(false); onSettings(); }}>Settings</div><div className="red" onClick={onLogout}>Log out</div></div>}</div>
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  const E = user.email;
  const [projects, setProjects] = useState(() => loadProjects(E));
  const [forms, setForms] = useState(() => loadForms(E)), [leads, setLeads] = useState(() => loadLeads(E)), [events, setEvents] = useState(() => loadEvents(E));
  const [view, setView] = useState("pages"), [openId, setOpenId] = useState(null), [modal, setModal] = useState(null);
  const syncT = useRef(0);
  const [integ, setInteg] = useState(() => loadInteg(E));
  const onInteg = (v) => { setInteg(v); saveInteg(E, v); };
  const [igTile, setIgTile] = useState(""), [navOpen, setNavOpen] = useState(false), [q, setQ] = useState(""), [um, setUm] = useState(false), [mini, setMini] = useState(() => localStorage.getItem("lb_nav_mini") === "1");
  const [cal, setCal] = useState(() => loadCal(E));
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
  useEffect(() => { if (!saveProjects(E, projects)) alert("Browser storage is full. Delete some projects or use smaller images."); }, [projects, E]);
  /* leads / visits arrive from preview & form-link tabs */
  useEffect(() => {
    const f = (e) => { if (!e || !e.key || e.key === "lb_leads_" + E) setLeads(loadLeads(E)); if (!e || !e.key || e.key === "lb_events_" + E) setEvents(loadEvents(E)); };
    const g = () => f(); window.addEventListener("storage", f); window.addEventListener("lb-leads", g);
    return () => { window.removeEventListener("storage", f); window.removeEventListener("lb-leads", g); };
  }, [E]);
  const openPreview = (p) => window.open(previewUrl(previewToken(E, p.id)), "_blank");

  /* ---- project actions ---- */
  const patch = (id, o) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...o, updated: Date.now() } : p)));
  const patchHtml = (id, pid, html) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, updated: Date.now(), pages: p.pages.map((x) => (x.id === pid ? { ...x, html } : x)) } : p)));
  const patchPages = (id, fn) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, updated: Date.now(), pages: fn(p.pages) } : p)));
  const full = () => projects.length >= LIMIT && (alert(`Free plan allows ${LIMIT} projects. Delete one to add another.`), true);
  const create = (name, pages, type) => {
    const p = { id: uid(), name, type, status: "draft", slug: slugify(name), domain: "", pages, updated: Date.now(), versions: [] };
    setProjects((ps) => [p, ...ps]); setOpenId(p.id); setModal(null); setView("pages");
  };
  const startNew = (kind) => !full() && setModal({ type: "new", kind: kind === "website" ? "website" : "landing" });
  const duplicate = (p) => !full() && create(p.name + " copy", p.pages.map((x) => ({ ...x, id: uid() })), p.type);
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

  const open = projects.find((p) => p.id === openId);
  const pub = modal && modal.type === "publish" && projects.find((p) => p.id === modal.id);
  const goView = (v, tile = "") => { setModal(null); setOpenId(null); setIgTile(tile); setView(v); };
  const pubModal = pub && <PublishModal page={pub} integ={integ} onInteg={onInteg} onClose={() => setModal(null)} onDone={(o, keep) => { patch(pub.id, o); if (!keep) setModal(null); }} onSetup={(tile) => goView("integrations", typeof tile === "string" ? tile : "server")} onDomains={() => goView("domains")} />;

  if (open) return (
    <>
      <Editor key={open.id} page={open} user={user} forms={forms} events={cal} integ={integ} onSave={(pid, h) => patchHtml(open.id, pid, h)} onPages={(fn) => patchPages(open.id, fn)} onType={(t) => patch(open.id, { type: t })}
        onBack={() => setOpenId(null)} onPublish={() => setModal({ type: "publish", id: open.id })} />
      {pubModal}
    </>
  );

  return (
    <div className={"dash" + (mini ? " mini" : "")} onClick={() => um && setUm(false)}>
      <Sidebar mini={mini} onMini={() => { const v = !mini; setMini(v); localStorage.setItem("lb_nav_mini", v ? "1" : "0"); }} open={navOpen} onClose={() => setNavOpen(false)} view={view} onView={setView} count={projects.length} user={user} onLogout={onLogout} badges={{ leads: leads.filter((l) => l.status === "new").length, forms: forms.length, calendar: cal.length }} />
      {navOpen && <div className="nv-ov" onClick={() => setNavOpen(false)} />}
      <section>
        <div className="mbar"><button className="mbar-btn" onClick={() => setNavOpen(true)} aria-label="Open menu"><span /><span /><span /></button>
          <div className="mbar-brand"><span className="mbar-logo">⬡</span>LaunchBuilder</div>
          {["pages", "websites", "landings"].includes(view) && <button className="mbar-new" onClick={() => startNew(view === "websites" ? "website" : "landing")} aria-label="Create new">＋</button>}</div>
        <TopBar user={user} q={q} setQ={(v) => { setQ(v); if (v && !["pages", "websites", "landings"].includes(view)) setView("pages"); }} newLeads={leads.filter((l) => l.status === "new").length}
          onLeads={() => setView("leads")} onSettings={() => setView("settings")} onLogout={onLogout} um={um} setUm={setUm} />
        {["pages", "websites", "landings"].includes(view) && <MyPages mode={view === "websites" ? "website" : view === "landings" ? "landing" : "dash"} query={q} projects={projects} leads={leads} events={events} user={user}
          onOpen={setOpenId} onNew={startNew} onImport={() => setView("import")} onRename={rename} onDuplicate={duplicate}
          onPublish={(p) => setModal({ type: "publish", id: p.id })} onUnpublish={(p) => patch(p.id, { status: "draft" })} onDelete={remove} onPreview={openPreview}
          onLeads={() => setView("leads")} onAnalytics={() => setView("analytics")} onTemplates={() => setView("templates")} />}
        {view === "import" && <ImportPage onBack={() => setView("pages")} onFile={importFile} />}
        {view === "templates" && <Templates onUse={(t) => !full() && create(t.name, t.make(t.name), t.type)} />}
        {view === "forms" && <Forms forms={forms} onSave={onSaveForms} projects={projects} leads={leads} onAddToPage={addFormToPage} onLeads={() => setView("leads")} integ={integ} onIntegrations={() => setView("integrations")} />}
        {view === "calendar" && <Calendar events={cal} onSave={onSaveCal} leads={leads} projects={projects} integ={integ} onInteg={onInteg} onAddToPage={addHtmlToPage} onPatchLead={patchLead} onDeleteLead={deleteLead} />}
        {view === "integrations" && <Integrations key={igTile} initial={igTile} integ={integ} onChange={onInteg} />}
        {view === "leads" && <Leads user={user} projects={projects} forms={forms} leads={leads} setLeads={setLeads} integ={integ} />}
        {view === "analytics" && <Analytics projects={projects} events={events} leads={leads} onOpenProject={setOpenId} />}
        {view === "domains" && <Domains projects={projects} onPatch={patch} onPatchPage={patchPage} onInteg={onInteg} onOpen={setOpenId} integ={integ} onSetup={(tile) => goView("integrations", typeof tile === "string" ? tile : "server")} onPublish={(p) => setModal({ type: "publish", id: p.id })} />}
        {view === "pixels" && <Pixels integ={integ} onChange={onInteg} projects={projects} />}
        // LaunchBuilder v27 — Dashboard.jsx
        import { useState, useEffect, useRef } from "react";
        import Editor from "./Editor.jsx";
        import { Sidebar, NewModal, PublishModal } from "./parts.jsx";
        import MyPages from "./MyPages.jsx";
        import Templates from "./Templates.jsx";
        import Domains from "./Domains.jsx";
        import Leads from "./Leads.jsx";
        import Forms from "./Forms.jsx";
        import Analytics from "./Analytics.jsx";
        import Integrations from "./Integrations.jsx";
        import Calendar from "./Calendar.jsx";
        import { Icon } from "./Inspector.jsx";
        import Settings from "./Settings.jsx";
        import Pixels from "./Pixels.jsx";
        import ImportPage from "./ImportPage.jsx";
        import { LIMIT, uid, slugify, pg, loadProjects, saveProjects, loadLeads, loadForms, saveForms, loadEvents, previewToken, previewUrl, loadInteg, saveInteg, syncServerLeads, serverOn, loadCal, saveCal, saveLeads, loadMyTpl, saveMyTpl } from "../lib.js";
        import { formHtml, bookingWidget } from "./tools.js";
        
        /* replace every copy of a linked calendar inside a page with its latest version */
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
        function TopBar({ user, q, setQ, newLeads, onLeads, onSettings, onLogout, um, setUm }) {
          const h = new Date().getHours(), hi = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
          const first = (user.name || "").split(" ")[0] || "there";
          return (
            <div className="tb2">
              <div className="tb2-hi"><h1>{hi}, <span>{first}</span> 👋</h1><p>Build high-converting landing pages and websites in minutes.</p></div>
              <label className="tb2-search"><Icon n="search" s={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search websites, landing pages…" /></label>
              <button className="tb2-bell" onClick={onLeads} title={newLeads ? newLeads + " new leads" : "Notifications"}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>{newLeads > 0 && <i>{newLeads > 9 ? "9+" : newLeads}</i>}</button>
              <div className="tb2-me" onClick={(e) => { e.stopPropagation(); setUm(!um); }}><span className="av">{(user.name || "U")[0].toUpperCase()}</span><b>{first}</b><Icon n="chevd" s={14} />
                {um && <div className="menu tb2-menu" onClick={(e) => e.stopPropagation()}><div onClick={() => { setUm(false); onSettings(); }}>Settings</div><div className="red" onClick={onLogout}>Log out</div></div>}</div>
            </div>
          );
        }
        
        export default function Dashboard({ user, onLogout }) {
          const E = user.email;
          const [projects, setProjects] = useState(() => loadProjects(E));
          const [forms, setForms] = useState(() => loadForms(E)), [leads, setLeads] = useState(() => loadLeads(E)), [events, setEvents] = useState(() => loadEvents(E));
          const [view, setView] = useState("pages"), [openId, setOpenId] = useState(null), [modal, setModal] = useState(null);
          const syncT = useRef(0);
          const [integ, setInteg] = useState(() => loadInteg(E));
          const onInteg = (v) => { setInteg(v); saveInteg(E, v); };
          const [igTile, setIgTile] = useState(""), [navOpen, setNavOpen] = useState(false), [q, setQ] = useState(""), [um, setUm] = useState(false), [mini, setMini] = useState(() => localStorage.getItem("lb_nav_mini") === "1");
          const [cal, setCal] = useState(() => loadCal(E));
          const [myTpl, setMyTpl] = useState(() => loadMyTpl(E));
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
          useEffect(() => { if (!saveProjects(E, projects)) alert("Browser storage is full. Delete some projects or use smaller images."); }, [projects, E]);
          /* leads / visits arrive from preview & form-link tabs */
          useEffect(() => {
            const f = (e) => { if (!e || !e.key || e.key === "lb_leads_" + E) setLeads(loadLeads(E)); if (!e || !e.key || e.key === "lb_events_" + E) setEvents(loadEvents(E)); };
            const g = () => f(); window.addEventListener("storage", f); window.addEventListener("lb-leads", g);
            return () => { window.removeEventListener("storage", f); window.removeEventListener("lb-leads", g); };
          }, [E]);
          const openPreview = (p) => window.open(previewUrl(previewToken(E, p.id)), "_blank");
        
          /* ---- project actions ---- */
          const patch = (id, o) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...o, updated: Date.now() } : p)));
          const patchHtml = (id, pid, html) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, updated: Date.now(), pages: p.pages.map((x) => (x.id === pid ? { ...x, html } : x)) } : p)));
          const patchPages = (id, fn) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, updated: Date.now(), pages: fn(p.pages) } : p)));
          const full = () => projects.length >= LIMIT && (alert(`Free plan allows ${LIMIT} projects. Delete one to add another.`), true);
          const create = (name, pages, type) => {
            const p = { id: uid(), name, type, status: "draft", slug: slugify(name), domain: "", pages, updated: Date.now(), versions: [] };
            setProjects((ps) => [p, ...ps]); setOpenId(p.id); setModal(null); setView("pages");
          };
          const startNew = (kind) => !full() && setModal({ type: "new", kind: kind === "website" ? "website" : "landing" });
          const duplicate = (p) => !full() && create(p.name + " copy", p.pages.map((x) => ({ ...x, id: uid() })), p.type);
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
        
          const open = projects.find((p) => p.id === openId);
          const pub = modal && modal.type === "publish" && projects.find((p) => p.id === modal.id);
          const goView = (v, tile = "") => { setModal(null); setOpenId(null); setIgTile(tile); setView(v); };
          const pubModal = pub && <PublishModal page={pub} integ={integ} onInteg={onInteg} onClose={() => setModal(null)} onDone={(o, keep) => { patch(pub.id, o); if (!keep) setModal(null); }} onSetup={(tile) => goView("integrations", typeof tile === "string" ? tile : "server")} onDomains={() => goView("domains")} />;
        
          if (open) return (
            <>
              <Editor key={open.id} page={open} user={user} forms={forms} events={cal} integ={integ} onSave={(pid, h) => patchHtml(open.id, pid, h)} onPages={(fn) => patchPages(open.id, fn)} onType={(t) => patch(open.id, { type: t })}
                onBack={() => setOpenId(null)} onPublish={() => setModal({ type: "publish", id: open.id })} />
              {pubModal}
            </>
          );
        
          return (
            <div className={"dash" + (mini ? " mini" : "")} onClick={() => um && setUm(false)}>
              <Sidebar mini={mini} onMini={() => { const v = !mini; setMini(v); localStorage.setItem("lb_nav_mini", v ? "1" : "0"); }} open={navOpen} onClose={() => setNavOpen(false)} view={view} onView={setView} count={projects.length} user={user} onLogout={onLogout} badges={{ leads: leads.filter((l) => l.status === "new").length, forms: forms.length, calendar: cal.length }} />
              {navOpen && <div className="nv-ov" onClick={() => setNavOpen(false)} />}
              <section>
                <div className="mbar"><button className="mbar-btn" onClick={() => setNavOpen(true)} aria-label="Open menu"><span /><span /><span /></button>
                  <div className="mbar-brand"><span className="mbar-logo">⬡</span>LaunchBuilder</div>
                  {["pages", "websites", "landings"].includes(view) && <button className="mbar-new" onClick={() => startNew(view === "websites" ? "website" : "landing")} aria-label="Create new">＋</button>}</div>
                <TopBar user={user} q={q} setQ={(v) => { setQ(v); if (v && !["pages", "websites", "landings"].includes(view)) setView("pages"); }} newLeads={leads.filter((l) => l.status === "new").length}
                  onLeads={() => setView("leads")} onSettings={() => setView("settings")} onLogout={onLogout} um={um} setUm={setUm} />
                {["pages", "websites", "landings"].includes(view) && <MyPages mode={view === "websites" ? "website" : view === "landings" ? "landing" : "dash"} query={q} projects={projects} leads={leads} events={events} user={user}
                  onOpen={setOpenId} onNew={startNew} onImport={() => setView("import")} onRename={rename} onDuplicate={duplicate}
                  onPublish={(p) => setModal({ type: "publish", id: p.id })} onUnpublish={(p) => patch(p.id, { status: "draft" })} onDelete={remove} onPreview={openPreview} onSaveTpl={saveAsTpl}
                  onLeads={() => setView("leads")} onAnalytics={() => setView("analytics")} onTemplates={() => setView("templates")} />}
                {view === "import" && <ImportPage onBack={() => setView("pages")} onFile={importFile} />}
                {view === "templates" && <Templates mine={myTpl} onDeleteMine={(id) => putTpl(myTpl.filter((x) => x.id !== id))} onUse={(t) => !full() && create(t.mine ? t.name + " (copy)" : t.name, t.make(t.name), t.type)} />}
                {view === "forms" && <Forms forms={forms} onSave={onSaveForms} projects={projects} leads={leads} onAddToPage={addFormToPage} onLeads={() => setView("leads")} integ={integ} onIntegrations={() => setView("integrations")} />}
                {view === "calendar" && <Calendar events={cal} onSave={onSaveCal} leads={leads} projects={projects} integ={integ} onInteg={onInteg} onAddToPage={addHtmlToPage} onPatchLead={patchLead} onDeleteLead={deleteLead} />}
                {view === "integrations" && <Integrations key={igTile} initial={igTile} integ={integ} onChange={onInteg} />}
                {view === "leads" && <Leads user={user} projects={projects} forms={forms} leads={leads} setLeads={setLeads} integ={integ} />}
                {view === "analytics" && <Analytics projects={projects} events={events} leads={leads} onOpenProject={setOpenId} />}
                {view === "domains" && <Domains projects={projects} onPatch={patch} onPatchPage={patchPage} onInteg={onInteg} onOpen={setOpenId} integ={integ} onSetup={(tile) => goView("integrations", typeof tile === "string" ? tile : "server")} onPublish={(p) => setModal({ type: "publish", id: p.id })} />}
                {view === "pixels" && <Pixels integ={integ} onChange={onInteg} projects={projects} />}
                {view === "settings" && <Settings user={user} count={projects.length} onDeleteAll={() => setProjects([])} />}
              </section>
              {modal && modal.type === "new" && <NewModal mine={myTpl} kind={modal.kind || "landing"} onClose={() => setModal(null)} onCreate={create} onImport={() => { setModal(null); setView("import"); }} ai={integ.ai} onSetupAI={() => { setModal(null); setView("integrations"); }} />}
              {pubModal}
            </div>
          );
        }
        {view === "settings" && <Settings user={user} count={projects.length} onDeleteAll={() => setProjects([])} />}
      </section>
      {modal && modal.type === "new" && <NewModal kind={modal.kind || "landing"} onClose={() => setModal(null)} onCreate={create} onImport={() => { setModal(null); setView("import"); }} ai={integ.ai} onSetupAI={() => { setModal(null); setView("integrations"); }} />}
      {pubModal}
    </div>
  );
}
