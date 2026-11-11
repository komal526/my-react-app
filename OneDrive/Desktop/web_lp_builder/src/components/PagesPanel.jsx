// LaunchBuilder v3 — PagesPanel.jsx
// Left-panel tabs: Pages, Layers (structure) and Site settings
import { useState, useRef, useEffect } from "react";
import { PAGE_TPLS, CONT, nameOf, iconOf, GFONTS, SYSFONTS, ensureFont, fontStack, fontName, readCfg } from "./tools.js";
import { Icon } from "./Inspector.jsx";

/* ==================== Pages tab ==================== */
/* ================= Pages tab: list, add from template, connect pages with menus ================= */
export default function PagesPanel({ project, curId, act }) {
  const site = project.type === "website";
  const [adding, setAdding] = useState(false);
  if (!site) return (
    <div className="pp">
      <div className="pp-card"><b>Single landing page</b><p className="hint">Turn it into a website to add more pages (About, Contact, Thank-you, Privacy policy…) and link them together.</p>
        <button className="btn pri sm" onClick={act.convert}><Icon n="plus" s={13} /> Convert to website</button></div>
      {project.pages.map((p) => <div key={p.id} className="prow on"><Icon n="file" s={15} /><div><b>{p.name}</b><span>{p.file}</span></div></div>)}
    </div>
  );
  return (
    <div className="pp">
      <div className="row between"><b className="pp-h">{project.pages.length} pages</b><button className="btn pri sm" onClick={() => setAdding(!adding)}><Icon n="plus" s={13} /> Add page</button></div>
      {adding && <div className="tpls">{PAGE_TPLS.map(([k, n]) => <button key={k} onClick={() => { setAdding(false); act.add(k, n); }}><Icon n={k === "blank" ? "file" : k === "404" ? "x" : k === "privacy" || k === "terms" ? "shield" : k === "contact" ? "mail" : k === "blog" ? "doc" : k === "sitemap" ? "menu" : "section"} s={14} />{n}</button>)}
        <button onClick={() => { setAdding(false); act.add("copy", "Copy of this page"); }}><Icon n="copy" s={14} />Copy of this page</button></div>}
      <div className="plist">{project.pages.map((p) => (
        <div key={p.id} className={"prow" + (p.id === curId ? " on" : "")} onClick={() => act.switch(p.id)}>
          <Icon n={p.file === "index.html" ? "logo" : "file"} s={15} />
          <div className="grow"><b>{p.name}{p.file === "index.html" && <em>Home</em>}</b><span>{p.file}</span></div>
          <div className="pact" onClick={(e) => e.stopPropagation()}>
            <button className="ib" title="Rename" onClick={() => act.rename(p.id)}><Icon n="pen" s={13} /></button>
            {p.file !== "index.html" && <button className="ib" title="Change file name (updates all links)" onClick={() => act.refile(p.id)}><Icon n="link" s={13} /></button>}
            <button className="ib" title="Duplicate" onClick={() => act.dup(p.id)}><Icon n="copy" s={13} /></button>
            {p.file !== "index.html" && <button className="ib danger" title="Delete" onClick={() => act.del(p.id)}><Icon n="trash" s={13} /></button>}
          </div>
        </div>))}</div>
      <div className="pp-card">
        <b>Connect your pages</b>
        <p className="hint">Menus added from <i>Header &amp; menus</i> list every page automatically and stay updated when you add, rename or delete pages.</p>
        <button className="btn sm" onClick={act.insertNav}><Icon n="header" s={13} /> Add header menu to this page</button>
        <button className="btn sm" onClick={act.syncNav}><Icon n="menu" s={13} /> Refresh menus on all pages</button>
        <p className="hint">To link a single button or image: select it → Content → <b>Link / navigation</b> → “Go to a page of this site”.</p>
      </div>
    </div>
  );
}

/* ==================== Layers / structure tab ==================== */
/* ================= Layers / Structure: the page as a tree (like Elementor's Navigator) ================= */
const SKIP = /^(SCRIPT|STYLE|LINK|META|TEMPLATE|NOSCRIPT|BR|WBR)$/;
const kids = (el) => [...el.children].filter((c) => !SKIP.test(c.tagName) && !(c.id || "").startsWith("lb-"));

