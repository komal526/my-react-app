// LaunchBuilder v3 — Analytics.jsx
import { useMemo, useState } from "react";
import { Icon } from "./icons.jsx";

/* ================= Analytics: visits, visitors, leads, conversion, pages, devices, forms ================= */
const DAY = 864e5;
const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const gaOf = (p) => { const h = (p.pages[0] || {}).html || ""; const m = h.match(/"ga":"(G-[A-Za-z0-9]+)"/); return m ? m[1] : ""; };
const gtmOf = (p) => { const h = (p.pages[0] || {}).html || ""; const m = h.match(/"gtm":"(GTM-[A-Za-z0-9]+)"/); return m ? m[1] : ""; };

function Chart({ days, views, leads }) {
  const W = 760, H = 220, P = 30, max = Math.max(4, ...views, ...leads), n = days.length;
  const x = (i) => P + (i * (W - P * 2)) / Math.max(1, n - 1), y = (v) => H - P - (v / max) * (H - P * 2);
  const line = (a) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const step = Math.max(1, Math.ceil(n / 8));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="an-chart" role="img" aria-label="Visits and leads per day">
      {[0, 0.5, 1].map((k) => <g key={k}><line x1={P} x2={W - P} y1={y(max * k)} y2={y(max * k)} stroke="#eceaf5" /><text x={P - 8} y={y(max * k) + 4} textAnchor="end" fontSize="10" fill="#8a87a8">{Math.round(max * k)}</text></g>)}
      <defs><linearGradient id="anv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b5bdb" stopOpacity=".28" /><stop offset="1" stopColor="#3b5bdb" stopOpacity="0" /></linearGradient></defs>
      <path d={line(views) + ` L${x(n - 1)},${H - P} L${x(0)},${H - P} Z`} fill="url(#anv)" className="an-area" />
      <path d={line(views)} fill="none" stroke="#3b5bdb" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" className="an-lv" />
      <path d={line(leads)} fill="none" stroke="#f5b301" strokeWidth="2.6" strokeDasharray="5 4" strokeLinejoin="round" className="an-ll" />
      {days.map((d, i) => i % step === 0 && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#8a87a8">{d}</text>)}
    </svg>
  );
}

export default function Analytics({ projects, events, leads, onOpenProject }) {
  const [range, setRange] = useState(7), [pid, setPid] = useState("");
  const since = Date.now() - range * DAY;
  const ev = useMemo(() => events.filter((e) => e.ts >= since && (!pid || e.pid === pid)), [events, since, pid]);
  const ld = useMemo(() => leads.filter((l) => l.ts >= since && (!pid || l.projectId === pid)), [leads, since, pid]);
  const views = ev.filter((e) => e.t === "view"), visitors = new Set(views.map((e) => e.sid)).size;
  const conv = visitors ? Math.round((ld.length / visitors) * 1000) / 10 : 0;
  const prevSince = since - range * DAY;
  const prevViews = events.filter((e) => e.t === "view" && e.ts >= prevSince && e.ts < since && (!pid || e.pid === pid)).length;
  const trend = prevViews ? Math.round(((views.length - prevViews) / prevViews) * 100) : null;

  const days = [], vSeries = [], lSeries = [];
  for (let i = range - 1; i >= 0; i--) {
    const t = Date.now() - i * DAY, k = dayKey(t), d = new Date(t);
    days.push(`${d.getDate()}/${d.getMonth() + 1}`);
    vSeries.push(views.filter((e) => dayKey(e.ts) === k).length); lSeries.push(ld.filter((l) => dayKey(l.ts) === k).length);
  }
  const by = (arr, f) => { const m = {}; arr.forEach((x) => { const k = f(x); m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const pname = (id) => (projects.find((p) => p.id === id) || {}).name || "Deleted project";
  const topPages = by(views, (e) => e.pid + "|" + e.page).slice(0, 8);
  const devices = by(views, (e) => e.dev || "desktop"), formsPerf = by(ld, (l) => l.form || "Form").slice(0, 6);
  /* leads by city — from the visitor's location, or a "City" field in the form */
  const cityOf = (l) => { const g = l.geo || {}; const k = Object.keys(l.data || {}).find((x) => /^(city|town|location|place)$/i.test(x.trim())); const c = (g.city || (k ? l.data[k] : "") || "").toString().trim(); return c ? c.replace(/\b\w/g, (m) => m.toUpperCase()) : ""; };
  const cities = by(ld.filter((l) => cityOf(l)), cityOf), unknownCity = ld.filter((l) => !cityOf(l)).length, cityMax = cities.length ? cities[0][1] : 1;
  const maxPage = topPages[0] ? topPages[0][1] : 1;

  return (
    <>
      <div className="top"><div><h1>Analytics</h1><p className="mut">How many people see your pages and how many become leads.</p></div>
        <div className="row"><select value={pid} onChange={(e) => setPid(e.target.value)}><option value="">All projects</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <div className="chips" style={{ margin: 0 }}>{[7, 30, 90].map((d) => <button key={d} className={range === d ? "on" : ""} onClick={() => setRange(d)}>{d} days</button>)}</div></div></div>
      <div className="db-stats fx an-fx">
        {[["Page views", views.length, "eye", "blue", trend !== null ? `${trend >= 0 ? "↑ +" : "↓ "}${Math.abs(trend)}% vs previous ${range} days` : `last ${range} days`, trend > 0],
          ["Visitors", visitors, "users", "purple", `last ${range} days`, false],
          ["Leads", ld.length, "form", "green", `last ${range} days`, false],
          ["Conversion rate", conv + "%", "chart", "orange", "leads ÷ visitors", false]].map(([l, v, ic, c, sub, up], i) => (
          <div key={l} className={"fx-stat fx-" + c} style={{ "--d": i * 0.07 + "s" }}>
            <span className="fx-orb"><Icon n={ic} s={22} /></span>
            <div className="fx-txt"><span className="fx-lbl">{l}</span><b className="fx-num">{v}</b></div>
            <small className={"fx-sub" + (up ? " up" : "")}>{sub}</small>
          </div>))}
      </div>
      <div className="panel"><div className="row between"><b>Visits and leads per day</b><span className="an-key"><i className="v" />Page views <i className="l" />Leads</span></div><Chart days={days} views={vSeries} leads={lSeries} /></div>
      <div className="an-grid">
        <div className="panel"><b>Top pages</b>{!topPages.length ? <p className="mut">No visits yet in this period.</p> : topPages.map(([k, n]) => { const [p, page] = k.split("|"); return <div key={k} className="an-bar"><div className="grow"><div>{page}<span className="mut"> · {pname(p)}</span></div><div className="an-track"><i style={{ width: (n / maxPage) * 100 + "%" }} /></div></div><b>{n}</b></div>; })}</div>
        <div className="panel"><b>Devices</b>{!devices.length ? <p className="mut">No visits yet.</p> : devices.map(([d, n]) => <div key={d} className="an-bar"><div className="grow"><div style={{ textTransform: "capitalize" }}>{d}</div><div className="an-track"><i style={{ width: (n / views.length) * 100 + "%" }} /></div></div><b>{Math.round((n / views.length) * 100)}%</b></div>)}
          <b style={{ display: "block", marginTop: 18 }}>Leads by form</b>{!formsPerf.length ? <p className="mut">No leads yet.</p> : formsPerf.map(([f, n]) => <div key={f} className="an-bar"><div className="grow">{f}</div><b>{n}</b></div>)}</div>
      </div>
      <div className="panel an-cities"><div className="row between"><b>📍 Leads by city</b><span className="mut sm">{cities.length} {cities.length === 1 ? "city" : "cities"} · last {range} days</span></div>
        {!cities.length ? <p className="mut">No city data yet. New leads from your live sites include the visitor's city automatically — or add a <b>City</b> field to your form.</p>
          : <div className="an-citylist">{cities.slice(0, 10).map(([c, n], i) => <div key={c} className="an-city" style={{ "--d": i * 0.05 + "s" }}><span className="an-rank">{i + 1}</span><b>{c}</b><div className="an-track"><div className="v" style={{ width: Math.max(6, (n / cityMax) * 100) + "%" }} /></div><em>{n} lead{n === 1 ? "" : "s"}</em></div>)}</div>}
        {cities.length > 0 && unknownCity > 0 && <p className="mut sm">{unknownCity} lead{unknownCity === 1 ? "" : "s"} without a city (older leads or location blocked).</p>}
      </div>
      <div className="panel"><b>Live site tracking</b>
        <p className="mut">Numbers above count visits to your preview links and form share links. For visitors on your live domain, connect Google Analytics 4 or Tag Manager — they're added to every exported page automatically.</p>
        <div className="an-ga">{projects.map((p) => { const ga = gaOf(p), gtm = gtmOf(p); return (
          <div key={p.id} className="drow"><b>{p.name}</b><span className="grow" />
            {ga || gtm ? <span className="badge published">✓ {[ga, gtm].filter(Boolean).join(" · ")}</span> : <span className="badge draft">Not connected</span>}
            <button onClick={() => onOpenProject(p.id)}>{ga || gtm ? "Edit" : "Connect"}</button></div>); })}
          {!projects.length && <p className="mut">Create a project first.</p>}</div>
        <p className="mut sm">To connect: open the project → <b>Site</b> tab → <b>Analytics &amp; tracking</b> → paste your GA4 ID (G-XXXXXXX) → <b>Apply to all pages</b>.</p>
      </div>
    </>
  );
}
