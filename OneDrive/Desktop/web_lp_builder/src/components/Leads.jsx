// LaunchBuilder v4 — Leads.jsx
import { useMemo, useState } from "react";
import { saveLeads, LEAD_STATUS, ago } from "../lib.js";

/* ================= Leads / Form CRM: table + pipeline board, status, notes, CSV export ================= */
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const pick = (d, re) => { const k = Object.keys(d || {}).find((x) => re.test(x)); return k ? d[k] : ""; };
const nameOf = (l) => pick(l.data, /name/i) || Object.values(l.data || {})[0] || "—";
const PAY = { paid: ["won", "Paid"], claimed: ["contacted", "Payment claimed"], pending: ["new", "Payment pending"] };
const PayTag = ({ l }) => (l.payment ? <span className={"lst " + (PAY[l.payment.status] || PAY.pending)[0]} title={l.payment.id || l.payment.ref || ""}>{(PAY[l.payment.status] || PAY.pending)[1]} · ₹{l.payment.amount}</span> : null);
const fillT = (t, d) => String(t || "").replace(/\{\{\s*([\w-]+)\s*\}\}/g, (m, k) => (d[k] != null ? d[k] : ""));
const phoneOf = (l) => pick(l.data, /phone|tel|mobile|whats/i), mailOf = (l) => pick(l.data, /mail/i);

