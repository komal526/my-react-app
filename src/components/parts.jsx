// LaunchBuilder v29 — parts.jsx
// Shared pieces: Modal, Thumb, Sidebar, NewModal, PublishModal, Preview
import { useState, useEffect, useMemo, useRef } from "react";
import { LIMIT, slugify, TEMPLATES, loadProjects, readToken, addLead, previewUrl, addEvent, findForm, payLead, loadInteg, aiWebsite, AI_PROVIDERS, pg, ago, serverCall, publishReady, blobToBase64, serverOn, phpCall, filesForServer, defaultServerUrl, lovableUrl, boltText, autoServer, findEvent, serverUrlFrom, SERVER_HELP, subUrl, pixelsFor, asTemplate } from "../lib.js";
import { finalize, formPageHtml, buildSite, makeZip, bookingPageHtml } from "./tools.js";
import { cloudOn, lastStatus } from "../cloud.js";
/* small "saved to cloud" indicator in the sidebar */
function CloudStatus() {
  const [st, setSt] = useState(lastStatus.s), [why, setWhy] = useState(lastStatus.why);
  useEffect(() => { const f = (e) => { setSt(e.detail); setWhy(lastStatus.why || ""); }; window.addEventListener("lb-cloud", f); return () => window.removeEventListener("lb-cloud", f); }, []);
  if (!cloudOn()) return null;
  const M = { saved: ["☁", "Saved to cloud"], saving: ["⟳", "Saving…"], loading: ["⟳", "Loading…"], offline: ["⚠", "Not saved to cloud"] }[st] || ["☁", "Saved to cloud"];
  return <div className={"cloud-st " + st}><div><span>{M[0]}</span> {M[1]}</div>{st === "offline" && why && <small>{why}</small>}</div>;
}
import { Icon } from "./Inspector.jsx";

/* ==================== Modal, Thumb, Sidebar, NewModal, PublishModal ==================== */
// Shared pieces: Modal, Thumb, Sidebar, NewModal, PublishModal


export function Modal({ children, onClose }) {
  return <div className="ov" onClick={onClose}><div className="md" onClick={(e) => e.stopPropagation()}>{children}</div></div>;
}

// Small live preview of a page (no scripts run inside it)
export function Thumb({ html }) {
  return <div className="thumb"><iframe title="preview" srcDoc={html} sandbox="" tabIndex={-1} /></div>;
}


const NAV = [["pages", "grid", "Dashboard"], ["templates", "card", "Templates"], ["forms", "form", "Forms"], ["calendar", "calendar", "Calendar"], ["leads", "inbox", "Leads"], ["analytics", "chart", "Analytics"], ["domains", "globe", "Domains"], ["integrations", "share", "Integrations"], ["settings", "gear", "Settings"]];

