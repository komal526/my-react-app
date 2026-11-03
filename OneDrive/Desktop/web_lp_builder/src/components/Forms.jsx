// LaunchBuilder v3 — Forms.jsx
import { useMemo, useRef, useState } from "react";
import { FORM_TEMPLATES, FIELD_TYPES, newForm, newField, uid, ago, formUrl } from "../lib.js";
import { formHtml, formPageHtml } from "./tools.js";

/* ================= Forms: templates, drag & drop builder, share link, embed, add to page ================= */
const TYPE_IC = { text: "Aa", email: "@", tel: "☎", number: "#", textarea: "¶", select: "▾", radio: "◉", checkboxes: "☑", date: "📅", time: "⏰", url: "🔗", consent: "✓", heading: "H" };
const copy = async (t, done) => { try { await navigator.clipboard.writeText(t); done && done(); } catch { window.prompt("Copy this:", t); } };

function Gallery({ onPick, onClose }) {
  return (
    <div className="ov" onClick={onClose}><div className="md fm-gal" onClick={(e) => e.stopPropagation()}>
      <h3>Start a new form</h3><p className="mut">Pick a template — you can change every field afterwards.</p>
      <div className="fm-tpls">{FORM_TEMPLATES.map((t) => (
        <button key={t.key} onClick={() => onPick(t)}>
          <div className="fm-mini">{t.fields().slice(0, 4).map((f) => <i key={f.id} className={f.width === "half" ? "half" : ""} />)}<em /></div>
          <b>{t.name}</b><span>{t.note}</span>
        </button>))}</div>
      <div className="mrow"><div className="grow" /><button onClick={onClose}>Cancel</button></div>
    </div></div>
  );
}

