// LaunchBuilder v11 — Templates.jsx
import { useMemo, useState } from "react";
import { TEMPLATES } from "../lib.js";
import { Icon } from "./Inspector.jsx";

/* ================= Templates gallery: filters, search, hover-scroll previews, full-screen preview ================= */
const W = { desktop: "100%", tablet: "820px", mobile: "390px" };

function PreviewModal({ t, onClose, onUse }) {
  const pages = useMemo(() => t.make(t.name), [t]);
  const [i, setI] = useState(0), [dev, setDev] = useState("desktop");
  return (
    <div className="tp-ov" onClick={onClose}><div className="tp-box" onClick={(e) => e.stopPropagation()}>
      <div className="tp-bar">
        <div className="tp-ttl"><i style={{ background: t.accent || "#3d6bff" }} /><b>{t.name}</b><span>{t.cat}</span></div>
        {pages.length > 1 && <div className="tp-pages">{pages.map((p, k) => <button key={p.id} className={i === k ? "on" : ""} onClick={() => setI(k)}>{p.name}</button>)}</div>}
        <div className="tp-dev">{Object.keys(W).map((d) => <button key={d} title={d[0].toUpperCase() + d.slice(1)} className={dev === d ? "on" : ""} onClick={() => setDev(d)}><Icon n={d} s={17} /></button>)}</div>
        <button className="pri" onClick={() => onUse(t)}>Use this template</button>
        <button className="tp-x" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="tp-stage"><iframe title={t.name} srcDoc={pages[i].html} style={{ width: W[dev] }} sandbox="allow-same-origin" /></div>
    </div></div>
  );
}

export default function Templates({ onUse }) {
  const [type, setType] = useState("landing"), [cat, setCat] = useState(""), [q, setQ] = useState(""), [open, setOpen] = useState(null);
  const ALL = TEMPLATES.filter((t) => !t.hidden);
  const thumbs = useMemo(() => Object.fromEntries(ALL.map((t) => [t.key || t.name, t.make(t.name)])), []);
  const cats = [...new Set(ALL.filter((t) => t.type === type).map((t) => t.cat).filter(Boolean))];
  const count = (k) => ALL.filter((t) => t.type === k).length;
  const list = ALL.filter((t) => (q || type === "all" || t.type === type) && (!cat || t.cat === cat) && (!q || (t.name + " " + t.note + " " + t.cat).toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <div className="tg-hero">
        <div><span className="tg-kick">Template library</span><h1>Start with a design you'll love</h1><p className="mut">Professionally designed, fully responsive, and every part is editable — text, colours, images, sections and forms.</p></div>
        <div className="tg-search"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates — e.g. clinic, workshop, SaaS…" /></div>
      </div>
      <div className="tg-filters">
        <div className="tg-type-tabs">{[["landing", "Landing pages", "One focused page — offers, signups, events", "hero"], ["website", "Websites", "Several pages with a shared menu", "pages"]].map(([k, l, d, ic]) => <button key={k} className={type === k ? "on" : ""} onClick={() => { setType(k); setCat(""); }}><Icon n={ic} s={20} /><span><b>{l} <em>{count(k)}</em></b><small>{d}</small></span></button>)}</div>
        <div className="tg-cats"><button className={!cat ? "on" : ""} onClick={() => setCat("")}>All {type === "website" ? "websites" : "landing pages"}</button>{cats.map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(cat === c ? "" : c)}>{c}</button>)}</div>
      </div>
      {!list.length && <div className="empty"><b>No templates match</b><p className="mut">Try another word or clear the filters.</p></div>}
      <div className="tg-grid">{list.map((t) => { const pages = thumbs[t.key || t.name]; return (
        <div key={t.key || t.name} className="tg-card">
          <div className="tg-shot" onClick={() => setOpen(t)}>
            <div className="tg-chrome"><i /><i /><i /><span>{pages.length > 1 ? `${pages.length} pages` : "1 page"}</span></div>
            <div className="tg-frame"><iframe title={t.name} srcDoc={pages[0].html} sandbox="allow-same-origin" tabIndex={-1} /></div>
            <div className="tg-hover"><button onClick={(e) => { e.stopPropagation(); setOpen(t); }}>👁 Preview</button><button className="pri" onClick={(e) => { e.stopPropagation(); onUse(t); }}>Use template</button></div>
          </div>
          <div className="tg-info">
            <div className="tg-row"><b>{t.name}</b><span className={"tg-type " + t.type}>{t.type === "website" ? "Website" : "Landing"}</span></div>
            <p>{t.note}</p>
            <div className="tg-meta"><i style={{ background: t.accent || "#9aa3b8" }} />{t.cat}</div>
          </div>
        </div>); })}</div>
      {open && <PreviewModal t={open} onClose={() => setOpen(null)} onUse={(t) => { setOpen(null); onUse(t); }} />}
    </>
  );
}
