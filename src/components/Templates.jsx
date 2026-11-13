// LaunchBuilder v41 — Templates.jsx
import { useMemo, useState } from "react";
import { FILE_TEMPLATES, asTemplate, tplUrl } from "../lib.js";
import { Icon } from "./Inspector.jsx";

/* ================= Templates gallery: filters, search, hover-scroll previews, full-screen preview ================= */
const W = { desktop: "100%", tablet: "820px", mobile: "390px" };

function PreviewModal({ t, onClose, onUse }) {
  const pages = useMemo(() => (t.file ? [{ id: "f", name: "Home" }] : t.make(t.name)), [t]);
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
      <div className="tp-stage">{t.file ? <iframe title={t.name} src={tplUrl(t)} style={{ width: W[dev] }} sandbox="allow-scripts allow-same-origin allow-forms" /> : <iframe title={t.name} srcDoc={pages[i].html} style={{ width: W[dev] }} sandbox="allow-same-origin" />}</div>
    </div></div>
  );
}

/* hover a card: the page inside slowly scrolls down; leave: it glides back to the top */
const scrollers = new WeakMap();
function glide(card, down) {
  const f = card && card.querySelector(".tg-frame iframe"); if (!f) return;
  let w; try { w = f.contentWindow; if (!w || !w.document || !w.document.documentElement) return; } catch { return; }
  cancelAnimationFrame(scrollers.get(f));
  const d = w.document.documentElement, max = Math.max(0, d.scrollHeight - w.innerHeight), from = w.scrollY, to = down ? max : 0;
  const ms = down ? Math.min(9000, Math.max(2500, (max - from) * 1.6)) : 500, t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = down ? k : 1 - Math.pow(1 - k, 3); w.scrollTo({ top: from + (to - from) * e, behavior: "instant" }); if (k < 1) scrollers.set(f, requestAnimationFrame(step)); };
  scrollers.set(f, requestAnimationFrame(step));
}

export default function Templates({ onUse, mine = [], onDeleteMine = () => {} }) {
  const [type, setType] = useState("all"), [cat, setCat] = useState(""), [q, setQ] = useState(""), [open, setOpen] = useState(null);
  const MINE = mine.map(asTemplate);
  const ALL = [...MINE, ...FILE_TEMPLATES];
  const thumbs = useMemo(() => Object.fromEntries(MINE.map((t) => [t.key, t.make(t.name)])), [mine]); // eslint-disable-line react-hooks/exhaustive-deps
  const cats = type === "mine" ? [] : [...new Set(ALL.filter((t) => (type === "all" || t.type === type) && !t.mine).map((t) => t.cat).filter(Boolean))];
  const count = (k) => (k === "mine" ? MINE.length : k === "all" ? ALL.filter((t) => !t.mine).length : ALL.filter((t) => t.type === k && !t.mine).length);
  const list = ALL.filter((t) => (type === "mine" ? t.mine : type === "all" || q ? true : t.type === type) && (!cat || type === "mine" || t.cat === cat) && (!q || (t.name + " " + t.note + " " + t.cat).toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <div className="hb tg-hb">
        <div className="hb-l">
          <span className="hb-pill"><Icon n="card" s={13} /> Template library</span>
          <h2><span className="hb-w">Start with a design</span> <span className="hb-y">you'll love</span></h2>
          <div className="hb-feats">{["Fully responsive", "Every part editable", "Forms built in", "Publish in one click"].map((c, i) => <span key={c} style={{ "--d": 0.35 + i * 0.08 + "s" }}><i>✓</i>{c}</span>)}</div>
        </div>
        <label className="tg-hsearch"><Icon n="search" s={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates — yoga, hotel, school…" /></label>
        <div className="hb-fanwrap" aria-hidden="true"><div className="hx-art hb-fan">
          {[["c1", "#c07a5b", "Yoga"], ["c2", "#0ea5e9", "Hotel"], ["c5", "#7c3aed", "Webinar"], ["c6", "#d4a843", "School"]].map(([k, c, t]) => (
            <div key={k} className={"hx-card " + k} style={{ "--c": c }}><i /><b>{t}</b><span /><span className="s" /><em /></div>))}
          <div className="hx-lap"><div className="hx-scr"><div className="hx-nav"><i /><i /><i /></div><b>16 ready <br />designs</b><span /><span className="s" /><em>Use template</em><div className="hx-plant" /></div></div>
          <div className="hx-base" /><div className="hx-ai">16</div>
        </div></div>
      </div>
      <div className="tg-filters">
        <div className="tg-type-tabs">{[["all", "All templates", "Every ready-made design", "grid"], ["landing", "Landing pages", "One focused page — offers, signups, events", "hero"], ["website", "Websites", "Full business websites", "pages"], ["mine", "My templates", "Saved from your own projects", "star"]].map(([k, l, d, ic]) => <button key={k} className={type === k ? "on" : ""} onClick={() => { setType(k); setCat(""); }}><Icon n={ic} s={20} /><span><b>{l} <em>{count(k)}</em></b><small>{d}</small></span></button>)}</div>
        <div className="tg-cats"><button className={!cat ? "on" : ""} onClick={() => setCat("")}>All {type === "website" ? "websites" : type === "landing" ? "landing pages" : "categories"}</button>{cats.map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(cat === c ? "" : c)}>{c}</button>)}</div>
      </div>
      {!list.length && (type === "mine" ? <div className="empty"><b>No saved templates yet</b><p className="mut">Open <b>Projects</b>, click <b>⋯</b> on any project and choose <b>Save as template</b>. It appears here for you to reuse.</p></div>
        : <div className="empty"><b>No templates match</b><p className="mut">Try another word or clear the filters.</p></div>)}
      <div className="tg-grid">{list.map((t) => { const pages = thumbs[t.key] || [{ html: "" }]; return (
        <div key={t.key || t.name} className="tg-card" onMouseEnter={(e) => glide(e.currentTarget, true)} onMouseLeave={(e) => glide(e.currentTarget, false)}>
          <div className="tg-shot" onClick={() => setOpen(t)}>
            <div className="tg-chrome"><i /><i /><i /><span>{t.file ? (t.type === "website" ? "Website" : "Landing page") : pages.length > 1 ? `${pages.length} pages` : "1 page"}</span></div>
            <div className="tg-frame">{t.file ? <iframe title={t.name} src={tplUrl(t)} loading="lazy" sandbox="allow-scripts allow-same-origin" tabIndex={-1} scrolling="no" /> : <iframe title={t.name} srcDoc={pages[0].html} sandbox="allow-same-origin" tabIndex={-1} />}</div>
            <div className="tg-hover"><button onClick={(e) => { e.stopPropagation(); setOpen(t); }}>👁 Preview</button><button className="pri" onClick={(e) => { e.stopPropagation(); onUse(t); }}>Use template</button></div>
          </div>
          <div className="tg-info">
            <div className="tg-row"><b>{t.name}</b>{t.mine && <span className="tg-mine">★ Mine</span>}<span className={"tg-type " + t.type}>{t.type === "website" ? "Website" : "Landing"}</span></div>
            <p>{t.note}</p>
            <div className="tg-meta"><i style={{ background: t.accent || "#9aa3b8" }} />{t.cat}{t.mine && <button className="tg-del" onClick={() => { if (window.confirm(`Delete the template "${t.name}"? Your original project stays.`)) onDeleteMine(t.id); }}>Delete</button>}</div>
          </div>
        </div>); })}</div>
      {open && <PreviewModal t={open} onClose={() => setOpen(null)} onUse={(t) => { setOpen(null); onUse(t); }} />}
    </>
  );
}
