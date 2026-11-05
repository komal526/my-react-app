// LaunchBuilder v11 — Calendar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { newEvent, EVENT_TEMPLATES, LOCATIONS, eventSlug, eventUrl, gcalLink, uid, serverOn, phpCall, defaultServerUrl, autoServer, filesForServer } from "../lib.js";
import { bookingWidget, bookingPageHtml, buildSite, finalize } from "./tools.js";
import { Icon } from "./Inspector.jsx";

/* ================= Calendar: event types (templates + full settings), booking links, embeds and a meetings CRM ================= */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const copy = (t) => (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => window.prompt("Copy:", t));
const fmtDate = (d) => { if (!d) return "—"; const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); };
const isoDay = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
const STATUS = [["new", "Booked"], ["contacted", "Confirmed"], ["won", "Completed"], ["lost", "Cancelled"], ["qualified", "No-show"]];

function Preview({ ev, integ, dev = "desktop", h = 820 }) {
  const [html, setHtml] = useState(""), box = useRef(), [sc, setSc] = useState(0.6);
  useEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setSc(Math.min(1, (el.clientWidth - 24) / 1180))); ro.observe(el); return () => ro.disconnect(); }, []);
  useEffect(() => { let gone = false; const t = setTimeout(() => finalize(bookingPageHtml(ev, integ), { mode: "blob", preview: true, page: "booking" }).then((r) => !gone && setHtml(r.html)), 250); return () => { gone = true; clearTimeout(t); }; }, [ev, integ]);
  return <div ref={box} className="ce-fit">{dev !== "mobile" ? <div style={{ width: 1180 * sc, height: h * sc }}><iframe title="Booking preview" srcDoc={html} sandbox="allow-scripts allow-same-origin" style={{ width: 1180, height: h, transform: `scale(${sc})`, transformOrigin: "0 0" }} /></div>
    : <iframe title="Booking preview" srcDoc={html} sandbox="allow-scripts allow-same-origin" style={{ width: 390, height: h }} />}</div>;
}

/* ---------- template gallery ---------- */
function Gallery({ onPick, onClose, integ }) {
  const [view, setView] = useState(null), t = view && EVENT_TEMPLATES.find((x) => x.key === view);
  const ev = useMemo(() => (t ? newEvent(t.o) : null), [t]);
  return (
    <div className="ov" onClick={onClose}><div className="md fm-gal" onClick={(e) => e.stopPropagation()}>
      {!t ? <>
        <div className="fm-gh"><div><h3>Create a calendar</h3><p className="mut">Start from a template — every setting can be changed afterwards.</p></div><button onClick={onClose}>✕</button></div>
        <div className="ce-gal">
          <button className="ce-card blank" onClick={() => onPick({ o: {} })}><span className="ce-ic">＋</span><b>Blank calendar</b><span className="mut sm">Start from scratch</span></button>
          {EVENT_TEMPLATES.map((x) => <div key={x.key} className="ce-card" style={{ "--c": x.o.color || "#3d6bff" }}>
            <span className="ce-ic">{x.ic}</span><b>{x.label}</b><span className="mut sm">{x.note}</span>
            <div className="ce-meta"><span>🕒 {x.o.duration || 30} min</span>{x.o.pay && <span>₹{x.o.pay.amount}</span>}{x.o.location === "inperson" && <span>📍 In person</span>}</div>
            <div className="row"><button onClick={() => setView(x.key)}>Preview</button><button className="pri" onClick={() => onPick(x)}>Use</button></div>
          </div>)}
        </div>
      </> : <>
        <div className="fm-pbar"><button onClick={() => setView(null)}>← All templates</button><b>{t.label}</b><div className="grow" /><button className="pri" onClick={() => onPick(t)}>Use this template</button></div>
        <div className="ce-gprev"><Preview ev={ev} integ={integ} h={760} /></div>
      </>}
    </div></div>
  );
}