function Builder({ form, onChange, onBack, projects, onAddToPage, usedOn, leadCount }) {
  const [sel, setSel] = useState(form.fields[0] ? form.fields[0].id : null), [tab, setTab] = useState("field"), [note, setNote] = useState("");
  const [dropAt, setDropAt] = useState(null), drag = useRef(null), [target, setTarget] = useState({ pid: "", page: "" });
  const s = form.settings, f = form.fields.find((x) => x.id === sel);
  const flash = (t) => { setNote(t); setTimeout(() => setNote(""), 2200); };
  const up = (o) => onChange({ ...form, ...o, updated: Date.now() });
  const setS = (o) => up({ settings: { ...s, ...o } });
  const setF = (id, o) => up({ fields: form.fields.map((x) => (x.id === id ? { ...x, ...o } : x)) });
  const insert = (type, at) => { const n = newField(type), list = [...form.fields]; list.splice(at ?? list.length, 0, n); up({ fields: list }); setSel(n.id); setTab("field"); };
  const moveTo = (id, at) => { const list = [...form.fields], i = list.findIndex((x) => x.id === id), [it] = list.splice(i, 1); list.splice(at > i ? at - 1 : at, 0, it); up({ fields: list }); };
  const onDrop = (at) => { const d = drag.current; drag.current = null; setDropAt(null); if (!d) return; d.type ? insert(d.type, at) : moveTo(d.id, at); };
  const html = useMemo(() => formPageHtml(form), [form]);
  const embed = formHtml(form), proj = projects.find((p) => p.id === target.pid);

  return (
    <div className="fb">
      <div className="fb-top">
        <button className="link" onClick={onBack}>← Forms</button>
        <input className="fb-name" value={form.name} onChange={(e) => up({ name: e.target.value })} />
        <span className="mut sm">Saved automatically · {leadCount} lead{leadCount === 1 ? "" : "s"}{usedOn ? ` · used on ${usedOn} page${usedOn > 1 ? "s" : ""}` : ""}</span>
        <div className="grow" />
        {note && <span className="fb-note">{note}</span>}
        <button onClick={() => copy(formUrl(form.id), () => flash("Share link copied"))}>Copy share link</button>
        <button onClick={() => window.open(formUrl(form.id), "_blank")}>Open form</button>
        <button className="pri" onClick={() => copy(embed, () => flash("Embed code copied"))}>Copy embed code</button>
      </div>
      <div className="fb-grid">
        {/* ---- left: fields (drag & drop) ---- */}
        <div className="fb-col">
          <div className="fb-h">Add a field <span className="mut sm">drag or click</span></div>
          <div className="fb-types">{FIELD_TYPES.map(([t, l]) => (
            <div key={t} className="fb-type" draggable onDragStart={() => (drag.current = { type: t })} onDragEnd={() => setDropAt(null)} onClick={() => insert(t)}><i>{TYPE_IC[t]}</i>{l}</div>))}</div>
          <div className="fb-h">Fields <span className="mut sm">drag to reorder</span></div>
          <div className="fb-list" onDragOver={(e) => { e.preventDefault(); if (e.target === e.currentTarget) setDropAt(form.fields.length); }} onDrop={() => onDrop(dropAt ?? form.fields.length)}>
            {form.fields.map((x, i) => (
              <div key={x.id} className={"fb-row" + (sel === x.id ? " on" : "") + (dropAt === i ? " dz" : "")} draggable
                onDragStart={() => (drag.current = { id: x.id })} onDragEnd={() => setDropAt(null)}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setDropAt(e.clientY < r.top + r.height / 2 ? i : i + 1); }}
                onDrop={(e) => { e.stopPropagation(); onDrop(dropAt ?? i); }}
                onClick={() => { setSel(x.id); setTab("field"); }}>
                <span className="grip">⋮⋮</span><i>{TYPE_IC[x.type]}</i>
                <div className="grow"><b>{x.label || "Untitled"}{x.required && <em>*</em>}</b><span>{(FIELD_TYPES.find((t) => t[0] === x.type) || [])[1]}{x.width === "half" ? " · half width" : ""}</span></div>
                <button title="Duplicate" onClick={(e) => { e.stopPropagation(); const c = { ...x, id: uid(), name: x.name + "_2" }, l = [...form.fields]; l.splice(i + 1, 0, c); up({ fields: l }); }}>⧉</button>
                <button title="Delete" onClick={(e) => { e.stopPropagation(); up({ fields: form.fields.filter((y) => y.id !== x.id) }); }}>✕</button>
              </div>))}
            {dropAt === form.fields.length && <div className="fb-row dz-end" />}
            {!form.fields.length && <p className="mut pad">Drag a field here.</p>}
          </div>
        </div>
        {/* ---- center: live preview ---- */}
        <div className="fb-prev"><div className="fb-prev-bar"><span className="dot" /><span className="dot" /><span className="dot" /><code>{formUrl(form.id).replace(/^https?:\/\//, "")}</code></div><iframe title="Form preview" srcDoc={html} sandbox="" /></div>
        {/* ---- right: settings ---- */}
        <div className="fb-col">
          <div className="fb-tabs">{[["field", "Field"], ["settings", "Settings"], ["design", "Design"], ["use", "Use it"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
          {tab === "field" && (f ? <div className="fb-set">
            <label>Label<input value={f.label} onChange={(e) => setF(f.id, { label: e.target.value })} /></label>
            {f.type !== "heading" && <>
              <label>Field key <span className="mut sm">(column name in Leads)</span><input value={f.name} onChange={(e) => setF(f.id, { name: e.target.value.replace(/[^\w]/g, "_") })} /></label>
              <label>Type<select value={f.type} onChange={(e) => setF(f.id, { type: e.target.value, options: /select|radio|checkboxes/.test(e.target.value) && !f.options.length ? ["Option 1", "Option 2"] : f.options })}>{FIELD_TYPES.filter((t) => t[0] !== "heading").map(([t, l]) => <option key={t} value={t}>{l}</option>)}</select></label>
              {!/radio|checkboxes|consent/.test(f.type) && <label>Placeholder<input value={f.placeholder} onChange={(e) => setF(f.id, { placeholder: e.target.value })} /></label>}
              {/select|radio|checkboxes/.test(f.type) && <label>Options <span className="mut sm">(one per line)</span><textarea rows={5} value={f.options.join("\n")} onChange={(e) => setF(f.id, { options: e.target.value.split("\n") })} onBlur={(e) => setF(f.id, { options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean) })} /></label>}
              <label>Help text<input value={f.help} placeholder="Shown under the field" onChange={(e) => setF(f.id, { help: e.target.value })} /></label>
              {f.type !== "checkboxes" && <label className="chk"><input type="checkbox" checked={f.required} onChange={(e) => setF(f.id, { required: e.target.checked })} />Required</label>}
            </>}
            <div className="seg2">{[["full", "Full width"], ["half", "Half width"]].map(([v, l]) => <button key={v} className={f.width === v ? "on" : ""} onClick={() => setF(f.id, { width: v })}>{l}</button>)}</div>
          </div> : <p className="mut pad">Select a field to edit it.</p>)}
          {tab === "settings" && <div className="fb-set">
            <label>Form title<input value={s.title} onChange={(e) => setS({ title: e.target.value })} /></label>
            <label>Subtitle<input value={s.subtitle} onChange={(e) => setS({ subtitle: e.target.value })} /></label>
            <label>Button text<input value={s.submit} onChange={(e) => setS({ submit: e.target.value })} /></label>
            <label>Thank-you message<textarea rows={2} value={s.success} onChange={(e) => setS({ success: e.target.value })} /></label>
            <label>Redirect after submit <span className="mut sm">(optional, e.g. thank-you.html)</span><input value={s.redirect} onChange={(e) => setS({ redirect: e.target.value.trim() })} /></label>
            <label>Send to webhook / CRM <span className="mut sm">(optional)</span><input value={s.webhook} placeholder="https://hooks.zapier.com/…" onChange={(e) => setS({ webhook: e.target.value.trim() })} /></label>
            <p className="mut sm">Every submission is always saved in <b>Leads</b>. The webhook also sends it (as JSON) to Google Sheets, Zapier, Make, Pabbly or another CRM.</p>
          </div>}
          {tab === "design" && <div className="fb-set">
            <label>Button & accent color<div className="row"><input type="color" value={s.color} onChange={(e) => setS({ color: e.target.value })} /><input value={s.color} onChange={(e) => setS({ color: e.target.value })} /></div></label>
            <div className="fb-sw">{["#4f46e5", "#0d9488", "#e11d48", "#f97316", "#16a34a", "#0284c7", "#16142b", "#9333ea"].map((c) => <button key={c} style={{ background: c }} onClick={() => setS({ color: c })} />)}</div>
            <label>Corner rounding: {s.radius}px<input type="range" min="0" max="24" value={s.radius} onChange={(e) => setS({ radius: +e.target.value })} /></label>
            <label>Max width: {s.width}px<input type="range" min="320" max="900" step="10" value={s.width} onChange={(e) => setS({ width: +e.target.value })} /></label>
            <div className="seg2">{[["card", "Card"], ["plain", "Plain"]].map(([v, l]) => <button key={v} className={s.style === v ? "on" : ""} onClick={() => setS({ style: v })}>{l}</button>)}</div>
          </div>}
          {tab === "use" && <div className="fb-set">
            <b>Add to one of your pages</b>
            <select value={target.pid} onChange={(e) => setTarget({ pid: e.target.value, page: "" })}><option value="">Choose a project…</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            {proj && <select value={target.page} onChange={(e) => setTarget({ ...target, page: e.target.value })}><option value="">Choose a page…</option>{proj.pages.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.file}</option>)}</select>}
            <button className="pri" disabled={!target.page} onClick={() => { onAddToPage(form, target.pid, target.page); flash("Form added to the page"); }}>Add form to page</button>
            <p className="mut sm">Or open any page in the editor → <b>Add</b> → <b>My forms</b>. Forms stay linked: change them here and every page updates.</p>
            <hr />
            <b>Share link</b><code className="fb-code">{formUrl(form.id)}</code><button onClick={() => copy(formUrl(form.id), () => flash("Link copied"))}>Copy link</button>
            <b>Embed on another website</b><textarea className="fb-code" rows={4} readOnly value={embed} onFocus={(e) => e.target.select()} />
            <p className="mut sm">On other sites the form shows and validates; to collect those entries, add a webhook URL in Settings.</p>
          </div>}
        </div>
      </div>
    </div>
  );
}

