// LaunchBuilder v36 — Pipeline.jsx (several lead pipelines · custom stages · manual leads · drag & drop)
import { useMemo, useState } from "react";
import { Icon } from "./Inspector.jsx";
import { ago, uid, loadPipes, savePipes, PIPE_COLORS, LEAD_STATUS } from "../lib.js";

const pickK = (d, re) => { const k = Object.keys(d || {}).find((x) => re.test(x)); return k ? d[k] : ""; };
const nameOf = (l) => pickK(l.data, /name/i) || Object.values(l.data || {})[0] || "—";
const phoneOf = (l) => pickK(l.data, /phone|tel|mobile|whats/i);
const noteOf = (l) => pickK(l.data, /message|note|comment|query|enquir|interest/i) || l.note || "";
const mask = (p) => { const d = String(p || ""); return d.length > 4 ? "•".repeat(Math.min(8, d.length - 4)) + d.slice(-4) : d; };
const PRI = ["Low", "Medium", "High"];
const STATUS_IDS = LEAD_STATUS.map(([k]) => k);

function Modal({ title, children, onClose, onOk, ok = "Save", okOff }) {
  return (
    <div className="pl-ov" onClick={onClose}><div className="pl-md" onClick={(e) => e.stopPropagation()}>
      <div className="pl-mh"><b>{title}</b><button className="pl-x" onClick={onClose} aria-label="Close">✕</button></div>
      <div className="pl-mb">{children}</div>
      <div className="pl-mf"><button onClick={onClose}>Cancel</button><button className="pri" disabled={okOff} onClick={onOk}>{ok}</button></div>
    </div></div>
  );
}

