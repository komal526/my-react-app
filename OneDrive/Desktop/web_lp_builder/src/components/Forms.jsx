// LaunchBuilder v8 — Forms.jsx
// LaunchBuilder v3 — Forms.jsx
import { useMemo, useRef, useState } from "react";
import { FORM_TEMPLATES, FIELD_TYPES, newForm, newField, uid, ago, formUrl } from "../lib.js";
import { formHtml, formPageHtml } from "./tools.js";

/* ================= Forms: templates, drag & drop builder, share link, embed, add to page ================= */
const TYPE_IC = { text: "Aa", email: "@", tel: "☎", number: "#", textarea: "¶", select: "▾", radio: "◉", checkboxes: "☑", date: "📅", time: "⏰", url: "🔗", consent: "✓", heading: "H" };
const copy = async (t, done) => { try { await navigator.clipboard.writeText(t); done && done(); } catch { window.prompt("Copy this:", t); } };

function Gallery({ onPick, onClose, integ }) {
  const forms = useMemo(() => Object.fromEntries(FORM_TEMPLATES.map((t) => [t.key, formPageHtml(newForm(t), integ)])), [integ]);
  const [view, setView] = useState(null), [dev, setDev] = useState("desktop");
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

function Builder({ form, onChange, onBack, projects, onAddToPage, usedOn, leadCount, integ, onIntegrations }) {
  const [sel, setSel] = useState(form.fields[0] ? form.fields[0].id : null), [tab, setTab] = useState("field"), [note, setNote] = useState("");
  const [dropAt, setDropAt] = useState(null), drag = useRef(null), [target, setTarget] = useState({ pid: "", page: "" });
  const s = form.settings, f = form.fields.find((x) => x.id === sel);
  const bt = { full: true, align: "center", size: "md", bg: "", fg: "#ffffff", note: true, extra: false, extraText: "Chat on WhatsApp", extraUrl: "", ...(s.btn || {}) }, setB = (o) => setS({ btn: { ...bt, ...o } });
  const em = s.email || {}, gem = (integ && integ.email) || {}, setE = (o) => setS({ email: { ...em, ...o } });
  const mailReady = gem.provider === "emailjs" ? !!(gem.serviceId && gem.templateId && gem.publicKey) : !!gem.webhook;
  const VARS = ["name", ...form.fields.filter((x) => x.type !== "heading" && x.name !== "name").map((x) => x.name), "form", "all_fields", ...(s.pay && s.pay.enabled ? ["amount", "payment_id"] : [])];
  const pay = s.pay || {}, wa = s.wa || {}, gpay = (integ && integ.pay) || {}, gwa = (integ && integ.wa) || {};
  const flash = (t) => { setNote(t); setTimeout(() => setNote(""), 2200); };
  const up = (o) => onChange({ ...form, ...o, updated: Date.now() });
  const setS = (o) => up({ settings: { ...s, ...o } });
  const setF = (id, o) => up({ fields: form.fields.map((x) => (x.id === id ? { ...x, ...o } : x)) });
  const insert = (type, at) => { const n = newField(type), list = [...form.fields]; list.splice(at ?? list.length, 0, n); up({ fields: list }); setSel(n.id); setTab("field"); };
  const moveTo = (id, at) => { const list = [...form.fields], i = list.findIndex((x) => x.id === id), [it] = list.splice(i, 1); list.splice(at > i ? at - 1 : at, 0, it); up({ fields: list }); };
  const onDrop = (at) => { const d = drag.current; drag.current = null; setDropAt(null); if (!d) return; d.type ? insert(d.type, at) : moveTo(d.id, at); };
  const html = useMemo(() => formPageHtml(form, integ), [form, integ]);
  const embed = formHtml(form, integ), proj = projects.find((p) => p.id === target.pid);

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
          <div className="fb-tabs">{[["field", "Field"], ["settings", "Settings"], ["pay", "Payment"], ["design", "Design"], ["use", "Use it"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
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
            <hr />
            <label className="chk"><input type="checkbox" checked={!!wa.enabled} onChange={(e) => setS({ wa: { ...wa, enabled: e.target.checked } })} />💬 Send an automatic WhatsApp message</label>
            {wa.enabled && <>
              {!wa.hook && !gwa.webhook && <p className="red sm">Add your WhatsApp webhook in <a href="#" onClick={(e) => { e.preventDefault(); onIntegrations(); }}>Integrations</a> first.</p>}
              <label>Message <span className="mut sm">{"{{name}}"}, {"{{phone}}"}, or any field key</span><textarea rows={3} value={wa.msg ?? ""} placeholder={gwa.template} onChange={(e) => setS({ wa: { ...wa, msg: e.target.value } })} /></label>
              <div className="fb-vars">{form.fields.filter((x) => x.type !== "heading").map((x) => <button key={x.id} onClick={() => setS({ wa: { ...wa, msg: (wa.msg ?? gwa.template ?? "") + ` {{${x.name}}}` } })}>{`{{${x.name}}}`}</button>)}</div>
              <label>Webhook for this form <span className="mut sm">(optional — overrides Integrations)</span><input value={wa.hook || ""} placeholder={gwa.webhook || "https://…"} onChange={(e) => setS({ wa: { ...wa, hook: e.target.value.trim() } })} /></label>
              <p className="mut sm">The form needs a phone field (key like <code>phone</code> or <code>whatsapp</code>). {pay.enabled ? "Because this form takes payment, the message is sent after payment." : ""}</p>
            </>}
          </div>}
          {tab === "settings" && <div className="fb-set fb-mail">
            <hr /><label className="chk"><input type="checkbox" checked={!!em.enabled} onChange={(e) => setE({ enabled: e.target.checked })} />✉️ Email automation</label>
            {em.enabled && <>
              {!mailReady && <p className="red sm">Connect an email service first in <a href="#" onClick={(e) => { e.preventDefault(); onIntegrations(); }}>Integrations → Email</a> (free with your Gmail — takes 3 minutes).</p>}
              <label className="chk"><input type="checkbox" checked={em.auto !== false} onChange={(e) => setE({ auto: e.target.checked })} />Send an email to the person who submitted</label>
              {em.auto !== false && <>
                {!form.fields.some((x) => x.type === "email") && <div className="fb-fix"><span>This form has no <b>Email</b> field, so there's no address to send to.</span><button onClick={() => { const f = newField("email"); f.label = "Email"; f.name = "email"; up({ fields: [...form.fields.slice(0, 2), f, ...form.fields.slice(2)] }); }}>＋ Add Email field</button></div>}
                <label>Subject<input value={em.subject ?? ""} placeholder="Thanks for registering, {{name}}!" onChange={(e) => setE({ subject: e.target.value })} /></label>
                <label>Email message<textarea rows={7} value={em.body ?? ""} placeholder={"Hi {{name}},\n\nThank you! We received your details and will contact you soon.\n\nTeam " + (gem.fromName || form.name)} onChange={(e) => setE({ body: e.target.value })} /></label>
                <div className="fb-vars">{VARS.map((v) => <button key={v} title="Insert" onClick={() => setE({ body: (em.body || "") + `{{${v}}}` })}>{`{{${v}}}`}</button>)}</div>
                <details className="fb-mprev"><summary>Preview email</summary><div><b>{(em.subject || "Thanks for registering, {{name}}!").replace(/\{\{name\}\}/g, "Priya")}</b>
                  <div dangerouslySetInnerHTML={{ __html: (em.body || "Hi {{name}},\n\nThank you! We received your details and will contact you soon.").replace(/[<>]/g, "").replace(/\{\{name\}\}/g, "Priya").replace(/\{\{all_fields\}\}/g, "[table of all answers]").replace(/\{\{(\w+)\}\}/g, "[$1]").replace(/\n/g, "<br>") }} /></div></details>
              </>}
              <label className="chk"><input type="checkbox" checked={!!em.notify} onChange={(e) => setE({ notify: e.target.checked })} />Also email me every new submission</label>
              {em.notify && <label>Send to<input value={em.ownerEmail ?? ""} placeholder={gem.ownerEmail || "you@yourbrand.com"} onChange={(e) => setE({ ownerEmail: e.target.value.trim() })} /></label>}
              <p className="mut sm">{s.pay && s.pay.enabled ? "This form takes payment, so emails go out after payment. " : ""}Emails are sent from Preview, form links and your live site.</p>
            </>}
          </div>}
          {tab === "pay" && <div className="fb-set">
            <label className="chk"><input type="checkbox" checked={!!pay.enabled} onChange={(e) => setS({ pay: { amount: 21, mode: gpay.razorpayKey ? "razorpay" : "upi", ...pay, enabled: e.target.checked } })} />💳 Collect a payment before registration</label>
            {pay.enabled && <>
              <label>Amount (₹)<input type="number" min="1" value={pay.amount || ""} onChange={(e) => setS({ pay: { ...pay, amount: +e.target.value } })} /></label>
              <label>How people pay<select value={pay.mode || "razorpay"} onChange={(e) => setS({ pay: { ...pay, mode: e.target.value } })}>
                <option value="razorpay">Razorpay checkout (UPI, cards, netbanking, wallets)</option><option value="upi">Direct UPI — GPay, PhonePe, Paytm (QR + button)</option><option value="link">Payment link (Razorpay / Paytm / Instamojo / Cashfree link)</option></select></label>
              {(pay.mode || "razorpay") === "razorpay" && <>
                {!(pay.key || gpay.razorpayKey) && <p className="red sm">Add your Razorpay Key ID in <a href="#" onClick={(e) => { e.preventDefault(); onIntegrations(); }}>Integrations</a>, or paste one below.</p>}
                <label>Razorpay Key ID <span className="mut sm">(optional — uses Integrations)</span><input value={pay.key || ""} placeholder={gpay.razorpayKey || "rzp_live_…"} onChange={(e) => setS({ pay: { ...pay, key: e.target.value.trim() } })} /></label></>}
              {pay.mode === "upi" && <>
                {!(pay.upi || gpay.upiId) && <p className="red sm">Add your UPI ID here or in Integrations.</p>}
                <label>UPI ID<input value={pay.upi || ""} placeholder={gpay.upiId || "yourname@okhdfcbank"} onChange={(e) => setS({ pay: { ...pay, upi: e.target.value.trim() } })} /></label>
                <label>Payee name<input value={pay.payee || ""} placeholder={gpay.payee || form.name} onChange={(e) => setS({ pay: { ...pay, payee: e.target.value } })} /></label></>}
              {pay.mode === "link" && <label>Payment link URL<input value={pay.link || ""} placeholder="https://rzp.io/l/your-link" onChange={(e) => setS({ pay: { ...pay, link: e.target.value.trim() } })} /></label>}
              <label>Description (shown at checkout)<input value={pay.desc || ""} placeholder={form.name} onChange={(e) => setS({ pay: { ...pay, desc: e.target.value } })} /></label>
              <p className="mut sm">Flow: visitor fills the form → the lead is saved as <b>Payment pending</b> → they pay → it becomes <b>Paid</b> (Razorpay) or <b>Payment claimed</b> (UPI / link, with their UTR) → thank-you message or redirect. The price is added to the button automatically, e.g. “Register now · ₹{(pay.amount || 0).toLocaleString("en-IN")}”.</p>
              <p className="mut sm">Test it in <b>Open form</b>. Payment pop-ups don't run inside this small preview.</p>
            </>}
          </div>}
          {tab === "design" && <div className="fb-set">
            <label>Button & accent color<div className="row"><input type="color" value={s.color} onChange={(e) => setS({ color: e.target.value })} /><input value={s.color} onChange={(e) => setS({ color: e.target.value })} /></div></label>
            <div className="fb-sw">{["#4f46e5", "#0d9488", "#e11d48", "#f97316", "#16a34a", "#0284c7", "#16142b", "#9333ea"].map((c) => <button key={c} style={{ background: c }} onClick={() => setS({ color: c })} />)}</div>
            <label>Corner rounding: {s.radius}px<input type="range" min="0" max="24" value={s.radius} onChange={(e) => setS({ radius: +e.target.value })} /></label>
            <label>Max width: {s.width}px<input type="range" min="320" max="900" step="10" value={s.width} onChange={(e) => setS({ width: +e.target.value })} /></label>
            <div className="seg2">{[["card", "Card"], ["plain", "Plain"]].map(([v, l]) => <button key={v} className={s.style === v ? "on" : ""} onClick={() => setS({ style: v })}>{l}</button>)}</div>
            <hr /><b>Submit button</b>
            <label>Button text<input value={s.submit} onChange={(e) => setS({ submit: e.target.value })} /></label>
            <label>Size</label><div className="seg2">{[["sm", "Small"], ["md", "Medium"], ["lg", "Large"]].map(([v, l]) => <button key={v} className={bt.size === v ? "on" : ""} onClick={() => setB({ size: v })}>{l}</button>)}</div>
            <label>Width</label><div className="seg2">{[[true, "Full width"], [false, "Fit text"]].map(([v, l]) => <button key={l} className={bt.full === v ? "on" : ""} onClick={() => setB({ full: v })}>{l}</button>)}</div>
            {!bt.full && <><label>Position</label><div className="seg2">{[["left", "Left"], ["center", "Center"], ["right", "Right"]].map(([v, l]) => <button key={v} className={bt.align === v ? "on" : ""} onClick={() => setB({ align: v })}>{l}</button>)}</div></>}
            <div className="row"><label>Button color<div className="row"><input type="color" value={bt.bg || s.color} onChange={(e) => setB({ bg: e.target.value })} />{bt.bg && <button className="xs" onClick={() => setB({ bg: "" })}>Use accent</button>}</div></label>
              <label>Text color<input type="color" value={bt.fg} onChange={(e) => setB({ fg: e.target.value })} /></label></div>
            {pay.enabled && <label className="chk"><input type="checkbox" checked={bt.note} onChange={(e) => setB({ note: e.target.checked })} />Show “🔒 Secure payment” note</label>}
            <hr /><label className="chk"><input type="checkbox" checked={bt.extra} onChange={(e) => setB({ extra: e.target.checked })} />Add a second button</label>
            {bt.extra && <><label>Second button text<input value={bt.extraText} onChange={(e) => setB({ extraText: e.target.value })} /></label>
              <label>Link <span className="mut sm">(WhatsApp, phone, any page)</span><input value={bt.extraUrl} placeholder="https://wa.me/919876543210" onChange={(e) => setB({ extraUrl: e.target.value.trim() })} /></label>
              {!bt.extraUrl && <p className="red sm">Add a link to show the second button.</p>}</>}
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

export default function Forms({ forms, onSave, projects, leads, onAddToPage, onLeads, integ, onIntegrations }) {
  const [open, setOpen] = useState(null), [gal, setGal] = useState(false), [menu, setMenu] = useState(null);
  const cur = forms.find((x) => x.id === open);
  const countLeads = (f) => leads.filter((l) => l.formId === f.id).length;
  const usedOn = (f) => projects.reduce((n, p) => n + p.pages.filter((pg) => pg.html.includes(`data-lb-form-id="${f.id}"`)).length, 0);
  const put = (f) => onSave(forms.some((x) => x.id === f.id) ? forms.map((x) => (x.id === f.id ? f : x)) : [f, ...forms]);
  if (cur) return <Builder form={cur} onChange={put} onBack={() => setOpen(null)} projects={projects} onAddToPage={onAddToPage} usedOn={usedOn(cur)} leadCount={countLeads(cur)} integ={integ} onIntegrations={onIntegrations} />;
  return (
    <div onClick={() => setMenu(null)}>
      <div className="top"><div><h1>Forms</h1><p className="mut">Build forms once, use them on any page, and collect every entry in Leads.</p></div><button className="pri big" onClick={() => setGal(true)}>＋ New form</button></div>
      {!forms.length ? (
        <div className="empty"><b>No forms yet</b><p className="mut">Start from a template like Lead capture, Contact, Workshop registration or Appointment booking.</p><button className="pri" onClick={() => setGal(true)}>＋ Create your first form</button></div>
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
      {gal && <Gallery integ={integ} onClose={() => setGal(false)} onPick={(t) => { const f = newForm(t); f.name = f.name === "Untitled form" ? "Untitled form" : f.name; onSave([f, ...forms]); setGal(false); setOpen(f.id); }} />}
    </div>
  );
}
