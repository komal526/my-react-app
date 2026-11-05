// LaunchBuilder v11 — Inspector.jsx
// Customize panel, Canva-style quick toolbar and icons
import { useState, useLayoutEffect, useRef } from "react";
import { aiEdit } from "../lib.js";
import { INL, SH, GFONTS, SYSFONTS, ensureFont, fontStack, fontName, nameOf, readImage, putAsset, hydrate, field as fieldHtml } from "./tools.js";

/* ==================== icons ==================== */
// Lightweight stroke icons for the editor UI (no icon library needed)
const ICON_PATHS = {
  section: <rect x="3" y="5" width="18" height="14" rx="2" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" /></>,
  apps: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><path d="M17.5 14v7M14 17.5h7" /></>,
  container: <><rect x="3" y="4" width="18" height="16" rx="2" strokeDasharray="3 2" /><rect x="7" y="8" width="10" height="8" rx="1" /></>,
  columns: <><rect x="3" y="4" width="7.5" height="16" rx="1.5" /><rect x="13.5" y="4" width="7.5" height="16" rx="1.5" /></>,
  columns3: <><rect x="2.5" y="4" width="5" height="16" rx="1" /><rect x="9.5" y="4" width="5" height="16" rx="1" /><rect x="16.5" y="4" width="5" height="16" rx="1" /></>,
  grid: <><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></>,
  sidebar: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></>,
  spacer: <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />,
  divider: <path d="M3 12h18M7 7h10M7 17h10" opacity=".9" />,
  heading: <path d="M6 4v16M18 4v16M6 12h12" />,
  text: <path d="M4 6h16M4 11h16M4 16h11" />,
  button: <><rect x="3" y="8" width="18" height="8" rx="4" /><path d="M9 12h6" /></>,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  star: <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  quote: <path d="M6 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6" />,
  badge: <><rect x="4" y="8" width="16" height="8" rx="4" /><circle cx="8" cy="12" r="1" /></>,
  header: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M6 6.5h3" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  dropdown: <><rect x="4" y="4" width="16" height="6" rx="1.5" /><path d="M8 14h8M8 18h6" /></>,
  mega: <><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="11" width="5" height="9" rx="1" /><rect x="9.5" y="11" width="5" height="9" rx="1" /><rect x="16" y="11" width="5" height="9" rx="1" /></>,
  crumbs: <path d="M3 12h4M10 9l3 3-3 3M16 12h5" />,
  announce: <path d="M3 10v4h4l7 5V5L7 10H3zM18 9a4 4 0 0 1 0 6" />,
  footer: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15h18M6 17.5h4" /></>,
  share: <><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 11l7.6-4M8.2 13l7.6 4" /></>,
  image: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-9 8" /></>,
  gallery: <><rect x="7" y="7" width="14" height="13" rx="2" /><path d="M3 16V5a2 2 0 0 1 2-2h11" /></>,
  slider: <><rect x="6" y="5" width="12" height="14" rx="2" /><path d="M3 9v6M21 9v6" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></>,
  bg: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16l6-6 4 4 3-3 5 5" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  hero: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 10h10M9 14h6" /></>,
  cta: <><rect x="3" y="7" width="18" height="10" rx="3" /><path d="M8 12h7M13 9.5l2.5 2.5-2.5 2.5" /></>,
  card: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 10h16M7 14h8" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="7.5" r="1.4" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2a5 5 0 0 1 5.5 5.8" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  chart: <path d="M5 20V10M12 20V4M19 20v-7" />,
  progress: <><rect x="3" y="9.5" width="18" height="5" rx="2.5" /><path d="M5.5 12h8" strokeWidth="2.6" /></>,
  timeline: <><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><path d="M6 8v8M11 6h9M11 18h9" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
  accordion: <><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /></>,
  tabs: <path d="M3 9h18v11H3zM3 9V5h7v4M10 5h6v4" />,
  popup: <><rect x="3" y="4" width="18" height="16" rx="2" /><rect x="7" y="8" width="10" height="8" rx="1.5" /></>,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  cookie: <><circle cx="12" cy="12" r="9" /><circle cx="9" cy="9" r=".9" /><circle cx="14.5" cy="14" r=".9" /><circle cx="15" cy="8.5" r=".9" /><circle cx="9" cy="15" r=".9" /></>,
  loader: <path d="M12 3a9 9 0 1 0 9 9" />,
  form: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />,
  doc: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" />,
  pages: <><rect x="3" y="9" width="5" height="6" rx="1" /><rect x="10" y="9" width="5" height="6" rx="1" /><rect x="17" y="9" width="4" height="6" rx="1" /></>,
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.6 12h11.2L21 7H6" /></>,
  heart: <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.6A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z" />,
  filter: <path d="M3 5h18l-7 8v6l-4-2v-4z" />,
  layers: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  file: <path d="M6 3h9l4 4v14H6zM14 3v5h5" />,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  pen: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  eye: <><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10.5 7 10.5 7a17 17 0 0 1-3 3.6M6.6 6.6C3.4 8.5 1.5 12 1.5 12S5.5 19 12 19a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  parent: <path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 5 5v6" />,
  undo: <path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  redo: <path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />,
  desktop: <><rect x="2.5" y="4" width="19" height="12" rx="1.5" /><path d="M8 20h8M12 16v4" /></>,
  tablet: <><rect x="5" y="2.5" width="14" height="19" rx="2" /><path d="M11 18h2" /></>,
  mobile: <><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18h2" /></>,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chev: <path d="M9 6l6 6-6 6" />,
  chevd: <path d="M6 9l6 6 6-6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  card2: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  box: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V4h6v3M3 12h18" /></>,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />,
  download: <path d="M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />,
  play: <path d="M7 4l13 8-13 8z" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  logo: <path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  grip: <><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></>,
  inbox: <path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 13h5l1.5 3h5L16 13h5" />,
  field: <><rect x="3" y="8" width="18" height="8" rx="2" /><path d="M7 12h1" /></>,
  wand: <path d="M4 20L15 9M14 4v2M19 9h2M17.5 5.5L16 7M18 13l-1.5-1.5M9.5 5.5L11 7" />,
};

export function Icon({ n, s = 16, w = 1.7, className }) {
  return (
    <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[n] || ICON_PATHS.section}
    </svg>
  );
}

/* ==================== Customize panel (Content / Style / Advanced) ==================== */
/* ================= small UI pieces ================= */
const F = ({ l, children, hint, row }) => <div className={"f" + (row ? " frow" : "")}>{l && <label>{l}</label>}{children}{hint && <p className="hint">{hint}</p>}</div>;
const G = ({ t, children, open = false }) => <details className="grp" open={open}><summary>{t}<Icon n="chevd" s={13} /></summary><div className="grp-b">{children}</div></details>;
const Seg = ({ value, opts, onChange }) => (
  <div className="sg">{opts.map(([v, l, tip]) => <button key={v} title={tip || v} className={value === v ? "on" : ""} onClick={() => onChange(value === v ? "" : v)}>{l}</button>)}</div>
);
const Toggle = ({ on, onChange, label }) => <label className="tg"><input type="checkbox" checked={!!on} onChange={(e) => onChange(e.target.checked)} /><i />{label}</label>;
const hex = (c) => { const m = (c || "").match(/\d+(\.\d+)?/g); return !m || (m[3] !== undefined && +m[3] === 0) ? "" : "#" + m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, "0")).join(""); };
const unit = (v) => (/^-?\d*\.?\d+$/.test(String(v).trim()) ? v + "px" : v);
const ytId = (u) => (u.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/) || [])[1];
const vimeoId = (u) => (u.match(/vimeo\.com\/(?:video\/)?(\d+)/) || [])[1];

function HtmlBox({ el, A }) {
  const [v, setV] = useState(() => A.current.outer(el));
  return <><textarea className="code" rows={12} value={v} onChange={(e) => setV(e.target.value)} spellCheck={false} /><button className="btn pri sm" onClick={() => A.current.applyOuter(el, v)}>Apply code</button></>;
}
function CodeArea({ value, onApply, rows = 8, placeholder }) {
  const [v, setV] = useState(value);
  return <><textarea className="code" rows={rows} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} spellCheck={false} /><button className="btn pri sm" onClick={() => onApply(v)}>Apply</button></>;
}

