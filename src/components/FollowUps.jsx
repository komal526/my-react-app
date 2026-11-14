// LaunchBuilder v50 — FollowUps.jsx (every lead you need to call back: overdue · today · upcoming · done)
import { useMemo, useState } from "react";
import { Icon } from "./icons.jsx";
import { fuState, fuLabel, FU_QUICK, toLocalInput, ago } from "../lib.js";

const pickK = (d, re) => { const k = Object.keys(d || {}).find((x) => re.test(x)); return k ? d[k] : ""; };
export const nameOf = (l) => pickK(l.data, /name/i) || Object.values(l.data || {})[0] || "—";
export const phoneOf = (l) => pickK(l.data, /phone|tel|mobile|whats/i);
const waLink = (p, msg) => { let d = String(p || "").replace(/\D/g, ""); if (d.length === 11 && d[0] === "0") d = d.slice(1); if (d.length === 10) d = "91" + d; return d.length >= 11 ? "https://wa.me/" + d + (msg ? "?text=" + encodeURIComponent(msg) : "") : ""; };

/* set / change a follow-up — used here and on pipeline cards */
export function FuModal({ lead, onSave, onClose }) {
  const [at, setAt] = useState(lead.fu && lead.fu.at ? lead.fu.at : FU_QUICK[2][1]()), [note, setNote] = useState((lead.fu && lead.fu.note) || "");
  return (
    <div className="pl-ov" onClick={onClose}><div className="pl-md fu-md" onClick={(e) => e.stopPropagation()}>
      <div className="pl-mh"><b>Follow-up · {nameOf(lead)}</b><button className="pl-x" onClick={onClose} aria-label="Close">✕</button></div>
      <div className="pl-mb">
        <span className="pl-l">When</span>
        <div className="fu-quick">{FU_QUICK.map(([l, fn]) => <button key={l} className={Math.abs(fn() - at) < 6e4 ? "on" : ""} onClick={() => setAt(fn())}>{l}</button>)}</div>
        <label className="pl-l">Date &amp; time<input type="datetime-local" value={toLocalInput(at)} onChange={(e) => e.target.value && setAt(new Date(e.target.value).getTime())} /></label>
        <label className="pl-l">What to talk about<textarea rows={3} value={note} placeholder="e.g. Send fee details, confirm Sunday batch" onChange={(e) => setNote(e.target.value)} /></label>
        <p className="mut sm">Shows in <b>Follow-ups</b> and on the lead's card. Due follow-ups get a badge in the menu.</p>
      </div>
      <div className="pl-mf">{lead.fu && <button className="red" onClick={() => onSave(null)}>Remove</button>}<div className="grow" /><button onClick={onClose}>Cancel</button><button className="pri" onClick={() => onSave({ at, note: note.trim(), set: Date.now() })}>Save follow-up</button></div>
    </div></div>
  );
}

