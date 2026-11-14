// LaunchBuilder v48 — MyPages.jsx (Dashboard · Websites · Landing pages)
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Thumb } from "./parts.jsx";
import { Icon } from "./icons.jsx";
import { addr, LIMIT, FILE_TEMPLATES, FEATURED_TPL, longThumb } from "../lib.js";
import { metrics, consult, areaName } from "./insights.js";
import { BRAND } from "../brand.js";
const Legal = lazy(() => import("./Legal.jsx"));

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

/* ---------- Smart Insights: visitors · CTA clicks · form submits · conversion ---------- */
const Pill = ({ v, pts }) => (v ? <em className={"si-pill" + (v < 0 ? " down" : "")}>{v > 0 ? "↑" : "↓"} {v > 0 ? "+" : ""}{v}{pts ? " pts" : "%"}</em> : <em className="si-pill flat">no change</em>);
function SmartInsights({ events, leads, onAsk, onAnalytics }) {
  const [days, setDays] = useState(7);
  const m = useMemo(() => metrics(events, leads, { days }), [events, leads, days]);
  const tiles = [["Visitors", m.visitors, "eye", "pink", m.trend.visitors], ["CTA Clicks", m.clicks, "cursor", "orange", m.trend.clicks], ["Form Submits", m.subs, "form", "violet", m.trend.subs]];
  return (
    <div className="db-card si">
      <div className="si-h"><span className="si-spark" aria-hidden="true">✦<i>✦</i><i>✦</i></span><h3>Smart Insights</h3>
        <label className="si-range"><select value={days} onChange={(e) => setDays(+e.target.value)} aria-label="Period">{[[7, "Last 7 days"], [30, "Last 30 days"], [90, "Last 90 days"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><Icon n="chevd" s={14} /></label></div>
      <div className="si-grid">
        {tiles.map(([l, v, ic, c, t], i) => <button key={l} className="si-t" style={{ "--d": i * 0.06 + "s" }} onClick={onAnalytics}><span className={"si-ic " + c}><Icon n={ic} s={20} /></span><b><CountUp to={v} /></b><span className="si-l">{l}</span><Pill v={t} /></button>)}
        <button className="si-t si-conv" onClick={onAnalytics}><span className="si-ic funnel"><Icon n="funnel" s={20} /></span><b>{m.conv >= 10 ? Math.round(m.conv) : m.conv.toFixed(1)}%</b><span className="si-l">Conversion</span><Pill v={m.trend.conv} pts /></button>
      </div>
      <button className="si-ask" onClick={onAsk}><Icon n="sparkle" s={15} /><span>{m.visitors ? "Ask AI how to improve these numbers" : "Publish a page — numbers appear here as visitors arrive"}</span><b>→</b></button>
    </div>
  );
}

/* ---------- AI Consultant: direct, actionable suggestions from the audit + live numbers ---------- */
function AiCard({ projects, events, leads, onConsult, onOpen }) {
  const { res, tips } = useMemo(() => consult(projects, events, leads, { days: 30 }), [projects, events, leads]);
  const avg = res.length ? Math.round(res.reduce((n, r) => n + r.score, 0) / res.length) : 0;
  const top = tips.slice(0, 3);
  return (
    <div className="db-card ai-card">
      <div className="ai-h"><span className="ai-av"><Icon n="sparkle" s={18} /></span><div className="grow"><h3>AI Consultant</h3><small>Suggestions from your pages and live numbers</small></div>
        {res.length > 0 && <div className="ai-score" title="Average page score"><b>{avg}</b><small>/100</small></div>}</div>
      {!res.length ? <p className="mut ai-empty">Create your first page — I'll check its headline, buttons, form, mobile view, speed and conversions, and tell you exactly what to fix.</p>
        : !top.length ? <div className="ai-good"><b>Your pages look great 🎉</b><p className="mut">No important problems found. Ask me how to get more visitors or test a new headline.</p></div>
        : top.map((t, i) => (
          <div key={i} className={"ai-tip s" + t.sev} style={{ "--d": i * 0.08 + "s" }}>
            <span className="ai-sev">{t.sev >= 3 ? "High" : t.sev === 2 ? "Medium" : "Low"}</span>
            <div className="grow"><b>{t.title}</b><p>{t.fix}</p><small><span className="ai-area">{areaName(t.area)}</span>{t.live && <span className="ai-live">● Live data</span>}<span>{t.p.name}</span></small></div>
            <div className="ai-acts"><button onClick={() => onOpen(t.p.id)} title="Open in the editor"><Icon n="pen" s={14} /> Fix</button><button onClick={() => onConsult({ tab: "ask", pid: t.p.id, ask: `How exactly should I fix this: ${t.title}?` })} title="Ask AI"><Icon n="chat" s={14} /> Ask</button></div>
          </div>))}
      <div className="ai-foot">
        <button className="ai-btn" onClick={() => onConsult({ tab: "ask", ask: "Give me today's top 3 fixes" })}><Icon n="sparkle" s={15} /> Today's AI review</button>
        <button className="ai-btn y" onClick={() => onConsult({ tab: "plan" })}><Icon n="wand" s={15} /> Plan a page with AI</button>
      </div>
    </div>
  );
}

/* ---------- 5 featured landing-page templates: light images, page scrolls on hover ---------- */
function FeaturedTpl({ onUse, onAll }) {
  const list = FEATURED_TPL.map((k) => FILE_TEMPLATES.find((t) => t.key === k)).filter(Boolean);
  const [busy, setBusy] = useState("");
  return (
    <div className="db-card ft">
      <div className="db-ch"><h3>Start with a proven landing page</h3><button className="link" onClick={onAll}>All templates →</button></div>
      <div className="ft-row">{list.map((t, i) => (
        <div key={t.key} className="ft-c" style={{ "--d": i * 0.06 + "s" }}>
          <button className="ft-shot" onMouseEnter={(e) => e.currentTarget.style.setProperty("--fth", e.currentTarget.clientHeight + "px")} onFocus={(e) => e.currentTarget.style.setProperty("--fth", e.currentTarget.clientHeight + "px")} onClick={() => { setBusy(t.key); Promise.resolve(onUse(t)).finally(() => setBusy("")); }} aria-label={"Use " + t.name}>
            <img src={longThumb(t)} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.src = (import.meta.env.BASE_URL || "/") + t.thumb; e.currentTarget.classList.add("short"); }} />
            <span className="ft-use">{busy === t.key ? "Opening…" : "Use this template"}</span>
          </button>
          <b>{t.name}</b><small>{t.cat}</small>
        </div>))}</div>
    </div>
  );
}

/* ---------- dashboard footer: your links, contact and legal pages ---------- */
const SOC = [["instagram", "Instagram"], ["facebook", "Facebook"], ["youtube", "YouTube"], ["linkedin", "LinkedIn"], ["x", "X"]];
function DashFooter({ onNew, onGo, onTemplates, onLeads, onAnalytics, onConsult }) {
  const [legal, setLegal] = useState(null), B = BRAND, wa = B.whatsapp ? `https://wa.me/${B.whatsapp}?text=${encodeURIComponent("Hi, I need help with " + B.product)}` : "";
  const contact = [wa && ["whatsapp", "WhatsApp us", wa, true], B.phone && ["phone", B.phone, "tel:" + B.phone.replace(/\s/g, "")], B.email && ["mail", B.email, "mailto:" + B.email], B.address && ["pin", B.address]].filter(Boolean);
  const socials = SOC.filter(([k]) => B.social && B.social[k]);
  return (
    <footer className="df">
      <div className="df-top">
        <div className="df-brand"><div className="df-logo"><span>⬡</span><b>{B.product}</b></div><p>{B.tagline}</p>
          {wa && <a className="df-wa" href={wa} target="_blank" rel="noreferrer"><Icon n="whatsapp" s={18} /> Chat with us on WhatsApp</a>}
          {socials.length > 0 && <div className="df-soc">{socials.map(([k, l]) => <a key={k} href={B.social[k]} target="_blank" rel="noreferrer" aria-label={l} title={l}><Icon n={k === "x" ? "xlogo" : k} s={17} /></a>)}</div>}
        </div>
        <div className="df-col"><h4>Build</h4><button onClick={() => onNew("landing")}>Create a landing page</button><button onClick={() => onNew("website")}>Create a website</button><button onClick={onTemplates}>Templates</button><button onClick={() => onGo("forms")}>Forms</button><button onClick={() => onGo("calendar")}>Booking calendar</button></div>
        <div className="df-col"><h4>Grow</h4><button onClick={onLeads}>Leads &amp; CRM</button><button onClick={onAnalytics}>Analytics</button><button onClick={() => onConsult({ tab: "ask" })}>AI Consultant</button><button onClick={() => onGo("domains")}>Connect a domain</button><button onClick={() => onGo("pixels")}>Tracking pixels</button></div>
        <div className="df-col"><h4>Support</h4>
          {contact.map(([ic, l, href, ext]) => href ? <a key={l} href={href} target={ext ? "_blank" : undefined} rel="noreferrer"><Icon n={ic} s={15} />{l}</a> : <span key={l}><Icon n={ic} s={15} />{l}</span>)}
          {B.hours && contact.length > 0 && <span className="df-hrs"><Icon n="clock" s={15} />{B.hours}</span>}
          <button onClick={() => onGo("integrations")}>Integrations</button><button onClick={() => onGo("settings")}>Account settings</button>
        </div>
        <div className="df-col"><h4>Legal</h4>{[["privacy", "Privacy Policy"], ["terms", "Terms of Service"], ["refund", "Refund & Cancellation"], ["cookies", "Cookie Policy"]].map(([k, l]) => <button key={k} onClick={() => setLegal(k)}>{l}</button>)}</div>
      </div>
      <div className="df-bot"><span>© {new Date().getFullYear()} {B.company}. All rights reserved.</span><span className="df-made">Made in India 🇮🇳</span>
        <span className="df-legal">{[["privacy", "Privacy"], ["terms", "Terms"], ["refund", "Refunds"]].map(([k, l]) => <button key={k} onClick={() => setLegal(k)}>{l}</button>)}</span></div>
      {legal && <Suspense fallback={null}><Legal k={legal} onClose={() => setLegal(null)} onGo={setLegal} /></Suspense>}
    </footer>
  );
}

export default function MyPages({ onViewAll, projects, onOpen, onNew, onImport, onRename, onDuplicate, onPublish, onUnpublish, onDelete, onPreview, onSaveTpl, leads = [], events = [], user = {}, mode = "dash", query = "", onLeads, onAnalytics, onTemplates, onConsult, onUseTpl }) {
  const [filter, setFilter] = useState("All"), [menu, setMenu] = useState(null), [kind, setKind] = useState("all");
  const act = (fn, p) => () => { setMenu(null); fn(p); };
  const nWeb = projects.filter((p) => p.type === "website").length, nLand = projects.length - nWeb;
  const typed = mode === "website" || (mode === "all" && kind === "website") ? projects.filter((p) => p.type === "website") : mode === "landing" || (mode === "all" && kind === "landing") ? projects.filter((p) => p.type !== "website") : projects;
  const matching = typed.filter((p) => (filter === "All" || p.status === filter.toLowerCase()) && (!query || p.name.toLowerCase().includes(query.toLowerCase())));
  const shown = mode === "dash" && !query ? [...matching].sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 3) : matching;

  /* ---------- numbers for the dashboard ---------- */
  const st = useMemo(() => {
    const now = Date.now(), wk = (arr, f) => arr.filter((x) => now - f(x) < 7 * DAY).length, pwk = (arr, f) => arr.filter((x) => now - f(x) >= 7 * DAY && now - f(x) < 14 * DAY).length;
    const views = events.filter((e) => e.t === "view");
    const created = (p) => p.created || p.updated || 0;
    const days = [...Array(7)].map((_, i) => { const d = new Date(now - (6 - i) * DAY); d.setHours(0, 0, 0, 0); const a = d.getTime(), b = a + DAY;
      return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), views: views.filter((e) => e.ts >= a && e.ts < b).length, leads: leads.filter((l) => l.ts >= a && l.ts < b).length }; });
    return {
      total: projects.length, tTotal: wk(projects, created), landing: projects.filter((p) => p.type !== "website").length, website: projects.filter((p) => p.type === "website").length,
      leads: leads.length, tLeads: pct(wk(leads, (l) => l.ts), pwk(leads, (l) => l.ts)), views: views.length, tViews: pct(wk(views, (e) => e.ts), pwk(views, (e) => e.ts)),
      wLeads: wk(leads, (l) => l.ts), wViews: wk(views, (e) => e.ts),
      pub: projects.filter((p) => p.status === "published").length, draft: projects.filter((p) => p.status !== "published").length, dom: projects.filter((p) => p.domain).length,
      days,
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
          <div key={p.id} className="card" onClick={() => onOpen(p.id)} onContextMenu={(e) => { e.preventDefault(); setMenu(p.id); }} title="Click to edit · right-click for more">
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
                <div onClick={() => onOpen(p.id)}>Edit</div>{onPreview && <div onClick={act(onPreview, p)}>↗ Open in new tab</div>}<div onClick={act(onRename, p)}>Rename</div><div onClick={act(onDuplicate, p)}>Duplicate</div>{onSaveTpl && <div onClick={act(onSaveTpl, p)}>★ Save as template</div>}
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
      {mode === "all" && <div className="pj-kinds">{[["all", "All projects", projects.length, "layers"], ["website", "Websites", nWeb, "globe"], ["landing", "Landing pages", nLand, "pages"]].map(([k, l, n, ic]) => (
        <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}><Icon n={ic} s={16} /><b>{l}</b><em>{n}</em></button>))}</div>}
      {list}
    </div>
  );

  return (
    <div onClick={() => setMenu(null)}>
      {/* hero — compact navy banner: text · button in the centre · laptop */}
      <div className="hb">
        <div className="hb-l">
          <span className="hb-pill"><Icon n="sparkle" s={13} /> AI Website &amp; Landing Page Builder</span>
          <h2><span className="hb-w">Create High-Converting</span> <span className="hb-y">Landing Pages &amp; Websites</span></h2>
          <div className="hb-feats">{["Drag & Drop", "Ready Templates", "Mobile Responsive", "Launch in Minutes"].map((c, i) => <span key={c} style={{ "--d": 0.35 + i * 0.08 + "s" }}><i>✓</i>{c}</span>)}</div>
        </div>
        <div className="hb-ctaw">
          <svg className="hb-wave" viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120 C 90 70 150 150 230 100 S 360 40 400 70" /><path d="M0 40 C 80 90 170 20 250 60 S 350 120 400 100" /></svg>
          {[["c1", "🚀", "Landing Pages"], ["c2", "📊", "Analytics"], ["c3", "🌐", "Websites"], ["c4", "👥", "Leads"], ["c5", "🗄", "Domains"], ["c6", "⚡", "Conversions"], ["c7", "📈", "Growth"], ["c8", "☁", "Publish"]].map(([k, ic, t]) => (
            <span key={k} className={"hb-chip " + k} aria-hidden="true"><i>{ic}</i>{t}</span>))}
          {[...Array(8)].map((_, i) => <i key={i} className={"hb-dot d" + i} aria-hidden="true" />)}
          <i className="hb-ray r1" /><i className="hb-ray r2" /><i className="hb-ray r3" /><i className="hb-ray r4" />
          <button className="hb-cta hb-cta2" onClick={() => onNew("landing")}><span>Create New Project</span><b>→</b></button>
        </div>
        <div className="hb-fanwrap" aria-hidden="true"><div className="hx-art hb-fan">
          {[["c1", "#f97316", "Bloom"], ["c2", "#0ea5e9", "Studio"], ["c5", "#ec4899", "Event"], ["c6", "#eab308", "Shop"]].map(([k, c, t]) => (
            <div key={k} className={"hx-card " + k} style={{ "--c": c }}><i /><b>{t}</b><span /><span className="s" /><em /></div>))}
          <div className="hx-lap"><div className="hx-scr"><div className="hx-nav"><i /><i /><i /></div><b>Grow Your <br />Business Online</b><span /><span className="s" /><em>Get started</em><div className="hx-plant" /></div></div>
          <div className="hx-base" /><div className="hx-ai">AI</div>
        </div></div>
      </div>

      {/* stats: light, compact cards — icon tile left, label + number, trend at the bottom */}
      <div className="db-stats fx">
        {[["Total Projects", st.total, "layers", "green", Math.round((st.total / LIMIT) * 100), st.tTotal ? `↑ +${st.tTotal} this week` : `${st.total}/${LIMIT} used`, !!st.tTotal, null],
          ["Landing Pages", st.landing, "pages", "orange", st.total ? Math.round((st.landing / st.total) * 100) : 0, `${st.total ? Math.round((st.landing / st.total) * 100) : 0}% of projects`, false, "landings"],
          ["Websites", st.website, "globe", "blue", st.total ? Math.round((st.website / st.total) * 100) : 0, `${st.total ? Math.round((st.website / st.total) * 100) : 0}% of projects`, false, "websites"],
          ["Total Leads", st.leads, "users", "purple", st.leads ? Math.round((st.wLeads / st.leads) * 100) : 0, st.tLeads ? `${st.tLeads > 0 ? "↑ +" : "↓ "}${Math.abs(st.tLeads)}%` : `+${st.wLeads} this week`, st.tLeads > 0 || (!st.tLeads && st.wLeads > 0), "leads"],
          ["Total Views", st.views, "eye", "pink", st.views ? Math.round((st.wViews / st.views) * 100) : 0, st.tViews ? `${st.tViews > 0 ? "↑ +" : "↓ "}${Math.abs(st.tViews)}%` : `${st.wViews} this week`, st.tViews > 0 || (!st.tViews && st.wViews > 0), "analytics"]].map(([l, v, ic, c, bar, sub, up, go], i) => (
          <div key={l} className={"fx-stat fx-" + c + (go ? " click" : "")} style={{ "--d": i * 0.07 + "s" }} onClick={go === "leads" ? onLeads : go === "analytics" ? onAnalytics : go ? () => onViewAll && onViewAll(go) : undefined}>
            <span className="fx-orb"><Icon n={ic} s={22} /></span>
            <div className="fx-txt"><span className="fx-lbl">{l}</span><b className="fx-num"><CountUp to={v} /></b></div>
            <small className={"fx-sub" + (up ? " up" : "")}>{sub}</small>
            <div className="fx-bar"><i style={{ width: Math.max(6, Math.min(100, bar)) + "%" }} /></div>
          </div>))}
      </div>

      {/* progress · chart · Smart Insights */}
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
        <SmartInsights events={events} leads={leads} onAsk={() => onConsult && onConsult({ tab: "ask", ask: "Why isn't my page performing well?" })} onAnalytics={onAnalytics} />
      </div>

      {/* AI Consultant suggestions · featured templates */}
      <div className="db-row2">
        <AiCard projects={projects} events={events} leads={leads} onConsult={onConsult} onOpen={onOpen} />
        <FeaturedTpl onUse={onUseTpl} onAll={onTemplates} />
      </div>

      <DashFooter onNew={onNew} onGo={(v) => onViewAll && onViewAll(v)} onTemplates={onTemplates} onLeads={onLeads} onAnalytics={onAnalytics} onConsult={onConsult} />
    </div>
  );
}