/* grouped menu · collapses to an icon-only rail */
const SHORT = { build: "Build", collect: "Collect", grow: "Grow", reports: "Reports" };
const GROUPS = [
  ["build", "layers", "Build & Manage", [["websites", "globe", "Websites"], ["landings", "pages", "Landing Pages"], ["templates", "card", "Templates"]]],
  ["collect", "form", "Create & Collect", [["forms", "form", "Forms"], ["calendar", "calendar", "Calendar"], ["leads", "users", "Leads"]]],
  ["grow", "share", "Connect & Grow", [["domains", "share", "Domains"], ["integrations", "apps", "Integrations"]]],
  ["reports", "gear", "Reports & Settings", [["analytics", "chart", "Analytics"], ["pixels", "eye", "Tracking Pixels"], ["settings", "gear", "Settings"]]],
];
export function Sidebar({ view, onView, count, user, onLogout, badges = {}, open = false, onClose = () => {}, mini = false, onMini = () => {} }) {
  const [shut, setShut] = useState(() => { try { return JSON.parse(localStorage.getItem("lb_nav_shut") || "[]"); } catch { return []; } }), [fly, setFly] = useState("");
  const toggle = (g) => { const n = shut.includes(g) ? shut.filter((x) => x !== g) : [...shut, g]; setShut(n); localStorage.setItem("lb_nav_shut", JSON.stringify(n)); };
  const go = (k) => { onView(k); onClose(); };
  const isOn = (k) => view === k || (k === "pages" && view === "import");
  const Item = ({ k, ic, nm, sub }) => (
    <div className={"sb3-item" + (sub && !mini ? " sub" : "") + (isOn(k) ? " on" : "")} onClick={() => go(k)} title={mini ? nm : undefined}>
      {sub && !mini ? <i className="sb3-node" /> : <Icon n={ic} s={17} />}<span className="sb3-l">{nm}</span>{badges[k] ? <em className="sb3-b">{badges[k]}</em> : null}
    </div>);
  return (
    <nav className={"sb3" + (open ? " open" : "") + (mini ? " mini" : "")}>
      <button className="nv-x" onClick={onClose} aria-label="Close menu">✕</button>
      <div className="sb3-top">
        <span className="sb3-logo"><Icon n="logo" s={17} w={2.2} /></span>
        <div className="sb3-name"><b>LaunchBuilder</b><small>Studio</small></div>
        <button className="sb3-mini" onClick={onMini} title={mini ? "Expand menu" : "Collapse menu"} aria-label="Toggle menu"><Icon n={mini ? "chev" : "back"} s={15} /></button>
      </div>
      {mini ? <div className="sb3-scroll sb3-rail" onMouseLeave={() => setFly("")}>
        {/* collapsed: main sections with small labels; a panel shows each section's pages */}
        <div className={"sb3-m" + (isOn("pages") ? " on" : "")} onClick={() => go("pages")}><Icon n="grid" s={18} /><small>Dashboard</small></div>
        {GROUPS.map(([g, gic, label, items]) => (
          <div key={g} className={"sb3-mg" + (items.some(([k]) => isOn(k)) ? " on" : "") + (fly === g ? " open" : "")} onMouseEnter={() => setFly(g)}>
            <div className="sb3-m" onClick={() => setFly(fly === g ? "" : g)}><Icon n={gic} s={18} /><small>{SHORT[g]}</small></div>
            <div className="sb3-fly"><b>{label}</b>{items.map(([k, ic, nm]) => (
              <div key={k} className={"sb3-fi" + (isOn(k) ? " on" : "")} onClick={() => { setFly(""); go(k); }}><Icon n={ic} s={15} /><span>{nm}</span>{badges[k] ? <em className="sb3-b">{badges[k]}</em> : null}</div>))}</div>
          </div>))}
      </div> : <div className="sb3-scroll">
        <Item k="pages" ic="grid" nm="Dashboard" />
        {GROUPS.map(([g, gic, label, items]) => {
          const closed = !mini && shut.includes(g) && !items.some(([k]) => isOn(k));
          return <div key={g} className={"sb3-grp" + (closed ? " shut" : "")}>
            {!mini ? <button className="sb3-gh" onClick={() => toggle(g)}><Icon n={gic} s={16} /><span>{label}</span><Icon n="chevd" s={12} className={closed ? "rot" : ""} /></button> : <div className="sb3-sep" />}
            {!closed && <div className={mini ? "" : "sb3-tree"}>{items.map(([k, ic, nm]) => <Item key={k} k={k} ic={ic} nm={nm} sub />)}</div>}
          </div>;
        })}
      </div>}
      <button className="sb3-up" onClick={() => go("settings")} title={mini ? `Upgrade to Pro · ${count}/${LIMIT} projects` : undefined}>
        <span className="sb3-crown">👑</span><span className="sb3-l"><b>Upgrade to Pro</b><small>{count}/{LIMIT} projects used</small></span></button>
      <CloudStatus />
      <div className="sb3-user" title={mini ? user.email : undefined}><span className="av">{(user.name || "U")[0].toUpperCase()}</span>
        <span className="sb3-l"><b>{user.name}</b><small>{user.email}</small></span>
        <button title="Log out" onClick={onLogout}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg></button></div>
    </nav>
  );
}

