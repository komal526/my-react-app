// LaunchBuilder v48 — Forms.jsx
import { useMemo, useState } from "react";
import ScratchCard from "./Scratch.jsx";
import Builder from "./FormBuilder.jsx";
import { FORM_TEMPLATES as FT0, newForm, uid, ago, formUrl } from "../lib.js";
import { formPageHtml } from "./tools.js";

/* ================= Forms: templates, drag & drop builder, share link, embed, add to page ================= */
const copy = async (t, done) => { try { await navigator.clipboard.writeText(t); done && done(); } catch { window.prompt("Copy this:", t); } };

/* templates shown right on the Forms page */
/* "Start from scratch" always comes first */
const FORM_TEMPLATES = [...FT0.filter((t) => t.key === "blank"), ...FT0.filter((t) => t.key !== "blank")];

function InlineTemplates({ integ, onPick, onPreview, title }) {
  const forms = useMemo(() => Object.fromEntries(FORM_TEMPLATES.map((t) => [t.key, formPageHtml(newForm(t), integ)])), [integ]);
  return (
    <div className="inl-tpl">
      <div className="inl-h"><div><h2>{title}</h2><p className="mut">Pick one, then change every field, colour and automation.</p></div></div>
      <div className="fm-tpls">{FORM_TEMPLATES.map((t) => t.key === "blank" ? (
        <ScratchCard key={t.key} icon="form" text="Build your own form — drag fields in, edit everything." onClick={() => onPick(t)} />) : (
        <div key={t.key} className="fm-t">
          <div className="fm-shot" onClick={() => onPreview(t.key)}><iframe title={t.name} srcDoc={forms[t.key]} sandbox="" tabIndex={-1} loading="lazy" />
            <div className="fm-hov"><button onClick={(e) => { e.stopPropagation(); onPreview(t.key); }}>Preview</button><button className="pri" onClick={(e) => { e.stopPropagation(); onPick(t); }}>Use</button></div></div>
          <b>{t.name}</b><span>{t.note}</span>
        </div>))}</div>
    </div>
  );
}

function Gallery({ onPick, onClose, integ, initial = null }) {
  const forms = useMemo(() => Object.fromEntries(FORM_TEMPLATES.map((t) => [t.key, formPageHtml(newForm(t), integ)])), [integ]);
  const [view, setView] = useState(initial), [dev, setDev] = useState("desktop");
  const cur = view && FORM_TEMPLATES.find((t) => t.key === view);
  return (
    <div className="ov" onClick={onClose}><div className="md fm-gal" onClick={(e) => e.stopPropagation()}>
      {!cur ? <>
        <div className="fm-gh"><div><h3>Start a new form</h3><p className="mut">{FORM_TEMPLATES.length} templates · hover to preview, change every field afterwards.</p></div><button onClick={onClose}>✕</button></div>
        <div className="fm-tpls">{FORM_TEMPLATES.map((t) => (
          <div key={t.key} className="fm-t">
            <div className="fm-shot" onClick={() => setView(t.key)}><iframe title={t.name} srcDoc={forms[t.key]} sandbox="" tabIndex={-1} />
              <div className="fm-hov"><button onClick={(e) => { e.stopPropagation(); setView(t.key); }}>👁 Preview</button><button className="pri" onClick={(e) => { e.stopPropagation(); onPick(t); }}>Use</button></div></div>
            <b>{t.name}</b><span>{t.note}</span>
          </div>))}</div>
      </> : <div className="fm-prev">
        <div className="fm-pbar"><button onClick={() => setView(null)}>← All templates</button><b>{cur.name}</b><div className="grow" />
          <div className="seg2" style={{ width: 210 }}>{[["desktop", "Desktop"], ["mobile", "Mobile"]].map(([k, l]) => <button key={k} className={dev === k ? "on" : ""} onClick={() => setDev(k)}>{l}</button>)}</div>
          <button className="pri" onClick={() => onPick(cur)}>Use this template</button></div>
        <div className="fm-pstage"><iframe title={cur.name} srcDoc={forms[cur.key]} sandbox="" style={{ width: dev === "mobile" ? 390 : "100%" }} /></div>
        <p className="mut sm">{cur.note}. After choosing it you can add/remove fields, change colours, button text, payment, WhatsApp and email automation.</p>
      </div>}
    </div></div>
  );
}

export default function Forms({ forms, onSave, projects, leads, onAddToPage, onLeads, integ, onIntegrations }) {
  const [open, setOpen] = useState(null), [gal, setGal] = useState(false), [menu, setMenu] = useState(null);
  const cur = forms.find((x) => x.id === open);
  const countLeads = (f) => leads.filter((l) => l.formId === f.id).length;
  const usedOn = (f) => projects.reduce((n, p) => n + p.pages.filter((pg) => pg.html.includes(`data-lb-form-id="${f.id}"`)).length, 0);
  const put = (f) => onSave(forms.some((x) => x.id === f.id) ? forms.map((x) => (x.id === f.id ? f : x)) : [f, ...forms]);
  if (cur) return <Builder form={cur} onChange={put} onBack={() => setOpen(null)} projects={projects} onAddToPage={onAddToPage} usedOn={usedOn(cur)} leads={leads} integ={integ} onIntegrations={onIntegrations} onLeads={onLeads} />;
  return (
    <div onClick={() => setMenu(null)}>
      <div className="top"><div><h1>Forms</h1><p className="mut">Build forms once, use them on any page, and collect every entry in Leads.</p></div><button className="pri big" onClick={() => setGal(true)}>＋ New form</button></div>
      {!forms.length ? (
        <InlineTemplates integ={integ} title="Start with a form template" onPreview={(k) => setGal(k)} onPick={(t) => { const f = newForm(t); onSave([f, ...forms]); setOpen(f.id); }} />
      ) : (
        <div className="grid">{forms.map((f) => (
          <div key={f.id} className="card fm-card" onClick={() => setOpen(f.id)}>
            <div className="fm-thumb"><iframe title={f.name} srcDoc={formPageHtml(f, integ)} sandbox="" tabIndex={-1} /></div>
            <div className="cb">
              <div className="ct"><b>{f.name}</b><span className="tag">{f.settings.pay && f.settings.pay.enabled ? `₹${f.settings.pay.amount} · ` : ""}{f.fields.length} fields</span></div>
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
      {forms.length > 0 && <InlineTemplates integ={integ} title="Add another from a template" onPreview={(k) => setGal(k)} onPick={(t) => { const f = newForm(t); onSave([f, ...forms]); setOpen(f.id); }} />}
      {gal && <Gallery integ={integ} initial={typeof gal === "string" ? gal : null} onClose={() => setGal(false)} onPick={(t) => { const f = newForm(t); f.name = f.name === "Untitled form" ? "Untitled form" : f.name; onSave([f, ...forms]); setGal(false); setOpen(f.id); }} />}
    </div>
  );
}
