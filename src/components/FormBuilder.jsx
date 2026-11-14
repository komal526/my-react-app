// LaunchBuilder v48 — FormBuilder.jsx
// Drag & drop form builder: element panel · live canvas (the real form) · Styles & Options (Customize · Themes · Advanced)
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FIELD_TYPES, newField, uid, formUrl, ago } from "../lib.js";
import { formHtml, formPageHtml, FORM_STYLE_DEF, FORM_FONTS } from "./tools.js";
import { Icon } from "./icons.jsx";

const copy = async (t, done) => { try { await navigator.clipboard.writeText(t); done && done(); } catch { window.prompt("Copy this:", t); } };
const STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman & Nicobar", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];

/* the element panel — grouped like a pro builder; each one becomes a ready-to-use field */
const ELEMENTS = [
  ["Text", [["text", "Single line", "text"], ["textarea", "Multi line", "menu"], ["number", "Number", "tag"], ["url", "Website", "link"]]],
  ["Personal info", [["fullname", "Full name", "user"], ["firstname", "First name", "user"], ["lastname", "Last name", "user"], ["dob", "Date of birth", "calendar"], ["phone", "Phone", "phone"], ["email", "Email", "mail"]]],
  ["Choice", [["select", "Dropdown", "dropdown"], ["radio", "Single choice", "badge"], ["checkboxes", "Multi choice", "check"], ["consent", "Consent", "shield"]]],
  ["Date & time", [["date", "Date", "calendar"], ["time", "Time", "clock"]]],
  ["Address", [["address", "Address", "pin"], ["city", "City", "globe"], ["state", "State", "layers"], ["pincode", "PIN code", "tag"]]],
  ["Layout", [["heading", "Heading / text", "heading"]]],
  ["Ad tracking", [["utm", "UTM & click IDs", "chart"]]],
];
const PRESET = {
  fullname: ["text", { label: "Full name", name: "name", placeholder: "Your full name" }],
  firstname: ["text", { label: "First name", name: "first_name", width: "half" }],
  lastname: ["text", { label: "Last name", name: "last_name", width: "half" }],
  dob: ["date", { label: "Date of birth", name: "dob" }],
  phone: ["tel", { label: "WhatsApp number", name: "phone", placeholder: "10-digit mobile number" }],
  email: ["email", { label: "Email", name: "email", placeholder: "you@example.com" }],
  address: ["textarea", { label: "Address", name: "address", required: false }],
  city: ["text", { label: "City", name: "city", width: "half" }],
  state: ["select", { label: "State", name: "state", width: "half", options: STATES, placeholder: "Choose state" }],
  pincode: ["text", { label: "PIN code", name: "pincode", width: "half", placeholder: "6 digits" }],
  utm: ["utm", { label: "Ad tracking", name: "utm", required: false }],
};
const make = (key, taken) => {
  const [type, o] = PRESET[key] || [key, {}], f = { ...newField(type), ...o };
  let n = f.name, i = 2; while (taken.includes(n)) n = f.name + "_" + i++; return { ...f, name: n, id: uid() };
};
const elName = (key) => ELEMENTS.flatMap(([, l]) => l).find((x) => x[0] === key)?.[1] || "Field";

/* themes = a set of style values */
const THEMES = [
  ["classic", "Classic", { ...FORM_STYLE_DEF, color: "#4f46e5", style: "card", btn: { bg: "", fg: "#ffffff", grad: "" } }],
  ["navy", "Navy & Gold", { ...FORM_STYLE_DEF, pageBg: "#eef0fb", cardBg: "#0f1238", text: "#ffffff", muted: "#c9cbf0", inputBg: "#ffffff", inputText: "#16142b", inputBorder: "#ffffff", color: "#f5b301", style: "card", btn: { bg: "#f5b301", fg: "#1b1300", grad: "" } }],
  ["whatsapp", "WhatsApp", { ...FORM_STYLE_DEF, pageBg: "#f5f3fa", cardBg: "#ffffff", inputBg: "#111111", inputText: "#ffffff", inputBorder: "#111111", color: "#22c55e", style: "card", btn: { bg: "#22c55e", fg: "#ffffff", grad: "#0d9488" } }],
  ["midnight", "Midnight", { ...FORM_STYLE_DEF, pageBg: "#0b0d24", cardBg: "#14173a", text: "#ffffff", muted: "#a9add6", inputBg: "#0b0d24", inputText: "#ffffff", inputBorder: "#2b2f63", color: "#8b7bff", style: "card", btn: { bg: "#8b7bff", fg: "#ffffff", grad: "#ec4899" } }],
  ["sunrise", "Sunrise", { ...FORM_STYLE_DEF, pageBg: "#fff7ed", cardBg: "#ffffff", text: "#3b1d06", muted: "#8a5a35", inputBg: "#fffaf3", inputText: "#3b1d06", inputBorder: "#f3d6b5", color: "#f97316", style: "card", btn: { bg: "#f97316", fg: "#ffffff", grad: "#ec4899" } }],
  ["mint", "Mint", { ...FORM_STYLE_DEF, pageBg: "#ecfdf5", cardBg: "#ffffff", text: "#064e3b", muted: "#3f7b66", inputBg: "#f6fffb", inputText: "#064e3b", inputBorder: "#bfe9d6", color: "#10b981", style: "card", btn: { bg: "#10b981", fg: "#ffffff", grad: "" } }],
  ["royal", "Royal", { ...FORM_STYLE_DEF, pageBg: "#f5f3ff", cardBg: "#ffffff", text: "#2e1065", muted: "#6b5b95", inputBg: "#f3efff", inputText: "#2e1065", inputBorder: "#f3efff", inputStyle: "filled", color: "#7c3aed", style: "card", btn: { bg: "#7c3aed", fg: "#ffffff", grad: "#db2777" } }],
  ["minimal", "Minimal", { ...FORM_STYLE_DEF, pageBg: "#ffffff", cardBg: "#ffffff", inputStyle: "line", color: "#111827", style: "plain", shadow: false, btn: { bg: "#111827", fg: "#ffffff", grad: "" } }],
];