/* ================= Inspector ================= */
export default function Inspector({ el, A, pages = [], dev, itab, setItab, openLink }) {
  const doc = el.ownerDocument, w = doc.defaultView, cs = w.getComputedStyle(el), s = el.style, tag = el.tagName, isBody = tag === "BODY";
  const a = A.current, R = dev !== "desktop";
  const changed = () => a.changed();
  /* style get/set: desktop → inline style, tablet/mobile → responsive CSS rule */
  const get = (k) => (R ? a.resp.get(el, dev, k) : s[k]) || "";
  const set = (o) => { if (R) a.resp.set(el, dev, o); else Object.entries(o).forEach(([k, v]) => { s[k] = v; }); changed(); };
  const attrSet = (k, v, node = el) => { v === "" || v === null || v === false ? node.removeAttribute(k) : node.setAttribute(k, v === true ? "" : v); changed(); };

  const Num = ({ l, k, ph }) => <F l={l}><input value={get(k)} placeholder={ph || cs[k] || ""} onChange={(e) => set({ [k]: unit(e.target.value) })} /></F>;
  const Txt = ({ l, k }) => <F l={l}><input value={get(k)} placeholder={cs[k] || ""} onChange={(e) => set({ [k]: e.target.value })} /></F>;
  const Sel = ({ l, k, o }) => <F l={l}><select value={get(k)} onChange={(e) => set({ [k]: e.target.value })}><option value="">Default</option>{o.map((x) => <option key={x}>{x}</option>)}</select></F>;
  const Col = ({ l, k }) => (
    <F l={l}><div className="col">
      <input type="color" value={hex(get(k) || cs[k]) || "#ffffff"} onChange={(e) => set({ [k]: e.target.value })} />
      <input value={get(k)} placeholder={hex(cs[k]) || "none"} onChange={(e) => set({ [k]: e.target.value })} />
      <button className="ib" title="Use global primary color" onClick={() => set({ [k]: "var(--lb-primary)" })}><span className="dot" /></button>
      <button className="ib" title="Clear" onClick={() => set({ [k]: "" })}><Icon n="x" s={12} /></button>
    </div></F>
  );
  const Sides = ({ l, p }) => (
    <F l={l}><div className="sides">{["Top", "Right", "Bottom", "Left"].map((x) => (
      <label key={x}><input value={get(p + x)} placeholder={parseFloat(cs[p + x]) + ""} onChange={(e) => set({ [p + x]: unit(e.target.value) })} /><span>{x[0]}</span></label>))}
      <button className="ib" title="Same value on all sides" onClick={() => { const v = get(p + "Top") || cs[p + "Top"]; set({ [p + "Top"]: v, [p + "Right"]: v, [p + "Bottom"]: v, [p + "Left"]: v }); }}><Icon n="link" s={12} /></button>
    </div></F>
  );

  /* ---------- context: what kind of widget is this element part of? ---------- */
  const ctx = (attr) => el.closest(`[${attr}]`);
  const video = ctx("data-lb-video"), map = ctx("data-lb-map"), embed = ctx("data-lb-embed"), html = ctx("data-lb-html"), form = el.closest("form");
  const calSlot = el.closest("[data-lb-calendar]"), formSlot = el.closest("[data-lb-formslot]"), booking = calSlot && calSlot.getAttribute("data-lb-calendar") ? null : ctx("data-lb-booking"), countdown = ctx("data-lb-countdown"), counter = el.hasAttribute("data-lb-count") ? el : null, slider = ctx("data-lb-slider"), tabs = ctx("data-lb-tabs");
  const popup = ctx("data-lb-popup"), gallery = ctx("data-lb-gallery"), wa = ctx("data-lb-wa"), prog = el.querySelector && (el.hasAttribute("data-lb-progress") ? el : null);
  const leaf = !/^(IMG|IFRAME|INPUT|TEXTAREA|SELECT|HR|BODY|SVG|VIDEO|AUDIO|CANVAS)$/.test(tag) && [...el.childNodes].every((c) => c.nodeType === 3 || c.nodeType === 8 || (c.nodeType === 1 && INL.has(c.tagName)));

  /* ---------- LINK ---------- */
  const isA = tag === "A";
  const url = (isA ? el.getAttribute("href") : el.getAttribute("data-href")) || "", tgt = (isA ? el.getAttribute("target") : el.getAttribute("data-target")) || "";
  const pop = el.getAttribute("data-lb-open") || "";
  const setLink = (u, t = tgt) => {
    el.removeAttribute("data-lb-open");
    if (isA) { u ? el.setAttribute("href", u) : el.removeAttribute("href"); t ? el.setAttribute("target", t) : el.removeAttribute("target"); t ? el.setAttribute("rel", "noopener") : el.removeAttribute("rel"); }
    else if (u) { el.setAttribute("data-href", u); t ? el.setAttribute("data-target", t) : el.removeAttribute("data-target"); el.setAttribute("onclick", "var d=this.dataset;d.target==='_blank'?window.open(d.href,'_blank'):location.href=d.href"); el.style.cursor = "pointer"; }
    else { ["data-href", "data-target", "onclick"].forEach((x) => el.removeAttribute(x)); el.style.cursor = ""; }
    changed();
  };
  const setPopupLink = (id) => { setLink(isA ? "#" : "", ""); id ? el.setAttribute("data-lb-open", id) : el.removeAttribute("data-lb-open"); changed(); };
  const fileOf = (u) => u.split("#")[0];
  const kind = pop ? "popup" : !url ? "" : url.startsWith("#") ? "section" : url.startsWith("mailto:") ? "email" : url.startsWith("tel:") ? "phone" : /wa\.me|whatsapp/.test(url) ? "whatsapp" : pages.some((p) => p.file === fileOf(url)) ? "page" : "url";
  const [lkind, setLkind] = useState(kind);
  const sections = a.sections();
  const popups = [...doc.querySelectorAll("[data-lb-popup][id]")].map((p) => p.id);
  const otherIds = kind === "page" ? a.idsOf(fileOf(url)) : [];

  /* ---------- VIDEO ---------- */
  const vcfg = video ? JSON.parse(video.getAttribute("data-lb-vcfg") || "{}") : {};
  const buildVideo = (c) => {
    const o = { ratio: "56.25", ...vcfg, ...c };
    video.setAttribute("data-lb-vcfg", JSON.stringify(o)); video.style.paddingTop = o.ratio + "%";
    let inner = "";
    if (o.type === "youtube" && ytId(o.src || "")) {
      const id = ytId(o.src), q = new URLSearchParams({ rel: "0", modestbranding: "1" });
      if (o.autoplay) { q.set("autoplay", "1"); q.set("mute", "1"); } else if (o.muted) q.set("mute", "1");
      if (o.loop) { q.set("loop", "1"); q.set("playlist", id); } if (o.controls === false) q.set("controls", "0"); if (o.start) q.set("start", String(parseInt(o.start) || 0));
      inner = `<iframe src="https://www.youtube.com/embed/${id}?${q}" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>`;
    } else if (o.type === "vimeo" && vimeoId(o.src || "")) {
      const q = new URLSearchParams({ dnt: "1" }); if (o.autoplay) { q.set("autoplay", "1"); q.set("muted", "1"); } if (o.loop) q.set("loop", "1"); if (o.controls === false) q.set("controls", "0");
      inner = `<iframe src="https://player.vimeo.com/video/${vimeoId(o.src)}?${q}" title="Video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>`;
    } else if ((o.type === "file" && o.src) || (o.type === "upload" && o.asset)) {
      const at = [o.controls !== false && "controls", o.autoplay && "autoplay", (o.muted || o.autoplay) && "muted", o.loop && "loop", "playsinline"].filter(Boolean).join(" ");
      inner = `<video ${o.type === "upload" ? `data-lb-asset="${o.asset}"` : `src="${o.src.replace(/"/g, "&quot;")}"`} ${at}${o.poster ? ` poster="${o.poster}"` : ""} preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:${o.fit || "cover"};background:#000"></video>`;
    } else inner = `<div data-lb-vph style="position:absolute;inset:0;display:grid;place-items:center;color:#cfcaff;font:600 15px system-ui,sans-serif;text-align:center;padding:20px">▶<br>Add a YouTube / Vimeo link or upload a video</div>`;
    video.innerHTML = inner; hydrate(doc); a.select(video); changed();
  };
  const [vBusy, setVBusy] = useState(false);
  const uploadVideo = async (f) => {
    if (!f) return; if (!/^video\//.test(f.type)) return alert("Please choose a video file (mp4, webm, mov).");
    setVBusy(true); try { const id = await putAsset(f); buildVideo({ type: "upload", asset: id, fileName: f.name, src: "" }); } catch { alert("Couldn't store this video in the browser. Try a smaller file or use a YouTube link."); } setVBusy(false);
  };

  /* ---------- FORM ---------- */
  const fields = form ? [...form.querySelectorAll("input,textarea,select")].filter((x) => !/^(submit|button|hidden|reset)$/.test(x.type)) : [];
  const labelText = (x) => { const l = x.closest("label"); if (!l) return x.placeholder || x.name || ""; return [...l.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").replace(/\*/g, "").trim(); };
  const setLabel = (x, v) => { const l = x.closest("label"); if (!l) { x.placeholder = v; return changed(); } const tn = [...l.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()); const txt = v + (x.required && x.type !== "checkbox" ? " *" : ""); tn ? (tn.textContent = txt) : l.insertBefore(doc.createTextNode(txt), l.firstChild); changed(); };
  const setReq = (x, on) => { x.required = on; on ? x.setAttribute("required", "") : x.removeAttribute("required"); setLabel(x, labelText(x)); };
  const subBtn = form && form.querySelector("[type=submit],button:not([type])");
  const addField = (t) => {
    const n = ({ text: "Text", email: "Email", tel: "Phone", number: "Number", date: "Date", textarea: "Message", select: "Choose one", checkbox: "I agree" })[t];
    const tpl = doc.createElement("template"); tpl.innerHTML = fieldHtml(n, n.toLowerCase().replace(/\W+/g, "_"), t, t !== "checkbox");
    const node = tpl.content.firstElementChild, anchor = subBtn && [...form.children].find((c) => c === subBtn || c.contains(subBtn));
    anchor ? anchor.before(node) : form.appendChild(node); changed();
  };
  const fieldBox = (x) => x.closest("label") && form.contains(x.closest("label")) ? x.closest("label") : x;
  const moveField = (x, d) => { const b = fieldBox(x), sib = d < 0 ? b.previousElementSibling : b.nextElementSibling; if (sib && !sib.contains(subBtn)) { d < 0 ? sib.before(b) : sib.after(b); changed(); } };

  /* ---------- custom attributes ---------- */
  const SKIPA = /^(style|class|id|draggable|contenteditable|data-lb-.*|onclick|href|src|data-href|data-target|target|rel)$/;
  const attrs = [...el.attributes].filter((x) => !SKIPA.test(x.name)).map((x) => `${x.name}=${x.value}`).join("\n");
  const applyAttrs = (txt) => {
    [...el.attributes].filter((x) => !SKIPA.test(x.name)).forEach((x) => el.removeAttribute(x.name));
    txt.split("\n").map((l) => l.trim()).filter(Boolean).forEach((l) => { const i = l.indexOf("="), k = (i < 0 ? l : l.slice(0, i)).trim(), v = i < 0 ? "" : l.slice(i + 1).trim(); if (/^[a-zA-Z_:][\w:.-]*$/.test(k) && !/^on/i.test(k)) el.setAttribute(k, v); });
    changed();
  };
  const userCls = [...el.classList].filter((c) => !/^lb-(sel|hover|hide-|h-)/.test(c)).join(" ");
  const keepCls = () => [...el.classList].filter((c) => /^lb-(sel|hover|hide-|h-)/.test(c));
  const hoverFx = ([...el.classList].find((c) => /^lb-h-/.test(c)) || "").replace("lb-h-", "");
  const setHover = (v) => { [...el.classList].filter((c) => /^lb-h-/.test(c)).forEach((c) => el.classList.remove(c)); v && el.classList.add("lb-h-" + v); changed(); };

  const bgImg = (get("backgroundImage") || "").match(/url\(["']?([^"')]+)["']?\)/);
  const tabsBar = [["content", "Content", "pen"], ["style", "Style", "sparkle"], ["adv", "Advanced", "gear"]];

  return (
    <div className="insp">
      <div className="ih">
        <div className="ih-t"><b>{isBody ? "Whole page" : nameOf(el)}</b><code>{"<" + tag.toLowerCase() + ">"}{el.id ? " #" + el.id : ""}</code></div>
        <div className="ih-a">
          {!isBody && <><button className="ib" title="Move up" onClick={() => a.move(-1)}><Icon n="up" s={14} /></button><button className="ib" title="Move down" onClick={() => a.move(1)}><Icon n="down" s={14} /></button><button className="ib" title="Duplicate (Ctrl+D)" onClick={a.dup}><Icon n="copy" s={14} /></button></>}
          <button className="ib" title="Select parent (Esc)" onClick={a.parent}><Icon n="parent" s={14} /></button>
          <button className="ib" title="Copy style" onClick={() => a.copyStyle(el)}><Icon n="wand" s={14} /></button>
          <button className="ib" title="Paste style" disabled={!a.hasStyle()} onClick={() => a.pasteStyle(el)}><Icon n="sparkle" s={14} /></button>
          {!isBody && <button className="ib danger" title="Delete (Del)" onClick={a.del}><Icon n="trash" s={14} /></button>}
        </div>
      </div>
      <div className="itabs">{tabsBar.map(([k, l, ic]) => <button key={k} className={itab === k ? "on" : ""} onClick={() => setItab(k)}><Icon n={ic} s={13} />{l}</button>)}</div>
      {R && itab !== "content" && <div className="devnote"><Icon n={dev} s={13} />Styles you change now apply to <b>{dev}</b> and smaller only.</div>}

      {/* ===================== CONTENT ===================== */}
      {itab === "content" && <>
        {video && <G t="Video" open>
          <F l="Source"><Seg value={vcfg.type || ""} onChange={(v) => buildVideo({ type: v || "youtube" })} opts={[["youtube", "YouTube"], ["vimeo", "Vimeo"], ["file", "MP4 link"], ["upload", "Upload"]]} /></F>
          {(vcfg.type || "youtube") !== "upload" ? <F l={vcfg.type === "file" ? "Video file URL (.mp4 / .webm)" : vcfg.type === "vimeo" ? "Vimeo link" : "YouTube link (watch, shorts or youtu.be)"} hint={vcfg.src && !vcfg.type ? "" : undefined}>
            <input defaultValue={vcfg.src || ""} placeholder="https://www.youtube.com/watch?v=…" onBlur={(e) => { const v = e.target.value.trim(); buildVideo({ src: v, type: vcfg.type && vcfg.type !== "upload" ? vcfg.type : vimeoId(v) ? "vimeo" : ytId(v) ? "youtube" : v ? "file" : "youtube" }); }} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} />
          </F> : <F l="Video from your computer" hint="Stored in this browser and included in Export (assets folder).">
            <label className="btn up">{vBusy ? "Saving…" : vcfg.fileName ? "Replace video" : "Choose video file"}<input hidden type="file" accept="video/*" onChange={(e) => { uploadVideo(e.target.files[0]); e.target.value = ""; }} /></label>
            {vcfg.fileName && <p className="hint">Current: {vcfg.fileName}</p>}
          </F>}
          <div className="tgs">
            <Toggle on={vcfg.autoplay} label="Autoplay (muted)" onChange={(v) => buildVideo({ autoplay: v })} />
            <Toggle on={vcfg.loop} label="Loop" onChange={(v) => buildVideo({ loop: v })} />
            <Toggle on={vcfg.muted} label="Muted" onChange={(v) => buildVideo({ muted: v })} />
            <Toggle on={vcfg.controls !== false} label="Show controls" onChange={(v) => buildVideo({ controls: v })} />
          </div>
          <div className="g2">
            <F l="Shape"><select value={vcfg.ratio || "56.25"} onChange={(e) => buildVideo({ ratio: e.target.value })}><option value="56.25">16:9 wide</option><option value="177.78">9:16 reel / shorts</option><option value="75">4:3</option><option value="100">1:1 square</option><option value="42.86">21:9 cinema</option></select></F>
            {vcfg.type === "youtube" ? <F l="Start at (sec)"><input defaultValue={vcfg.start || ""} onBlur={(e) => buildVideo({ start: e.target.value })} /></F>
              : <F l="Fit"><select value={vcfg.fit || "cover"} onChange={(e) => buildVideo({ fit: e.target.value })}><option value="cover">Fill</option><option value="contain">Fit inside</option></select></F>}
          </div>
          {(vcfg.type === "file" || vcfg.type === "upload") && <F l="Poster image URL (shown before play)"><input defaultValue={vcfg.poster || ""} onBlur={(e) => buildVideo({ poster: e.target.value.trim() })} /></F>}
        </G>}

        {map && <G t="Map" open>
          <F l="Address or place"><input defaultValue={map.getAttribute("data-lb-map")} onBlur={(e) => { const v = e.target.value.trim(); if (!v) return; map.setAttribute("data-lb-map", v); const f = map.querySelector("iframe"), z = map.getAttribute("data-lb-zoom") || 14; f && f.setAttribute("src", `https://maps.google.com/maps?q=${encodeURIComponent(v)}&z=${z}&output=embed`); changed(); }} /></F>
          <div className="g2"><F l="Zoom"><input type="number" min="3" max="20" defaultValue={map.getAttribute("data-lb-zoom") || 14} onChange={(e) => { map.setAttribute("data-lb-zoom", e.target.value); const f = map.querySelector("iframe"); f && f.setAttribute("src", `https://maps.google.com/maps?q=${encodeURIComponent(map.getAttribute("data-lb-map"))}&z=${e.target.value}&output=embed`); changed(); }} /></F>
            <F l="Height"><input defaultValue={map.style.height} onChange={(e) => { map.style.height = unit(e.target.value); changed(); }} /></F></div>
        </G>}

        {embed && <G t="Embed (CRM form, calendar, any page)" open>
          <F l="Link to embed" hint="Paste the public link of your CRM form, Calendly, Typeform, Google Form…"><input defaultValue={(embed.querySelector("iframe") || {}).src || ""} placeholder="https://…" onBlur={(e) => { const v = e.target.value.trim(); if (!v) return; embed.innerHTML = `<iframe src="${v.replace(/"/g, "&quot;")}" loading="lazy" style="width:100%;height:${embed.getAttribute("data-lb-h") || 640}px;border:0;display:block" allow="clipboard-write"></iframe>`; changed(); }} /></F>
          <F l="Height (px)"><input defaultValue={embed.getAttribute("data-lb-h") || 640} onChange={(e) => { embed.setAttribute("data-lb-h", e.target.value); const f = embed.querySelector("iframe"); f && (f.style.height = unit(e.target.value)); changed(); }} /></F>
          <F l="…or paste full embed code" hint="Scripts in embed code run in Preview and on the exported site, not inside the editor."><CodeArea value={embed.querySelector("[data-lb-eph]") ? "" : embed.innerHTML} rows={5} placeholder="<iframe …></iframe> or <script …>" onApply={(v) => { embed.innerHTML = v; changed(); a.commit(); }} /></F>
        </G>}

        {html && <G t="HTML code" open><CodeArea value={html.innerHTML} rows={10} onApply={(v) => { html.innerHTML = v; a.commit(); changed(); }} /></G>}

        {form && <G t="Form & leads" open>
          {form.hasAttribute("data-lb-form-id") && <p className="hint" style={{ marginBottom: 8 }}>🔗 This form is linked to <b>Dashboard → Forms</b>. Edit it there to update it on every page (changes made here are replaced on the next update).</p>}
          <Toggle on={form.hasAttribute("data-lb-form")} label="Save submissions to Leads" onChange={(v) => attrSet("data-lb-form", v ? form.getAttribute("data-lb-form") || "Form" : "", form)} />
          {form.hasAttribute("data-lb-form") && <>
            <F l="Form name (shown in Leads)"><input value={form.getAttribute("data-lb-form")} onChange={(e) => attrSet("data-lb-form", e.target.value || "Form", form)} /></F>
            <F l="After submit"><select value={form.getAttribute("data-lb-redirect") ? "redirect" : "message"} onChange={(e) => attrSet("data-lb-redirect", e.target.value === "redirect" ? (pages[1] || pages[0] || {}).file || "thank-you.html" : "", form)}><option value="message">Show a thank-you message</option><option value="redirect">Go to a page / URL</option></select></F>
            {form.getAttribute("data-lb-redirect") ? <F l="Redirect to">
              <select value={pages.some((p) => p.file === form.getAttribute("data-lb-redirect")) ? form.getAttribute("data-lb-redirect") : ""} onChange={(e) => e.target.value && attrSet("data-lb-redirect", e.target.value, form)}><option value="">Custom URL…</option>{pages.map((p) => <option key={p.id} value={p.file}>{p.name}</option>)}</select>
              <input value={form.getAttribute("data-lb-redirect")} onChange={(e) => attrSet("data-lb-redirect", e.target.value, form)} style={{ marginTop: 6 }} />
            </F> : <F l="Thank-you message"><input value={form.getAttribute("data-lb-success") || ""} placeholder="Thank you! We will be in touch soon." onChange={(e) => attrSet("data-lb-success", e.target.value, form)} /></F>}
            <F l="Also send to webhook / CRM URL" hint="Optional. Each submission is POSTed as JSON (Google Sheets script, Zapier, Make, Pabbly, your CRM)."><input value={form.getAttribute("data-lb-webhook") || ""} placeholder="https://hooks.your-crm.com/…" onChange={(e) => attrSet("data-lb-webhook", e.target.value.trim(), form)} /></F>
          </>}
          <div className="fl-h">Fields</div>
          {fields.map((x, i) => (
            <div key={i} className={"fl" + (x === el ? " on" : "")}>
              <div className="fl-r"><input className="fl-l" value={labelText(x)} onChange={(e) => setLabel(x, e.target.value)} />
                <button className="ib" title="Up" onClick={() => moveField(x, -1)}><Icon n="up" s={12} /></button><button className="ib" title="Down" onClick={() => moveField(x, 1)}><Icon n="down" s={12} /></button>
                <button className="ib danger" title="Remove" onClick={() => { fieldBox(x).remove(); changed(); a.commit(); }}><Icon n="x" s={12} /></button></div>
              <div className="fl-r sm">
                <select value={x.tagName === "TEXTAREA" ? "textarea" : x.tagName === "SELECT" ? "select" : x.type} onChange={(e) => { const t = e.target.value; if (x.tagName === "INPUT" && !/textarea|select/.test(t)) { x.type = t; x.setAttribute("type", t); changed(); } }} disabled={x.tagName !== "INPUT"}>
                  {["text", "email", "tel", "number", "date", "checkbox", "textarea", "select"].map((t) => <option key={t} value={t}>{t}</option>)}</select>
                <input value={x.name} placeholder="name" title="Field key saved in Leads" onChange={(e) => attrSet("name", e.target.value.replace(/\s+/g, "_"), x)} />
                <Toggle on={x.required} label="Req." onChange={(v) => setReq(x, v)} />
              </div>
              {x.tagName === "SELECT" && <input className="sm" defaultValue={[...x.options].filter((o) => o.value).map((o) => o.text).join(", ")} placeholder="Options, comma separated" onBlur={(e) => { x.innerHTML = '<option value="">Choose…</option>' + e.target.value.split(",").map((o) => o.trim()).filter(Boolean).map((o) => `<option>${o.replace(/</g, "&lt;")}</option>`).join(""); changed(); }} />}
            </div>))}
          <F l="Add field"><select value="" onChange={(e) => e.target.value && addField(e.target.value)}><option value="">＋ Choose field type…</option>{["text", "email", "tel", "number", "date", "textarea", "select", "checkbox"].map((t) => <option key={t} value={t}>{t}</option>)}</select></F>
          {subBtn && <F l="Button text"><input value={subBtn.textContent} onChange={(e) => { subBtn.textContent = e.target.value; changed(); }} /></F>}
        </G>}

        {calSlot && <G t="Calendar" open>
          {!(a.events || []).length ? <p className="hint" style={{ marginTop: 0 }}>You haven't created a calendar yet. Go to <b>Dashboard → Calendar → Create event</b>, then come back and pick it here.</p> : <>
            <F l="Which calendar?"><select value={calSlot.getAttribute("data-lb-calendar") || ""} onChange={(e) => { const ev = a.events.find((x) => x.id === e.target.value); if (!ev) return; calSlot.setAttribute("data-lb-calendar", ev.id); calSlot.removeAttribute("style"); calSlot.setAttribute("data-lb-name", "Calendar: " + ev.name); calSlot.innerHTML = a.bookingWidget(ev, a.integ); a.select(calSlot); a.commit(); }}>
              <option value="">Choose a calendar…</option>{a.events.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.duration} min{x.pay && x.pay.enabled ? ` · ₹${x.pay.amount}` : ""}</option>)}</select></F>
            <p className="hint">Change availability, questions or payment in <b>Dashboard → Calendar</b> — every page using it updates automatically. Bookings appear in <b>Calendar → Meetings</b>.</p></>}
        </G>}
        {formSlot && <G t="Form" open>
          {!(a.forms || []).length ? <p className="hint" style={{ marginTop: 0 }}>No saved forms yet. Create one in <b>Dashboard → Forms</b> (with templates), then pick it here.</p> : <>
            <F l="Which form?"><select value={formSlot.getAttribute("data-lb-formslot") || ""} onChange={(e) => { const f = a.forms.find((x) => x.id === e.target.value); if (!f) return; formSlot.setAttribute("data-lb-formslot", f.id); formSlot.removeAttribute("style"); formSlot.setAttribute("data-lb-name", "Form: " + f.name); formSlot.innerHTML = a.formHtml(f, a.integ); a.select(formSlot); a.commit(); }}>
              <option value="">Choose a form…</option>{a.forms.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.fields.length} fields</option>)}</select></F>
            <p className="hint">Edit fields, design, payment and automations in <b>Dashboard → Forms</b> — pages update automatically.</p></>}
        </G>}
        {booking && (() => {
          let c = {}; try { c = JSON.parse(booking.getAttribute("data-lb-booking") || "{}"); } catch { c = {}; }
          const up = (o) => { const n = { ...c, ...o }; booking.setAttribute("data-lb-booking", JSON.stringify(n)); changed(); };
          const days = c.days || [1, 2, 3, 4, 5];
          return <G t="Booking calendar" open>
            <p className="hint" style={{ marginTop: 0 }}>Visitors pick a date and time, then fill the form. Every booking lands in <b>Leads</b> with the date &amp; time.</p>
            <div className="g2"><F l="Meeting length (min)"><input type="number" min="5" step="5" value={c.duration || 30} onChange={(e) => up({ duration: +e.target.value || 30 })} /></F>
              <F l="Gap between slots (min)"><input type="number" min="5" step="5" value={c.step || 30} onChange={(e) => up({ step: +e.target.value || 30 })} /></F></div>
            <F l="Working days"><div className="bk-days">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <button key={i} className={days.includes(i) ? "on" : ""} onClick={() => up({ days: days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort() })}>{d}</button>)}</div></F>
            <div className="g2"><F l="Day starts"><input type="time" value={c.start || "10:00"} onChange={(e) => up({ start: e.target.value })} /></F><F l="Day ends"><input type="time" value={c.end || "17:00"} onChange={(e) => up({ end: e.target.value })} /></F></div>
            <div className="g2"><F l="Bookable days ahead"><input type="number" min="1" max="365" value={c.ahead || 30} onChange={(e) => up({ ahead: +e.target.value || 30 })} /></F><F l="Time zone label"><input value={c.tz || ""} placeholder="Asia/Kolkata" onChange={(e) => up({ tz: e.target.value })} /></F></div>
            <p className="hint">Edit the title, description and form fields by clicking them on the page. The calendar becomes interactive in Preview and on the live site.</p>
          </G>;
        })()}
        {countdown && <G t="Countdown" open><F l="Ends at"><input type="datetime-local" value={countdown.getAttribute("data-lb-countdown")} onChange={(e) => attrSet("data-lb-countdown", e.target.value, countdown)} /></F></G>}
        {counter && <G t="Counter" open><div className="g2">
          <F l="Number"><input value={counter.getAttribute("data-lb-count")} onChange={(e) => { attrSet("data-lb-count", e.target.value, counter); counter.textContent = (counter.getAttribute("data-lb-prefix") || "") + Number(e.target.value || 0).toLocaleString("en-IN") + (counter.getAttribute("data-lb-suffix") || ""); }} /></F>
          <F l="Suffix"><input value={counter.getAttribute("data-lb-suffix") || ""} onChange={(e) => { attrSet("data-lb-suffix", e.target.value, counter); counter.textContent = (counter.getAttribute("data-lb-prefix") || "") + Number(counter.getAttribute("data-lb-count") || 0).toLocaleString("en-IN") + e.target.value; }} /></F>
          <F l="Prefix"><input value={counter.getAttribute("data-lb-prefix") || ""} onChange={(e) => { attrSet("data-lb-prefix", e.target.value, counter); counter.textContent = e.target.value + Number(counter.getAttribute("data-lb-count") || 0).toLocaleString("en-IN") + (counter.getAttribute("data-lb-suffix") || ""); }} /></F></div></G>}
        {prog && <G t="Progress" open><F l={`Value ${prog.getAttribute("data-lb-progress")}%`}><input type="range" min="0" max="100" value={prog.getAttribute("data-lb-progress")} onChange={(e) => { prog.setAttribute("data-lb-progress", e.target.value); prog.style.width = e.target.value + "%"; changed(); }} /></F></G>}
        {slider && <G t="Slider" open>
          <F l="Autoplay every (seconds, 0 = off)"><input type="number" min="0" value={(+slider.getAttribute("data-lb-slider") || 0) / 1000} onChange={(e) => attrSet("data-lb-slider", String((+e.target.value || 0) * 1000), slider)} /></F>
          <div className="row"><button className="btn sm" onClick={() => { const t = slider.querySelector("[data-lb-track]"), last = t && t.lastElementChild; if (last) { const c = last.cloneNode(true); a.clean(c); t.appendChild(c); a.select(c); a.commit(); } }}>＋ Add slide</button>
            <button className="btn sm" onClick={() => { const t = slider.querySelector("[data-lb-track]"); const sl = t && [...t.children].find((c) => c.contains(el)); if (sl && t.children.length > 1) { sl.remove(); a.select(slider); a.commit(); } }}>Remove this slide</button></div>
          <p className="hint">In the editor slides are shown one under another so you can edit each. In Preview they slide.</p>
        </G>}
        {tabs && <G t="Tabs" open><button className="btn sm" onClick={() => { const b = [...tabs.querySelectorAll("[data-lb-tab]")].pop(), p = [...tabs.querySelectorAll("[data-lb-pane]")].pop(); if (b && p) { const nb = b.cloneNode(true), np = p.cloneNode(true); a.clean(nb); a.clean(np); nb.textContent = "New tab"; b.after(nb); p.after(np); a.commit(); } }}>＋ Add tab</button><p className="hint">Each tab button matches the panel in the same position.</p></G>}
        {popup && <G t="Popup" open>
          <F l="Popup ID (buttons open it with Link → Open popup)"><input value={popup.id} onChange={(e) => attrSet("id", e.target.value.replace(/[^\w-]/g, "-"), popup)} /></F>
          <F l="Open automatically after (seconds)" hint="Leave empty to open only from a button."><input value={popup.getAttribute("data-lb-delay") || ""} onChange={(e) => attrSet("data-lb-delay", e.target.value, popup)} /></F>
          <div className="tgs"><Toggle on={popup.hasAttribute("data-lb-exit")} label="Open on exit intent" onChange={(v) => attrSet("data-lb-exit", v, popup)} /><Toggle on={popup.hasAttribute("data-lb-once")} label="Only once per visit" onChange={(v) => attrSet("data-lb-once", v, popup)} /></div>
        </G>}
        {gallery && <G t="Gallery" open>
          <F l="Columns"><input type="number" min="1" max="6" value={(gallery.style.gridTemplateColumns.match(/repeat\((\d+)/) || [])[1] || 3} onChange={(e) => { gallery.style.gridTemplateColumns = `repeat(${e.target.value},minmax(0,1fr))`; changed(); }} /></F>
          <label className="btn up sm">＋ Add images from computer<input hidden multiple type="file" accept="image/*" onChange={(e) => { const tplImg = gallery.querySelector("img"); [...e.target.files].forEach((f) => readImage(f, (d) => { const n = tplImg ? tplImg.cloneNode() : doc.createElement("img"); a.clean(n); n.src = d; gallery.appendChild(n); a.commit(); })); e.target.value = ""; }} /></label>
        </G>}
        {wa && <G t="WhatsApp" open>
          {(() => { const u = new URL(wa.getAttribute("href") || "https://wa.me/"), num = u.pathname.replace(/\D/g, ""), msg = u.searchParams.get("text") || ""; const upd = (n, m) => { wa.setAttribute("href", `https://wa.me/${n.replace(/\D/g, "")}${m ? "?text=" + encodeURIComponent(m) : ""}`); changed(); };
            return <><F l="Number with country code"><input value={num} placeholder="919876543210" onChange={(e) => upd(e.target.value, msg)} /></F><F l="Pre-filled message"><input value={msg} onChange={(e) => upd(num, e.target.value)} /></F></>; })()}
        </G>}

        {!isBody && !video && !map && !embed && !html && <G t="Content" open>
          {leaf && <F l="Text (HTML allowed)" hint="Tip: double-click text on the page to type directly."><textarea rows={4} value={el.innerHTML} onChange={(e) => { el.innerHTML = e.target.value; changed(); }} /></F>}
          {tag === "IMG" && <>
            <div className="imgp"><img src={el.getAttribute("src")} alt="" /></div>
            <F l="Image URL"><input value={el.getAttribute("src") && el.getAttribute("src").startsWith("data:") ? "(uploaded image)" : el.getAttribute("src") || ""} onChange={(e) => attrSet("src", e.target.value)} /></F>
            <label className="btn up sm"><Icon n="upload" s={13} /> Upload from computer<input hidden type="file" accept="image/*" onChange={(e) => { readImage(e.target.files[0], (d) => attrSet("src", d)); e.target.value = ""; }} /></label>
            <F l="Alt text (for SEO & screen readers)"><input value={el.getAttribute("alt") || ""} onChange={(e) => attrSet("alt", e.target.value)} /></F>
            <div className="g2">{Sel({ l: "Fit", k: "objectFit", o: ["cover", "contain", "fill", "none"] })}<F l="Loading"><select value={el.getAttribute("loading") || ""} onChange={(e) => attrSet("loading", e.target.value)}><option value="">Normal</option><option value="lazy">Lazy (faster page)</option></select></F></div>
          </>}
          {/^(INPUT|TEXTAREA)$/.test(tag) && <><F l="Placeholder"><input value={el.getAttribute("placeholder") || ""} onChange={(e) => attrSet("placeholder", e.target.value)} /></F></>}
          {!leaf && !/^(IMG|IFRAME|INPUT|TEXTAREA|SELECT|HR)$/.test(tag) && <p className="hint">This is a container. Drag elements into it, or open the Style tab to change its look.</p>}
        </G>}

        {!isBody && <G t="Link / navigation" open={!!url || !!pop || isA || openLink}>
          <F l="When clicked"><select value={lkind} onChange={(e) => { setLkind(e.target.value); if (!e.target.value) { setLink(""); el.removeAttribute("data-lb-open"); changed(); } }}>
            <option value="">Nothing (not a link)</option>{pages.length > 1 && <option value="page">Go to a page of this site</option>}<option value="section">Scroll to a section on this page</option>
            <option value="url">Open a web address</option><option value="email">Send an email</option><option value="phone">Call a phone number</option><option value="whatsapp">Open WhatsApp chat</option>{popups.length > 0 && <option value="popup">Open a popup</option>}</select></F>
          {lkind === "page" && <>
            <F l="Page"><select value={pages.some((p) => p.file === fileOf(url)) ? fileOf(url) : ""} onChange={(e) => setLink(e.target.value)}><option value="">Choose a page…</option>{pages.map((p) => <option key={p.id} value={p.file}>{p.name} — {p.file}</option>)}</select></F>
            {kind === "page" && <F l="…and jump to a section (optional)"><select value={url.split("#")[1] || ""} onChange={(e) => setLink(fileOf(url) + (e.target.value ? "#" + e.target.value : ""))}><option value="">Top of page</option>{otherIds.map((x) => <option key={x.id} value={x.id}>{x.label} (#{x.id})</option>)}</select></F>}
          </>}
          {lkind === "section" && <F l="Section" hint={sections.length ? "Sections without an ID get one automatically." : "No sections found. Add a Section first."}>
            <select value={url.startsWith("#") ? url.slice(1) : ""} onChange={(e) => { const v = e.target.value; if (!v) return; const sx = v.startsWith("idx:") ? sections[+v.slice(4)] : sections.find((x) => x.el.id === v); if (sx) setLink("#" + a.ensureAnchor(sx.el)); }}>
              <option value="">Choose a section…</option>{sections.map((x, i) => <option key={i} value={x.el.id || "idx:" + i}>{x.label}{x.el.id ? "  (#" + x.el.id + ")" : ""}</option>)}</select>
            {url.startsWith("#") && <p className="hint">Links to <b>{url}</b></p>}</F>}
          {lkind === "url" && <F l="Web address"><input value={url} placeholder="https://…" onChange={(e) => setLink(e.target.value)} /></F>}
          {lkind === "email" && <F l="Email address"><input value={url.replace("mailto:", "")} placeholder="you@example.com" onChange={(e) => setLink(e.target.value ? "mailto:" + e.target.value : "")} /></F>}
          {lkind === "phone" && <F l="Phone number"><input value={url.replace("tel:", "")} placeholder="+91 98765 43210" onChange={(e) => setLink(e.target.value ? "tel:" + e.target.value.replace(/[^\d+]/g, "") : "")} /></F>}
          {lkind === "whatsapp" && <F l="WhatsApp number (with country code)"><input value={(url.match(/wa\.me\/(\d+)/) || [])[1] || ""} placeholder="919876543210" onChange={(e) => setLink(e.target.value ? "https://wa.me/" + e.target.value.replace(/\D/g, "") : "", "_blank")} /></F>}
          {lkind === "popup" && <F l="Popup"><select value={pop} onChange={(e) => setPopupLink(e.target.value)}><option value="">Choose…</option>{popups.map((p) => <option key={p}>{p}</option>)}</select></F>}
          {lkind && lkind !== "popup" && lkind !== "section" && <Toggle on={tgt === "_blank"} label="Open in a new tab" onChange={(v) => setLink(url, v ? "_blank" : "")} />}
        </G>}
        {isBody && <p className="hint pad">Whole page selected. Use the Style tab for the page background, or the <b>Site</b> tab for SEO, fonts, colors and code.</p>}
      </>}

      {/* ===================== STYLE ===================== */}
      {itab === "style" && <>
        <G t="Typography" open>
          <F l="Font"><select value={fontName(get("fontFamily"))} onChange={(e) => { const v = e.target.value; v && ensureFont(doc, v); set({ fontFamily: v ? fontStack(v) : "" }); }}>
            <option value="">Default (from Site)</option><optgroup label="Google fonts">{GFONTS.map((f) => <option key={f}>{f}</option>)}</optgroup><optgroup label="System">{SYSFONTS.map((f) => <option key={f} value={fontName(f)}>{fontName(f)}</option>)}</optgroup></select></F>
          <div className="g2">{Num({ l: "Size", k: "fontSize" })}{Sel({ l: "Weight", k: "fontWeight", o: ["300", "400", "500", "600", "700", "800", "900"] })}</div>
          {Col({ l: "Text color", k: "color" })}
          <F l="Align"><Seg value={get("textAlign")} onChange={(v) => set({ textAlign: v })} opts={[["left", "Left"], ["center", "Center"], ["right", "Right"], ["justify", "Justify"]]} /></F>
          <div className="g2">{Num({ l: "Line height", k: "lineHeight" })}{Num({ l: "Letter spacing", k: "letterSpacing" })}</div>
          <div className="g2">{Sel({ l: "Case", k: "textTransform", o: ["none", "uppercase", "lowercase", "capitalize"] })}{Sel({ l: "Decoration", k: "textDecoration", o: ["none", "underline", "line-through"] })}</div>
          {Sel({ l: "Style", k: "fontStyle", o: ["normal", "italic"] })}
        </G>
        <G t="Spacing" open>{Sides({ l: "Padding (inside)", p: "padding" })}{Sides({ l: "Margin (outside)", p: "margin" })}<p className="hint">Numbers are px. You can also type 2rem, 5%, auto.</p></G>
        <G t="Size"><div className="g2">{Txt({ l: "Width", k: "width" })}{Txt({ l: "Max width", k: "maxWidth" })}{Txt({ l: "Height", k: "height" })}{Txt({ l: "Min height", k: "minHeight" })}</div></G>
        <G t="Background">
          {Col({ l: "Color", k: "backgroundColor" })}
          <F l="Gradient"><div className="grads">{["linear-gradient(120deg,#3b2fd6,#7c6cff)", "linear-gradient(120deg,#0f766e,#22c1a1)", "linear-gradient(120deg,#b4235a,#f0628f)", "linear-gradient(120deg,#f59e0b,#ef4444)", "linear-gradient(180deg,#fbfaff,#ebe8ff)", "linear-gradient(120deg,#16142b,#3a3370)"].map((g) => <button key={g} style={{ background: g }} onClick={() => set({ backgroundImage: g })} />)}<button className="none" title="Remove" onClick={() => set({ backgroundImage: "" })}><Icon n="x" s={12} /></button></div></F>
          <F l="Image URL"><input value={bgImg ? (bgImg[1].startsWith("data:") ? "(uploaded image)" : bgImg[1]) : ""} placeholder="https://…" onChange={(e) => set(e.target.value ? { backgroundImage: `url("${e.target.value}")`, backgroundSize: get("backgroundSize") || "cover", backgroundPosition: "center" } : { backgroundImage: "" })} /></F>
          <label className="btn up sm"><Icon n="upload" s={13} /> Upload background<input hidden type="file" accept="image/*" onChange={(e) => { readImage(e.target.files[0], (d) => set({ backgroundImage: `url("${d}")`, backgroundSize: "cover", backgroundPosition: "center" })); e.target.value = ""; }} /></label>
          <div className="g2">{Sel({ l: "Image size", k: "backgroundSize", o: ["cover", "contain", "auto"] })}{Sel({ l: "Position", k: "backgroundPosition", o: ["center", "top", "bottom", "left", "right"] })}</div>
          {Sel({ l: "Scroll effect", k: "backgroundAttachment", o: ["scroll", "fixed"] })}
        </G>
        <G t="Border & shadow">
          <div className="g2">{Num({ l: "Width", k: "borderWidth" })}{Sel({ l: "Style", k: "borderStyle", o: ["solid", "dashed", "dotted", "double", "none"] })}</div>
          {Col({ l: "Color", k: "borderColor" })}
          {Num({ l: "Corner radius", k: "borderRadius" })}
          <F l="Shadow"><select value={Object.keys(SH).find((k) => SH[k] === get("boxShadow")) || (get("boxShadow") ? "Custom" : "None")} onChange={(e) => e.target.value !== "Custom" && set({ boxShadow: SH[e.target.value] })}>{Object.keys(SH).map((k) => <option key={k}>{k}</option>)}<option disabled>Custom</option></select></F>
          <F l={`Opacity ${Math.round((parseFloat(get("opacity") || cs.opacity) || 1) * 100)}%`}><input type="range" min="0" max="1" step="0.05" value={get("opacity") || cs.opacity} onChange={(e) => set({ opacity: e.target.value })} /></F>
        </G>
        <G t="Layout">
          <F l="Display"><Seg value={get("display")} onChange={(v) => set({ display: v })} opts={[["block", "Block"], ["flex", "Flex"], ["grid", "Grid"], ["inline-block", "Inline"], ["none", "Hide"]]} /></F>
          {/flex/.test(get("display") || cs.display) && <>
            <F l="Direction"><Seg value={get("flexDirection")} onChange={(v) => set({ flexDirection: v })} opts={[["row", "Row →"], ["column", "Column ↓"], ["row-reverse", "← Row"], ["column-reverse", "↑ Col"]]} /></F>
            <div className="g2">{Sel({ l: "Justify", k: "justifyContent", o: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] })}{Sel({ l: "Align", k: "alignItems", o: ["stretch", "flex-start", "center", "flex-end", "baseline"] })}</div>
            <div className="g2">{Sel({ l: "Wrap", k: "flexWrap", o: ["nowrap", "wrap"] })}{Num({ l: "Gap", k: "gap" })}</div>
          </>}
          {/grid/.test(get("display") || cs.display) && <div className="g2">{Txt({ l: "Columns", k: "gridTemplateColumns" })}{Num({ l: "Gap", k: "gap" })}</div>}
          {el.parentElement && /flex/.test(w.getComputedStyle(el.parentElement).display) && <div className="g2">{Txt({ l: "Flex (grow shrink basis)", k: "flex" })}{Sel({ l: "Align self", k: "alignSelf", o: ["auto", "flex-start", "center", "flex-end", "stretch"] })}</div>}
          <div className="g2">{Sel({ l: "Position", k: "position", o: ["static", "relative", "absolute", "fixed", "sticky"] })}{Txt({ l: "Z-index", k: "zIndex" })}</div>
          {/absolute|fixed|sticky|relative/.test(get("position")) && <div className="g2">{Txt({ l: "Top", k: "top" })}{Txt({ l: "Right", k: "right" })}{Txt({ l: "Bottom", k: "bottom" })}{Txt({ l: "Left", k: "left" })}</div>}
          {Sel({ l: "Overflow", k: "overflow", o: ["visible", "hidden", "auto"] })}
        </G>
      </>}

      {/* ===================== ADVANCED ===================== */}
      {itab === "adv" && <>
        <G t="Identity" open>
          {!isBody && <F l="Layer name (shown in Layers)"><input value={el.getAttribute("data-lb-name") || ""} placeholder={nameOf(el)} onChange={(e) => attrSet("data-lb-name", e.target.value)} /></F>}
          <F l="Element ID" hint={el.id ? <>Link to it with <b>#{el.id}</b> (same page) or <b>page.html#{el.id}</b>.</> : "Give a unique ID so menus/buttons can scroll here."}>
            <input value={el.getAttribute("id") || ""} placeholder="e.g. pricing" onChange={(e) => attrSet("id", e.target.value.replace(/\s+/g, "-").replace(/[^\w-]/g, ""))} /></F>
          <F l="CSS classes" hint="Space separated. Style them in Site → Custom CSS."><input value={userCls} placeholder="my-class another" onChange={(e) => { const k = keepCls(); el.className = (e.target.value + " " + k.join(" ")).trim(); changed(); }} /></F>
          <F l="Custom attributes" hint="One per line: name=value (e.g. aria-label=Menu, data-id=7)"><CodeArea value={attrs} rows={3} onApply={applyAttrs} /></F>
        </G>
        <G t="Custom CSS (this element)" open>
          <p className="hint">Use <code>selector</code> for this element. Works with hover, media queries and child elements.</p>
          <CodeArea key={dev} rows={8} value={a.css.get(el)} placeholder={"selector {\n  transition: .3s;\n}\nselector:hover {\n  transform: translateY(-4px);\n}\n@media (max-width:767px) {\n  selector { padding: 16px; }\n}"} onApply={(v) => { a.css.set(el, v); changed(); a.commit(); }} />
        </G>
        {!isBody && <G t="Motion effects">
          <div className="g2"><F l="Entrance animation"><select value={el.getAttribute("data-lb-anim") || ""} onChange={(e) => attrSet("data-lb-anim", e.target.value)}><option value="">None</option><option value="fade-up">Fade up</option><option value="fade-down">Fade down</option><option value="fade-left">Slide from left</option><option value="fade-right">Slide from right</option><option value="zoom">Zoom in</option><option value="flip">Flip</option></select></F>
            <F l="Delay (ms)"><input value={el.getAttribute("data-lb-delay") || ""} placeholder="0" onChange={(e) => attrSet("data-lb-delay", e.target.value.replace(/\D/g, ""))} /></F></div>
          <F l="Hover effect"><select value={hoverFx} onChange={(e) => setHover(e.target.value)}><option value="">None</option><option value="lift">Lift</option><option value="grow">Grow</option><option value="glow">Glow</option><option value="dim">Dim</option><option value="tilt">Tilt</option></select></F>
          <p className="hint">Animations play in Preview and on the live site.</p>
        </G>}
        {!isBody && <G t="Responsive visibility" open>
          <div className="tgs">{[["d", "desktop", "Hide on desktop"], ["t", "tablet", "Hide on tablet"], ["m", "mobile", "Hide on mobile"]].map(([k, ic, l]) => <Toggle key={k} on={el.classList.contains("lb-hide-" + k)} label={<><Icon n={ic} s={12} /> {l}</>} onChange={(v) => { el.classList.toggle("lb-hide-" + k, v); changed(); }} />)}</div>
          <p className="hint">Hidden elements look faded in the editor.</p>
        </G>}
        {!isBody && <G t="HTML code (this element)"><HtmlBox el={el} A={A} /></G>}
      </>}
    </div>
  );
}

/* ==================== Canva-style floating toolbar ==================== */
/* ================= Canva-style floating toolbar =================
   A contextual bar above the selected element (changes for text / image / button / video / box)
   and a small action bar below it (lock, duplicate, delete, more). */

const PRESETS = ["#000000", "#ffffff", "#16142b", "#5f5b7d", "#e11d48", "#f97316", "#f59e0b", "#16a34a", "#0d9488", "#0284c7", "#4f46e5", "#9333ea", "#db2777", "#f3f4f6"];
const ANIMS = [["", "None"], ["fade-up", "Rise"], ["fade-down", "Drop"], ["fade-left", "Slide right"], ["fade-right", "Slide left"], ["zoom", "Pop"], ["flip", "Flip"]];
const FROM = { "fade-up": "translateY(34px)", "fade-down": "translateY(-34px)", "fade-left": "translateX(-44px)", "fade-right": "translateX(44px)", zoom: "scale(.9)", flip: "perspective(800px) rotateX(18deg)" };
const TEXTY = /^(H1|H2|H3|H4|H5|H6|P|SPAN|LI|A|B|STRONG|EM|I|LABEL|BLOCKQUOTE|SUMMARY|BUTTON|SMALL|FIGCAPTION|TD|TH|DT|DD)$/;

/* colors already used on the page = "Document colors" */
const docColors = (doc) => {
  const seen = new Map(), w = doc.defaultView;
  [...doc.body.querySelectorAll("*")].slice(0, 400).forEach((n) => {
    const s = w.getComputedStyle(n);
    [s.color, s.backgroundColor].forEach((c) => { const h = hex(c); if (h) seen.set(h, (seen.get(h) || 0) + 1); });
  });
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map((x) => x[0]);
};

export function QuickBar({ el, A, ifr, wrapEl, sc, posRef, editing, onOpen }) {
  const top = useRef(), bot = useRef(), [pop, setPop] = useState(""), [more, setMore] = useState(false);
  const [aiQ, setAiQ] = useState(""), [aiBusy, setAiBusy] = useState(false), [aiErr, setAiErr] = useState("");
  const a = A.current, doc = el.ownerDocument, w = doc.defaultView, cs = w.getComputedStyle(el), tag = el.tagName;
  const st = (k) => a.getStyle(el, k) || "";
  const set = (o) => a.setStyle(el, o);
  const locked = el.hasAttribute("data-lb-lock");

  /* what is it? */
  const video = el.closest("[data-lb-video]");
  const isImg = tag === "IMG", isBtn = (tag === "A" && /background/.test(el.getAttribute("style") || "")) || tag === "BUTTON";
  const leaf = [...el.childNodes].every((c) => c.nodeType === 3 || c.nodeType === 8 || (c.nodeType === 1 && INL.has(c.tagName)));
  const isText = !isImg && !video && leaf && (TEXTY.test(tag) || (tag === "DIV" && el.textContent.trim()));
  const kind = video ? "video" : isImg ? "image" : isBtn ? "button" : isText ? "text" : "box";

  /* keep the bars glued to the element (also called when the page scrolls) */
  const place = () => {
    const t = top.current, b = bot.current; if (!t || !ifr || !wrapEl || !el.isConnected) return;
    const fr = ifr.getBoundingClientRect(), wr = wrapEl.getBoundingClientRect(), r = el.getBoundingClientRect();
    const x = fr.left - wr.left + r.left * sc, y = fr.top - wr.top + r.top * sc, wd = r.width * sc, h = r.height * sc, W = wrapEl.clientWidth, H = wrapEl.clientHeight;
    const off = y + h < 0 || y > H;
    t.style.display = b.style.display = off ? "none" : "";
    if (off) return;
    const cx = x + wd / 2, tw = t.offsetWidth, bw = b.offsetWidth;
    t.style.left = Math.max(8, Math.min(W - tw - 8, cx - tw / 2)) + "px";
    t.style.top = (y - t.offsetHeight - 12 >= 6 ? y - t.offsetHeight - 12 : Math.max(6, Math.min(H - 110, y + 10))) + "px";
    b.style.left = Math.max(8, Math.min(W - bw - 8, cx - bw / 2)) + "px";
    b.style.top = Math.max(60, Math.min(H - b.offsetHeight - 8, y + h + 12)) + "px";
    /* pop-ups: open upward when there's no room below, and never leave the canvas */
    const pw = t.querySelector(".qb-popwrap");
    if (pw) {
      pw.classList.remove("up"); pw.style.left = "0px";
      const pr = pw.getBoundingClientRect(), roomUp = t.getBoundingClientRect().top - wr.top - 12;
      if (pr.bottom > wr.bottom - 8 && roomUp > wr.bottom - t.getBoundingClientRect().bottom) pw.classList.add("up");
      const p2 = pw.getBoundingClientRect();
      pw.style.maxHeight = Math.max(160, pw.classList.contains("up") ? roomUp : wr.bottom - p2.top - 10) + "px";
      if (p2.right > wr.right - 8) pw.style.left = Math.round(wr.right - 8 - p2.right) + "px";
    }
    const mm = b.querySelector(".qb-more");
    if (mm) { mm.classList.remove("up"); if (mm.getBoundingClientRect().bottom > wr.bottom - 8) mm.classList.add("up"); }
  };
  useLayoutEffect(() => { posRef.current = place; place(); return () => { posRef.current = null; }; });

  const keep = (e) => e.preventDefault(); // don't steal focus from text being edited
  const B = ({ ic, label, on, onClick, title, cls = "" }) => (
    <button className={"qb-b" + (on ? " on" : "") + " " + cls} title={title || label} onMouseDown={keep} onClick={onClick}>{ic && <Icon n={ic} s={15} />}{label && <span>{label}</span>}</button>
  );
  const P = (name, ic, label, title) => <B ic={ic} label={label} title={title || label} on={pop === name} onClick={() => setPop(pop === name ? "" : name)} />;
  const Dot = ({ k, title }) => { const c = hex(st(k) || cs[k]) || (k === "backgroundColor" ? "" : "#000000"); return <button className={"qb-dot" + (pop === k ? " on" : "")} title={title} onMouseDown={keep} onClick={() => setPop(pop === k ? "" : k)}><i style={{ background: c || "repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/8px 8px" }} /></button>; };
  const sep = <span className="qb-sep" />;

  /* text actions */
  const exec = (cmd, style) => { if (editing) { doc.execCommand(cmd); a.changed(); } else set(style()); };
  const fsize = parseFloat(st("fontSize") || cs.fontSize) || 16;
  const align = st("textAlign") || cs.textAlign, nextAlign = { left: "center", start: "center", center: "right", right: "justify", justify: "left" }[align] || "center";
  const flipped = /scaleX\(-1\)/.test(st("transform"));
  const play = (v) => { if (!v || !el.animate) return; el.animate([{ opacity: 0, transform: FROM[v] }, { opacity: 1, transform: "none" }], { duration: 700, easing: "cubic-bezier(.2,.7,.2,1)" }); };

  const color = (k) => {
    const cur = hex(st(k) || cs[k]), dc = docColors(doc);
    const apply = (v) => set({ [k]: v });
    return <div className="qb-pop">
      <b>{k === "color" ? "Text color" : k === "borderColor" ? "Border color" : "Fill color"}</b>
      <div className="qb-sw"><label className="qb-pick" title="Custom color"><input type="color" value={cur || "#ffffff"} onChange={(e) => apply(e.target.value)} />+</label>
        <button title="Brand primary color" className="qb-c" style={{ background: "var(--ac)" }} onMouseDown={keep} onClick={() => apply("var(--lb-primary)")}><em>P</em></button>
        {k !== "color" && <button title="No color" className="qb-c none" onMouseDown={keep} onClick={() => apply(k === "backgroundColor" ? "transparent" : "")} />}</div>
      {dc.length > 0 && <><small>Document colors</small><div className="qb-sw">{dc.map((c) => <button key={c} title={c} className={"qb-c" + (c === cur ? " on" : "")} style={{ background: c }} onMouseDown={keep} onClick={() => apply(c)} />)}</div></>}
      <small>Default colors</small><div className="qb-sw">{PRESETS.map((c) => <button key={c} title={c} className={"qb-c" + (c === cur ? " on" : "")} style={{ background: c }} onMouseDown={keep} onClick={() => apply(c)} />)}</div>
      {k === "backgroundColor" && <><small>Gradients</small><div className="qb-sw">{["linear-gradient(120deg,#3b2fd6,#7c6cff)", "linear-gradient(120deg,#0f766e,#22c1a1)", "linear-gradient(120deg,#b4235a,#f0628f)", "linear-gradient(120deg,#f59e0b,#ef4444)", "linear-gradient(180deg,#fbfaff,#ebe8ff)", "linear-gradient(120deg,#16142b,#3a3370)"].map((g) => <button key={g} className="qb-c" style={{ background: g }} onMouseDown={keep} onClick={() => set({ backgroundImage: g })} />)}<button title="Remove gradient" className="qb-c none" onMouseDown={keep} onClick={() => set({ backgroundImage: "" })} /></div></>}
    </div>;
  };
  const slider = (title, k, min, max, unit, chips) => {
    const v = parseFloat(st(k) || cs[k]) || 0;
    return <div className="qb-pop"><b>{title}</b>
      <div className="qb-sl"><input type="range" min={min} max={max} step={unit ? 1 : 0.05} value={v} onChange={(e) => set({ [k]: e.target.value + unit })} /><input value={unit ? Math.round(v) : Math.round(v * 100)} onChange={(e) => set({ [k]: unit ? e.target.value + unit : String(+e.target.value / 100) })} /></div>
      {chips && <div className="qb-chips">{chips.map(([l, val]) => <button key={l} onMouseDown={keep} onClick={() => set({ [k]: val })}>{l}</button>)}</div>}
    </div>;
  };

  const pops = {
    color: () => color("color"), backgroundColor: () => color("backgroundColor"), borderColor: () => color("borderColor"),
    font: () => <div className="qb-pop qb-list"><b>Font</b>{[...GFONTS, ...SYSFONTS.map(fontName)].map((f) => <button key={f} className={fontName(st("fontFamily")) === f ? "on" : ""} style={{ fontFamily: `"${f}", system-ui` }} onMouseDown={keep} onClick={() => { ensureFont(doc, f); set({ fontFamily: fontStack(f) }); }}>{f}</button>)}</div>,
    radius: () => slider("Corner rounding", "borderRadius", 0, 80, "px", [["Square", "0px"], ["Soft", "8px"], ["Round", "18px"], ["Pill / circle", "999px"]]),
    opacity: () => slider("Transparency", "opacity", 0, 1, "", [["100%", "1"], ["75%", "0.75"], ["50%", "0.5"], ["25%", "0.25"]]),
    border: () => <div className="qb-pop"><b>Border</b>
      <div className="qb-chips">{[["None", "none"], ["Solid", "solid"], ["Dashed", "dashed"], ["Dotted", "dotted"]].map(([l, v]) => <button key={v} className={(st("borderStyle") || cs.borderStyle) === v ? "on" : ""} onMouseDown={keep} onClick={() => set(v === "none" ? { borderStyle: "none", borderWidth: "" } : { borderStyle: v, borderWidth: st("borderWidth") || (parseFloat(cs.borderWidth) ? cs.borderWidth : "2px"), borderColor: st("borderColor") || "#16142b" })}>{l}</button>)}</div>
      <small>Weight</small><div className="qb-sl"><input type="range" min="0" max="12" value={parseFloat(st("borderWidth") || cs.borderWidth) || 0} onChange={(e) => set({ borderWidth: e.target.value + "px", borderStyle: st("borderStyle") && st("borderStyle") !== "none" ? st("borderStyle") : "solid" })} /><input value={parseFloat(st("borderWidth") || cs.borderWidth) || 0} onChange={(e) => set({ borderWidth: e.target.value + "px" })} /></div>
      <small>Color</small><div className="qb-sw"><label className="qb-pick"><input type="color" value={hex(st("borderColor") || cs.borderColor) || "#000000"} onChange={(e) => set({ borderColor: e.target.value })} />+</label>{PRESETS.slice(0, 11).map((c) => <button key={c} className="qb-c" style={{ background: c }} onMouseDown={keep} onClick={() => set({ borderColor: c })} />)}</div>
    </div>,
    shadow: () => <div className="qb-pop qb-list"><b>Shadow</b>{Object.keys(SH).map((k) => <button key={k} className={(st("boxShadow") || "") === SH[k] ? "on" : ""} onMouseDown={keep} onClick={() => set({ boxShadow: SH[k] })}><i className="qb-shp" style={{ boxShadow: SH[k] }} />{k}</button>)}</div>,
    ai: () => {
      const ai = a.integ && a.integ.ai, ready = ai && ai.keys && ai.keys[ai.provider];
      const IDEAS = ["Make it look more premium and modern", "Rewrite the text to be more persuasive", "Make it dark with white text", "Add 3 customer testimonials", "Translate the text to Hindi", "Make it better on mobile"];
      const run = async () => {
        if (aiQ.trim().length < 4) return setAiErr("Tell the AI what to change.");
        setAiErr(""); setAiBusy(true);
        try { const h = await aiEdit(ai, a.outer(el), aiQ.trim()); a.replaceEl(el, h); }
        catch (e) { setAiErr(e.message); setAiBusy(false); }
      };
      return <div className="qb-pop qb-ai"><b>✨ Change this {nameOf(el).toLowerCase()} with AI</b>
        {!ready ? <small>Connect Claude, ChatGPT, Gemini or DeepSeek in Dashboard → Integrations first.</small> : <>
          <textarea rows={3} value={aiQ} disabled={aiBusy} placeholder="e.g. Make the background dark blue, bigger heading, add a WhatsApp button" onChange={(e) => setAiQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }} />
          <div className="qb-chips">{IDEAS.map((x) => <button key={x} disabled={aiBusy} onMouseDown={keep} onClick={() => setAiQ(x)}>{x}</button>)}</div>
          {aiErr && <small className="qb-err">{aiErr}</small>}
          <button className="qb-go" disabled={aiBusy} onMouseDown={keep} onClick={run}>{aiBusy ? "✨ Working… (10–40 s)" : "✨ Apply change"}</button>
          <small>Only this element changes. Don't like it? Press Undo (Ctrl+Z).</small></>}
      </div>;
    },
    anim: () => <div className="qb-pop"><b>Animate on scroll</b><div className="qb-anims">{ANIMS.map(([v, l]) => <button key={v} className={(el.getAttribute("data-lb-anim") || "") === v ? "on" : ""} onMouseDown={keep} onMouseEnter={() => play(v)} onClick={() => { v ? el.setAttribute("data-lb-anim", v) : el.removeAttribute("data-lb-anim"); play(v); a.changed(); }}><i className={"qb-ap " + (v || "none")} />{l}</button>)}</div><small>Hover to preview. Plays when visitors scroll to it.</small></div>,
    pos: () => <div className="qb-pop qb-grid"><b>Position</b>
      <button onMouseDown={keep} onClick={() => a.move(-1)}><Icon n="up" s={14} />Move up</button><button onMouseDown={keep} onClick={() => a.move(1)}><Icon n="down" s={14} />Move down</button>
      <button onMouseDown={keep} onClick={() => set({ display: isImg ? "block" : st("display"), marginLeft: "0px", marginRight: "auto" })}>⇤ Align left</button>
      <button onMouseDown={keep} onClick={() => set({ display: isImg ? "block" : st("display"), marginLeft: "auto", marginRight: "auto" })}>↔ Center</button>
      <button onMouseDown={keep} onClick={() => set({ display: isImg ? "block" : st("display"), marginLeft: "auto", marginRight: "0px" })}>⇥ Align right</button>
      <button onMouseDown={keep} onClick={() => set({ width: "100%", maxWidth: "100%" })}>⟷ Full width</button>
      <button onMouseDown={keep} onClick={() => set({ position: st("position") || "relative", zIndex: String((parseInt(cs.zIndex) || 0) + 1) })}>▲ Bring forward</button>
      <button onMouseDown={keep} onClick={() => set({ position: st("position") || "relative", zIndex: String((parseInt(cs.zIndex) || 1) - 1) })}>▼ Send backward</button>
    </div>,
  };

  /* the contextual buttons */
  const bars = {
    text: <>
      <B label={editing ? "Done" : "Edit"} ic="pen" on={editing} onClick={() => (editing ? doc.activeElement && doc.activeElement.blur() : a.editText(el))} />{sep}
      <button className={"qb-font" + (pop === "font" ? " on" : "")} onMouseDown={keep} onClick={() => setPop(pop === "font" ? "" : "font")} style={{ fontFamily: cs.fontFamily }}>{fontName(st("fontFamily") || cs.fontFamily).slice(0, 14)}<Icon n="chevd" s={12} /></button>
      <div className="qb-size"><button onMouseDown={keep} onClick={() => set({ fontSize: Math.max(8, fsize - 2) + "px" })}>−</button><input value={Math.round(fsize)} onChange={(e) => set({ fontSize: e.target.value + "px" })} /><button onMouseDown={keep} onClick={() => set({ fontSize: fsize + 2 + "px" })}>+</button></div>
      <Dot k="color" title="Text color" />
      <B label="B" cls="bold" title="Bold" on={+(st("fontWeight") || cs.fontWeight) >= 600} onClick={() => exec("bold", () => ({ fontWeight: +(st("fontWeight") || cs.fontWeight) >= 600 ? "400" : "700" }))} />
      <B label="I" cls="ital" title="Italic" on={(st("fontStyle") || cs.fontStyle) === "italic"} onClick={() => exec("italic", () => ({ fontStyle: (st("fontStyle") || cs.fontStyle) === "italic" ? "normal" : "italic" }))} />
      <B label="U" cls="und" title="Underline" on={/underline/.test(st("textDecoration") || cs.textDecorationLine)} onClick={() => exec("underline", () => ({ textDecoration: /underline/.test(st("textDecoration") || cs.textDecorationLine) ? "none" : "underline" }))} />
      <B label={{ left: "⇤", start: "⇤", center: "↔", right: "⇥", justify: "≡" }[align] || "⇤"} title={`Align (${align}) — click for ${nextAlign}`} onClick={() => set({ textAlign: nextAlign })} />
      <B label="aA" title="Uppercase" on={(st("textTransform") || cs.textTransform) === "uppercase"} onClick={() => set({ textTransform: (st("textTransform") || cs.textTransform) === "uppercase" ? "none" : "uppercase" })} />
      {sep}{P("anim", "sparkle", "Animate")}<B ic="link" title="Link" onClick={() => onOpen("content", "link")} />{P("pos", null, "Position")}
    </>,
    button: <>
      <B label={editing ? "Done" : "Edit"} ic="pen" on={editing} onClick={() => (editing ? doc.activeElement && doc.activeElement.blur() : a.editText(el))} />{sep}
      <Dot k="backgroundColor" title="Button color" /><Dot k="color" title="Text color" />
      {P("radius", null, "Corners")}{P("border", null, "Border")}{P("shadow", null, "Shadow")}
      {sep}<B ic="link" label="Link" onClick={() => onOpen("content", "link")} />{P("anim", "sparkle", "Animate")}{P("pos", null, "Position")}
    </>,
    image: <>
      <label className="qb-b" title="Replace image" onMouseDown={keep}><Icon n="upload" s={15} /><span>Replace</span><input hidden type="file" accept="image/*" onChange={(e) => { readImage(e.target.files[0], (d) => { el.setAttribute("src", d); a.changed(); a.commit(); }); e.target.value = ""; }} /></label>{sep}
      <B label={(st("objectFit") || cs.objectFit) === "contain" ? "Fit" : "Fill"} title="Crop: fill the box or fit inside" onClick={() => set({ objectFit: (st("objectFit") || cs.objectFit) === "contain" ? "cover" : "contain" })} />
      <B label="Flip" title="Flip horizontally" on={flipped} onClick={() => set({ transform: flipped ? "" : "scaleX(-1)" })} />
      {P("radius", null, "Corners")}{P("border", null, "Border")}{P("opacity", null, "Transparency")}{P("shadow", null, "Shadow")}
      {sep}<B ic="link" title="Link" onClick={() => onOpen("content", "link")} />{P("anim", "sparkle", "Animate")}{P("pos", null, "Position")}
    </>,
    video: <>
      <B ic="video" label="Replace video" onClick={() => onOpen("content")} />{sep}
      {P("radius", null, "Corners")}{P("shadow", null, "Shadow")}{sep}{P("anim", "sparkle", "Animate")}{P("pos", null, "Position")}
    </>,
    box: <>
      <Dot k="backgroundColor" title="Background color" />
      <label className="qb-b" title="Background image" onMouseDown={keep}><Icon n="image" s={15} /><span>Background</span><input hidden type="file" accept="image/*" onChange={(e) => { readImage(e.target.files[0], (d) => set({ backgroundImage: `url("${d}")`, backgroundSize: "cover", backgroundPosition: "center" })); e.target.value = ""; }} /></label>
      {P("radius", null, "Corners")}{P("border", null, "Border")}{P("shadow", null, "Shadow")}{P("opacity", null, "Transparency")}
      {sep}{P("anim", "sparkle", "Animate")}{P("pos", null, "Position")}
    </>,
  };

  return <>
    <div ref={top} className={"qb" + (locked ? " locked" : "")} onMouseDown={(e) => e.stopPropagation()}>
      {locked ? <><Icon n="lock" s={14} /><span className="qb-lk">Locked — unlock to edit</span><B ic="lock" label="Unlock" onClick={() => a.toggleLock(el)} /></> : bars[kind]}
      <span className="qb-sep" /><B label="✨ AI" title="Change this with AI" on={pop === "ai"} cls="qb-aib" onClick={() => setPop(pop === "ai" ? "" : "ai")} />
      <B ic="sparkle" label="Style" title="All style options" onClick={() => onOpen("style")} />
      {pop && !locked && pops[pop] && <div className="qb-popwrap">{pops[pop]()}</div>}
    </div>
    <div ref={bot} className="qb-mini" onMouseDown={(e) => e.stopPropagation()}>
      <span className="qb-name">{nameOf(el)}</span>
      <B ic="lock" title={locked ? "Unlock" : "Lock (prevents moving and deleting)"} on={locked} onClick={() => a.toggleLock(el)} />
      <B ic="copy" title="Duplicate (Ctrl+D)" onClick={a.dup} />
      <B ic="trash" title="Delete (Del)" cls="del" onClick={a.del} />
      <B label="•••" title="More" on={more} onClick={() => setMore(!more)} />
      {more && <div className="qb-more">
        <button onMouseDown={keep} onClick={() => { setMore(false); a.parent(); }}><Icon n="parent" s={14} />Select parent</button>
        <button onMouseDown={keep} onClick={() => { setMore(false); a.copyStyle(el); }}><Icon n="wand" s={14} />Copy style</button>
        <button onMouseDown={keep} disabled={!a.hasStyle()} onClick={() => { setMore(false); a.pasteStyle(el); }}><Icon n="sparkle" s={14} />Paste style</button>
        <button onMouseDown={keep} onClick={() => { setMore(false); el.classList.toggle("lb-hide-all"); a.changed(); }}><Icon n="eyeoff" s={14} />{el.classList.contains("lb-hide-all") ? "Show on site" : "Hide on site"}</button>
        <button onMouseDown={keep} onClick={() => { setMore(false); onOpen("adv"); }}><Icon n="code" s={14} />ID, CSS &amp; code</button>
        <button onMouseDown={keep} onClick={() => { setMore(false); onOpen("layers"); }}><Icon n="layers" s={14} />Show in Layers</button>
      </div>}
    </div>
  </>;
}