export default function Forms({ forms, onSave, projects, leads, onAddToPage, onLeads }) {
  const [open, setOpen] = useState(null), [gal, setGal] = useState(false), [menu, setMenu] = useState(null);
  const cur = forms.find((x) => x.id === open);
  const countLeads = (f) => leads.filter((l) => l.formId === f.id).length;
  const usedOn = (f) => projects.reduce((n, p) => n + p.pages.filter((pg) => pg.html.includes(`data-lb-form-id="${f.id}"`)).length, 0);
  const put = (f) => onSave(forms.some((x) => x.id === f.id) ? forms.map((x) => (x.id === f.id ? f : x)) : [f, ...forms]);
  if (cur) return <Builder form={cur} onChange={put} onBack={() => setOpen(null)} projects={projects} onAddToPage={onAddToPage} usedOn={usedOn(cur)} leadCount={countLeads(cur)} />;
  return (
    <div onClick={() => setMenu(null)}>
      <div className="top"><div><h1>Forms</h1><p className="mut">Build forms once, use them on any page, and collect every entry in Leads.</p></div><button className="pri big" onClick={() => setGal(true)}>＋ New form</button></div>
      {!forms.length ? (
        <div className="empty"><b>No forms yet</b><p className="mut">Start from a template like Lead capture, Contact, Workshop registration or Appointment booking.</p><button className="pri" onClick={() => setGal(true)}>＋ Create your first form</button></div>
      ) : (
        <div className="grid">{forms.map((f) => (
          <div key={f.id} className="card fm-card" onClick={() => setOpen(f.id)}>
            <div className="fm-thumb"><iframe title={f.name} srcDoc={formPageHtml(f)} sandbox="" tabIndex={-1} /></div>
            <div className="cb">
              <div className="ct"><b>{f.name}</b><span className="tag">{f.fields.length} fields</span></div>
              <div className="mut sm"><span onClick={(e) => { e.stopPropagation(); onLeads(); }} className="fm-leads">{countLeads(f)} leads</span> · used on {usedOn(f)} page{usedOn(f) === 1 ? "" : "s"} · edited {ago(f.updated)}</div>
            </div>
            <button className="dots" onClick={(e) => { e.stopPropagation(); setMenu(menu === f.id ? null : f.id); }}>⋯</button>
            {menu === f.id && <div className="menu" onClick={(e) => e.stopPropagation()}>
              <div onClick={() => setOpen(f.id)}>Edit</div>
              <div onClick={() => { copy(formUrl(f.id)); setMenu(null); }}>Copy share link</div>
              <div onClick={() => { window.open(formUrl(f.id), "_blank"); setMenu(null); }}>Open form</div>
              <div onClick={() => { put({ ...f, id: "f" + uid(), name: f.name + " copy", created: Date.now(), updated: Date.now() }); setMenu(null); }}>Duplicate</div>
              <div className="red" onClick={() => { if (window.confirm(`Delete "${f.name}"? Pages that use it keep a copy of the form.`)) onSave(forms.filter((x) => x.id !== f.id)); setMenu(null); }}>Delete</div>
            </div>}
          </div>))}</div>
      )}
      {gal && <Gallery onClose={() => setGal(false)} onPick={(t) => { const f = newForm(t); f.name = f.name === "Untitled form" ? "Untitled form" : f.name; onSave([f, ...forms]); setGal(false); setOpen(f.id); }} />}
    </div>
  );
}
