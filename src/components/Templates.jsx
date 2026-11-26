// LaunchBuilder v42 — Templates.jsx (fast: image previews, live page only on hover)
import { useMemo, useState } from "react";
import { FILE_TEMPLATES, asTemplate, tplUrl } from "../lib.js";
import { RailView, RI, tplTabUrl } from "./Rail.jsx";
import { Icon } from "./icons.jsx";

/* ================= Templates gallery: filters, search, hover-scroll previews, full-screen preview ================= */
const W = { desktop: "100%", tablet: "820px", mobile: "390px" };

function PreviewModal({ t, onClose, onUse, onAi }) {
  const pages = useMemo(() => (t.file ? [{ id: "f", name: "Home" }] : t.make(t.name)), [t]);
  const [i, setI] = useState("0"), [dev, setDev] = useState("desktop");
  return (
    <RailView dev={dev} setDev={setDev} onClose={onClose} pages={pages.map((p, k) => ({ v: String(k), l: p.name }))} page={i} setPage={setI}
      actions={[{ ic: RI.edit, l: "Use", cls: "k-pri", fn: () => onUse(t) }, t.file && { ic: RI.tab, l: "New tab", cls: "k-tab", fn: () => window.open(tplTabUrl(t), "_blank") }]}>
      {t.file ? <iframe title={t.name} src={tplUrl(t)} sandbox="allow-scripts allow-same-origin allow-forms" /> : <iframe title={t.name} srcDoc={pages[+i].html} sandbox="allow-same-origin" />}
    </RailView>
  );
}

/* hover a card: the page inside slowly scrolls down; leave: it glides back to the top */
const scrollers = new WeakMap();
function glide(card, down) {
  const f = card && card.querySelector(".tg-frame iframe"); if (!f) return;
  if (down && !f.dataset.ready) return; // starts from onLoad below
  let w; try { w = f.contentWindow; if (!w || !w.document || !w.document.documentElement) return; } catch { return; }
  cancelAnimationFrame(scrollers.get(f));
  const d = w.document.documentElement, max = Math.max(0, d.scrollHeight - w.innerHeight), from = w.scrollY, to = down ? max : 0;
  const ms = down ? Math.min(9000, Math.max(2500, (max - from) * 1.6)) : 500, t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = down ? k : 1 - Math.pow(1 - k, 3); w.scrollTo({ top: from + (to - from) * e, behavior: "instant" }); if (k < 1) scrollers.set(f, requestAnimationFrame(step)); };
  scrollers.set(f, requestAnimationFrame(step));
}

export default function Templates({ onUse, onAi, onSave = onUse, mine = [], onDeleteMine = () => {} }) {
  const [live, setLive] = useState(""); /* only the card under the mouse loads its live page */
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
          <div className="hx-lap"><div className="hx-scr"><div className="hx-nav"><i /><i /><i /></div><b>{FILE_TEMPLATES.length} ready <br />designs</b><span /><span className="s" /><em>Use template</em><div className="hx-plant" /></div></div>
          <div className="hx-base" /><div className="hx-ai">{FILE_TEMPLATES.length}</div>
        </div></div>
      </div>
      <div className="tg-filters">
        <div className="tg-type-tabs">{[["all", "All templates", "Every ready-made design", "grid"], ["landing", "Landing pages", "One focused page — offers, signups, events", "hero"], ["website", "Websites", "Full business websites", "pages"], ["mine", "My templates", "Saved from your own projects", "star"]].map(([k, l, d, ic]) => <button key={k} className={type === k ? "on" : ""} onClick={() => { setType(k); setCat(""); }}><Icon n={ic} s={20} /><span><b>{l} <em>{count(k)}</em></b><small>{d}</small></span></button>)}</div>
        <div className="tg-cats"><button className={!cat ? "on" : ""} onClick={() => setCat("")}>All {type === "website" ? "websites" : type === "landing" ? "landing pages" : "categories"}</button>{cats.map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(cat === c ? "" : c)}>{c}</button>)}</div>
      </div>
      {!list.length && (type === "mine" ? <div className="empty"><b>No saved templates yet</b><p className="mut">Open <b>Projects</b>, click <b>⋯</b> on any project and choose <b>Save as template</b>. It appears here for you to reuse.</p></div>
        : <div className="empty"><b>No templates match</b><p className="mut">Try another word or clear the filters.</p></div>)}
      <div className="tg-grid">{list.map((t, i) => { const pages = thumbs[t.key] || [{ html: "" }]; return (
        <div key={t.key || t.name} className="tg-card" onMouseEnter={(e) => { setLive(t.key); const c = e.currentTarget; requestAnimationFrame(() => glide(c, true)); }} onMouseLeave={(e) => glide(e.currentTarget, false)}>
          <a className="tg-shot" href={t.file ? tplTabUrl(t) : undefined} target="_blank" rel="noopener" onClick={(e) => { e.preventDefault(); if (t.file) window.open(tplTabUrl(t), "_blank"); else setOpen(t); }}>
            <div className="tg-chrome"><i /><i /><i /><span>{t.file ? (t.type === "website" ? "Website" : "Landing page") : pages.length > 1 ? `${pages.length} pages` : "1 page"}</span></div>
            <div className="tg-frame">{t.file ? <>{t.thumb && <div className="tg-reel" style={{ "--i": i }}><img src={tplUrl({ file: t.thumb.replace("/thumbs/", "/long/") })} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.parentNode.classList.add("short"); e.currentTarget.src = tplUrl({ file: t.thumb }); }} /><img src={tplUrl({ file: t.thumb.replace("/thumbs/", "/long/") })} alt="" loading="lazy" decoding="async" /></div>}{live === t.key && <iframe title={t.name} src={tplUrl(t)} sandbox="allow-scripts allow-same-origin" tabIndex={-1} scrolling="no" onLoad={(e) => { const f = e.currentTarget, c = f.closest(".tg-card"); f.classList.add("on"); f.dataset.ready = "1"; if (c && c.matches(":hover")) glide(c, true); }} />}</> : <iframe title={t.name} srcDoc={pages[0].html} sandbox="allow-same-origin" tabIndex={-1} scrolling="no" onLoad={(e) => { const f = e.currentTarget, c = f.closest(".tg-card"); f.classList.add("on"); f.dataset.ready = "1"; if (c && c.matches(":hover")) glide(c, true); }} />}</div>
            <div className="tg-hover"><button className="tg-tab" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (t.file) window.open(tplTabUrl(t), "_blank"); else setOpen(t); }} title="Opens in a new tab">👁 Preview</button><button className="pri" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUse(t); }} title="Open it in the editor">✏️ Use</button></div>
          </a>
          <div className="tg-info">
            <div className="tg-row"><b>{t.name}</b>{t.mine && <span className="tg-mine">★ Mine</span>}<span className={"tg-type " + t.type}>{t.type === "website" ? "Website" : "Landing"}</span></div>
            <p>{t.note}</p>
            <div className="tg-meta"><i style={{ background: t.accent || "#9aa3b8" }} />{t.cat}{t.mine && <button className="tg-del" onClick={() => { if (window.confirm(`Delete the template "${t.name}"? Your original project stays.`)) onDeleteMine(t.id); }}>Delete</button>}</div>
          </div>
        </div>); })}</div>
      {open && <PreviewModal t={open} onAi={onAi && ((t) => { setOpen(null); onAi(t); })} onClose={() => setOpen(null)} onUse={(t) => { setOpen(null); onUse(t); }} onSave={(t) => { setOpen(null); onSave(t); }} />}
    </>
  );
}
