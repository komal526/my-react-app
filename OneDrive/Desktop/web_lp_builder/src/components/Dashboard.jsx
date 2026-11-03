// LaunchBuilder v3 — Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import Editor from "./Editor.jsx";
import { Sidebar, NewModal, PublishModal } from "./parts.jsx";
import MyPages from "./MyPages.jsx";
import Templates from "./Templates.jsx";
import Domains from "./Domains.jsx";
import Leads from "./Leads.jsx";
import Forms from "./Forms.jsx";
import Analytics from "./Analytics.jsx";
import Settings from "./Settings.jsx";
import ImportPage from "./ImportPage.jsx";
import { LIMIT, uid, slugify, pg, loadProjects, saveProjects, loadLeads, loadForms, saveForms, loadEvents, previewToken, previewUrl } from "../lib.js";
import { formHtml } from "./tools.js";

/* replace every copy of a linked form inside a page with its latest version */
const syncFormInHtml = (html, f) => {
  if (!html.includes(`data-lb-formbox="${f.id}"`)) return html;
  const d = new DOMParser().parseFromString(html, "text/html");
  d.querySelectorAll(`[data-lb-formbox="${f.id}"]`).forEach((n) => {
    const t = d.createElement("template"); t.innerHTML = formHtml(f); const nn = t.content.firstElementChild;
    if (n.getAttribute("data-lb-id")) nn.setAttribute("data-lb-id", n.getAttribute("data-lb-id"));
    n.replaceWith(nn);
  });
  return "<!DOCTYPE html>\n" + d.documentElement.outerHTML;
};

export default function Dashboard({ user, onLogout }) {
  const E = user.email;
  const [projects, setProjects] = useState(() => loadProjects(E));
  const [forms, setForms] = useState(() => loadForms(E)), [leads, setLeads] = useState(() => loadLeads(E)), [events, setEvents] = useState(() => loadEvents(E));
  const [view, setView] = useState("pages"), [openId, setOpenId] = useState(null), [modal, setModal] = useState(null);
  const syncT = useRef(0);
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
  const startNew = () => !full() && setModal({ type: "new" });
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
    syncT.current = setTimeout(() => setProjects((ps) => ps.map((p) => ({ ...p, pages: p.pages.map((x) => ({ ...x, html: changed.reduce((h, f) => syncFormInHtml(h, f), x.html) })) }))), 500);
  };
  const addFormToPage = (form, pid, pageId) => patchPages(pid, (pages) => pages.map((x) => {
    if (x.id !== pageId) return x;
    const d = new DOMParser().parseFromString(x.html, "text/html"), t = d.createElement("template");
    t.innerHTML = `<section data-lb-name="Form section" style="padding:64px 24px">${formHtml(form)}</section>`;
    const sec = t.content.firstElementChild, foot = [...d.body.children].reverse().find((n) => n.tagName === "FOOTER");
    foot ? foot.before(sec) : d.body.appendChild(sec);
    return { ...x, html: "<!DOCTYPE html>\n" + d.documentElement.outerHTML };
  }));
  const visits7 = events.filter((e) => e.t === "view" && Date.now() - e.ts < 7 * 864e5).length;

  const open = projects.find((p) => p.id === openId);
  const pub = modal && modal.type === "publish" && projects.find((p) => p.id === modal.id);
  const pubModal = pub && <PublishModal page={pub} onClose={() => setModal(null)} onDone={(o) => { patch(pub.id, o); setModal(null); }} />;

  if (open) return (
    <>
      <Editor key={open.id} page={open} user={user} forms={forms} onSave={(pid, h) => patchHtml(open.id, pid, h)} onPages={(fn) => patchPages(open.id, fn)} onType={(t) => patch(open.id, { type: t })}
        onBack={() => setOpenId(null)} onPublish={() => setModal({ type: "publish", id: open.id })} />
      {pubModal}
    </>
  );

  return (
    <div className="dash">
      <Sidebar view={view} onView={setView} count={projects.length} user={user} onLogout={onLogout} badges={{ leads: leads.filter((l) => l.status === "new").length, forms: forms.length }} />
      <section>
        {view === "pages" && <MyPages projects={projects} onOpen={setOpenId} onNew={startNew} onImport={() => setView("import")} onRename={rename} onDuplicate={duplicate}
          onPublish={(p) => setModal({ type: "publish", id: p.id })} onUnpublish={(p) => patch(p.id, { status: "draft" })} onDelete={remove} onPreview={openPreview}
          leadCount={leads.length} visits={visits7} onLeads={() => setView("leads")} onAnalytics={() => setView("analytics")} />}
        {view === "import" && <ImportPage onBack={() => setView("pages")} onFile={importFile} />}
        {view === "templates" && <Templates onUse={(t) => !full() && create(t.name, t.make(t.name), t.type)} />}
        {view === "forms" && <Forms forms={forms} onSave={onSaveForms} projects={projects} leads={leads} onAddToPage={addFormToPage} onLeads={() => setView("leads")} />}
        {view === "leads" && <Leads user={user} projects={projects} forms={forms} leads={leads} setLeads={setLeads} />}
        {view === "analytics" && <Analytics projects={projects} events={events} leads={leads} onOpenProject={setOpenId} />}
        {view === "domains" && <Domains projects={projects} onPatch={patch} onOpen={setOpenId} />}
        {view === "settings" && <Settings user={user} count={projects.length} onDeleteAll={() => setProjects([])} />}
      </section>
      {modal && modal.type === "new" && <NewModal onClose={() => setModal(null)} onCreate={create} onImport={() => { setModal(null); setView("import"); }} />}
      {pubModal}
    </div>
  );
}