function Color({ label, value, onChange, def }) {
  const v = value || def || "#ffffff";
  return <div className="fb2-color"><span>{label}</span><div><label className="fb2-sw" style={{ background: v }}><input type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#ffffff"} onChange={(e) => onChange(e.target.value)} /></label>
    <input value={v} onChange={(e) => onChange(e.target.value)} spellCheck={false} />{def && value && value !== def && <button title="Reset" onClick={() => onChange(def)}>✕</button>}</div></div>;
}
function Sec({ title, open: o0 = true, children }) {
  const [o, setO] = useState(o0);
  return <div className={"fb2-sec" + (o ? " on" : "")}><button className="fb2-sh" onClick={() => setO(!o)}>{title}<Icon n="chevd" s={14} /></button>{o && <div className="fb2-sb">{children}</div>}</div>;
}
const Seg = ({ value, opts, onChange }) => <div className="fb2-seg">{opts.map(([v, l]) => <button key={String(v)} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}</div>;
const Range = ({ label, value, min, max, step = 1, unit = "px", onChange }) => <label className="fb2-range"><span>{label}<b>{value}{unit}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} /></label>;

export default function Builder({ form, onChange, onBack, projects, onAddToPage, usedOn, leads = [], integ, onIntegrations, onLeads }) {
  const [sel, setSel] = useState(null), [side, setSide] = useState("customize"), [main, setMain] = useState("build"), [dev, setDev] = useState("desktop");
  const [note, setNote] = useState(""), [prev, setPrev] = useState(false), [q, setQ] = useState("");
  const [drop, setDrop] = useState(null), [tb, setTb] = useState(null), [target, setTarget] = useState({ pid: "", page: "" });
  const drag = useRef(null), cv = useRef(null), fb = useRef(null), hist = useRef({ past: [], future: [], t: 0 });
  const s = { ...FORM_STYLE_DEF, ...form.settings }, f = form.fields.find((x) => x.id === sel);
  const bt = { full: true, align: "center", size: "md", bg: "", fg: "#ffffff", note: true, extra: false, extraText: "Chat on WhatsApp", extraUrl: "", grad: "", ...(s.btn || {}) };
  const em = s.email || {}, gem = (integ && integ.email) || {}, pay = s.pay || {}, wa = s.wa || {}, gpay = (integ && integ.pay) || {}, gwa = (integ && integ.wa) || {};
  const mailReady = gem.provider === "emailjs" ? !!(gem.serviceId && gem.templateId && gem.publicKey) : !!gem.webhook;
  const VARS = ["name", ...form.fields.filter((x) => !/heading|utm/.test(x.type) && x.name !== "name").map((x) => x.name), "form", "all_fields", ...(pay.enabled ? ["amount", "payment_id"] : [])];
  const flash = (t) => { setNote(t); setTimeout(() => setNote(""), 2200); };

  /* every change goes through here → undo / redo (typing is grouped) */
  /* typing in one box (or dragging one slider) is one undo step; every click, drop or theme is its own step */
  const up = (o) => {
    const h = hist.current, now = Date.now(), el = document.activeElement, typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !/^(checkbox|radio)$/.test(el.type || "");
    if (!(typing && h.el === el && now - h.t < 1200)) { h.past.push(form); if (h.past.length > 60) h.past.shift(); }
    h.t = now; h.el = typing ? el : null; h.future = []; onChange({ ...form, ...o, updated: now });
  };
  const undo = () => { const h = hist.current; if (!h.past.length) return; h.future.push(form); h.t = 0; h.el = null; onChange({ ...h.past.pop(), updated: Date.now() }); };
  const redo = () => { const h = hist.current; if (!h.future.length) return; h.past.push(form); h.t = 0; h.el = null; onChange({ ...h.future.pop(), updated: Date.now() }); };
  useEffect(() => { const k = (e) => { if (!(e.ctrlKey || e.metaKey) || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return; if (e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); } if (e.key.toLowerCase() === "y") { e.preventDefault(); redo(); } }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); });
  const setS = (o) => up({ settings: { ...form.settings, ...o } });
  const setB = (o) => setS({ btn: { ...bt, ...o } }), setE = (o) => setS({ email: { ...em, ...o } });
  const setF = (id, o) => up({ fields: form.fields.map((x) => (x.id === id ? { ...x, ...o } : x)) });
  const names = form.fields.map((x) => x.name);
  const insert = (key, at) => { const n = make(key, names), list = [...form.fields]; list.splice(at ?? list.length, 0, n); up({ fields: list }); setSel(n.id); flash(`${elName(key)} added`); };
  const moveTo = (id, at) => { const list = [...form.fields], i = list.findIndex((x) => x.id === id); if (i < 0) return; const [it] = list.splice(i, 1); list.splice(at > i ? at - 1 : at, 0, it); up({ fields: list }); };
  const del = (id) => { up({ fields: form.fields.filter((y) => y.id !== id) }); setSel(null); };
  const dup = (id) => { const i = form.fields.findIndex((x) => x.id === id), x = form.fields[i], c = { ...x, id: uid(), name: x.name + "_2" }, l = [...form.fields]; l.splice(i + 1, 0, c); up({ fields: l }); setSel(c.id); };
  const step = (id, d) => { const i = form.fields.findIndex((x) => x.id === id); if (i + d < 0 || i + d >= form.fields.length) return; moveTo(id, d > 0 ? i + 2 : i - 1); };

  const html = useMemo(() => formHtml(form, integ), [form, integ]);
  const pageHtml = useMemo(() => (prev ? formPageHtml(form, integ) : ""), [prev, form, integ]);
  const embed = formHtml(form, integ), proj = projects.find((p) => p.id === target.pid);
  const formLeads = leads.filter((l) => l.formId === form.id);

  /* canvas: highlight the selected field, make fields draggable, place the toolbar */
  const boxes = () => (fb.current ? [...fb.current.querySelectorAll("form > [data-lb-fid]")].filter((b) => !b.getAttribute("data-lb-fid").startsWith("__")) : []);
  const place = () => {
    if (!fb.current || !cv.current) return setTb(null);
    fb.current.querySelectorAll(".fb2-on").forEach((n) => n.classList.remove("fb2-on"));
    boxes().forEach((b) => b.setAttribute("draggable", "true"));
    const el = sel && fb.current.querySelector(`[data-lb-fid="${CSS.escape(sel)}"]`);
    if (!el) return setTb(null);
    el.classList.add("fb2-on");
    const r = el.getBoundingClientRect(), c = cv.current.getBoundingClientRect();
    setTb({ top: r.top - c.top + cv.current.scrollTop, left: r.left - c.left + cv.current.scrollLeft, w: r.width, h: r.height, field: !sel.startsWith("__") });
  };
  useLayoutEffect(place, [html, sel, dev, main]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const r = () => place(); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (e) => {
    e.preventDefault();
    const t = e.target.closest && e.target.closest("[data-lb-fid]");
    if (!t) { setSel(null); return; }
    const id = t.getAttribute("data-lb-fid"); setSel(id);
  };
  const where = (e) => {
    const list = boxes(), c = cv.current.getBoundingClientRect(), st = cv.current.scrollTop, sl = cv.current.scrollLeft;
    if (!list.length) { const fr = fb.current.querySelector("form"); const r = (fr || fb.current).getBoundingClientRect(); return { i: 0, top: r.top - c.top + st, left: r.left - c.left + sl, w: r.width }; }
    for (let i = 0; i < list.length; i++) {
      const r = list[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2 && (e.clientY < r.top || e.clientX < r.right)) return { i, top: r.top - c.top + st - 8, left: r.left - c.left + sl, w: r.width };
    }
    const r = list[list.length - 1].getBoundingClientRect();
    return { i: list.length, top: r.bottom - c.top + st + 6, left: r.left - c.left + sl, w: r.width };
  };
  const onDragOver = (e) => { if (!drag.current) return; e.preventDefault(); const w = where(e); setDrop((d) => (d && d.i === w.i && d.top === w.top ? d : w)); };
  const onDrop = (e) => { e.preventDefault(); const d = drag.current, w = drop || where(e); drag.current = null; setDrop(null); if (!d) return; if (d.key) insert(d.key, w.i); else if (d.id) moveTo(d.id, w.i); };
  const onCanvasDragStart = (e) => { const t = e.target.closest && e.target.closest("[data-lb-fid]"); if (!t) return; const id = t.getAttribute("data-lb-fid"); if (id.startsWith("__")) return e.preventDefault(); drag.current = { id }; setSel(id); try { e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; } catch { /* old browsers */ } };
  const endDrag = () => { drag.current = null; setDrop(null); };

  const filtered = ELEMENTS.map(([g, list]) => [g, list.filter((x) => !q || x[1].toLowerCase().includes(q.toLowerCase()))]).filter(([, l]) => l.length);
  const theme = (o) => setS({ ...o, btn: { ...bt, ...o.btn } });

  /* ---------------- right panel ---------------- */
  const fieldPanel = f && <div className="fb2-pane">
    <div className="fb2-ph"><button className="fb2-back" onClick={() => setSel(null)}>←</button><b>{(FIELD_TYPES.find((t) => t[0] === f.type) || [, "Field"])[1]}</b><div className="grow" /><button title="Duplicate" onClick={() => dup(f.id)}><Icon n="copy" s={15} /></button><button title="Delete" className="red" onClick={() => del(f.id)}><Icon n="trash" s={15} /></button></div>
    {f.type === "utm" ? <p className="fb2-help">This hidden block saves <b>utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid</b> and <b>fbclid</b> from the page link with every lead — so in Leads you can see which ad, post or campaign each person came from. Visitors don't see it.</p> : <>
      <label>Label<input value={f.label} onChange={(e) => setF(f.id, { label: e.target.value })} autoFocus /></label>
      {f.type !== "heading" && <>
        {!/radio|checkboxes|consent/.test(f.type) && <label>Placeholder<input value={f.placeholder} onChange={(e) => setF(f.id, { placeholder: e.target.value })} /></label>}
        {/select|radio|checkboxes/.test(f.type) && <label>Options <small>(one per line)</small><textarea rows={5} value={f.options.join("\n")} onChange={(e) => setF(f.id, { options: e.target.value.split("\n") })} onBlur={(e) => setF(f.id, { options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean) })} /></label>}
        <label>Help text<input value={f.help} placeholder="Shown under the field" onChange={(e) => setF(f.id, { help: e.target.value })} /></label>
        <div className="fb2-two">{f.type !== "checkboxes" && <label className="fb2-tog"><input type="checkbox" checked={f.required} onChange={(e) => setF(f.id, { required: e.target.checked })} /><i />Required</label>}</div>
        <span className="fb2-lab">Width</span><Seg value={f.width} opts={[["full", "Full"], ["half", "Half"]]} onChange={(v) => setF(f.id, { width: v })} />
        <details className="fb2-more"><summary>More</summary>
          <label>Field key <small>(column name in Leads)</small><input value={f.name} onChange={(e) => setF(f.id, { name: e.target.value.replace(/[^\w]/g, "_") })} /></label>
          <label>Type<select value={f.type} onChange={(e) => setF(f.id, { type: e.target.value, options: /select|radio|checkboxes/.test(e.target.value) && !f.options.length ? ["Option 1", "Option 2"] : f.options })}>{FIELD_TYPES.filter((t) => !/heading|utm/.test(t[0])).map(([t, l]) => <option key={t} value={t}>{l}</option>)}</select></label>
        </details>
      </>}</>}
  </div>;
  const titlePanel = sel === "__title" && <div className="fb2-pane">
    <div className="fb2-ph"><button className="fb2-back" onClick={() => setSel(null)}>←</button><b>Title</b></div>
    <label>Form title<input value={s.title} onChange={(e) => setS({ title: e.target.value })} autoFocus /></label>
    <label>Subtitle<textarea rows={2} value={s.subtitle} onChange={(e) => setS({ subtitle: e.target.value })} /></label>
    <span className="fb2-lab">Align</span><Seg value={s.align} opts={[["left", "Left"], ["center", "Center"]]} onChange={(v) => setS({ align: v })} />
    <Range label="Title size" value={s.titleSize} min={18} max={44} onChange={(v) => setS({ titleSize: v })} />
  </div>;
  const btnPanel = sel === "__submit" && <div className="fb2-pane">
    <div className="fb2-ph"><button className="fb2-back" onClick={() => setSel(null)}>←</button><b>Submit button</b></div>
    <label>Button text<input value={s.submit} onChange={(e) => setS({ submit: e.target.value })} autoFocus /></label>
    <Color label="Button colour" value={bt.bg} def={s.color} onChange={(v) => setB({ bg: v })} />
    <Color label="Gradient to (optional)" value={bt.grad} def="" onChange={(v) => setB({ grad: v })} />
    <Color label="Button text" value={bt.fg} def="#ffffff" onChange={(v) => setB({ fg: v })} />
    <span className="fb2-lab">Size</span><Seg value={bt.size} opts={[["sm", "S"], ["md", "M"], ["lg", "L"]]} onChange={(v) => setB({ size: v })} />
    <span className="fb2-lab">Width</span><Seg value={bt.full} opts={[[true, "Full width"], [false, "Fit text"]]} onChange={(v) => setB({ full: v })} />
    {!bt.full && <><span className="fb2-lab">Position</span><Seg value={bt.align} opts={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} onChange={(v) => setB({ align: v })} /></>}
    {pay.enabled && <label className="fb2-tog"><input type="checkbox" checked={bt.note} onChange={(e) => setB({ note: e.target.checked })} /><i />Show “🔒 Secure payment”</label>}
    <label className="fb2-tog"><input type="checkbox" checked={bt.extra} onChange={(e) => setB({ extra: e.target.checked })} /><i />Add a second button</label>
    {bt.extra && <><label>Second button text<input value={bt.extraText} onChange={(e) => setB({ extraText: e.target.value })} /></label>
      <label>Link<input value={bt.extraUrl} placeholder="https://wa.me/919876543210" onChange={(e) => setB({ extraUrl: e.target.value.trim() })} /></label></>}
  </div>;

  const customize = <div className="fb2-pane fb2-styles">
    <Sec title="Basics">
      <Color label="Page background" value={s.pageBg} def={FORM_STYLE_DEF.pageBg} onChange={(v) => setS({ pageBg: v })} />
      <Color label="Form card" value={s.cardBg} def={FORM_STYLE_DEF.cardBg} onChange={(v) => setS({ cardBg: v })} />
      <Color label="Text colour" value={s.text} def={FORM_STYLE_DEF.text} onChange={(v) => setS({ text: v })} />
      <Color label="Input background" value={s.inputBg} def={FORM_STYLE_DEF.inputBg} onChange={(v) => setS({ inputBg: v })} />
      <Color label="Input text" value={s.inputText} def={FORM_STYLE_DEF.inputText} onChange={(v) => setS({ inputText: v })} />
      <Color label="Input border" value={s.inputBorder} def={FORM_STYLE_DEF.inputBorder} onChange={(v) => setS({ inputBorder: v })} />
      <Color label="Accent & button" value={s.color} def="#4f46e5" onChange={(v) => setS({ color: v, btn: { ...bt, bg: "" } })} />
      <Range label="Corner radius — all" value={s.radius} min={0} max={24} onChange={(v) => setS({ radius: v })} />
    </Sec>
    <Sec title="Layout" open={false}>
      <Range label="Form width" value={s.width} min={320} max={900} step={10} onChange={(v) => setS({ width: v })} />
      <Range label="Space between fields" value={s.gap} min={8} max={32} onChange={(v) => setS({ gap: v })} />
      <Range label="Card padding" value={s.pad} min={12} max={56} onChange={(v) => setS({ pad: v })} />
      <span className="fb2-lab">Title align</span><Seg value={s.align} opts={[["left", "Left"], ["center", "Center"]]} onChange={(v) => setS({ align: v })} />
    </Sec>
    <Sec title="Surface" open={false}>
      <span className="fb2-lab">Form</span><Seg value={s.style} opts={[["card", "Card"], ["plain", "No card"]]} onChange={(v) => setS({ style: v })} />
      <span className="fb2-lab">Inputs</span><Seg value={s.inputStyle} opts={[["box", "Box"], ["filled", "Filled"], ["line", "Underline"]]} onChange={(v) => setS({ inputStyle: v })} />
      <label className="fb2-tog"><input type="checkbox" checked={!!s.shadow} onChange={(e) => setS({ shadow: e.target.checked })} /><i />Card shadow</label>
    </Sec>
    <Sec title="Text" open={false}>
      <label>Font<select value={s.font} onChange={(e) => setS({ font: e.target.value })}>{FORM_FONTS.map((x) => <option key={x} value={x}>{x || "Same as the page"}</option>)}</select></label>
      <Range label="Title size" value={s.titleSize} min={18} max={44} onChange={(v) => setS({ titleSize: v })} />
      <Range label="Label size" value={s.labelSize} min={12} max={18} onChange={(v) => setS({ labelSize: v })} />
      <Range label="Input text size" value={s.inputSize} min={13} max={20} onChange={(v) => setS({ inputSize: v })} />
      <Color label="Muted text" value={s.muted} def={FORM_STYLE_DEF.muted} onChange={(v) => setS({ muted: v })} />
    </Sec>
    <Sec title="Button" open={false}>
      <Color label="Button colour" value={bt.bg} def={s.color} onChange={(v) => setB({ bg: v })} />
      <Color label="Gradient to" value={bt.grad} def="" onChange={(v) => setB({ grad: v })} />
      <Color label="Button text" value={bt.fg} def="#ffffff" onChange={(v) => setB({ fg: v })} />
      <span className="fb2-lab">Size</span><Seg value={bt.size} opts={[["sm", "S"], ["md", "M"], ["lg", "L"]]} onChange={(v) => setB({ size: v })} />
      <span className="fb2-lab">Width</span><Seg value={bt.full} opts={[[true, "Full width"], [false, "Fit text"]]} onChange={(v) => setB({ full: v })} />
    </Sec>
  </div>;

  const themes = <div className="fb2-pane"><p className="fb2-help">One click changes every colour. Fine-tune afterwards in Customize.</p>
    <div className="fb2-themes">{THEMES.map(([k, l, t]) => <button key={k} className="fb2-th" onClick={() => { theme(t); flash(`${l} theme applied`); }} style={{ background: t.pageBg }}>
      <span className="fb2-thc" style={{ background: t.style === "plain" ? "transparent" : t.cardBg }}><i style={{ background: t.inputBg, borderColor: t.inputBorder, borderRadius: t.inputStyle === "line" ? 0 : 4, borderWidth: t.inputStyle === "line" ? "0 0 1.5px" : 1 }} /><i style={{ background: t.inputBg, borderColor: t.inputBorder, borderRadius: t.inputStyle === "line" ? 0 : 4, borderWidth: t.inputStyle === "line" ? "0 0 1.5px" : 1 }} /><em style={{ background: t.btn.grad ? `linear-gradient(135deg,${t.btn.bg || t.color},${t.btn.grad})` : t.btn.bg || t.color }} /></span>
      <b>{l}</b></button>)}</div></div>;

  const advanced = <div className="fb2-pane fb2-styles">
    <Sec title="After submit">
      <label>Thank-you message<textarea rows={2} value={s.success} onChange={(e) => setS({ success: e.target.value })} /></label>
      <label>Redirect to <small>(optional, e.g. thank-you.html)</small><input value={s.redirect} onChange={(e) => setS({ redirect: e.target.value.trim() })} /></label>
      <label>Send to webhook / CRM <small>(optional)</small><input value={s.webhook} placeholder="https://hooks.zapier.com/…" onChange={(e) => setS({ webhook: e.target.value.trim() })} /></label>
      <p className="fb2-help">Every submission is always saved in <b>Leads</b>. The webhook also sends it to Google Sheets, Zapier, Make, Pabbly or another CRM.</p>
    </Sec>
    <Sec title="💬 WhatsApp message" open={!!wa.enabled}>
      <label className="fb2-tog"><input type="checkbox" checked={!!wa.enabled} onChange={(e) => setS({ wa: { ...wa, enabled: e.target.checked } })} /><i />Send an automatic WhatsApp</label>
      {wa.enabled && <>
        {!wa.hook && !gwa.webhook && <p className="fb2-warn">Add your WhatsApp webhook in <a href="#" onClick={(e) => { e.preventDefault(); onIntegrations(); }}>Integrations</a> first.</p>}
        <label>Message<textarea rows={3} value={wa.msg ?? ""} placeholder={gwa.template} onChange={(e) => setS({ wa: { ...wa, msg: e.target.value } })} /></label>
        <div className="fb2-vars">{form.fields.filter((x) => !/heading|utm/.test(x.type)).map((x) => <button key={x.id} onClick={() => setS({ wa: { ...wa, msg: (wa.msg ?? gwa.template ?? "") + ` {{${x.name}}}` } })}>{`{{${x.name}}}`}</button>)}</div>
        <label>Webhook for this form <small>(optional)</small><input value={wa.hook || ""} placeholder={gwa.webhook || "https://…"} onChange={(e) => setS({ wa: { ...wa, hook: e.target.value.trim() } })} /></label>
      </>}
    </Sec>
    <Sec title="✉️ Email automation" open={!!em.enabled}>
      <label className="fb2-tog"><input type="checkbox" checked={!!em.enabled} onChange={(e) => setE({ enabled: e.target.checked })} /><i />Email automation</label>
      {em.enabled && <>
        {!mailReady && <p className="fb2-warn">Connect an email service in <a href="#" onClick={(e) => { e.preventDefault(); onIntegrations(); }}>Integrations → Email</a> first.</p>}
        <label className="fb2-tog"><input type="checkbox" checked={em.auto !== false} onChange={(e) => setE({ auto: e.target.checked })} /><i />Email the person who submitted</label>
        {em.auto !== false && <>
          {!form.fields.some((x) => x.type === "email") && <div className="fb2-fix"><span>No <b>Email</b> field — nowhere to send.</span><button onClick={() => insert("email", 1)}>＋ Add Email</button></div>}
          <label>Subject<input value={em.subject ?? ""} placeholder="Thanks for registering, {{name}}!" onChange={(e) => setE({ subject: e.target.value })} /></label>
          <label>Message<textarea rows={6} value={em.body ?? ""} placeholder={"Hi {{name}},\n\nThank you! We received your details."} onChange={(e) => setE({ body: e.target.value })} /></label>
          <div className="fb2-vars">{VARS.map((v) => <button key={v} onClick={() => setE({ body: (em.body || "") + `{{${v}}}` })}>{`{{${v}}}`}</button>)}</div>
        </>}
        <label className="fb2-tog"><input type="checkbox" checked={!!em.notify} onChange={(e) => setE({ notify: e.target.checked })} /><i />Email me every new submission</label>
        {em.notify && <label>Send to<input value={em.ownerEmail ?? ""} placeholder={gem.ownerEmail || "you@yourbrand.com"} onChange={(e) => setE({ ownerEmail: e.target.value.trim() })} /></label>}
      </>}
    </Sec>
    <Sec title="💳 Payment" open={!!pay.enabled}>
      <label className="fb2-tog"><input type="checkbox" checked={!!pay.enabled} onChange={(e) => setS({ pay: { amount: 21, mode: gpay.razorpayKey ? "razorpay" : "upi", ...pay, enabled: e.target.checked } })} /><i />Collect a payment</label>
      {pay.enabled && <>
        <label>Amount (₹)<input type="number" min="1" value={pay.amount || ""} onChange={(e) => setS({ pay: { ...pay, amount: +e.target.value } })} /></label>
        <label>How people pay<select value={pay.mode || "razorpay"} onChange={(e) => setS({ pay: { ...pay, mode: e.target.value } })}><option value="razorpay">Razorpay checkout</option><option value="upi">Direct UPI (QR + button)</option><option value="link">Payment link</option></select></label>
        {(pay.mode || "razorpay") === "razorpay" && <label>Razorpay Key ID <small>(optional — uses Integrations)</small><input value={pay.key || ""} placeholder={gpay.razorpayKey || "rzp_live_…"} onChange={(e) => setS({ pay: { ...pay, key: e.target.value.trim() } })} /></label>}
        {pay.mode === "upi" && <><label>UPI ID<input value={pay.upi || ""} placeholder={gpay.upiId || "yourname@okhdfcbank"} onChange={(e) => setS({ pay: { ...pay, upi: e.target.value.trim() } })} /></label>
          <label>Payee name<input value={pay.payee || ""} placeholder={gpay.payee || form.name} onChange={(e) => setS({ pay: { ...pay, payee: e.target.value } })} /></label></>}
        {pay.mode === "link" && <label>Payment link<input value={pay.link || ""} placeholder="https://rzp.io/l/your-link" onChange={(e) => setS({ pay: { ...pay, link: e.target.value.trim() } })} /></label>}
        <label>Description at checkout<input value={pay.desc || ""} placeholder={form.name} onChange={(e) => setS({ pay: { ...pay, desc: e.target.value } })} /></label>
        <p className="fb2-help">The price is added to the button, e.g. “Register now · ₹{(pay.amount || 0).toLocaleString("en-IN")}”. Test payments with <b>Preview</b> → open the share link.</p>
      </>}
    </Sec>
  </div>;

  return (
    <div className="fb2">
      {/* ---------- top bar ---------- */}
      <header className="fb2-top">
        <button className="fb2-ib" onClick={onBack} title="Back to Forms"><Icon n="back" s={18} /></button>
        <input className="fb2-name" value={form.name} onChange={(e) => up({ name: e.target.value })} aria-label="Form name" />
        <span className="fb2-saved"><i />Saved</span>
        <div className="fb2-mtabs" role="tablist">{[["build", "Edit"], ["subs", `Submissions${formLeads.length ? " · " + formLeads.length : ""}`], ["share", "Share & embed"]].map(([k, l]) => <button key={k} className={main === k ? "on" : ""} onClick={() => setMain(k)}>{l}</button>)}</div>
        <div className="grow" />
        {main === "build" && <div className="fb2-dev">{[["desktop", "desktop"], ["mobile", "mobile"]].map(([k, ic]) => <button key={k} className={dev === k ? "on" : ""} title={k} onClick={() => setDev(k)}><Icon n={ic} s={16} /></button>)}</div>}
        <button className="fb2-ib" title="Undo (Ctrl+Z)" disabled={!hist.current.past.length} onClick={undo}><Icon n="undo" s={16} /></button>
        <button className="fb2-ib" title="Redo (Ctrl+Y)" disabled={!hist.current.future.length} onClick={redo}><Icon n="redo" s={16} /></button>
        <button className="fb2-btn" onClick={() => setPrev(true)}><Icon n="eye" s={15} /> Preview</button>
        <button className="fb2-btn" onClick={() => copy(embed, () => flash("Embed code copied"))}><Icon n="code" s={15} /><span className="fb2-hide">Embed</span></button>
        <button className="fb2-btn y" onClick={() => copy(formUrl(form.id), () => flash("Share link copied"))}><Icon n="link" s={15} /> Copy link</button>
      </header>

      {main === "build" && <div className="fb2-grid">
        {/* ---------- left: elements ---------- */}
        <aside className="fb2-left">
          <div className="fb2-lh"><b>Form elements</b><small>Drag onto the form, or click to add</small></div>
          <label className="fb2-search"><Icon n="search" s={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search elements" /></label>
          {filtered.map(([g, list]) => <div key={g} className="fb2-grp"><span>{g}</span><div className="fb2-els">{list.map(([key, l, ic]) => (
            <button key={key} className="fb2-el" draggable onDragStart={(e) => { drag.current = { key }; try { e.dataTransfer.setData("text/plain", key); e.dataTransfer.effectAllowed = "copy"; } catch { /* old browsers */ } }} onDragEnd={endDrag} onClick={() => insert(key, f ? form.fields.indexOf(f) + 1 : undefined)} title={`Add ${l}`}>
              <Icon n={ic} s={18} /><span>{l}</span></button>))}</div></div>)}
          <div className="fb2-grp"><span>Submit</span><div className="fb2-els"><button className="fb2-el" onClick={() => setSel("__submit")}><Icon n="button" s={18} /><span>Button</span></button><button className="fb2-el" onClick={() => setSel("__title")}><Icon n="heading" s={18} /><span>Title</span></button></div></div>
        </aside>

        {/* ---------- centre: the real form on a dotted canvas ---------- */}
        <div className="fb2-cv" ref={cv} onClick={(e) => { if (e.target === e.currentTarget) setSel(null); }} onScroll={place} onDragOver={onDragOver} onDrop={onDrop} onDragLeave={(e) => { if (!cv.current.contains(e.relatedTarget)) setDrop(null); }}>
          <div className={"fb2-page " + dev} style={{ background: s.pageBg }}>
            <div className="fb2-form" ref={fb} onClick={pick} onDragStart={onCanvasDragStart} onDragEnd={endDrag} dangerouslySetInnerHTML={{ __html: html }} />
            {!form.fields.length && <div className="fb2-empty"><Icon n="plus" s={20} /><b>Drag elements here</b><small>or click any element on the left</small></div>}
          </div>
          {drop && <div className="fb2-dz" style={{ top: drop.top, left: drop.left, width: drop.w }}><span>{drag.current && drag.current.key ? "Add " + elName(drag.current.key) : "Move here"}</span></div>}
          {tb && !drop && <div className="fb2-sel" style={{ top: tb.top - 4, left: tb.left - 6, width: tb.w + 12, height: tb.h + 8 }}>
            {tb.field && <div className="fb2-tools" onClick={(e) => e.stopPropagation()}>
              <span className="fb2-grip" title="Drag to move"><Icon n="grip" s={13} /></span>
              <button title="Move up" onClick={() => step(sel, -1)}><Icon n="up" s={13} /></button><button title="Move down" onClick={() => step(sel, 1)}><Icon n="down" s={13} /></button>
              <button title="Duplicate" onClick={() => dup(sel)}><Icon n="copy" s={13} /></button><button title="Delete" onClick={() => del(sel)}><Icon n="trash" s={13} /></button></div>}
          </div>}
          {note && <span className="fb2-note">{note}</span>}
          <p className="fb2-tip">Click any part of the form to edit it · drag fields to reorder · Ctrl+Z to undo</p>
        </div>

        {/* ---------- right: Styles & Options ---------- */}
        <aside className="fb2-right">
          {fieldPanel || titlePanel || btnPanel || <>
            <div className="fb2-rh"><b>Styles &amp; Options</b></div>
            <div className="fb2-rtabs">{[["customize", "Customize"], ["themes", "Themes"], ["advanced", "Advanced"]].map(([k, l]) => <button key={k} className={side === k ? "on" : ""} onClick={() => setSide(k)}>{l}</button>)}</div>
            {side === "customize" ? customize : side === "themes" ? themes : advanced}
          </>}
        </aside>
      </div>}

      {main === "subs" && <div className="fb2-wide">
        <div className="fb2-wh"><div><h2>Submissions</h2><p className="mut">{formLeads.length} entr{formLeads.length === 1 ? "y" : "ies"} for this form · all of them are also in Leads.</p></div>{onLeads && <button className="fb2-btn" onClick={onLeads}>Open Leads →</button>}</div>
        {!formLeads.length ? <div className="empty"><b>No submissions yet</b><p className="mut">Share the link or add the form to a page — entries show up here.</p></div>
          : <div className="fb2-table"><table><thead><tr><th>Received</th>{form.fields.filter((x) => !/heading|utm/.test(x.type)).slice(0, 5).map((x) => <th key={x.id}>{x.label}</th>)}<th>Source</th></tr></thead>
            <tbody>{formLeads.slice(0, 200).map((l) => <tr key={l.id}><td>{ago(l.ts)}</td>{form.fields.filter((x) => !/heading|utm/.test(x.type)).slice(0, 5).map((x) => <td key={x.id}>{String((l.data || {})[x.name] ?? "")}</td>)}<td>{(l.data && l.data.utm_source) || l.projectName || l.source || "—"}</td></tr>)}</tbody></table></div>}
      </div>}

      {main === "share" && <div className="fb2-wide fb2-share">
        <section><h3>Add to one of your pages</h3>
          <div className="fb2-two"><select value={target.pid} onChange={(e) => setTarget({ pid: e.target.value, page: "" })}><option value="">Choose a project…</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            {proj && <select value={target.page} onChange={(e) => setTarget({ ...target, page: e.target.value })}><option value="">Choose a page…</option>{proj.pages.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.file}</option>)}</select>}</div>
          <button className="fb2-btn y" disabled={!target.page} onClick={() => { onAddToPage(form, target.pid, target.page); flash("Form added to the page"); }}>Add form to page</button>
          <p className="fb2-help">Forms stay linked: change them here and every page updates. {usedOn ? `Used on ${usedOn} page${usedOn > 1 ? "s" : ""}.` : ""}</p></section>
        <section><h3>Share link</h3><code className="fb2-code">{formUrl(form.id)}</code><div className="fb2-two"><button className="fb2-btn" onClick={() => copy(formUrl(form.id), () => flash("Link copied"))}>Copy link</button><button className="fb2-btn" onClick={() => window.open(formUrl(form.id), "_blank")}>Open form ↗</button></div></section>
        <section><h3>Embed on another website</h3><textarea className="fb2-code" rows={5} readOnly value={embed} onFocus={(e) => e.target.select()} /><button className="fb2-btn" onClick={() => copy(embed, () => flash("Embed code copied"))}>Copy embed code</button>
          <p className="fb2-help">On other sites the form shows and validates; to collect those entries, add a webhook in Advanced.</p></section>
      </div>}

      {prev && <div className="ov" onClick={() => setPrev(false)}><div className="md fb2-prev" onClick={(e) => e.stopPropagation()}>
        <div className="fb2-pbar"><b>Preview · {form.name}</b><div className="grow" /><div className="fb2-dev">{[["desktop", "desktop"], ["mobile", "mobile"]].map(([k, ic]) => <button key={k} className={dev === k ? "on" : ""} onClick={() => setDev(k)}><Icon n={ic} s={16} /></button>)}</div><button className="fb2-btn" onClick={() => window.open(formUrl(form.id), "_blank")}>Open live ↗</button><button className="fb2-ib" onClick={() => setPrev(false)}>✕</button></div>
        <div className="fb2-pstage"><iframe title="Preview" srcDoc={pageHtml} sandbox="allow-scripts allow-forms" style={{ width: dev === "mobile" ? 390 : "100%" }} /></div>
      </div></div>}
    </div>
  );
}
