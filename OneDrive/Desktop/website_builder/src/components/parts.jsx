// Shared pieces: Modal, Thumb, Sidebar, NewModal, PublishModal
import { useState } from "react";
import { LIMIT, slugify, TEMPLATES } from "../lib.js";


export function Modal({ children, onClose }) {
  return <div className="ov" onClick={onClose}><div className="md" onClick={(e) => e.stopPropagation()}>{children}</div></div>;
}

// Small live preview of a page (no scripts run inside it)
export function Thumb({ html }) {
  return <div className="thumb"><iframe title="preview" srcDoc={html} sandbox="" tabIndex={-1} /></div>;
}


const NAV = [["pages", "▦", "My pages"], ["templates", "▤", "Templates"], ["domains", "◍", "Domains"], ["leads", "✉", "Leads"], ["settings", "⚙", "Settings"]];

export function Sidebar({ view, onView, count, user, onLogout }) {
  return (
    <nav>
      <div className="brand"><span>✎</span>LaunchBuilder</div>
      {NAV.map(([k, ic, nm]) => (
        <div key={k} className={"nv" + (view === k || (k === "pages" && view === "import") ? " on" : "")} onClick={() => onView(k)}><i>{ic}</i>{nm}</div>
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