/* ---------- event editor ---------- */
function EventEditor({ ev, onChange, onBack, onPublish, busy, note, integ }) {
  const [tab, setTab] = useState("details"), [dev, setDev] = useState("desktop"), [bd, setBd] = useState("");
  const up = (o) => onChange({ ...ev, ...o, updated: Date.now() });
  const upF = (o) => up({ fields: { ...ev.fields, ...o } }), upP = (o) => up({ pay: { ...ev.pay, ...o } });
  const qs = ev.questions || [], setQ = (i, o) => up({ questions: qs.map((q, k) => (k === i ? { ...q, ...o } : q)) });
  const moveQ = (i, d) => { const l = [...qs], j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; up({ questions: l }); };
  const link = eventUrl(ev, integ);
  return (
    <div className="ce">
      <div className="fb-top">
        <button className="link" onClick={onBack}>← Calendar</button>
        <input className="fb-name" value={ev.name} onChange={(e) => up({ name: e.target.value })} />
        <span className="mut sm">Saved automatically</span><div className="grow" />
        {note && <span className="fb-note">{note}</span>}
        <button onClick={() => copy(link)}>Copy link</button>
        <button className="pri" disabled={!!busy} onClick={onPublish}>{busy || (ev.host ? "Update public link" : "Publish booking link")}</button>
      </div>
      <div className="ce-grid">
        <div className="fb-col">
          <div className="fb-tabs ce-tabs">{[["details", "Details"], ["avail", "Availability"], ["form", "Questions"], ["done", "Confirmation"], ["auto", "Payment & alerts"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
          {tab === "details" && <div className="fb-set">
            <label>Calendar name<input value={ev.name} onChange={(e) => up({ name: e.target.value })} /></label>
            <label>Your name / brand <span className="mut sm">(shown at the top)</span><input value={ev.org} placeholder="BYB Academy" onChange={(e) => up({ org: e.target.value })} /></label>
            <label>Description<textarea rows={4} value={ev.desc} onChange={(e) => up({ desc: e.target.value })} /></label>
            <div className="row"><label style={{ flex: 1 }}>Duration (min)<input type="number" min="5" step="5" value={ev.duration} onChange={(e) => up({ duration: +e.target.value || 30 })} /></label>
              <label style={{ flex: 1 }}>Type<select value={ev.kind} onChange={(e) => up({ kind: e.target.value })}><option>One-on-One</option><option>Group</option></select></label></div>
            <label>Where the meeting happens<select value={ev.location} onChange={(e) => up({ location: e.target.value })}>{LOCATIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label>Location details <span className="mut sm">(link, address or number — optional)</span><input value={ev.locationNote} placeholder={ev.location === "inperson" ? "Main Bazaar, Hamirpur" : "Sent after booking"} onChange={(e) => up({ locationNote: e.target.value })} /></label>
            <label>Accent colour<div className="row"><input type="color" value={ev.color} onChange={(e) => up({ color: e.target.value })} />{["#3d6bff", "#16a34a", "#e11d48", "#f97316", "#7c3aed", "#0f766e", "#111827"].map((c) => <button key={c} className="ce-sw" style={{ background: c }} onClick={() => up({ color: c })} />)}</div></label>
            <label>Link name<input value={ev.slug || eventSlug(ev)} onChange={(e) => up({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></label>
          </div>}
          {tab === "avail" && <div className="fb-set">
            <label>Available days</label><div className="ce-days">{DAYS.map((d, i) => <button key={d} className={ev.days.includes(i) ? "on" : ""} onClick={() => up({ days: ev.days.includes(i) ? ev.days.filter((x) => x !== i) : [...ev.days, i].sort() })}>{d}</button>)}</div>
            <div className="row"><label style={{ flex: 1 }}>From<input type="time" value={ev.start} onChange={(e) => up({ start: e.target.value })} /></label><label style={{ flex: 1 }}>To<input type="time" value={ev.end} onChange={(e) => up({ end: e.target.value })} /></label></div>
            <label>Start a new slot every<select value={ev.step} onChange={(e) => up({ step: +e.target.value })}>{[10, 15, 20, 30, 45, 60, 90, 120].map((x) => <option key={x} value={x}>{x} minutes</option>)}</select></label>
            <div className="row"><label style={{ flex: 1 }}>Bookable days ahead<input type="number" min="1" max="365" value={ev.ahead} onChange={(e) => up({ ahead: +e.target.value || 30 })} /></label>
              <label style={{ flex: 1 }}>Minimum notice (hours)<input type="number" min="0" max="168" value={ev.notice} onChange={(e) => up({ notice: +e.target.value || 0 })} /></label></div>
            <label>Max bookings per day <span className="mut sm">(0 = no limit)</span><input type="number" min="0" value={ev.maxPerDay || 0} onChange={(e) => up({ maxPerDay: +e.target.value || 0 })} /></label>
            <label>Days off / holidays</label>
            <div className="row"><input type="date" value={bd} onChange={(e) => setBd(e.target.value)} /><button disabled={!bd} onClick={() => { up({ blocked: [...new Set([...(ev.blocked || []), bd])].sort() }); setBd(""); }}>Block date</button></div>
            {(ev.blocked || []).length > 0 && <div className="ce-chips">{ev.blocked.map((d) => <span key={d}>{fmtDate(d)}<button onClick={() => up({ blocked: ev.blocked.filter((x) => x !== d) })}>✕</button></span>)}</div>}
            <label>Time zone<input value={ev.tz} onChange={(e) => up({ tz: e.target.value })} /></label>
            <p className="mut sm">Booked slots disappear for other visitors automatically (on the public link).</p>
          </div>}
          {tab === "form" && <div className="fb-set">
            <p className="mut sm" style={{ margin: 0 }}>Name and email are always asked. Choose the rest:</p>
            <label className="chk"><input type="checkbox" checked={!!ev.fields.phone} onChange={(e) => upF({ phone: e.target.checked })} />WhatsApp number (required)</label>
            <label className="chk"><input type="checkbox" checked={!!ev.fields.company} onChange={(e) => upF({ company: e.target.checked })} />Company</label>
            <label className="chk"><input type="checkbox" checked={!!ev.fields.notes} onChange={(e) => upF({ notes: e.target.checked })} />“What would you like to discuss?”</label>
            <hr /><b style={{ fontSize: 13 }}>Your own questions</b>
            {qs.map((q, i) => <div key={i} className="ce-q">
              <div className="row"><input value={q.label} placeholder="Question" onChange={(e) => setQ(i, { label: e.target.value })} style={{ flex: 1 }} />
                <button className="xs" onClick={() => moveQ(i, -1)}>↑</button><button className="xs" onClick={() => moveQ(i, 1)}>↓</button><button className="xs red" onClick={() => up({ questions: qs.filter((_, k) => k !== i) })}>✕</button></div>
              <div className="row"><select value={q.type || "text"} onChange={(e) => setQ(i, { type: e.target.value })}><option value="text">Short answer</option><option value="textarea">Long answer</option><option value="select">Dropdown</option><option value="number">Number</option></select>
                <label className="chk" style={{ margin: 0 }}><input type="checkbox" checked={!!q.required} onChange={(e) => setQ(i, { required: e.target.checked })} />Required</label></div>
              {q.type === "select" && <input value={q.options || ""} placeholder="Options, separated by commas" onChange={(e) => setQ(i, { options: e.target.value })} />}
            </div>)}
            <button onClick={() => up({ questions: [...qs, { label: "", type: "text", required: false }] })}>＋ Add a question</button>
          </div>}
          {tab === "done" && <div className="fb-set">
            <label>Button text<input value={ev.button || "Confirm booking"} onChange={(e) => up({ button: e.target.value })} /></label>
            <label>Confirmation message<textarea rows={3} value={ev.success} onChange={(e) => up({ success: e.target.value })} /></label>
            <label>Or send people to a page after booking <span className="mut sm">(optional URL)</span><input value={ev.redirect} placeholder="https://…/thank-you.html" onChange={(e) => up({ redirect: e.target.value.trim() })} /></label>
          </div>}
          {tab === "auto" && <div className="fb-set">
            <label className="chk"><input type="checkbox" checked={!!ev.pay.enabled} onChange={(e) => upP({ enabled: e.target.checked, amount: ev.pay.amount || 499 })} />💳 Take payment to confirm the booking</label>
            {ev.pay.enabled && <><div className="row"><label style={{ flex: 1 }}>Amount (₹)<input type="number" min="1" value={ev.pay.amount} onChange={(e) => upP({ amount: +e.target.value })} /></label>
              <label style={{ flex: 1 }}>Method<select value={ev.pay.mode} onChange={(e) => upP({ mode: e.target.value })}><option value="razorpay">Razorpay</option><option value="upi">UPI (GPay, PhonePe)</option><option value="link">Payment link</option></select></label></div>
              {ev.pay.mode === "link" && <label>Payment link<input value={ev.pay.link || ""} onChange={(e) => upP({ link: e.target.value.trim() })} /></label>}
              <p className="mut sm">Uses your Razorpay key / UPI ID from Integrations.</p></>}
            <hr /><label className="chk"><input type="checkbox" checked={!!(ev.email && ev.email.enabled)} onChange={(e) => up({ email: { ...ev.email, enabled: e.target.checked } })} />✉ Email confirmation to the person who booked</label>
            {ev.email && ev.email.enabled && <label className="chk"><input type="checkbox" checked={!!ev.email.notify} onChange={(e) => up({ email: { ...ev.email, notify: e.target.checked } })} />Also email me each new booking</label>}
            <label className="chk"><input type="checkbox" checked={!!(ev.wa && ev.wa.enabled)} onChange={(e) => up({ wa: { ...ev.wa, enabled: e.target.checked } })} />💬 WhatsApp confirmation</label>
            {ev.wa && ev.wa.enabled && <label>WhatsApp message<textarea rows={2} value={ev.wa.msg ?? ""} placeholder="Hi {{name}}, your booking for {{date}} at {{time}} is confirmed!" onChange={(e) => up({ wa: { ...ev.wa, msg: e.target.value } })} /></label>}
            <p className="mut sm">Uses the connections in Integrations. Placeholders: {"{{name}}"}, {"{{date}}"}, {"{{time}}"}.</p>
          </div>}
        </div>
        <div className="fb-prev"><div className="fb-prev-bar"><span className="dot" /><span className="dot" /><span className="dot" /><code>{link.replace(/^https?:\/\//, "")}</code><div className="grow" />
          <div className="ce-dev">{["desktop", "mobile"].map((k) => <button key={k} title={k} className={dev === k ? "on" : ""} onClick={() => setDev(k)}><Icon n={k} s={16} /></button>)}</div></div>
          <div className={"ce-stage " + dev}><Preview ev={ev} integ={integ} dev={dev} /></div>
          <p className="mut sm" style={{ padding: "8px 12px", margin: 0 }}>Interactive preview — pick a date and time to try it. Test bookings here aren't saved.</p></div>
      </div>
    </div>
  );
}

/* ---------- meetings CRM ---------- */
function MonthView({ items, onOpen }) {
  const [m, setM] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const fd = m.getDay(), n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), today = isoDay(new Date());
  const cells = [...Array(fd).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  return <div className="ce-month">
    <div className="row between"><b>{MONTHS[m.getMonth()]} {m.getFullYear()}</b><div className="row"><button onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))}>‹</button><button onClick={() => { const d = new Date(); setM(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Today</button><button onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))}>›</button></div></div>
    <div className="ce-mgrid">{DAYS.map((d) => <i key={d}>{d}</i>)}{cells.map((d, k) => { if (!d) return <span key={k} />; const key = isoDay(new Date(m.getFullYear(), m.getMonth(), d)), list = items.filter((b) => b.data.date === key);
      return <div key={k} className={"ce-mday" + (key === today ? " today" : "")}><em>{d}</em>{list.slice(0, 3).map((b) => <button key={b.id} className={"ce-chip s-" + b.status} style={{ "--c": (b.ev && b.ev.color) || "#3d6bff" }} onClick={() => onOpen(b.id)}>{b.data.time} {b.data.name}</button>)}{list.length > 3 && <small>+{list.length - 3} more</small>}</div>; })}</div>
  </div>;
}

export default function Calendar({ events, onSave, leads, projects, integ, onInteg, onAddToPage, onPatchLead, onDeleteLead }) {
  const [tab, setTab] = useState("events"), [open, setOpen] = useState(null), [menu, setMenu] = useState(""), [gal, setGal] = useState(false), [busy, setBusy] = useState(""), [note, setNote] = useState(""), [add, setAdd] = useState(null);
  const [when, setWhen] = useState("upcoming"), [mview, setMview] = useState("list"), [q, setQ] = useState(""), [fev, setFev] = useState(""), [det, setDet] = useState(null);
  const flash = (t) => { setNote(t); setTimeout(() => setNote(""), 3000); };
  const cur = events.find((x) => x.id === open);
  const put = (e) => onSave(events.some((x) => x.id === e.id) ? events.map((x) => (x.id === e.id ? e : x)) : [e, ...events]);
  const create = (t) => { const e = newEvent(t ? t.o : {}); onSave([e, ...events]); setGal(false); setOpen(e.id); };
  const ids = useMemo(() => new Set(events.map((e) => e.id)), [events]);
  const bookings = useMemo(() => leads.filter((l) => (l.formId && ids.has(l.formId)) || /^Booking:/.test(l.form || "")).map((l) => ({ ...l, ev: events.find((e) => e.id === l.formId) })), [leads, events, ids]);
  const today = isoDay(new Date());
  const filtered = bookings.filter((b) => (!fev || b.formId === fev) && (!q || JSON.stringify(b.data).toLowerCase().includes(q.toLowerCase())));
  const shown = filtered.filter((b) => (when === "upcoming" ? (b.data.date || "") >= today : (b.data.date || "") < today)).sort((a, b) => ((a.data.date || "") + (a.data.time || "")).localeCompare((b.data.date || "") + (b.data.time || "")) * (when === "upcoming" ? 1 : -1));
  const countFor = (e) => bookings.filter((b) => b.formId === e.id).length;
  const upcoming = bookings.filter((b) => (b.data.date || "") >= today && b.status !== "lost").length;
  const thisWeek = bookings.filter((b) => { const d = b.data.date || ""; const end = isoDay(new Date(Date.now() + 7 * 864e5)); return d >= today && d <= end && b.status !== "lost"; }).length;
  const exportCsv = () => {
    const cols = [...new Set(filtered.flatMap((b) => Object.keys(b.data || {})))];
    const rows = [["Date", "Time", "Calendar", "Status", ...cols, "Note"], ...filtered.map((b) => [b.data.date, b.data.time, (b.ev && b.ev.name) || b.form, (STATUS.find((s) => s[0] === b.status) || [, b.status])[1], ...cols.map((c) => b.data[c]), b.note || ""])];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" })); a.download = "meetings.csv"; a.click();
  };
  const publish = async (e) => {
    setBusy("Publishing…");
    try {
      let ig = integ;
      if (!serverOn(ig)) { const a = await autoServer(ig, onInteg); if (!a.ok) throw new Error(a.reason === "key" ? "Your hosting is already connected from another browser. Open any page → Publish → “Publishing from another computer?” and paste your key once." : "Public booking links work once the builder is uploaded to your Hostinger (it includes lb-server.php). Until then use Copy link (this browser) or add the calendar to a page."); ig = a.integ; }
      const sl = "book-" + eventSlug(e), url = `${(ig.server.base || location.origin).replace(/\/$/, "")}/sites/${sl}`;
      const files = await buildSite([{ name: "Booking", file: "index.html", html: bookingPageHtml(e, ig) }], "", { leadUrl: ig.server.url || defaultServerUrl(), site: sl });
      const r = await phpCall(ig.server, { action: "publish", slug: sl, files: filesForServer(files) });
      put({ ...e, host: { slug: sl, url: r.url || url + "/", ts: Date.now() } }); flash("✓ Public booking link is live — copied"); copy(r.url || url + "/");
    } catch (err) { alert(err.message); }
    setBusy("");
  };
  const embedCode = (e) => `<iframe src="${eventUrl(e, integ)}" style="width:100%;min-height:760px;border:0" title="${e.name}"></iframe>`;
  const d = det && bookings.find((b) => b.id === det);

  if (cur) return <EventEditor ev={cur} integ={integ} onChange={put} onBack={() => setOpen(null)} onPublish={() => publish(cur)} busy={busy} note={note} />;
  return (
    <div onClick={() => setMenu("")}>
      <div className="top"><div><h1>Calendar</h1><p className="mut">Create calendars, share a booking link or add one to any page. Every booking lands in Meetings.</p></div>
        <div className="row">{note && <span className="fb-note">{note}</span>}<button className="pri big" onClick={() => setGal(true)}>＋ Create calendar</button></div></div>
      <div className="stats"><div className="stat"><span>Calendars</span><b>{events.length}</b></div><div className="stat"><span>Upcoming meetings</span><b>{upcoming}</b></div><div className="stat"><span>Next 7 days</span><b>{thisWeek}</b></div></div>
      <div className="ce-tabsbar">{[["events", "Calendars", events.length], ["meetings", "Meetings", bookings.length]].map(([k, l, n]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}<em>{n}</em></button>)}</div>
      {tab === "events" ? (!events.length ? <div className="empty"><b>No calendars yet</b><p className="mut">Pick a template — discovery call, product demo, paid consultation, clinic, salon, interview and more.</p><button className="pri" onClick={() => setGal(true)}>＋ Create your first calendar</button></div>
        : <div className="ce-list">{events.map((e) => (
          <div key={e.id} className="ce-row" style={{ "--c": e.color }}>
            <div className="grow" onClick={() => setOpen(e.id)} style={{ cursor: "pointer" }}><b>{e.name}</b>
              <div className="mut">{e.duration} min · {e.kind} <span className="tag">{(LOCATIONS.find((l) => l[0] === e.location) || [, ""])[1]}</span>{e.pay.enabled && <span className="tag ce-pay">₹{e.pay.amount}</span>}</div>
              <div className="mut sm">{e.days.map((x) => DAYS[x]).join(", ")} · {e.start}–{e.end} · {countFor(e)} booking{countFor(e) === 1 ? "" : "s"}{e.host ? <> · <span className="green">● public link live</span></> : ""}</div>
            </div>
            <button className="ib2" title="Edit" onClick={() => setOpen(e.id)}><Icon n="pen" s={15} /></button>
            <button className="ib2" title="Preview" onClick={() => window.open(eventUrl(e, integ), "_blank")}><Icon n="eye" s={15} /></button>
            <div className="ce-mw" onClick={(x) => x.stopPropagation()}><button onClick={() => setMenu(menu === "em" + e.id ? "" : "em" + e.id)}><Icon n="code" s={14} /> Embed ▾</button>
              {menu === "em" + e.id && <div className="menu"><div onClick={() => { setAdd(e); setMenu(""); }}>Add to one of my pages</div><div onClick={() => { copy(embedCode(e)); flash("Embed code copied"); setMenu(""); }}>Copy iframe code</div><div onClick={() => { copy(bookingWidget(e, integ)); flash("HTML copied"); setMenu(""); }}>Copy HTML</div></div>}</div>
            <div className="ce-mw" onClick={(x) => x.stopPropagation()}><button onClick={() => setMenu(menu === "ln" + e.id ? "" : "ln" + e.id)}><Icon n="link" s={14} /> Link ▾</button>
              {menu === "ln" + e.id && <div className="menu"><div onClick={() => { copy(eventUrl(e, integ)); flash("Link copied"); setMenu(""); }}>{e.host ? "Copy public link" : "Copy link (this browser only)"}</div><div onClick={() => { setMenu(""); publish(e); }}>{e.host ? "Update public link" : "Publish public link"}</div></div>}</div>
            <div className="ce-mw" onClick={(x) => x.stopPropagation()}><button className="ib2" onClick={() => setMenu(menu === "mo" + e.id ? "" : "mo" + e.id)}>⋮</button>
              {menu === "mo" + e.id && <div className="menu"><div onClick={() => put({ ...e, id: "ev" + uid(), name: e.name + " copy", host: null, slug: "", created: Date.now() })}>Duplicate</div><div className="red" onClick={() => { if (window.confirm(`Delete "${e.name}"? Existing bookings stay in Meetings.`)) onSave(events.filter((x) => x.id !== e.id)); setMenu(""); }}>Delete</div></div>}</div>
          </div>))}</div>)
      : <>
        <div className="lfilters">
          <input placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={fev} onChange={(e) => setFev(e.target.value)}><option value="">All calendars</option>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <div className="seg2" style={{ width: 200 }}>{[["list", "List"], ["month", "Month"]].map(([k, l]) => <button key={k} className={mview === k ? "on" : ""} onClick={() => setMview(k)}>{l}</button>)}</div>
          {mview === "list" && <div className="seg2" style={{ width: 200 }}>{[["upcoming", "Upcoming"], ["past", "Past"]].map(([k, l]) => <button key={k} className={when === k ? "on" : ""} onClick={() => setWhen(k)}>{l}</button>)}</div>}
          {filtered.length > 0 && <button onClick={exportCsv}>Export CSV</button>}
        </div>
        {mview === "month" ? <MonthView items={filtered} onOpen={setDet} />
          : !shown.length ? <div className="empty"><b>No {when} meetings</b><p className="mut">Bookings from your booking links and pages appear here automatically.</p></div>
          : <div className="ltable"><table><thead><tr><th>When</th><th>Calendar</th><th>Booked by</th><th>Status</th><th></th></tr></thead><tbody>{shown.map((b) => (
            <tr key={b.id} onClick={() => setDet(b.id)} style={{ cursor: "pointer" }}><td><b>{fmtDate(b.data.date)}</b><div className="mut">{b.data.time} · {b.data.duration || ((b.ev && b.ev.duration) || 30) + " min"}</div></td>
              <td><span className="ce-dot" style={{ background: (b.ev && b.ev.color) || "#3d6bff" }} />{(b.ev && b.ev.name) || b.form.replace(/^Booking: /, "")}{b.payment && <div className="mut sm">₹{b.payment.amount} · {b.payment.status}</div>}</td>
              <td><b>{b.data.name}</b><div className="mut">{b.data.email}{b.data.phone ? " · " + b.data.phone : ""}</div></td>
              <td onClick={(x) => x.stopPropagation()}><select className={"lst s-" + b.status} value={b.status} onChange={(x) => onPatchLead(b.id, { status: x.target.value })}>{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
              <td className="mut">Open →</td></tr>))}</tbody></table></div>}
      </>}
      {gal && <Gallery integ={integ} onClose={() => setGal(false)} onPick={create} />}
      {d && <div className="ldrawer" onClick={() => setDet(null)}><div onClick={(x) => x.stopPropagation()}>
        <div className="row between"><h3>{d.data.name || "Meeting"}</h3><button onClick={() => setDet(null)}>Close</button></div>
        <p className="mut"><span className="ce-dot" style={{ background: (d.ev && d.ev.color) || "#3d6bff" }} />{(d.ev && d.ev.name) || d.form} · booked {new Date(d.ts).toLocaleString()}</p>
        <div className="ce-when"><div><span className="mut sm">Date</span><input type="date" value={d.data.date || ""} onChange={(x) => onPatchLead(d.id, { data: { ...d.data, date: x.target.value } })} /></div><div><span className="mut sm">Time</span><input type="time" value={d.data.time || ""} onChange={(x) => onPatchLead(d.id, { data: { ...d.data, time: x.target.value } })} /></div></div>
        <label className="mut">Status</label><select value={d.status} onChange={(x) => onPatchLead(d.id, { status: x.target.value })}>{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <dl>{Object.entries(d.data || {}).filter(([k]) => !["date", "time", "duration"].includes(k)).map(([k, v]) => <div key={k}><dt>{k.replace(/^q\d+_/, "").replace(/_/g, " ")}</dt><dd>{String(v)}</dd></div>)}</dl>
        {d.payment && <div className="lpay">₹{d.payment.amount} · {d.payment.status}{d.payment.id ? " · " + d.payment.id : ""}</div>}
        <div className="row"><a className="btn" href={gcalLink(`${(d.ev && d.ev.name) || "Meeting"} — ${d.data.name}`, d.data.date, d.data.time, (d.ev && d.ev.duration) || 30, `${d.data.email || ""} ${d.data.phone || ""}\n${d.data.notes || ""}`)} target="_blank" rel="noopener">+ Google Calendar</a>
          {d.data.phone && <a className="btn go" href={`https://wa.me/${String(d.data.phone).replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noopener">WhatsApp</a>}
          {d.data.email && <a className="btn" href={`mailto:${d.data.email}`}>Email</a>}</div>
        <label className="mut">Notes</label><textarea rows={4} value={d.note || ""} onChange={(x) => onPatchLead(d.id, { note: x.target.value })} placeholder="Agenda, follow-ups, outcome…" />
        <button className="red" onClick={() => { if (window.confirm("Delete this meeting?")) { onDeleteLead(d.id); setDet(null); } }}>Delete meeting</button>
      </div></div>}
      {add && <div className="ov" onClick={() => setAdd(null)}><div className="md" onClick={(x) => x.stopPropagation()}><h3>Add “{add.name}” to a page</h3>
        <AddToPage projects={projects} onAdd={(pid, pgid) => { onAddToPage(`<section data-lb-name="Calendar section" style="padding:64px 24px"><div data-lb-calendar="${add.id}" data-lb-name="Calendar: ${add.name.replace(/"/g, "")}">${bookingWidget(add, integ)}</div></section>`, pid, pgid); setAdd(null); flash("Calendar added to the page"); }} onClose={() => setAdd(null)} /></div></div>}
    </div>
  );
}

function AddToPage({ projects, onAdd, onClose }) {
  const [pid, setPid] = useState(""), [pg, setPg] = useState(""), proj = projects.find((p) => p.id === pid);
  return <><p className="mut">The calendar is added above the footer. You can move and restyle it in the editor — it stays linked to this calendar.</p>
    <label>Project<select value={pid} onChange={(e) => { setPid(e.target.value); setPg(""); }}><option value="">Choose…</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    {proj && <label>Page<select value={pg} onChange={(e) => setPg(e.target.value)}><option value="">Choose…</option>{proj.pages.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.file}</option>)}</select></label>}
    <div className="mrow"><div className="grow" /><button onClick={onClose}>Cancel</button><button className="pri" disabled={!pg} onClick={() => onAdd(pid, pg)}>Add to page</button></div></>;
}