const AI_IDEAS = ["AI ad-creation workshop for beginners, ₹21 registration, Hindi + English audience, dark modern style", "Dental clinic in Hamirpur: services, doctors, timings, book appointment form, Google map", "Digital marketing agency: services, case studies, pricing plans, contact form", "Online yoga classes: batches, trainer bio, testimonials, WhatsApp signup"];
export function NewModal({ onCreate, onImport, onClose, ai, onSetupAI, kind = "landing", mine = [] }) {
  const [type, setType] = useState(kind), [name, setName] = useState(""), [t, setT] = useState(0), [src, setSrc] = useState("tpl");
  const [brief, setBrief] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const list = [...TEMPLATES.filter((x) => x.type === type && x.hidden).sort((a, b) => (/^blank/.test(b.key) ? 1 : 0) - (/^blank/.test(a.key) ? 1 : 0)), ...mine.map(asTemplate).filter((x) => x.type === type), ...TEMPLATES.filter((x) => x.type === type && !x.hidden)];
  const prov = AI_PROVIDERS.find((p) => p.id === (ai && ai.provider)) || AI_PROVIDERS[0], hasKey = ai && ai.keys && ai.keys[prov.id];
  const gen = async () => {
    if (brief.trim().length < 15) return setErr("Describe your business in a sentence or two (what, who for, what you want visitors to do).");
    setErr(""); setBusy(true);
    try {
      const n = name.trim() || brief.trim().split(/[,.:]/)[0].slice(0, 40) || "AI website";
      const pages = await aiWebsite(ai, `Business / page name: ${n}\nBrief: ${brief.trim()}`, type === "website");
      onCreate(n, pages.map((p) => pg(p.name, p.file, p.html)), type);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <Modal onClose={busy ? () => {} : onClose}>
      <h3>Create new</h3>
      <div className="opts">
        <div className={"opt" + (type === "landing" ? " on" : "")} onClick={() => { setType("landing"); setT(0); }}><b>Landing page</b><span>One focused page: offer, signup, webinar, waitlist.</span></div>
        <div className={"opt" + (type === "website" ? " on" : "")} onClick={() => { setType("website"); setT(0); }}><b>Website</b><span>Several pages (Home, About, Contact…) with a shared menu.</span></div>
      </div>
      <label>Name<input autoFocus value={name} placeholder="e.g. Autumn Sale Offer" onChange={(e) => setName(e.target.value)} /></label>
      <div className="chips nm-src"><button className={src === "tpl" ? "on" : ""} onClick={() => setSrc("tpl")}>Start from a template</button><button className={src === "ai" ? "on" : ""} onClick={() => setSrc("ai")}>✨ Create with AI</button></div>
      {src === "tpl" ? <div className="opts">{list.map((x, i) => <div key={x.name} className={"opt" + (t === i ? " on" : "")} onClick={() => setT(i)}><b>{x.name}</b><span>{x.note}</span></div>)}</div> : <div className="nm-ai">
        {!hasKey && <div className="nm-warn">Connect an AI first (Claude, ChatGPT, Gemini or DeepSeek) with your own API key. <button className="pri" onClick={onSetupAI}>Open Integrations</button></div>}<>
          <label>Describe the {type === "website" ? "website" : "page"}<textarea rows={4} value={brief} disabled={busy} onChange={(e) => setBrief(e.target.value)} placeholder="What is it, who is it for, what should visitors do (register, call, buy)? Mention price, city, language, colours, sections you want…" /></label>
          <div className="nm-ideas">{AI_IDEAS.map((x) => <button key={x} disabled={busy} onClick={() => setBrief(x)}>{x.slice(0, 48)}…</button>)}</div>
          <div className="nm-hand"><span className="mut sm">Or build it in:</span>
            <a className="btn" href={lovableUrl(brief || "A modern landing page")} target="_blank" rel="noopener">Lovable ↗</a>
            <button onClick={() => { navigator.clipboard.writeText(boltText(brief || "A modern landing page")).catch(() => {}); window.open("https://bolt.new", "_blank"); }}>Copy prompt &amp; open Bolt ↗</button>
            <span className="mut sm">then download its index.html and use <b>Import HTML</b>.</span></div>
          {hasKey && <p className="mut">Using <b>{prov.name}</b> · {(ai.models || {})[prov.id] || prov.model}. {type === "website" ? "Creates 3–5 linked pages." : "Creates one landing page."} Takes about 20–90 seconds. You can edit everything afterwards.</p>}
        </>
        {err && <p className="red">{err}</p>}
      </div>}
      <div className="mrow"><button onClick={onImport} disabled={busy}>Import HTML instead</button><div className="grow" /><button onClick={onClose} disabled={busy}>Cancel</button>
        {src === "tpl" ? <button className="pri" onClick={() => { const n = name.trim() || "Untitled"; onCreate(n, list[t].make(n), type); }}>Create</button>
          : <button className="pri" disabled={busy || !hasKey} onClick={gen}>{busy ? "✨ Generating… please wait" : "✨ Generate"}</button>}</div>
    </Modal>
  );
}


export function PublishModal({ page, onDone, onClose, integ, onSetup, onDomains, onInteg }) {
  const srvOk = serverOn(integ), netOk = !!integ && publishReady(integ);
  const [dest, setDest] = useState(page.host ? "server" : page.netlify ? "netlify" : srvOk ? "server" : netOk ? "netlify" : "");
  /* your own hosting connects by itself the first time (no setup screen) */
  const [auto, setAuto] = useState(srvOk ? "ok" : "checking"), [pkey, setPkey] = useState(""), [rurl, setRurl] = useState(""), [rbusy, setRbusy] = useState(false), [diag, setDiag] = useState(null), [ownDiag, setOwnDiag] = useState("");
  /* publish from anywhere (even localhost) to your Hostinger: just type its address */
  const connectRemote = async () => {
    const url = serverUrlFrom(rurl); if (!url) return;
    setErr(""); setDiag(null); setRbusy(true);
    const a = await autoServer(integ, onInteg, url);
    setRbusy(false);
    if (a.ok) { setAuto("ok"); setDest("server"); }
    else if (a.reason === "key") { onInteg({ ...integ, server: { ...(integ.server || {}), url, ok: false } }); setAuto("key"); }
    else setDiag({ url, text: SERVER_HELP[a.diag] || SERVER_HELP.missing });
  };
  useEffect(() => {
    if (srvOk || !onInteg) { if (!srvOk) setAuto("none"); return; }
    autoServer(integ, onInteg).then((a) => { setAuto(a.ok ? "ok" : a.reason); setOwnDiag(a.diag || ""); if (a.ok && !page.netlify) setDest("server"); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const useKey = async () => {
    setErr("");
    try { const url = serverUrlFrom(rurl) || (integ.server && integ.server.url) || defaultServerUrl(), r = await phpCall({ url, key: pkey.trim() }, { action: "ping" }); onInteg({ ...integ, server: { url, key: pkey.trim(), ok: true, ip: r.ip || "", base: r.base || "" } }); setAuto("ok"); setDest("server"); }
    catch (e) { setErr(e.message); }
  };
  const [busy, setBusy] = useState(""), [err, setErr] = useState(""), [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState((page.host && page.host.slug) || slugify(page.slug || page.name) || "my-site");
  const [target, setTarget] = useState("new"), [sites, setSites] = useState(null), [siteId, setSiteId] = useState("");
  const own = page.domain && page.domainStatus === "connected" ? "https://" + page.domain : "";
  const liveUrl = dest === "server" ? page.host && (subUrl(integ, page.host.slug) || page.host.url) : page.netlify && page.netlify.url;
  const sd = integ && integ.server && integ.server.sitesDomain;
  const url = own || liveUrl;
  const base = ((integ && integ.server && integ.server.base) || location.origin).replace(/\/$/, "");
  const versions = [...(page.versions || []), { ts: Date.now(), pages: page.pages }].slice(-5);
  const run = async (fn) => { setErr(""); try { await fn(); } catch (e) { setErr(e.message); } setBusy(""); };
  const pubServer = () => run(async () => {
    const sl = slugify(slug); if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(sl)) throw new Error("Link name: use 2+ lowercase letters, numbers or dashes.");
    setBusy("Building your pages…");
    const files = await buildSite(page.pages, own || `${base}/sites/${sl}`, { leadUrl: (integ.server.url || defaultServerUrl()), site: sl, pixels: pixelsFor(integ, page) });
    const payload = filesForServer(files), size = payload.reduce((n, f) => n + f.b64.length, 0);
    if (size > 60e6) throw new Error("Your site is bigger than 45 MB. Use smaller videos or YouTube links.");
    setBusy("Uploading to your hosting…");
    const r = await phpCall(integ.server, { action: "publish", slug: sl, files: payload });
    onDone({ status: "published", host: { slug: sl, url: r.url, folder: r.folder, ts: Date.now() }, versions }, true);
  });
  const unpublish = () => { if (window.confirm("Take this site offline? The link will stop working.")) run(async () => { setBusy("Taking it offline…"); await phpCall(integ.server, { action: "unpublish", slug: page.host.slug }); onDone({ status: "draft", host: null }, true); }); };
  const pubNetlify = () => run(async () => {
    setBusy("Building your pages…");
    const zip = makeZip(await buildSite(page.pages, url || "", { pixels: pixelsFor(integ, page) }));
    if (zip.size > 35e6) throw new Error("Your site is bigger than 35 MB. Use smaller videos or YouTube links, then try again.");
    setBusy("Uploading to Netlify…");
    const r = await serverCall(integ, { event: "publish", siteId: (page.netlify && page.netlify.siteId) || (target === "existing" ? siteId : undefined), zip: await blobToBase64(zip) });
    onDone({ status: "published", netlify: { siteId: r.siteId, name: r.name, url: r.url, admin: r.admin, ts: Date.now() }, versions }, true);
  });
  const loadSites = async () => { setSites("loading"); try { const r = await serverCall(integ, { event: "sites" }); setSites(r.sites || []); } catch (e) { setSites([]); setErr(e.message); } };
  const copy = () => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }, () => window.prompt("Copy:", url));
  const live = <div className="pub-live">
    <span className="badge published">● Live — anyone can open it</span>
    <a className="pub-url" href={url} target="_blank" rel="noopener">{url && url.replace(/^https?:\/\//, "")} ↗</a>
    <p className="mut">Last published {ago(((dest === "server" ? page.host : page.netlify) || {}).ts || Date.now())}. Edits appear after you click Update.</p>
    <div className="mrow" style={{ marginTop: 6 }}><button onClick={copy}>{copied ? "✓ Copied" : "Copy link"}</button><a className="btn" href={url} target="_blank" rel="noopener">Open site</a>
      {dest === "server" && <button className="red" onClick={unpublish}>Unpublish</button>}<div className="grow" /><button className="pri" onClick={dest === "server" ? pubServer : pubNetlify}>Update live site</button></div>
    {dest === "server" && integ.server && <details className="pub-adv"><summary>Hosting key (to publish from another computer)</summary><div className="row"><code>{integ.server.key}</code><button className="xs" onClick={() => navigator.clipboard.writeText(integ.server.key)}>Copy</button></div></details>}
    <div className="pub-dom"><div><b>{own ? "✓ Custom domain connected" : "Connect a domain or subdomain"}</b><span className="mut">{own ? page.domain : "e.g. mybrand.com or offer.mybrand.com"}</span></div><button onClick={onDomains}>{own ? "Manage" : "Connect domain →"}</button></div>
  </div>;
  return (
    <Modal onClose={busy ? () => {} : onClose}>
      <div className="pub-h"><span className="pub-ic">🚀</span><div><h3>Publish {page.type === "website" ? "website" : "page"}</h3><p className="mut">{page.name} · {page.pages.length} page{page.pages.length > 1 ? "s" : ""}</p></div></div>
      {!srvOk && !netOk ? <div className="pub-setup">
        {auto === "checking" ? <div className="pub-busy" style={{ border: 0, padding: 10 }}><span className="pub-spin" /><b>Connecting to your hosting…</b></div>
          : auto === "key" ? <>
            <b>Your hosting was connected earlier from another browser</b>
            <p className="mut">From now on this is automatic — the connection comes from your LaunchBuilder login. Just do this once:</p>
            <div className="pub-fix">
              <div><span className="dm-n">1</span><div><b>Reset the old connection (1 minute)</b>
                <p className="mut sm">hPanel → <b>Websites</b> → <b>{(serverUrlFrom(rurl) || (integ.server && integ.server.url) || defaultServerUrl()).replace(/^https?:\/\//, "").replace(/\/lb-server\.php$/, "")}</b> → <b>File Manager</b> → open <code>public_html</code> → open <code>lb-data</code> → delete only the file <code>config.json</code>.<br />Your published websites and leads are <b>not</b> touched.</p>
                <a className="btn" href="https://hpanel.hostinger.com/websites" target="_blank" rel="noopener">Open hPanel ↗</a></div></div>
              <div><span className="dm-n">2</span><div><b>Press Connect again</b>
                <div className="row" style={{ marginTop: 6 }}><button className="pri" disabled={rbusy} onClick={async () => { setErr(""); setRbusy(true); const a = await autoServer({ ...integ, server: { ...(integ.server || {}), ok: false } }, onInteg, serverUrlFrom(rurl) || (integ.server && integ.server.url) || defaultServerUrl()); setRbusy(false); if (a.ok) { setAuto("ok"); setDest("server"); } else setErr(a.reason === "key" ? "Still connected to the old key — make sure config.json inside lb-data is deleted, then try again." : SERVER_HELP[a.diag] || "Couldn't connect."); }}>{rbusy ? "Connecting…" : "Connect again"}</button></div></div></div>
            </div>
            <details className="pub-adv"><summary>Or paste the old hosting key instead</summary>
              <p className="mut sm">On the first computer/browser: Publish → (live site) → “Hosting key”.</p>
              <div className="row"><input value={pkey} onChange={(e) => setPkey(e.target.value)} placeholder="lbk_…" style={{ flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 10, font: "inherit" }} /><button disabled={pkey.trim().length < 16} onClick={useKey}>Use key</button></div></details>
          </> : <>
            {location.hostname === "localhost" || location.hostname === "127.0.0.1" ? <>
              <b>You're working on your computer</b>
              <p className="mut">Publishing happens on your live builder. Open your builder's real address (for example <b>https://crecapo.tech</b>) and publish there — or connect it below.</p>
            </> : <>
              <b>Publishing isn't switched on yet</b>
              <p className="mut">This builder needs a one-time server setup by the person who installed it. After that, Publish works in one click — no addresses to type.</p>
              <div className="pub-diag"><b>What's wrong:</b> {{
                missing: "The builder's server file isn't on this server. Upload the latest build (the dist folder) again — it includes it.",
                nophp: "The server can't run PHP yet. Run the VPS setup script once (it installs everything).",
                unreachable: "The builder couldn't reach its own server.",
                blocked: "The server didn't answer. The setup script probably hasn't finished — run it once on the VPS.",
              }[ownDiag] || "The server isn't set up yet. Run the VPS setup script once, then upload the builder."}
                <div className="row" style={{ marginTop: 8 }}><button className="pri" onClick={() => window.location.reload()}>↻ Check again</button><a className="btn" href={defaultServerUrl()} target="_blank" rel="noopener">Test the server ↗</a></div></div>
            </>}
            <details className="pub-adv"><summary>Advanced: publish to a different server</summary>
              <p className="mut sm">Only if your builder files live on another server. This is <b>not</b> where you put a customer's domain — connect domains after publishing, in <b>Domains</b>.</p>
              <div className="row"><input value={rurl} onChange={(e) => setRurl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && connectRemote()} placeholder="e.g. crecapo.tech" style={{ flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 10, font: "inherit" }} />
                <button disabled={!rurl.trim() || rbusy} onClick={connectRemote}>{rbusy ? "Connecting…" : "Connect"}</button></div>
              {diag && <div className="pub-diag" style={{ marginTop: 8 }}><b>Not connected.</b> {diag.text}</div>}
              <div className="pub-tg" style={{ marginTop: 10 }}><button onClick={() => onSetup("host")}><b>▲ Use Netlify instead</b><span>Free external hosting with a link like my-page.netlify.app</span></button></div>
            </details>
          </>}
      </div> : busy ? <div className="pub-busy"><span className="pub-spin" /><b>{busy}</b><p className="mut">Please keep this window open (usually 5–30 seconds).</p></div> : <>
        {srvOk && netOk && !page.host && !page.netlify && <div className="pub-dest">{[["server", "🏠 My hosting"], ["netlify", "▲ Netlify"]].map(([k, l]) => <button key={k} className={dest === k ? "on" : ""} onClick={() => setDest(k)}>{l}</button>)}</div>}
        {liveUrl ? live : dest === "server" ? <div className="pub-first">
          <label className="pub-slug">{sd ? "Your free subdomain" : "Link name"}<div className="pub-urlrow">{sd ? <><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /><span>.{sd}</span></> : <><span>{base.replace(/^https?:\/\//, "")}/sites/</span><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /><span>/</span></>}</div></label>
          <p className="mut" style={{ margin: 0 }}>Anyone with this link can see your site immediately. Later you can connect your own domain or subdomain.</p>
          <button className="pri big" onClick={pubServer}>🚀 Publish now</button>
        </div> : <div className="pub-first">
          <p>Your site goes live at a free link like <code>brave-otter-12ab.netlify.app</code>.</p>
          <div className="pub-tg">
            <button className={target === "new" ? "on" : ""} onClick={() => setTarget("new")}><b>✨ New Netlify site</b><span>Get a fresh free link</span></button>
            <button className={target === "existing" ? "on" : ""} onClick={() => { setTarget("existing"); if (!sites) loadSites(); }}><b>▲ My existing site</b><span>Replace a site you already have</span></button>
          </div>
          {target === "existing" && (sites === "loading" ? <p className="mut">Loading your Netlify sites…</p> : Array.isArray(sites) && (sites.length ? <select value={siteId} onChange={(e) => setSiteId(e.target.value)}><option value="">Choose a site…</option>{sites.map((x) => <option key={x.id} value={x.id}>{x.name} — {(x.domain || x.url || "").replace(/^https?:\/\//, "")}</option>)}</select> : <p className="mut">No sites found on your Netlify account.</p>))}
          <button className="pri big" disabled={target === "existing" && !siteId} onClick={pubNetlify}>🚀 Publish now</button>
        </div>}
      </>}
      {err && <div className="pub-err"><b>Couldn't publish.</b> {err}</div>}
      {!busy && <div className="mrow"><div className="grow" /><button onClick={onClose}>Close</button></div>}
    </Modal>
  );
}

/* ==================== Preview page (temporary link) ==================== */
/* ================= Temporary preview link: #/preview/<token>/<page.html> =================
   Renders the live draft, makes links between pages work, and saves form submissions to Leads. */
const W = { desktop: "100%", tablet: "768px", mobile: "390px" };
const notFound = (file, pages) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f7f6ff;color:#16142b;text-align:center;padding:24px}a{color:#4f46e5;font-weight:600}h1{font-size:64px;margin:0;color:#4f46e5}</style></head><body><div><h1>404</h1><p style="font-size:18px">The link points to <b>${file.replace(/</g, "&lt;")}</b>, which isn't a page in this project.</p><p style="color:#5f5b7d">Pages you have: ${pages.map((p) => `<a href="${p.file}">${p.name}</a>`).join(" · ")}</p><p style="color:#5f5b7d;font-size:14px">Fix it in the editor: select the button or menu item → Link → “Go to a page of this site”.</p></div></body></html>`;

export function Preview({ token, file: initFile }) {
  const info = useMemo(() => readToken(token), [token]);
  const [ver, setVer] = useState(0), [file, setFile] = useState(initFile || "index.html"), [hash, setHash] = useState(""), [dev, setDev] = useState("desktop");
  const [html, setHtml] = useState(""), [note, setNote] = useState(""), [pulse, setPulse] = useState(false);
  const ifr = useRef();
  const proj = useMemo(() => (info && !info.expired ? loadProjects(info.email).find((p) => p.id === info.pid) : null), [info, ver]);
  const pg = proj && proj.pages.find((p) => p.file === file);
  const flash = (t) => { setNote(t); setTimeout(() => setNote(""), 3200); };

  /* live: re-render when the editor saves (other tab) */
  useEffect(() => {
    if (!info) return;
    const f = (e) => { if (e.key === "lb_pages_" + info.email) { setVer((v) => v + 1); setPulse(true); setTimeout(() => setPulse(false), 900); } };
    window.addEventListener("storage", f); return () => window.removeEventListener("storage", f);
  }, [info]);
  useEffect(() => {
    if (!proj) return; let gone = false;
    if (!pg) { setHtml(notFound(file, proj.pages)); return; }
    finalize(pg.html, { mode: "blob", preview: true, page: file, hash }).then((r) => !gone && setHtml(r.html));
    return () => { gone = true; };
  }, [proj, pg, file, hash]);
  useEffect(() => { document.title = proj ? `Preview · ${proj.name}` : "Preview"; }, [proj]);
  /* analytics: one page view each time a page is opened */
  const pid = proj && proj.id;
  useEffect(() => { if (info && !info.expired && pid) addEvent(info.email, { t: "view", pid, page: file, dev: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1025 ? "tablet" : "desktop" }); }, [file, pid, info]);

  /* messages from the page: navigation + leads */
  useEffect(() => {
    const f = (e) => {
      if (!ifr.current || e.source !== ifr.current.contentWindow || !e.data || !e.data.lb) return;
      if (e.data.lb === "nav") {
        const [f0, h0 = ""] = String(e.data.href).split("#"), target = decodeURIComponent((f0 || file).split("?")[0].split("/").pop() || "index.html");
        if (e.data.blank) return window.open(previewUrl(token, target) + (h0 ? "" : ""), "_blank");
        setHash(h0); setFile(target); window.history.pushState(null, "", `#/preview/${token}/${target}`);
      }
      if (e.data.lb === "lead-pay" && info) { payLead(info.email, e.data.lid, e.data.payment); flash(e.data.payment.status === "paid" ? "✓ Payment received — lead marked Paid" : "✓ Payment claim saved to Leads"); }
      if (e.data.lb === "lead" && proj) { addLead(info.email, { ...e.data.lead, projectId: proj.id, projectName: proj.name, source: "preview" }); addEvent(info.email, { t: "lead", pid: proj.id, page: file, form: e.data.lead.form }); flash("✓ Submission saved to Leads"); }
    };
    window.addEventListener("message", f); return () => window.removeEventListener("message", f);
  }, [file, proj, info, token]);
  useEffect(() => {
    const f = () => { const m = location.hash.match(/^#\/preview\/[^/]+\/?(.*)$/); if (m) { setHash(""); setFile(decodeURIComponent(m[1]) || "index.html"); } };
    window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f);
  }, []);

  if (!info || info.expired || !proj) return (
    <div className="pv-dead"><div><Icon n="link" s={34} w={1.4} /><h2>{!info ? "This preview link doesn't exist" : info.expired ? "This preview link has expired" : "This project was deleted"}</h2>
      <p>Open the project in the editor and click <b>Preview</b> to get a fresh link. Preview links work in the browser where you're signed in to LaunchBuilder.</p>
      <a href={location.pathname}>Go to dashboard</a></div></div>
  );
  const hrs = Math.max(0, Math.round((info.exp - Date.now()) / 3600e3));
  const copy = async () => { const u = previewUrl(token, file); try { await navigator.clipboard.writeText(u); flash("Link copied"); } catch { window.prompt("Copy this link", u); } };

  return (
    <div className="pv">
      <div className="pv-bar">
        <div className="pv-l"><span className="pv-logo"><Icon n="logo" s={16} /></span><b>{proj.name}</b>
          <select value={file} onChange={(e) => { setHash(""); setFile(e.target.value); window.history.pushState(null, "", `#/preview/${token}/${e.target.value}`); }}>
            {proj.pages.map((p) => <option key={p.id} value={p.file}>{p.name} — {p.file}</option>)}{!pg && <option value={file}>{file} (missing)</option>}</select>
          <span className={"pv-live" + (pulse ? " pulse" : "")}><i />Live draft</span></div>
        <div className="pv-dev">{Object.keys(W).map((k) => <button key={k} className={dev === k ? "on" : ""} onClick={() => setDev(k)} title={k}><Icon n={k} s={16} /></button>)}</div>
        <div className="pv-r"><span className="pv-exp" title="Preview links are temporary">Link expires in {hrs} h</span><button onClick={copy}><Icon n="link" s={14} /> Copy link</button><button onClick={() => setVer((v) => v + 1)} title="Reload"><Icon n="redo" s={14} /></button></div>
      </div>
      <div className={"pv-stage " + dev}>
        <iframe ref={ifr} title="preview" srcDoc={html} style={{ width: W[dev] }} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" allow="payment; autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write; accelerometer; gyroscope; geolocation" />
      </div>
      {note && <div className="toast pv-toast">{note}</div>}
    </div>
  );
}


/* ==================== Form share link: #/form/<id> ==================== */
export function FormPage({ id }) {
  const found = useMemo(() => findForm(id), [id]);
  const [html, setHtml] = useState(""), [done, setDone] = useState(false), ifr = useRef();
  useEffect(() => { if (found) { finalize(formPageHtml(found.form, loadInteg(found.email)), { mode: "blob", preview: true, page: "form" }).then((r) => setHtml(r.html)); document.title = found.form.name; addEvent(found.email, { t: "fview", formId: id, page: "form link" }); } }, [found, id]);
  useEffect(() => {
    const f = (e) => {
      if (!found || !ifr.current || e.source !== ifr.current.contentWindow || !e.data) return;
      if (e.data.lb === "lead") { addLead(found.email, { ...e.data.lead, formId: id, projectId: "", projectName: "Form link", page: "share link", source: "form-link" }); addEvent(found.email, { t: "lead", formId: id, form: found.form.name }); setDone(true); }
      if (e.data.lb === "lead-pay") payLead(found.email, e.data.lid, e.data.payment);
      if (e.data.lb === "nav" && /^https?:/.test(e.data.href)) location.href = e.data.href;
    };
    window.addEventListener("message", f); return () => window.removeEventListener("message", f);
  }, [found, id]);
  if (!found) return <div className="pv-dead"><div><h2>This form isn't available</h2><p>The link may be wrong, or the form was deleted. Form links work in the browser where the form was created until a backend is added.</p></div></div>;
  return <div className="fpage"><iframe ref={ifr} title={found.form.name} srcDoc={html} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" allow="payment" />{done && <div className="toast pv-toast">✓ Submission saved to Leads</div>}</div>;
}


/* ==================== Booking link (this browser): #/book/<id> ==================== */
export function BookPage({ id }) {
  const found = useMemo(() => findEvent(id), [id]);
  const [html, setHtml] = useState(""), ifr = useRef();
  useEffect(() => { if (found) { finalize(bookingPageHtml(found.ev, loadInteg(found.email)), { mode: "blob", preview: true, page: "booking" }).then((r) => setHtml(r.html)); document.title = found.ev.name; } }, [found]);
  useEffect(() => {
    const f = (e) => {
      if (!found || !ifr.current || e.source !== ifr.current.contentWindow || !e.data) return;
      if (e.data.lb === "lead") addLead(found.email, { ...e.data.lead, formId: id, projectId: "", projectName: "Booking link", page: "booking link", source: "booking-link" });
      if (e.data.lb === "lead-pay") payLead(found.email, e.data.lid, e.data.payment);
    };
    window.addEventListener("message", f); return () => window.removeEventListener("message", f);
  }, [found, id]);
  if (!found) return <div className="pv-dead"><div><h2>This booking link isn't available</h2><p>Ask the organiser for the public booking link.</p></div></div>;
  return <div className="fpage"><iframe ref={ifr} title={found.ev.name} srcDoc={html} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" allow="payment" /></div>;
}