export function Layers({ doc, sel, onSelect, onChanged, tick }) {
  const [, force] = useState(0);
  const open = useRef(new WeakSet()), drag = useRef(null), selRow = useRef(null);
  const [drop, setDrop] = useState(null), [ren, setRen] = useState(null), [q, setQ] = useState("");

  useEffect(() => { selRow.current && selRow.current.scrollIntoView({ block: "nearest" }); }, [sel, tick]);
  if (!doc || !doc.body) return null;

  /* a page wrapped in one big box: show what's inside straight away */
  for (let top = kids(doc.body); top.length === 1 && !open.current.has(top[0]) && !open.current.has(doc.body); top = kids(top[0])) { open.current.add(top[0]); }
  open.current.add(doc.body);
  if (sel) for (let p = sel.parentElement; p && p !== doc.body; p = p.parentElement) open.current.add(p);
  const rows = [], qq = q.trim().toLowerCase();
  const label = (el) => nameOf(el);
  const hint = (el) => (el.id ? "#" + el.id : [...el.classList].filter((c) => !c.startsWith("lb-"))[0] ? "." + [...el.classList].filter((c) => !c.startsWith("lb-"))[0] : "");
  const walk = (el, depth) => kids(el).forEach((c) => {
    const ch = kids(c), isOpen = qq ? true : open.current.has(c);
    const match = !qq || (label(c) + " " + hint(c) + " " + (c.textContent || "").slice(0, 80)).toLowerCase().includes(qq);
    if (match) rows.push({ el: c, depth: qq ? 0 : depth, has: ch.length > 0, isOpen });
    if (isOpen) walk(c, depth + 1);
  });
  walk(doc.body, 0);

  const toggle = (el) => { open.current.has(el) ? open.current.delete(el) : open.current.add(el); force((x) => x + 1); };
  const all = (on) => { const w = (el) => kids(el).forEach((c) => { on ? open.current.add(c) : open.current.delete(c); w(c); }); w(doc.body); force((x) => x + 1); };
  const hover = (el, on) => { doc.querySelectorAll(".lb-hover").forEach((x) => x.classList.remove("lb-hover")); on && el.classList.add("lb-hover"); };
  const hide = (el) => { el.classList.toggle("lb-hide-all"); onChanged(); };
  const rename = (el, v) => { v.trim() ? el.setAttribute("data-lb-name", v.trim()) : el.removeAttribute("data-lb-name"); setRen(null); onChanged(); };

  const over = (e, el) => {
    const d = drag.current; if (!d || d === el || d.contains(el)) return setDrop(null);
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect(), f = (e.clientY - r.top) / r.height;
    setDrop({ el, mode: CONT.has(el.tagName) && f > 0.3 && f < 0.7 ? "in" : f < 0.5 ? "before" : "after" });
  };
  const doDrop = (e) => {
    e.preventDefault(); const d = drag.current, w = drop; drag.current = null; setDrop(null);
    if (!d || !w) return;
    w.mode === "in" ? (w.el.appendChild(d), open.current.add(w.el)) : w.mode === "before" ? w.el.before(d) : w.el.after(d);
    onSelect(d); onChanged(true);
  };

  return (
    <div className="layers">
      <div className="ly-top">
        <div className="srch"><Icon n="search" s={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a layer…" /></div>
        <button className="ib" title="Expand all" onClick={() => all(true)}><Icon n="chevd" s={14} /></button>
        <button className="ib" title="Collapse all" onClick={() => all(false)}><Icon n="chev" s={14} /></button>
      </div>
      <div className={"ly-row ly-body" + (sel === doc.body ? " on" : "")} onClick={() => onSelect(doc.body)}><Icon n="file" s={14} /><span>Page (body)</span></div>
      {!rows.length && <p className="mut pad">{qq ? "No layer matches." : "This page is empty. Add elements from the Add tab."}</p>}
      {rows.map(({ el, depth, has, isOpen }, i) => {
        const on = el === sel, hidden = el.classList.contains("lb-hide-all"), dz = drop && drop.el === el ? " dz-" + drop.mode : "";
        return (
          <div key={i} ref={on ? selRow : null} className={"ly-row" + (on ? " on" : "") + (hidden ? " off" : "") + dz} style={{ paddingLeft: 8 + depth * 14 }}
            draggable onDragStart={(e) => { drag.current = el; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "layer"); }}
            onDragOver={(e) => over(e, el)} onDragLeave={() => setDrop(null)} onDrop={doDrop} onDragEnd={() => { drag.current = null; setDrop(null); }}
            onMouseEnter={() => hover(el, true)} onMouseLeave={() => hover(el, false)} onClick={() => onSelect(el)} onDoubleClick={() => setRen(el)}>
            <button className={"car" + (has ? "" : " no") + (isOpen ? " open" : "")} onClick={(e) => { e.stopPropagation(); has && toggle(el); }}><Icon n="chev" s={12} w={2} /></button>
            <Icon n={iconOf(el)} s={14} />
            {ren === el ? <input autoFocus className="ren" defaultValue={el.getAttribute("data-lb-name") || ""} placeholder={label(el)} onClick={(e) => e.stopPropagation()}
              onBlur={(e) => rename(el, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") setRen(null); }} />
              : <span className="nm">{label(el)}<small>{hint(el)}</small></span>}
            <button className="eye" title={hidden ? "Show on site" : "Hide on site"} onClick={(e) => { e.stopPropagation(); hide(el); }}><Icon n={hidden ? "eyeoff" : "eye"} s={13} /></button>
          </div>
        );
      })}
      <p className="mut pad sm">Drag rows to reorder or nest. Double-click a row to rename it.</p>
    </div>
  );
}

/* ==================== Site tab: SEO, global style, custom code ==================== */
/* ================= Site tab: SEO, global style, custom code, tracking — stored in the page <head> ================= */
const G = ({ t, children, open }) => <details className="grp" open={open}><summary>{t}<Icon n="chevd" s={13} /></summary><div className="grp-b">{children}</div></details>;
const F = ({ l, children, hint }) => <div className="f"><label>{l}</label>{children}{hint && <p className="hint">{hint}</p>}</div>;

export const GLOBAL_DEF = { primary: "#4f46e5", text: "#1f1d36", bg: "#ffffff", link: "", heading: "", body: "", size: "" };
export const readGlobal = (doc) => { const s = doc.getElementById("lb-global"); try { return { ...GLOBAL_DEF, ...JSON.parse((s && s.getAttribute("data-lb-json")) || "{}") }; } catch { return { ...GLOBAL_DEF }; } };
export const writeGlobal = (doc, g) => {
  let s = doc.getElementById("lb-global");
  if (!s) { s = doc.createElement("style"); s.id = "lb-global"; const pc = doc.getElementById("lb-page-css"); pc ? doc.head.insertBefore(s, pc) : doc.head.appendChild(s); }
  [g.heading, g.body].filter(Boolean).forEach((f) => ensureFont(doc, f));
  s.setAttribute("data-lb-json", JSON.stringify(g));
  s.textContent = `:root{--lb-primary:${g.primary};--lb-text:${g.text};--lb-bg:${g.bg}}body{${g.body ? `font-family:${fontStack(g.body)};` : ""}color:${g.text};background:${g.bg};${g.size ? `font-size:${g.size}px;` : ""}}${g.heading ? `h1,h2,h3,h4,h5,h6{font-family:${fontStack(g.heading)}}` : ""}${g.link ? `a:not([style*="background"]){color:${g.link}}` : ""}`;
};
export const writeCfg = (doc, c) => {
  let s = doc.getElementById("lb-settings");
  if (!s) { s = doc.createElement("script"); s.id = "lb-settings"; s.type = "application/json"; doc.head.appendChild(s); }
  s.textContent = JSON.stringify(c).replace(/</g, "\\u003c");
};
export const pageCss = (doc, v) => {
  let s = doc.getElementById("lb-page-css");
  if (v === undefined) return s ? s.textContent : "";
  if (!s) { s = doc.createElement("style"); s.id = "lb-page-css"; doc.head.appendChild(s); }
  s.textContent = v;
};
const meta = (doc, key, v, prop) => {
  const sel = prop ? `meta[property="${key}"]` : `meta[name="${key}"]`; let m = doc.head.querySelector(sel);
  if (v === undefined) return m ? m.getAttribute("content") || "" : "";
  if (!v) { m && m.remove(); return; }
  if (!m) { m = doc.createElement("meta"); m.setAttribute(prop ? "property" : "name", key); doc.head.appendChild(m); }
  m.setAttribute("content", v);
};
const linkRel = (doc, rel, v) => {
  let l = doc.head.querySelector(`link[rel="${rel}"]`);
  if (v === undefined) return l ? l.getAttribute("href") || "" : "";
  if (!v) { l && l.remove(); return; }
  if (!l) { l = doc.createElement("link"); l.rel = rel; doc.head.appendChild(l); }
  l.setAttribute("href", v);
};

function Code({ value, onApply, rows = 8, ph }) {
  const [v, setV] = useState(value);
  return <><textarea className="code" rows={rows} value={v} placeholder={ph} onChange={(e) => setV(e.target.value)} spellCheck={false} /><button className="btn pri sm" onClick={() => onApply(v)}>Apply</button></>;
}

export function SiteSettings({ doc, changed, commit, pages, onApplyAll, curFile }) {
  const [, re] = useState(0);
  if (!doc || !doc.head) return null;
  const up = (fn) => { fn(); changed(); re((x) => x + 1); };
  const cfg = readCfg(doc), g = readGlobal(doc);
  const setCfg = (o) => up(() => writeCfg(doc, { ...cfg, ...o }));
  const setG = (o) => up(() => writeGlobal(doc, { ...g, ...o }));
  const fontSel = (k) => <select value={fontName(g[k])} onChange={(e) => setG({ [k]: e.target.value })}><option value="">Keep page default</option><optgroup label="Google fonts">{GFONTS.map((f) => <option key={f}>{f}</option>)}</optgroup><optgroup label="System">{SYSFONTS.map((f) => <option key={f} value={fontName(f)}>{fontName(f)}</option>)}</optgroup></select>;
  const color = (k, l) => <F l={l}><div className="col"><input type="color" value={g[k] || "#000000"} onChange={(e) => setG({ [k]: e.target.value })} /><input value={g[k]} onChange={(e) => setG({ [k]: e.target.value })} /></div></F>;

  return (
    <div className="site">
      <p className="mut pad">Settings for <b>{curFile}</b>. Global style and tracking can be copied to every page.</p>
      <G t="SEO & sharing" open>
        <F l="Page title" hint={`${(doc.title || "").length}/60 characters`}><input value={doc.title} onChange={(e) => up(() => { doc.title = e.target.value; })} /></F>
        <F l="Meta description" hint={`${meta(doc, "description").length}/160 characters — shown under your link on Google`}><textarea rows={3} value={meta(doc, "description")} onChange={(e) => up(() => meta(doc, "description", e.target.value))} /></F>
        <F l="Keywords"><input value={meta(doc, "keywords")} placeholder="ai ads, workshop, marketing" onChange={(e) => up(() => meta(doc, "keywords", e.target.value))} /></F>
        <F l="Share image URL (WhatsApp, Facebook, LinkedIn preview)"><input value={meta(doc, "og:image", undefined, true)} placeholder="https://…/cover.jpg" onChange={(e) => up(() => { meta(doc, "og:image", e.target.value, true); meta(doc, "og:title", doc.title, true); meta(doc, "og:description", meta(doc, "description"), true); })} /></F>
        <div className="g2"><F l="Favicon URL"><input value={linkRel(doc, "icon")} placeholder="https://…/icon.png" onChange={(e) => up(() => linkRel(doc, "icon", e.target.value))} /></F>
          <F l="Language"><input value={doc.documentElement.getAttribute("lang") || ""} placeholder="en" onChange={(e) => up(() => doc.documentElement.setAttribute("lang", e.target.value))} /></F></div>
        <F l="Canonical URL"><input value={linkRel(doc, "canonical")} placeholder="https://yourdomain.com/page.html" onChange={(e) => up(() => linkRel(doc, "canonical", e.target.value))} /></F>
        <label className="tg"><input type="checkbox" checked={/noindex/.test(meta(doc, "robots"))} onChange={(e) => up(() => meta(doc, "robots", e.target.checked ? "noindex,nofollow" : ""))} /><i />Hide this page from Google (noindex)</label>
      </G>
      <G t="Global fonts & colors" open>
        <div className="g2"><F l="Heading font">{fontSel("heading")}</F><F l="Body font">{fontSel("body")}</F></div>
        <div className="g2">{color("primary", "Primary (buttons, accents)")}{color("text", "Text")}</div>
        <div className="g2">{color("bg", "Page background")}<F l="Base font size"><input value={g.size} placeholder="16" onChange={(e) => setG({ size: e.target.value.replace(/[^\d.]/g, "") })} /></F></div>
        <F l="Link color (optional)"><div className="col"><input type="color" value={g.link || "#4f46e5"} onChange={(e) => setG({ link: e.target.value })} /><input value={g.link} placeholder="inherit" onChange={(e) => setG({ link: e.target.value })} /></div></F>
        <p className="hint">Elements from the Add panel use the primary color automatically. In any color picker, the ● button applies the primary color.</p>
      </G>
      <G t="Custom CSS (this page)">
        <p className="hint">Style classes you set in Advanced → CSS classes, e.g. <code>.my-card {"{ … }"}</code></p>
        <Code value={pageCss(doc)} rows={10} ph={".my-class {\n  color: #4f46e5;\n}\n@media (max-width:767px) {\n  h1 { font-size: 32px; }\n}"} onApply={(v) => { pageCss(doc, v); changed(); commit(); }} />
      </G>
      <G t="Custom JavaScript (this page)">
        <p className="hint">Runs at the end of the page in Preview and on the live site (not inside the editor).</p>
        <Code value={cfg.js || ""} rows={8} ph={"document.querySelector('.my-btn')\n  .addEventListener('click', () => alert('Hi'));"} onApply={(v) => { setCfg({ js: v }); commit(); }} />
      </G>
      <G t="Analytics & tracking">
        <F l="Google Analytics 4 ID"><input value={cfg.ga || ""} placeholder="G-XXXXXXXXXX" onChange={(e) => setCfg({ ga: e.target.value.trim() })} /></F>
        <F l="Google Tag Manager ID"><input value={cfg.gtm || ""} placeholder="GTM-XXXXXXX" onChange={(e) => setCfg({ gtm: e.target.value.trim() })} /></F>
        <F l="Meta (Facebook) Pixel ID"><input value={cfg.pixel || ""} placeholder="1234567890" onChange={(e) => setCfg({ pixel: e.target.value.trim() })} /></F>
        <F l="Extra <head> code" hint="Search Console verification meta tag, chat widgets, other scripts."><Code value={cfg.head || ""} rows={5} ph={'<meta name="google-site-verification" content="…">'} onApply={(v) => { setCfg({ head: v }); commit(); }} /></F>
        <p className="hint">Tracking codes are added to the exported/live site only — Preview never sends analytics.</p>
      </G>
      <G t="Schema markup (structured data)">
        <Code value={cfg.schema || ""} rows={8} ph={'{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your brand",\n  "url": "https://yourdomain.com"\n}'} onApply={(v) => { if (v.trim()) { try { JSON.parse(v); } catch { return alert("Schema must be valid JSON."); } } setCfg({ schema: v }); commit(); }} />
      </G>
      {pages.length > 1 && <div className="applyall">
        <b>Use these settings on every page</b>
        <p className="hint">Copies global fonts & colors, custom CSS, JavaScript, analytics and head code to all {pages.length} pages. SEO title/description stay per page.</p>
        <button className="btn pri sm" onClick={onApplyAll}><Icon n="copy" s={13} /> Apply to all pages</button>
      </div>}
    </div>
  );
}
