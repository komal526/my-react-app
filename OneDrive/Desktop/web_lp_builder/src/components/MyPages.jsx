// LaunchBuilder v26 — MyPages.jsx (Dashboard · Websites · Landing pages)
import { useMemo, useState } from "react";
import { Thumb } from "./parts.jsx";
import { Icon } from "./Inspector.jsx";
import { ago, addr } from "../lib.js";

const DAY = 864e5;
const pct = (now, prev) => (prev ? Math.round(((now - prev) / prev) * 100) : now ? 100 : 0);
const Trend = ({ v }) => (v ? <em className={"db-trend" + (v < 0 ? " down" : "")}>{v > 0 ? "↑" : "↓"} {Math.abs(v)}%</em> : <em className="db-trend flat">—</em>);

/* small dependency-free line chart (views + leads, last 7 days) */
function LineChart({ days }) {
  const W = 560, H = 190, P = { l: 34, r: 14, t: 16, b: 26 };
  const max = Math.max(4, ...days.map((d) => Math.max(d.views, d.leads)));
  const nice = Math.ceil(max / 4) * 4, x = (i) => P.l + (i * (W - P.l - P.r)) / (days.length - 1), y = (v) => H - P.b - (v / nice) * (H - P.t - P.b);
  const path = (k) => days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(" ");
  const area = `${path("views")} L${x(days.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`, last = days[days.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="db-chart" role="img" aria-label="Views and leads, last 7 days">
      <defs><linearGradient id="dbv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c4dff" stopOpacity=".28" /><stop offset="1" stopColor="#7c4dff" stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map((i) => { const v = (nice / 4) * i; return <g key={i}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className="db-grid" /><text x={P.l - 8} y={y(v) + 4} textAnchor="end" className="db-ax">{v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + "K" : v}</text></g>; })}
      {days.map((d, i) => <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="db-ax">{d.label}</text>)}
      <path d={area} fill="url(#dbv)" /><path d={path("views")} className="db-lv" /><path d={path("leads")} className="db-ll" />
      {days.map((d, i) => <g key={i}><circle cx={x(i)} cy={y(d.views)} r="3.6" className="db-pv" /><circle cx={x(i)} cy={y(d.leads)} r="3.2" className="db-pl" /></g>)}
      <g transform={`translate(${x(days.length - 1) - 44},${Math.max(4, y(last.views) - 30)})`}><rect width="52" height="22" rx="7" className="db-tagv" /><text x="26" y="15" textAnchor="middle" className="db-tagt">{last.views}</text></g>
      <g transform={`translate(${x(days.length - 1) - 40},${Math.min(H - P.b - 26, y(last.leads) - 30)})`}><rect width="44" height="22" rx="7" className="db-tagl" /><text x="22" y="15" textAnchor="middle" className="db-tagt">{last.leads}</text></g>
    </svg>
  );
}

function Donut({ parts }) {
  const total = parts.reduce((n, p) => n + p.v, 0) || 1, R = 54, C = 2 * Math.PI * R; let off = 0;
  const done = Math.round((parts[0].v / total) * 100);
  return (
    <div className="db-donut"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r={R} className="db-dbg" />
      {parts.map((p, i) => { const len = (p.v / total) * C, el = <circle key={i} cx="70" cy="70" r={R} stroke={p.c} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} className="db-dseg" />; off += len; return el; })}</svg>
      <div className="db-dc"><b>{done}%</b><span>Published</span></div></div>
  );
}

