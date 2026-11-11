import { useState, useEffect } from "react";
import Editor from "./Editor.jsx";
import { Sidebar, NewModal, PublishModal } from "./parts.jsx";
import MyPages from "./MyPages.jsx";
import Templates from "./Templates.jsx";
import Domains from "./Domains.jsx";
import Leads from "./Leads.jsx";
import Settings from "./Settings.jsx";
import ImportPage from "./ImportPage.jsx";
import { LIMIT, uid, slugify, pg, loadProjects, saveProjects } from "../lib.js";

export default function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useState(() => loadProjects(user.email));
  const [view, setView] = useState("pages"), [openId, setOpenId] = useState(null), [modal, setModal] = useState(null);
  useEffect(() => { if (!saveProjects(user.email, projects)) alert("Browser storage is full. Delete some projects or use smaller images."); }, [projects]);

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

  const open = projects.find((p) => p.id === openId);
  const pub = modal && modal.type === "publish" && projects.find((p) => p.id === modal.id);
  const pubModal = pub && <PublishModal page={pub} onClose={() => setModal(null)} onDone={(o) => { patch(pub.id, o); setModal(null); }} />;

  if (open) return (
    <>
      <Editor key={open.id} page={open} onSave={(pid, h) => patchHtml(open.id, pid, h)} onPages={(fn) => patchPages(open.id, fn)} onType={(t) => patch(open.id, { type: t })}
        onBack={() => setOpenId(null)} onPublish={() => setModal({ type: "publish", id: open.id })} />
      {pubModal}
    </>
  );

  return (
    <div className="dash">
      <Sidebar view={view} onView={setView} count={projects.length} user={user} onLogout={onLogout} />
      <section>
        {view === "pages" && <MyPages projects={projects} onOpen={setOpenId} onNew={startNew} onImport={() => setView("import")} onRename={rename} onDuplicate={duplicate}
          onPublish={(p) => setModal({ type: "publish", id: p.id })} onUnpublish={(p) => patch(p.id, { status: "draft" })} onDelete={remove} />}
        {view === "import" && <ImportPage onBack={() => setView("pages")} onFile={importFile} />}
        {view === "templates" && <Templates onUse={(t) => !full() && create(t.name, t.make(t.name), t.type)} />}
        {view === "domains" && <Domains projects={projects} />}
        {view === "leads" && <Leads />}
        {view === "settings" && <Settings user={user} count={projects.length} onDeleteAll={() => setProjects([])} />}
      </section>
      {modal && modal.type === "new" && <NewModal onClose={() => setModal(null)} onCreate={create} onImport={() => { setModal(null); setView("import"); }} />}
      {pubModal}
    </div>
  );
}