export default function FollowUps({ leads, setLeads, onPipeline }) {
  const [tab, setTab] = useState("due"), [q, setQ] = useState(""), [md, setMd] = useState(null), [, tick] = useState(0);
  const now = Date.now();
  const update = (id, fn) => setLeads(leads.map((l) => (l.id === id ? { ...fn(l), updated: Date.now() } : l)));
  const done = (l) => update(l.id, (x) => ({ ...x, fu: null, fuLog: [{ ...x.fu, done: Date.now() }, ...(x.fuLog || [])].slice(0, 30) }));
  const snooze = (l, ms) => update(l.id, (x) => ({ ...x, fu: { ...x.fu, at: Math.max(Date.now(), x.fu.at) + ms } }));
  const save = (fu) => { update(md.id, (x) => ({ ...x, fu })); setMd(null); };

  const t = q.trim().toLowerCase(), match = (l) => !t || JSON.stringify(l.data || {}).toLowerCase().includes(t) || (l.form || "").toLowerCase().includes(t);
  const groups = useMemo(() => {
    const g = { overdue: [], today: [], upcoming: [], done: [] };
    leads.forEach((l) => { const s = fuState(l, now); if (s) g[s].push(l); (l.fuLog || []).forEach((f) => { if (now - f.done < 30 * 864e5) g.done.push({ l, f }); }); });
    g.overdue.sort((a, b) => a.fu.at - b.fu.at); g.today.sort((a, b) => a.fu.at - b.fu.at); g.upcoming.sort((a, b) => a.fu.at - b.fu.at); g.done.sort((a, b) => b.f.done - a.f.done);
    return g;
  }, [leads, now]); // eslint-disable-line react-hooks/exhaustive-deps
  const doneWeek = groups.done.filter((x) => now - x.f.done < 7 * 864e5).length;
  const noDate = leads.filter((l) => !l.fu && l.status !== "won" && l.status !== "lost" && Object.values(l.pst || {}).includes("followup")).length;

  const row = (l, state) => {
    const ph = phoneOf(l), msg = `Hi ${String(nameOf(l)).split(" ")[0]}, `;
    return (
      <div key={l.id} className={"fu-row " + state}>
        <span className={"fu-when " + state}><Icon n="clock" s={14} />{fuLabel(l.fu.at, now)}</span>
        <div className="fu-who"><b>{nameOf(l)}</b><small>{l.form || "Lead"}{ph ? " · " + ph : ""} · added {ago(l.ts)}</small>{l.fu.note && <p>{l.fu.note}</p>}</div>
        <div className="fu-acts">
          {waLink(ph) && <a className="fu-wa" href={waLink(ph, msg)} target="_blank" rel="noopener" title="WhatsApp"><Icon n="whatsapp" s={16} /></a>}
          {ph && <a className="fu-ib" href={"tel:" + String(ph).replace(/\s/g, "")} title="Call"><Icon n="phone" s={15} /></a>}
          <div className="fu-snz"><button className="fu-ib" title="Later">+1 day</button>
            <div className="fu-snm">{[["+1 hour", 36e5], ["+1 day", 864e5], ["+3 days", 3 * 864e5], ["+1 week", 7 * 864e5]].map(([l2, ms]) => <button key={l2} onClick={() => snooze(l, ms)}>{l2}</button>)}</div></div>
          <button className="fu-ib" title="Change" onClick={() => setMd(l)}><Icon n="pen" s={14} /></button>
          <button className="fu-done" onClick={() => done(l)}><Icon n="check" s={15} /> Done</button>
        </div>
      </div>);
  };
  const list = tab === "due" ? [...groups.overdue.filter(match).map((l) => row(l, "overdue")), ...groups.today.filter(match).map((l) => row(l, "today"))]
    : tab === "upcoming" ? groups.upcoming.filter(match).map((l) => row(l, "upcoming"))
      : groups.done.filter((x) => match(x.l)).map(({ l, f }, i) => <div key={l.id + i} className="fu-row done"><span className="fu-when done"><Icon n="check" s={14} />{fuLabel(f.done, now)}</span><div className="fu-who"><b>{nameOf(l)}</b><small>{l.form || "Lead"} · was due {fuLabel(f.at, now)}</small>{f.note && <p>{f.note}</p>}</div><div className="fu-acts"><button className="fu-ib" onClick={() => setMd(l)}>Follow up again</button></div></div>);

  return (
    <div onMouseEnter={() => tick((n) => n + 1)}>
      <div className="top"><div><h1>Follow-ups</h1><p className="mut">Everyone you promised to call back — so no lead goes cold.</p></div>
        {onPipeline && <button className="pri big" onClick={onPipeline}><Icon n="users" s={16} /> Open pipeline</button>}</div>
      <div className="db-stats fx fu-stats">
        {[["Overdue", groups.overdue.length, "clock", "pink"], ["Due today", groups.today.length, "calendar", "orange"], ["Upcoming", groups.upcoming.length, "chev", "blue"], ["Done this week", doneWeek, "check", "green"]].map(([l, v, ic, c]) => (
          <div key={l} className={"fx-stat fx-" + c}><span className="fx-orb"><Icon n={ic} s={22} /></span><div className="fx-txt"><span className="fx-lbl">{l}</span><b className="fx-num">{v}</b></div></div>))}
      </div>
      <div className="fu-bar">
        <div className="fu-tabs">{[["due", `Due now · ${groups.overdue.length + groups.today.length}`], ["upcoming", `Upcoming · ${groups.upcoming.length}`], ["done", `Done · ${groups.done.length}`]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
        <label className="pl-search"><Icon n="search" s={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, form…" /></label>
      </div>
      {noDate > 0 && <div className="pl-hint">{noDate} lead{noDate > 1 ? "s are" : " is"} in the <b>Follow-up</b> stage without a date. Open the pipeline and click the clock on the card to set one.</div>}
      <div className="fu-list">{list.length ? list : <div className="empty"><b>{tab === "due" ? "Nothing due right now 🎉" : tab === "upcoming" ? "No upcoming follow-ups" : "No finished follow-ups yet"}</b><p className="mut">Set a follow-up from any lead card in the pipeline (clock button), or move a lead into the Follow-up stage.</p></div>}</div>
      {md && <FuModal lead={md} onClose={() => setMd(null)} onSave={save} />}
    </div>
  );
}