export default function MyPages({ projects, onOpen, onNew, onImport, onRename, onDuplicate, onPublish, onUnpublish, onDelete, onPreview, onSaveTpl, leads = [], events = [], user = {}, mode = "dash", query = "", onLeads, onAnalytics, onTemplates }) {
  const [filter, setFilter] = useState("All"), [menu, setMenu] = useState(null);
  const act = (fn, p) => () => { setMenu(null); fn(p); };
  const typed = mode === "website" ? projects.filter((p) => p.type === "website") : mode === "landing" ? projects.filter((p) => p.type !== "website") : projects;
  const shown = typed.filter((p) => (filter === "All" || p.status === filter.toLowerCase()) && (!query || p.name.toLowerCase().includes(query.toLowerCase())));

  /* ---------- numbers for the dashboard ---------- */
  const st = useMemo(() => {
    const now = Date.now(), wk = (arr, f) => arr.filter((x) => now - f(x) < 7 * DAY).length, pwk = (arr, f) => arr.filter((x) => now - f(x) >= 7 * DAY && now - f(x) < 14 * DAY).length;
    const views = events.filter((e) => e.t === "view");
    const created = (p) => p.created || p.updated || 0;
    const days = [...Array(7)].map((_, i) => { const d = new Date(now - (6 - i) * DAY); d.setHours(0, 0, 0, 0); const a = d.getTime(), b = a + DAY;
      return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), views: views.filter((e) => e.ts >= a && e.ts < b).length, leads: leads.filter((l) => l.ts >= a && l.ts < b).length }; });
    const byProj = projects.map((p) => ({ p, v: views.filter((e) => e.pid === p.id && now - e.ts < 30 * DAY).length, l: leads.filter((l) => l.projectId === p.id).length })).sort((a, b) => b.v - a.v || b.l - a.l);
    const activity = [
      ...projects.map((p) => ({ ts: p.updated || 0, ic: p.status === "published" ? "check" : "pen", c: p.status === "published" ? "v" : "g", t: p.status === "published" ? (p.type === "website" ? "Website published" : "Landing page published") : (p.type === "website" ? "Website updated" : "Landing page updated"), s: p.name, go: () => onOpen(p.id) })),
      ...leads.slice(0, 20).map((l) => ({ ts: l.ts || 0, ic: "users", c: "o", t: "New lead", s: `${(l.data && (l.data.name || l.data.email)) || "Someone"} · ${l.form || "Form"}`, go: onLeads })),
    ].sort((a, b) => b.ts - a.ts).slice(0, 4);
    return {
      total: projects.length, tTotal: wk(projects, created), landing: projects.filter((p) => p.type !== "website").length, website: projects.filter((p) => p.type === "website").length,
      leads: leads.length, tLeads: pct(wk(leads, (l) => l.ts), pwk(leads, (l) => l.ts)), views: views.length, tViews: pct(wk(views, (e) => e.ts), pwk(views, (e) => e.ts)),
      pub: projects.filter((p) => p.status === "published").length, draft: projects.filter((p) => p.status !== "published").length, dom: projects.filter((p) => p.domain).length,
      days, top: byProj[0], activity,
    };
  }, [projects, leads, events]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = (
    <>
      <div className="db-lh"><h2>{mode === "website" ? "Your websites" : mode === "landing" ? "Your landing pages" : "Your projects"} <span>({typed.length})</span></h2>
        <div className="chips" style={{ margin: 0 }}>{["All", "Published", "Draft"].map((f) => <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>)}</div></div>
      {!shown.length ? (
        <div className="empty"><b>{typed.length ? "Nothing matches" : mode === "website" ? "No websites yet" : mode === "landing" ? "No landing pages yet" : "Nothing here yet"}</b><p className="mut">Create one from a template, with AI, or import an existing HTML file.</p>
          <button className="pri" onClick={() => onNew(mode === "website" ? "website" : "landing")}>＋ Create new</button> <button onClick={onImport}>Import HTML</button></div>
      ) : (
        <div className="grid">{shown.map((p) => (
          <div key={p.id} className="card" onClick={() => onOpen(p.id)}>
            <Thumb html={p.pages[0].html} />
            <div className="cb">
              <div className="ct"><b>{p.name}</b><span className={"badge " + p.status}>{p.status === "published" ? "Published" : "Draft"}</span></div>
              <div className="mut db-addr"><Icon n="globe" s={13} /> {p.domain || (p.status === "published" ? addr(p) : "Not published yet")}</div>
              <div className="db-cardbtns" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onOpen(p.id)}><Icon n="pen" s={14} /> Edit</button>
                {onPreview && <button onClick={act(onPreview, p)}><Icon n="eye" s={14} /> Preview</button>}
                <button className="pri" onClick={act(onPublish, p)}>🚀 {p.status === "published" ? "Update" : "Publish"}</button>
              </div>
            </div>
            <button className="dots" onClick={(e) => { e.stopPropagation(); setMenu(menu === p.id ? null : p.id); }}>⋯</button>
            {menu === p.id && (
              <div className="menu" onClick={(e) => e.stopPropagation()}>
                <div onClick={() => onOpen(p.id)}>Edit</div>{onPreview && <div onClick={act(onPreview, p)}>Open preview link</div>}<div onClick={act(onRename, p)}>Rename</div><div onClick={act(onDuplicate, p)}>Duplicate</div>{onSaveTpl && <div onClick={act(onSaveTpl, p)}>★ Save as template</div>}
                <div onClick={act(onPublish, p)}>{p.status === "published" ? "Change address / republish" : "Publish"}</div>
                {p.status === "published" && <div onClick={act(onUnpublish, p)}>Unpublish</div>}
                <div className="red" onClick={act(onDelete, p)}>Delete</div>
              </div>)}
          </div>))}</div>
      )}
    </>
  );

  if (mode !== "dash") return (
    <div onClick={() => setMenu(null)}>
      <div className="top"><div><h1>{mode === "website" ? "Websites" : "Landing Pages"}</h1><p className="mut">{mode === "website" ? "Multi-page sites with a shared menu." : "Single pages built to convert — offers, events, sign-ups."}</p></div>
        <button className="pri big" onClick={() => onNew(mode === "website" ? "website" : "landing")}>＋ New {mode === "website" ? "website" : "landing page"}</button></div>
      {list}
    </div>
  );

  const top = st.top && st.top.p;
  return (
    <div onClick={() => setMenu(null)}>
      {/* hero */}
      <div className="db-hero">
        <div className="db-hero-l">
          <span className="db-pill"><Icon n="sparkle" s={14} /> AI Page Builder</span>
          <h2>Create Landing Pages &amp; Websites <br />with AI — <span className="db-gold">in Minutes!</span></h2>
          <div className="db-feats"><span>⚡ No Coding</span><span>◈ Drag &amp; Drop</span><span>▦ Ready Templates</span><span>🚀 Publish Instantly</span></div>
        </div>
        <button className="db-cta" onClick={() => onNew("landing")}>＋ Create New Project →</button>
        <div className="db-art" aria-hidden="true"><div className="db-ai">AI</div><div className="db-lap"><div className="db-scr"><i /><b>Grow Your Business</b><span /><em /></div></div><div className="db-base" /></div>
      </div>

      {/* stats */}
      <div className="db-stats">
        {[["Total Projects", st.total, "layers", "y", st.tTotal ? <em className="db-trend">+{st.tTotal} this week</em> : <em className="db-trend flat">—</em>, null],
          ["Landing Pages", st.landing, "pages", "v", null, "landings"], ["Websites", st.website, "globe", "b", null, "websites"],
          ["Total Leads", st.leads, "users", "o", <Trend v={st.tLeads} />, "leads"], ["Total Views", st.views, "eye", "p", <Trend v={st.tViews} />, "analytics"]].map(([l, v, ic, c, tr, go]) => (
          <div key={l} className={"db-stat c-" + c + (go ? " click" : "")} onClick={go === "leads" ? onLeads : go === "analytics" ? onAnalytics : undefined}>
            <span className="db-si"><Icon n={ic} s={24} /></span><div><span>{l}</span><b>{v.toLocaleString("en-IN")}</b></div>{tr}</div>))}
      </div>

      {/* progress · chart · top project */}
      <div className="db-row3">
        <div className="db-card"><h3>Project Progress</h3>
          <div className="db-prog"><Donut parts={[{ v: st.pub, c: "#7c4dff" }, { v: st.draft, c: "#f5b301" }]} />
            <ul><li><i style={{ background: "#7c4dff" }} />Published<b>{st.pub}</b></li><li><i style={{ background: "#f5b301" }} />Draft<b>{st.draft}</b></li><li><i style={{ background: "#e5e7eb" }} />Custom domain<b>{st.dom}</b></li></ul></div></div>
        <div className="db-card"><div className="db-ch"><h3>Views &amp; Leads Overview</h3><span className="db-leg"><i className="v" />Views<i className="l" />Leads</span><span className="db-wk">This week</span></div><LineChart days={st.days} /></div>
        <div className="db-card"><div className="db-ch"><h3>Top Performing Project</h3>{top && <button className="ib2" title="Open" onClick={() => onOpen(top.id)}><Icon n="external" s={15} /></button>}</div>
          {top ? <><div className="db-topimg" onClick={() => onOpen(top.id)}><Thumb html={top.pages[0].html} /></div><b className="db-topn">{top.name}</b>
            <div className="db-topst"><div><Icon n="eye" s={20} /><b>{st.top.v.toLocaleString("en-IN")}</b><span>Views</span></div><div><Icon n="users" s={20} /><b>{st.top.l}</b><span>Leads</span></div></div></>
            : <p className="mut">Publish a project to see which one performs best.</p>}</div>
      </div>

      {/* activity · quick actions */}
      <div className="db-row2">
        <div className="db-card"><div className="db-ch"><h3>Recent Activity</h3><button className="link" onClick={onAnalytics}>View all →</button></div>
          {st.activity.length ? st.activity.map((a, i) => <div key={i} className="db-act" onClick={a.go}><span className={"db-ai2 c-" + a.c}><Icon n={a.ic} s={16} /></span><div className="grow"><b>{a.t}</b><span>{a.s}</span></div><em>{ago(a.ts)}</em></div>)
            : <p className="mut">Your latest edits, publishes and leads will show here.</p>}</div>
        <div className="db-card"><h3>Quick Actions</h3>
          <div className="db-qa">
            {[["Create Landing Page", "plus", "dark", () => onNew("landing")], ["Create Website", "globe", "gold", () => onNew("website")], ["Browse Templates", "layers", "lav", onTemplates], ["Manage Leads", "users", "gold2", onLeads], ["View Reports", "chart", "lav", onAnalytics]].map(([t, ic, c, fn]) => (
              <button key={t} className={"db-q q-" + c} onClick={fn}><Icon n={ic} s={26} /><b>{t}</b><span className="db-qgo">→</span></button>))}
          </div></div>
      </div>

      <div className="db-list">{list}</div>
    </div>
  );
}