export default function Leads({ user, projects = [], forms = [], leads, setLeads, integ }) {
  const [proj, setProj] = useState(""), [form, setForm] = useState(""), [st, setSt] = useState(""), [q, setQ] = useState(""), [open, setOpen] = useState(null);
  const [view, setView] = useState("table"), [drag, setDrag] = useState(null), [over, setOver] = useState("");
  const update = (list) => { setLeads(list); saveLeads(user.email, list); };
  const patch = (id, o) => update(leads.map((l) => (l.id === id ? { ...l, ...o } : l)));
  const remove = (id) => window.confirm("Delete this lead?") && (update(leads.filter((l) => l.id !== id)), setOpen(null));

  const formNames = [...new Set([...forms.map((f) => f.name), ...leads.map((l) => l.form)])];
  const shown = useMemo(() => leads.filter((l) => (!proj || l.projectId === proj) && (!form || l.form === form) && (!st || l.status === st) && (!q || JSON.stringify(l.data).toLowerCase().includes(q.toLowerCase()))), [leads, proj, form, st, q]);
  const cols = useMemo(() => { const c = []; shown.forEach((l) => Object.keys(l.data || {}).forEach((k) => !c.includes(k) && c.push(k))); return c; }, [shown]);
  const exportCsv = () => {
    const head = ["Date", "Status", "Payment", "Amount", "Payment ID / UTR", "Form", "Source", "Page", ...cols, "Note"];
    const rows = shown.map((l) => [new Date(l.ts).toLocaleString(), l.status, l.payment ? l.payment.status : "", l.payment ? l.payment.amount : "", l.payment ? l.payment.id || l.payment.ref || "" : "", l.form, l.projectName, l.page, ...cols.map((c) => (l.data || {})[c]), l.note]);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" }));
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
  const cur = open && leads.find((l) => l.id === open);
  const won = leads.filter((l) => l.status === "won").length;

  return (
    <>
      <div className="top"><div><h1>Leads</h1><p className="mut">Your form CRM — every submission from every page and form link.</p></div>
        <div className="row"><div className="chips" style={{ margin: 0 }}><button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>Table</button><button className={view === "board" ? "on" : ""} onClick={() => setView("board")}>Pipeline</button></div>
          {leads.length > 0 && <button onClick={exportCsv}>Export CSV</button>}</div></div>
      <div className="stats">
        <div className="stat"><span>Total leads</span><b>{leads.length}</b></div>
        <div className="stat"><span>Last 24 hours</span><b>{leads.filter((l) => Date.now() - l.ts < 864e5).length}</b></div>
        <div className="stat"><span>Won</span><b>{won}</b><em>{leads.length ? Math.round((won / leads.length) * 100) : 0}% win rate</em></div>
      </div>
      {!leads.length ? (
        <div className="empty"><b>No leads yet</b>
          <p className="mut">Create a form in <b>Forms</b>, add it to a page (or share its link), then submit it once — the entry lands here instantly.</p></div>
      ) : <>
        <div className="lfilters">
          <input placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={proj} onChange={(e) => setProj(e.target.value)}><option value="">All projects</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select value={form} onChange={(e) => setForm(e.target.value)}><option value="">All forms</option>{formNames.map((f) => <option key={f}>{f}</option>)}</select>
          {view === "table" && <select value={st} onChange={(e) => setSt(e.target.value)}><option value="">Any status</option>{LEAD_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}
          <span className="mut">{shown.length} shown</span>
        </div>
        {view === "table" ? (
          <div className="ltable"><table>
            <thead><tr><th>Lead</th><th>Contact</th><th>Form</th><th>Payment</th><th>Status</th><th>Received</th></tr></thead>
            <tbody>{shown.map((l) => (
              <tr key={l.id} className={open === l.id ? "on" : ""} onClick={() => setOpen(l.id)}>
                <td><div className="lname"><div className="lav">{String(nameOf(l))[0].toUpperCase()}</div><b>{nameOf(l)}</b></div></td>
                <td><div>{mailOf(l)}</div><div className="mut">{phoneOf(l)}</div></td>
                <td><div>{l.form}</div><div className="mut">{l.projectName}{l.page ? " · " + l.page : ""}</div></td>
                <td><PayTag l={l} /></td>
                <td onClick={(e) => e.stopPropagation()}><select className={"lst " + l.status} value={l.status} onChange={(e) => patch(l.id, { status: e.target.value })}>{LEAD_STATUS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></td>
                <td className="mut">{ago(l.ts)}</td>
              </tr>))}</tbody>
          </table></div>
        ) : (
          <div className="board">{LEAD_STATUS.map(([k, t]) => { const items = shown.filter((l) => l.status === k); return (
            <div key={k} className={"bcol " + k + (over === k ? " over" : "")} onDragOver={(e) => { e.preventDefault(); setOver(k); }} onDragLeave={() => setOver("")}
              onDrop={() => { if (drag) patch(drag, { status: k }); setDrag(null); setOver(""); }}>
              <div className="bcol-h"><b>{t}</b><span>{items.length}</span></div>
              {items.map((l) => <div key={l.id} className="bcard" draggable onDragStart={() => setDrag(l.id)} onDragEnd={() => setDrag(null)} onClick={() => setOpen(l.id)}>
                <b>{nameOf(l)}</b><div className="mut sm">{phoneOf(l) || mailOf(l)}</div>{l.payment && <div style={{ marginTop: 6 }}><PayTag l={l} /></div>}<div className="bmeta"><span>{l.form}</span><span>{ago(l.ts)}</span></div>
                {l.note && <div className="bnote">📝 {l.note.slice(0, 60)}</div>}
              </div>)}
              {!items.length && <div className="bempty">Drop leads here</div>}
            </div>); })}</div>
        )}
      </>}
      {cur && <div className="ldrawer" onClick={() => setOpen(null)}><div onClick={(e) => e.stopPropagation()}>
        <div className="row between"><h3>{nameOf(cur)}</h3><button onClick={() => setOpen(null)}>Close</button></div>
        <p className="mut">{new Date(cur.ts).toLocaleString()} · {cur.form} · {cur.projectName}{cur.page ? " / " + cur.page : ""}</p>
        {cur.payment && <div className="lpay"><PayTag l={cur} />{cur.payment.id && <span className="mut sm">Razorpay ID: <code>{cur.payment.id}</code></span>}{cur.payment.ref && <span className="mut sm">UTR / ref: <code>{cur.payment.ref}</code></span>}
          {cur.payment.status !== "paid" && <button className="xs" onClick={() => patch(cur.id, { payment: { ...cur.payment, status: "paid", verified: Date.now() } })}>Mark as paid</button>}</div>}
        <dl>{Object.entries(cur.data || {}).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</dl>
        <div className="row">{phoneOf(cur) && <a className="btn go" href={`https://wa.me/${((p) => (p.length === 10 ? ((integ && integ.wa.country) || "91") + p : p))(String(phoneOf(cur)).replace(/\D/g, ""))}?text=${encodeURIComponent(fillT((integ && integ.wa.template) || "Hi {{name}},", cur.data || {}))}`} target="_blank" rel="noopener">WhatsApp</a>}
          {phoneOf(cur) && <a className="btn" href={`tel:${String(phoneOf(cur)).replace(/[^\d+]/g, "")}`}>Call</a>}
          {mailOf(cur) && <a className="btn" href={`mailto:${mailOf(cur)}`}>Email</a>}</div>
        <label className="mut">Status</label><select value={cur.status} onChange={(e) => patch(cur.id, { status: e.target.value })}>{LEAD_STATUS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
        <label className="mut">Notes</label><textarea rows={4} value={cur.note || ""} onChange={(e) => patch(cur.id, { note: e.target.value })} placeholder="Called on Monday, interested in the Pro plan…" />
        <button className="red" onClick={() => remove(cur.id)}>Delete lead</button>
      </div></div>}
    </>
  );
}
