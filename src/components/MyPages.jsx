// LaunchBuilder v30 — MyPages.jsx (Dashboard · Websites · Landing pages)
import { useEffect, useMemo, useRef, useState } from "react";
import { Thumb } from "./parts.jsx";
import { Icon } from "./Inspector.jsx";
import { ago, addr, LIMIT } from "../lib.js";

const DAY = 864e5;
/* numbers that count up when the dashboard opens */
function CountUp({ to = 0, ms = 900 }) {
  const [v, setV] = useState(0), raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    const t0 = performance.now(); cancelAnimationFrame(raf.current);
    const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); setV(Math.round(to * e)); if (k < 1) raf.current = requestAnimationFrame(step); };
    raf.current = requestAnimationFrame(step); return () => cancelAnimationFrame(raf.current);
  }, [to, ms]);
  return <>{v.toLocaleString("en-IN")}</>;
}
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
      <path d={area} fill="url(#dbv)" className="db-area" /><path d={path("views")} className="db-lv" /><path d={path("leads")} className="db-ll" />
      <circle cx={x(days.length - 1)} cy={y(last.views)} r="5" className="db-ping" /><circle cx={x(days.length - 1)} cy={y(last.leads)} r="5" className="db-ping l" />
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

export default function MyPages({ onViewAll, projects, onOpen, onNew, onImport, onRename, onDuplicate, onPublish, onUnpublish, onDelete, onPreview, onSaveTpl, leads = [], events = [], user = {}, mode = "dash", query = "", onLeads, onAnalytics, onTemplates }) {
  const [filter, setFilter] = useState("All"), [menu, setMenu] = useState(null);
  const act = (fn, p) => () => { setMenu(null); fn(p); };
  const typed = mode === "website" ? projects.filter((p) => p.type === "website") : mode === "landing" ? projects.filter((p) => p.type !== "website") : projects;
  const matching = typed.filter((p) => (filter === "All" || p.status === filter.toLowerCase()) && (!query || p.name.toLowerCase().includes(query.toLowerCase())));
  const shown = mode === "dash" && !query ? [...matching].sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 3) : matching;

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
      wLeads: wk(leads, (l) => l.ts), wViews: wk(views, (e) => e.ts),
      pub: projects.filter((p) => p.status === "published").length, draft: projects.filter((p) => p.status !== "published").length, dom: projects.filter((p) => p.domain).length,
      days, top: byProj[0], activity,
    };
  }, [projects, leads, events]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = (
    <>
      <div className="db-lh"><h2>{mode === "website" ? "Your websites" : mode === "landing" ? "Your landing pages" : mode === "all" ? "Your projects" : "Recent projects"} <span>({mode === "dash" && !query ? shown.length + " of " + typed.length : typed.length})</span></h2>
        {mode === "dash" && typed.length > 3 && <button className="link db-all" onClick={() => onViewAll && onViewAll()}>View all {typed.length} →</button>}
        <div className="chips" style={{ margin: 0 }}>{["All", "Published", "Draft"].map((f) => <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>)}</div></div>
      {!shown.length ? (
        <div className="empty"><b>{typed.length ? "Nothing matches" : mode === "website" ? "No websites yet" : mode === "landing" ? "No landing pages yet" : "Nothing here yet"}</b><p className="mut">Create one from a template, with AI, or import an existing HTML file.</p>
          <button className="pri" onClick={() => onNew(mode === "website" ? "website" : "landing")}>＋ Create new</button> <button onClick={onImport}>Import HTML</button></div>
      ) : (
        <div className={mode === "dash" && !query ? "grid pc-grid" : "grid"}>{shown.map((p) => (
          <div key={p.id} className="card" onClick={() => onOpen(p.id)}>
            <Thumb html={p.pages[0].html} />
            <div className="cb">
              <div className="ct"><b>{p.name}</b></div>
              <div className={"pc-st " + (p.status === "published" ? "on" : "")}><i />{p.status === "published" ? "Published" : "Draft"}<span className="mut">· {p.domain || (p.status === "published" ? addr(p) : "not live yet")}</span></div>
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
          </div>))}
          {mode === "dash" && !query && <div className="pc-help">
            <div className="pc-hh"><span>🎧</span><b>Need help?</b></div><p>Quick guides to get your site live.</p>
            <button onClick={onTemplates}>Start from a template →</button><button onClick={() => onViewAll && onViewAll("domains")}>Connect a domain →</button><button onClick={() => onViewAll && onViewAll("pixels")}>Add tracking pixels →</button>
          </div>}</div>
      )}
    </>
  );

  if (mode !== "dash") return (
    <div onClick={() => setMenu(null)}>
      <div className="top"><div><h1>{mode === "website" ? "Websites" : mode === "landing" ? "Landing Pages" : "All projects"}</h1><p className="mut">{mode === "website" ? "Multi-page sites with a shared menu." : mode === "landing" ? "Single pages built to convert — offers, events, sign-ups." : "Every website and landing page you've built."}</p></div>
        <button className="pri big" onClick={() => onNew(mode === "website" ? "website" : "landing")}>＋ New {mode === "website" ? "website" : mode === "landing" ? "landing page" : "project"}</button></div>
      {list}
    </div>
  );

  const top = st.top && st.top.p;
  return (
    <div onClick={() => setMenu(null)}>
      {/* hero */}
      <div className="hx">
        <i className="hx-blob b1" /><i className="hx-blob b2" /><i className="hx-blob b3" />
        <div className="hx-l">
          <span className="hx-pill"><Icon n="sparkle" s={14} /> AI Website &amp; Landing Page Builder</span>
          <h2>Create High-Converting <br /><span>Landing Pages &amp; Websites</span></h2>
          <div className="hx-chips">{["Drag & Drop", "Ready Templates", "Mobile Responsive", "Launch in Minutes"].map((c, i) => <span key={c} style={{ "--d": 0.15 + i * 0.08 + "s" }}><i>✓</i>{c}</span>)}</div>
          <button className="hx-cta" onClick={() => onNew("landing")}>＋ Create New Project <span>→</span></button>
        </div>
        <div className="hx-art" aria-hidden="true">
          {[["c1", "#f97316", "Bloom"], ["c2", "#0ea5e9", "Studio"], ["c3", "#10b981", "Fresh"], ["c4", "#7c3aed", "Launch"], ["c5", "#ec4899", "Event"], ["c6", "#eab308", "Shop"]].map(([k, c, t]) => (
            <div key={k} className={"hx-card " + k} style={{ "--c": c }}><i /><b>{t}</b><span /><span className="s" /><em /></div>))}
          <div className="hx-lap"><div className="hx-scr"><div className="hx-nav"><i /><i /><i /></div><b>Grow Your <br />Business Online</b><span /><span className="s" /><em>Get started</em><div className="hx-plant" /></div></div>
          <div className="hx-base" />
          <div className="hx-ai">AI</div>
        </div>
      </div>

      {/* stats: colourful cards — circle icon on top, number + label below, animated bar */}
      <div className="db-stats fx">
        {[["Total Projects", st.total, "layers", "amber", Math.round((st.total / LIMIT) * 100), `${st.total} of ${LIMIT} used`, null],
          ["Landing Pages", st.landing, "pages", "violet", st.total ? Math.round((st.landing / st.total) * 100) : 0, `${st.total ? Math.round((st.landing / st.total) * 100) : 0}% of projects`, "landings"],
          ["Websites", st.website, "globe", "ocean", st.total ? Math.round((st.website / st.total) * 100) : 0, `${st.total ? Math.round((st.website / st.total) * 100) : 0}% of projects`, "websites"],
          ["Total Leads", st.leads, "users", "mint", st.leads ? Math.round((st.wLeads / st.leads) * 100) : 0, `+${st.wLeads} this week`, "leads"],
          ["Total Views", st.views, "eye", "rose", st.views ? Math.round((st.wViews / st.views) * 100) : 0, `${st.wViews.toLocaleString("en-IN")} this week`, "analytics"]].map(([l, v, ic, c, bar, sub, go], i) => (
          <div key={l} className={"fx-stat fx-" + c + (go ? " click" : "")} style={{ "--d": i * 0.08 + "s" }} onClick={go === "leads" ? onLeads : go === "analytics" ? onAnalytics : go ? () => onViewAll && onViewAll(go) : undefined}>
            <span className="fx-orb"><Icon n={ic} s={22} /></span>
            <b className="fx-num"><CountUp to={v} /></b>
            <span className="fx-lbl">{l}</span>
            <div className="fx-bar"><i style={{ width: Math.max(4, Math.min(100, bar)) + "%" }} /></div>
            <small className="fx-sub">{sub}</small>
          </div>))}
      </div>

      {/* progress · chart · top project */}
      <div className="db-row3">
        <div className="db-card db-progc"><h3>Project Progress</h3>
          <div className="db-ringwrap"><i className="db-halo" /><Donut parts={[{ v: st.pub, c: "#7c4dff" }, { v: st.draft, c: "#f5b301" }]} /></div>
          <div className="db-legend">
            {[["Published", st.pub, "#7c4dff"], ["Draft", st.draft, "#f5b301"], ["Custom domain", st.dom, "#10b981"]].map(([l, v, c], i) => (
              <div key={l} className="db-lr" style={{ "--c": c, "--d": 0.3 + i * 0.12 + "s" }}>
                <div className="db-lt"><i />{l}<b>{v}</b></div>
                <div className="db-lb"><span style={{ width: (st.total ? Math.max(4, (v / st.total) * 100) : 4) + "%" }} /></div>
              </div>))}
          </div>
        </div>
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
          <div className="db-qa fx-qa">
            {[["Create Landing Page", "plus", "q1", () => onNew("landing")], ["Create Website", "globe", "q2", () => onNew("website")], ["Browse Templates", "layers", "q3", onTemplates], ["Manage Leads", "users", "q4", onLeads], ["View Reports", "chart", "q5", onAnalytics]].map(([t, ic, c, fn], i) => (
              <button key={t} className={"fx-q " + c} style={{ "--d": i * 0.07 + "s" }} onClick={fn}>
                <span className="fx-qorb"><Icon n={ic} s={22} /></span><b>{t}</b><span className="fx-go">→</span><i className="fx-glow" /></button>))}
          </div></div>
      </div>

      <div className="db-list">{list}</div>
    </div>
  );
}