export default function Pipeline({ user, leads, update, forms = [], onOpen }) {
  const E = user.email;
  const [pipes, setPipes] = useState(() => loadPipes(E));
  const [pid, setPid] = useState(() => localStorage.getItem("lb_pipe_cur") || "default");
  const [q, setQ] = useState(""), [fStage, setFStage] = useState(""), [fPri, setFPri] = useState(""), [fSrc, setFSrc] = useState(""), [sort, setSort] = useState("updated");
  const [mode, setMode] = useState("board"), [masked, setMasked] = useState(true), [drag, setDrag] = useState(null), [over, setOver] = useState("");
  const [md, setMd] = useState(null), [menu, setMenu] = useState(false);
  const putPipes = (l) => { setPipes(l); savePipes(E, l); };
  const pipe = pipes.find((p) => p.id === pid) || pipes[0];
  const choose = (id) => { setPid(id); localStorage.setItem("lb_pipe_cur", id); setFStage(""); };

  /* which leads belong to this pipeline */
  const claimed = new Set(pipes.filter((p) => !p.def).flatMap((p) => p.forms || []));
  const inPipe = (l) => (pipe.forms && pipe.forms.length ? pipe.forms.includes(l.form) : pipe.def ? !claimed.has(l.form) : true);
  const stageOf = (l) => { const s = (l.pst || {})[pipe.id] || (pipe.def ? l.status : ""); return pipe.stages.some((x) => x.id === s) ? s : pipe.stages[0].id; };
  const moveTo = (id, stage) => update(leads.map((l) => (l.id === id ? { ...l, pst: { ...(l.pst || {}), [pipe.id]: stage }, ...(pipe.def && STATUS_IDS.includes(stage) ? { status: stage } : {}), updated: Date.now() } : l)));
  const patchLead = (id, o) => update(leads.map((l) => (l.id === id ? { ...l, ...o, updated: Date.now() } : l)));
  const delLead = (id) => { if (window.confirm("Delete this lead?")) update(leads.filter((l) => l.id !== id)); };

  const formNames = [...new Set([...forms.map((f) => f.name), ...leads.map((l) => l.form).filter(Boolean)])];
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const r = leads.filter((l) => inPipe(l) && (!t || JSON.stringify(l.data || {}).toLowerCase().includes(t) || (l.form || "").toLowerCase().includes(t)) && (!fStage || stageOf(l) === fStage) && (!fPri || (l.priority || "Medium") === fPri) && (!fSrc || l.form === fSrc));
    const by = { updated: (a, b) => (b.updated || b.ts) - (a.updated || a.ts), newest: (a, b) => b.ts - a.ts, oldest: (a, b) => a.ts - b.ts, name: (a, b) => String(nameOf(a)).localeCompare(String(nameOf(b))) }[sort];
    return r.sort(by);
  }, [leads, pipe, q, fStage, fPri, fSrc, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  /* pipeline / stage actions */
  const savePipe = () => {
    const name = (md.name || "").trim(); if (!name) return;
    if (md.edit) putPipes(pipes.map((p) => (p.id === pipe.id ? { ...p, name, forms: md.forms } : p)));
    else { const id = "pl" + uid(); putPipes([...pipes, { id, name, forms: md.forms, stages: [{ id: "s" + uid(), name: "New", c: PIPE_COLORS[0] }, { id: "s" + uid(), name: "In progress", c: PIPE_COLORS[1] }, { id: "s" + uid(), name: "Won", c: PIPE_COLORS[5] }, { id: "s" + uid(), name: "Lost", c: PIPE_COLORS[7] }] }]); choose(id); }
    setMd(null);
  };
  const delPipe = () => { if (pipe.def) return; if (!window.confirm(`Delete the pipeline "${pipe.name}"? Its leads stay in Leads.`)) return; putPipes(pipes.filter((p) => p.id !== pipe.id)); choose("default"); setMenu(false); };
  const makeDefault = () => { putPipes(pipes.map((p) => ({ ...p, def: p.id === pipe.id }))); setMenu(false); };
  const saveStage = () => {
    const name = (md.name || "").trim(); if (!name) return;
    const stages = md.sid ? pipe.stages.map((s) => (s.id === md.sid ? { ...s, name, c: md.c } : s)) : [...pipe.stages, { id: "s" + uid(), name, c: md.c }];
    putPipes(pipes.map((p) => (p.id === pipe.id ? { ...p, stages } : p))); setMd(null);
  };
  const delStage = (s) => {
    if (pipe.stages.length < 2) return alert("A pipeline needs at least one stage.");
    if (!window.confirm(`Delete the stage "${s.name}"? Its leads move to "${pipe.stages.find((x) => x.id !== s.id).name}".`)) return;
    const rest = pipe.stages.filter((x) => x.id !== s.id), first = rest[0].id;
    update(leads.map((l) => (inPipe(l) && stageOf(l) === s.id ? { ...l, pst: { ...(l.pst || {}), [pipe.id]: first }, ...(pipe.def && STATUS_IDS.includes(first) ? { status: first } : {}) } : l)));
    putPipes(pipes.map((p) => (p.id === pipe.id ? { ...p, stages: rest } : p)));
  };
  const addLead = () => {
    const d = md.lead; if (!(d.name || "").trim()) return;
    const stage = d.stage || pipe.stages[0].id;
    const l = { id: uid(), lid: "M" + uid(), ts: Date.now(), updated: Date.now(), form: d.form || (pipe.forms && pipe.forms[0]) || "Manual", source: "manual", projectName: "Added manually", priority: d.priority || "Medium",
      status: pipe.def && STATUS_IDS.includes(stage) ? stage : "new", pst: { [pipe.id]: stage }, data: { name: d.name.trim(), ...(d.phone ? { phone: d.phone } : {}), ...(d.email ? { email: d.email } : {}), ...(d.message ? { message: d.message } : {}) } };
    update([l, ...leads]); setMd(null);
  };

  const card = (l) => (
    <div key={l.id} className={"pl-card" + (drag === l.id ? " dragging" : "")} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", l.id); e.dataTransfer.effectAllowed = "move"; setDrag(l.id); }} onDragEnd={() => { setDrag(null); setOver(""); }} onClick={() => onOpen(l.id)}>
      <div className="pl-ch"><span className="pl-grip">⠿</span><b>{nameOf(l)}</b>
        <select className={"pl-pri p-" + (l.priority || "Medium")} value={l.priority || "Medium"} onClick={(e) => e.stopPropagation()} onChange={(e) => patchLead(l.id, { priority: e.target.value })}>{PRI.map((p) => <option key={p}>{p}</option>)}</select></div>
      {noteOf(l) && <p className="pl-note">{String(noteOf(l)).slice(0, 70)}</p>}
      <div className="pl-tags">{l.form && <span>{l.form}</span>}{l.payment && <span className={"pay " + l.payment.status}>{l.payment.status === "paid" ? "Paid" : "Payment " + l.payment.status}</span>}</div>
      <div className="pl-cf">
        {phoneOf(l) && <code>{masked ? mask(phoneOf(l)) : phoneOf(l)}</code>}
        <span className="pl-ago">{ago(l.updated || l.ts)}</span>
        <button className="pl-del" title="Delete lead" onClick={(e) => { e.stopPropagation(); delLead(l.id); }}><Icon n="trash" s={14} /></button>
      </div>
    </div>
  );

  return (
    <div className="pl" onClick={() => setMenu(false)}>
      {/* pipeline bar */}
      <div className="pl-bar">
        <div className="pl-pick">
          <select value={pipe.id} onChange={(e) => choose(e.target.value)} aria-label="Pipeline">{pipes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          {pipe.def && <span className="pl-def">Default</span>}
          <button className="pl-ib" title="New pipeline" onClick={() => setMd({ k: "pipe", name: "", forms: [] })}>＋</button>
          <div className="pl-more" onClick={(e) => e.stopPropagation()}><button className="pl-ib" title="Pipeline options" onClick={() => setMenu(!menu)}>⋯</button>
            {menu && <div className="pl-menu">
              <button onClick={() => { setMd({ k: "pipe", edit: true, name: pipe.name, forms: pipe.forms || [] }); setMenu(false); }}>Rename / choose forms</button>
              {!pipe.def && <button onClick={makeDefault}>Set as default</button>}
              {!pipe.def ? <button className="red" onClick={delPipe}>Delete pipeline</button> : <span className="mut sm">The default pipeline can't be deleted.</span>}
            </div>}</div>
          <span className="pl-src">{pipe.forms && pipe.forms.length ? "Forms: " + pipe.forms.join(", ") : pipe.def ? "All forms not used by another pipeline" : "All forms"}</span>
        </div>
        <div className="pl-right">
          <div className="pl-seg"><button className={mode === "board" ? "on" : ""} onClick={() => setMode("board")}><Icon n="grid" s={14} /> Board</button><button className={mode === "list" ? "on" : ""} onClick={() => setMode("list")}><Icon n="pages" s={14} /> List</button></div>
          <button className={"pl-mask" + (masked ? " on" : "")} onClick={() => setMasked(!masked)}><Icon n="eye" s={14} /> {masked ? "Masked" : "Visible"}</button>
          <button className="pri pl-add" onClick={() => setMd({ k: "lead", lead: { priority: "Medium", stage: pipe.stages[0].id } })}>＋ Add lead</button>
        </div>
      </div>

      {/* filters */}
      <div className="pl-filters">
        <label className="pl-search"><Icon n="search" s={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone, form…" /></label>
        <label className="pl-f"><span>Stage:</span><select value={fStage} onChange={(e) => setFStage(e.target.value)}><option value="">All stages</option>{pipe.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="pl-f"><span>Priority:</span><select value={fPri} onChange={(e) => setFPri(e.target.value)}><option value="">All priorities</option>{PRI.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="pl-f"><span>Source:</span><select value={fSrc} onChange={(e) => setFSrc(e.target.value)}><option value="">All sources</option>{formNames.map((f) => <option key={f}>{f}</option>)}</select></label>
        <label className="pl-f"><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="updated">Recently updated</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></label>
        <span className="pl-count">{list.length} lead{list.length === 1 ? "" : "s"}</span>
      </div>

      {mode === "board" ? (
        <div className="pl-board">
          {pipe.stages.filter((s) => !fStage || s.id === fStage).map((s, i) => { const items = list.filter((l) => stageOf(l) === s.id); return (
            <div key={s.id} className={"pl-col" + (over === s.id ? " over" : "")} style={{ "--c": s.c, "--d": i * 0.05 + "s" }}
              onDragOver={(e) => { e.preventDefault(); setOver(s.id); }} onDragLeave={() => setOver("")} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain") || drag; if (id) moveTo(id, s.id); setDrag(null); setOver(""); }}>
              <div className="pl-colh"><i /><b>{s.name}</b><span className="pl-n">{items.length}</span>
                <button title="Edit stage" onClick={() => setMd({ k: "stage", sid: s.id, name: s.name, c: s.c })}><Icon n="pen" s={13} /></button>
                <button title="Delete stage" onClick={() => delStage(s)}><Icon n="trash" s={13} /></button></div>
              <div className="pl-items">{items.map(card)}{!items.length && <div className="pl-drop">Drop leads here</div>}</div>
            </div>); })}
          <button className="pl-addstage" onClick={() => setMd({ k: "stage", name: "", c: PIPE_COLORS[pipe.stages.length % PIPE_COLORS.length] })}><span>＋</span>Add stage</button>
        </div>
      ) : (
        <div className="ltable pl-list"><table>
          <thead><tr><th>Lead</th><th>Phone</th><th>Stage</th><th>Priority</th><th>Source</th><th>Updated</th><th /></tr></thead>
          <tbody>{list.map((l) => <tr key={l.id} onClick={() => onOpen(l.id)}>
            <td><b>{nameOf(l)}</b>{noteOf(l) && <div className="mut sm">{String(noteOf(l)).slice(0, 50)}</div>}</td>
            <td><code>{masked ? mask(phoneOf(l)) : phoneOf(l)}</code></td>
            <td onClick={(e) => e.stopPropagation()}><select value={stageOf(l)} onChange={(e) => moveTo(l.id, e.target.value)}>{pipe.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
            <td onClick={(e) => e.stopPropagation()}><select className={"pl-pri p-" + (l.priority || "Medium")} value={l.priority || "Medium"} onChange={(e) => patchLead(l.id, { priority: e.target.value })}>{PRI.map((p) => <option key={p}>{p}</option>)}</select></td>
            <td>{l.form}</td><td className="mut">{ago(l.updated || l.ts)}</td>
            <td><button className="pl-del" onClick={(e) => { e.stopPropagation(); delLead(l.id); }}><Icon n="trash" s={14} /></button></td></tr>)}
            {!list.length && <tr><td colSpan={7} className="mut" style={{ textAlign: "center", padding: 24 }}>No leads match.</td></tr>}</tbody>
        </table></div>
      )}

      {md && md.k === "pipe" && <Modal title={md.edit ? "Edit pipeline" : "Create pipeline"} ok={md.edit ? "Save" : "Create"} okOff={!(md.name || "").trim()} onClose={() => setMd(null)} onOk={savePipe}>
        <label className="pl-l">Pipeline name<input autoFocus value={md.name} onChange={(e) => setMd({ ...md, name: e.target.value })} placeholder="e.g. Inbound Sales" onKeyDown={(e) => e.key === "Enter" && savePipe()} /></label>
        <span className="pl-l">Leads from these forms</span>
        <div className="pl-forms">{formNames.length ? formNames.map((f) => <label key={f} className="chk"><input type="checkbox" checked={md.forms.includes(f)} onChange={(e) => setMd({ ...md, forms: e.target.checked ? [...md.forms, f] : md.forms.filter((x) => x !== f) })} />{f}</label>) : <span className="mut sm">No forms yet — this pipeline will show every lead.</span>}</div>
        <p className="mut sm">Leave all unticked to include every form.</p>
      </Modal>}
      {md && md.k === "stage" && <Modal title={md.sid ? "Edit stage" : "Add stage"} ok={md.sid ? "Save" : "Add stage"} okOff={!(md.name || "").trim()} onClose={() => setMd(null)} onOk={saveStage}>
        <label className="pl-l">Stage name<input autoFocus value={md.name} onChange={(e) => setMd({ ...md, name: e.target.value })} placeholder="e.g. Demo scheduled" onKeyDown={(e) => e.key === "Enter" && saveStage()} /></label>
        <span className="pl-l">Colour</span>
        <div className="pl-colors">{PIPE_COLORS.map((c) => <button key={c} className={md.c === c ? "on" : ""} style={{ background: c }} onClick={() => setMd({ ...md, c })} aria-label={c} />)}</div>
      </Modal>}
      {md && md.k === "lead" && <Modal title="Add lead" ok="Add lead" okOff={!(md.lead.name || "").trim()} onClose={() => setMd(null)} onOk={addLead}>
        {[["name", "Name *", "e.g. Rahul Jain"], ["phone", "Phone / WhatsApp", "e.g. 98765 43210"], ["email", "Email", "e.g. rahul@example.com"], ["message", "Note", "What are they interested in?"]].map(([k, l, ph], i) => (
          <label key={k} className="pl-l">{l}<input autoFocus={!i} value={md.lead[k] || ""} placeholder={ph} onChange={(e) => setMd({ ...md, lead: { ...md.lead, [k]: e.target.value } })} /></label>))}
        <div className="pl-two">
          <label className="pl-l">Stage<select value={md.lead.stage} onChange={(e) => setMd({ ...md, lead: { ...md.lead, stage: e.target.value } })}>{pipe.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="pl-l">Priority<select value={md.lead.priority} onChange={(e) => setMd({ ...md, lead: { ...md.lead, priority: e.target.value } })}>{PRI.map((p) => <option key={p}>{p}</option>)}</select></label>
        </div>
      </Modal>}
    </div>
  );
}
