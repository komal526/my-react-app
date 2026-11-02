import { useState } from "react";
import { Thumb } from "./parts.jsx";
import { ago, addr } from "../lib.js";

export default function MyPages({ projects, onOpen, onNew, onImport, onRename, onDuplicate, onPublish, onUnpublish, onDelete }) {
  const [filter, setFilter] = useState("All"), [menu, setMenu] = useState(null);
  const shown = projects.filter((p) => filter === "All" || p.status === filter.toLowerCase());
  const live = projects.filter((p) => p.status === "published").length;
  const act = (fn, p) => () => { setMenu(null); fn(p); };
  return (
    <div onClick={() => setMenu(null)}>
      <div className="top"><div><h1>My pages &amp; websites</h1><p className="mut">Build, publish and update pages without writing code.</p></div><button className="pri big" onClick={onNew}>＋ Create new</button></div>
      <div className="stats">
        <div className="stat"><span>Published</span><b>{live}</b></div>
        <div className="stat"><span>Visits, last 7 days</span><b>0</b></div>
        <div className="stat"><span>Leads collected</span><b>0</b></div>
      </div>
      <div className="chips">{["All", "Published", "Draft"].map((f) => <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>)}</div>
      {!shown.length ? (
        <div className="empty"><b>{projects.length ? "Nothing in this filter" : "Nothing here yet"}</b><p className="mut">Create a landing page or a website, or import an existing HTML file.</p><button className="pri" onClick={onNew}>＋ Create new</button> <button onClick={onImport}>Import HTML</button></div>
      ) : (
        <div className="grid">{shown.map((p) => (
          <div key={p.id} className="card" onClick={() => onOpen(p.id)}>
            <Thumb html={p.pages[0].html} />
            <div className="cb">
              <div className="ct"><b>{p.name}</b><span className={"badge " + p.status}>{p.status === "published" ? "Published" : "Draft"}</span></div>
              <div className="mut">{p.status === "published" ? addr(p) : "Not published yet"}</div>
              <div className="mut sm"><span className="tag">{p.type === "website" ? `Website · ${p.pages.length} page${p.pages.length > 1 ? "s" : ""}` : "Landing page"}</span> Edited {ago(p.updated)}</div>
            </div>
            <button className="dots" onClick={(e) => { e.stopPropagation(); setMenu(menu === p.id ? null : p.id); }}>⋯</button>
            {menu === p.id && (
              <div className="menu" onClick={(e) => e.stopPropagation()}>
                <div onClick={() => onOpen(p.id)}>Edit</div><div onClick={act(onRename, p)}>Rename</div><div onClick={act(onDuplicate, p)}>Duplicate</div>
                <div onClick={act(onPublish, p)}>{p.status === "published" ? "Change address / republish" : "Publish"}</div>
                {p.status === "published" && <div onClick={act(onUnpublish, p)}>Unpublish</div>}
                <div className="red" onClick={act(onDelete, p)}>Delete</div>
              </div>)}
          </div>))}</div>
      )}
    </div>
  );
}
