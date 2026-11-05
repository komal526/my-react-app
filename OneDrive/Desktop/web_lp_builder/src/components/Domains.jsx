// LaunchBuilder v20 — Domains.jsx
import { useState, useEffect } from "react";
import { addr, HOSTS, cleanDomain, validDomain, dnsRecords, verifyDomain, isApex, rootDomain, ago, serverCall, publishReady, verifyNS, NETLIFY_A, serverOn, phpCall, dnsLookup, HOSTINGER_NS } from "../lib.js";

/* ================= Domains: connect a custom domain (DNS records or nameservers) and verify ================= */
const copy = (t) => (navigator.clipboard ? navigator.clipboard.writeText(t).catch(() => window.prompt("Copy:", t)) : window.prompt("Copy:", t));
const STATUS = { connected: ["published", "✓ Connected"], pending: ["pending", "Waiting for DNS"], none: ["draft", "No custom domain"] };
const Copy = ({ v }) => <button className="xs" onClick={() => copy(v)}>Copy</button>;

function DomainCard({ p, onPatch, onOpen, integ, onSetup, onPublish }) {
  const [open, setOpen] = useState(false), [val, setVal] = useState(p.domain || ""), [busy, setBusy] = useState(""), [err, setErr] = useState(""), [note, setNote] = useState("");
  const nl = p.netlify && p.netlify.name, canServer = !!integ && publishReady(integ);
  const host = nl ? { id: "netlify", a: NETLIFY_A, cname: `${nl}.netlify.app` } : p.domainHost || { id: "vercel", a: HOSTS[0].a, cname: HOSTS[0].cname };
  const preset = HOSTS.find((h) => h.id === host.id) || HOSTS[0], method = nl ? p.domainMethod || "dns" : "dns";
  const recs = dnsRecords(p.domain, host), chk = p.domainCheck, st = STATUS[p.domain ? p.domainStatus || "pending" : "none"];
  const setHost = (o) => onPatch(p.id, { domainHost: { ...host, ...o }, domainStatus: p.domain ? "pending" : "", domainCheck: null });
  const save = async () => {
    const d = cleanDomain(val); setErr(""); setNote("");
    if (!validDomain(d)) return setErr("Enter a domain like mybrand.com or offer.mybrand.com");
    onPatch(p.id, { domain: d, domainHost: host, domainStatus: "pending", domainCheck: null, nsServers: d === p.domain ? p.nsServers : null }); setVal(d);
    if (nl && canServer) {
      setBusy("attach");
      try { await serverCall(integ, { event: "domain", siteId: p.netlify.siteId, domain: d }); setNote(`✓ ${d} added to your Netlify site`); }
      catch (e) { setErr(e.message); }
      setBusy("");
    }
  };
  const remove = async () => {
    if (!window.confirm(`Remove ${p.domain} from this project?`)) return;
    if (nl && canServer) { try { await serverCall(integ, { event: "domain", siteId: p.netlify.siteId, domain: "" }); } catch { /* ignore */ } }
    onPatch(p.id, { domain: "", domainStatus: "", domainCheck: null, nsServers: null }); setVal("");
  };
  const verify = async () => {
    setBusy("verify");
    if (method === "ns") { const r = await verifyNS(p.domain, p.nsServers || []); onPatch(p.id, { domainCheck: { ...r, ns: true }, domainStatus: r.ok ? "connected" : "pending" }); }
    else { const r = await verifyDomain(p.domain, host); onPatch(p.id, { domainCheck: r, domainStatus: r.ok ? "connected" : "pending" }); }
    setBusy("");
  };
  const getNS = async () => {
    setBusy("ns"); setErr("");
    try { const r = await serverCall(integ, { event: "nameservers", siteId: p.netlify.siteId, domain: rootDomain(p.domain) }); onPatch(p.id, { nsServers: r.servers || [] }); }
    catch (e) { setErr(e.message); }
    setBusy("");
  };
  const missing = method === "dns" && recs.some((r) => !r.value);

  return (
    <div className="panel dm">
      <div className="dm-h">
        <div><b>{p.name}</b><div className="mut sm">{p.type === "website" ? `Website · ${p.pages.length} pages` : "Landing page"} · {nl ? "● Live on Netlify" : "Not published yet"}</div></div>
        <div className="grow" />
        <span className={"badge " + st[0]}>{st[1]}</span>
        <button className={open ? "" : "pri"} onClick={() => setOpen(!open)}>{open ? "Close" : p.domain ? "Manage" : "Connect domain"}</button>
      </div>
      <div className="dm-addr">
        <div><span className="mut sm">Free link</span>{nl ? <a href={p.netlify.url} target="_blank" rel="noopener"><code>{nl}.netlify.app ↗</code></a> : <button className="xs" onClick={() => onPublish(p)}>Publish to get a free link</button>}</div>
        {p.domain && <div><span className="mut sm">Custom domain</span><code className="dm-own">{p.domain}</code></div>}
        <div><span className="mut sm">Live address</span><code>{addr(p)}</code></div>
      </div>
      {open && <div className="dm-body">
        {!nl && <div className="dm-tip">💡 <b>Publish first</b> to get a free live link — then this page sets up your domain on the hosting automatically. <button className="xs" onClick={() => onPublish(p)}>Publish now</button></div>}
        <div className="dm-step"><span className="dm-n">1</span><div className="grow">
          <b>Enter your domain</b><p className="mut sm">A main domain (mybrand.com) or a subdomain (offer.mybrand.com). Buy one at GoDaddy, Hostinger, Namecheap or BigRock.</p>
          <div className="row"><input value={val} placeholder="mybrand.com" onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} /><button className="pri" disabled={busy === "attach"} onClick={save}>{busy === "attach" ? "Adding…" : p.domain ? "Update" : "Add domain"}</button>
            {p.domain && <button className="red" onClick={remove}>Remove</button>}</div>
          {note && <p className="green sm">{note}</p>}{err && <p className="red sm">{err}</p>}
          {nl && !canServer && <p className="red sm">Finish <a href="#" onClick={(e) => { e.preventDefault(); onSetup(); }}>Integrations → Publishing</a> so the domain can be added to your hosting automatically.</p>}
        </div></div>
        <div className="dm-step"><span className="dm-n">2</span><div className="grow">
          {nl ? <>
            <b>How do you want to connect it?</b>
            <div className="dm-methods">
              <button className={method === "dns" ? "on" : ""} onClick={() => onPatch(p.id, { domainMethod: "dns", domainCheck: null })}><b>DNS records</b><span>Keep your current DNS provider. Add 1–2 records. Best if you use email on this domain.</span></button>
              <button className={method === "ns" ? "on" : ""} disabled={!isApex(p.domain || "x.com")} onClick={() => onPatch(p.id, { domainMethod: "ns", domainCheck: null })}><b>Nameservers</b><span>{isApex(p.domain || "x.com") ? "Let Netlify manage DNS. Change 4 nameservers once — easiest, auto SSL." : "Only for main domains, not subdomains."}</span></button>
            </div>
          </> : <>
            <b>Where is the site hosted?</b><p className="mut sm">Upload the exported .zip there (Editor → Export). Pick the host so we show the right DNS values.</p>
            <div className="dm-hosts">{HOSTS.map((h) => <button key={h.id} className={host.id === h.id ? "on" : ""} onClick={() => setHost({ id: h.id, a: h.a, cname: h.cname })}>{h.name}</button>)}</div>
            {(preset.askA || preset.ask) && <div className="row dm-in">
              <label>Server IP (A record)<input value={host.a || ""} placeholder="e.g. 185.212.71.10" onChange={(e) => setHost({ a: e.target.value.trim() })} /></label>
              <label>CNAME target{preset.ask ? ` (e.g. ${preset.ask})` : " (optional)"}<input value={host.cname || ""} placeholder={preset.ask || "optional"} onChange={(e) => setHost({ cname: cleanDomain(e.target.value) })} /></label>
            </div>}
            <p className="mut sm">{preset.note}</p>
          </>}
        </div></div>
        {p.domain && method === "dns" && <div className="dm-step"><span className="dm-n">3</span><div className="grow">
          <b>Add these records at your domain provider</b><p className="mut sm">Open your registrar → DNS / Manage DNS → add each record. Delete any old A record on the same host. {isApex(p.domain) ? "" : "Subdomains only need the CNAME."}</p>
          {missing && <p className="red sm">Fill in the server IP / CNAME target in step 2 first.</p>}
          <div className="ltable"><table><thead><tr><th>Type</th><th>Host / Name</th><th>Value / Points to</th><th>TTL</th><th>Status</th></tr></thead><tbody>
            {recs.map((r) => { const c = chk && !chk.ns && chk.checks && chk.checks.find((x) => x.name === r.name && x.type === r.type); return (
              <tr key={r.name + r.type}><td><b>{r.type}</b></td><td><code>{r.host}</code> <Copy v={r.host} /></td>
                <td><code>{r.value || "—"}</code> {r.value && <Copy v={r.value} />}</td><td>Auto</td>
                <td>{!c ? <span className="mut">Not checked</span> : c.ok ? <span className="badge published">✓ Correct</span> : <span className="badge pending" title={c.error || ""}>{c.found.length ? `Points to ${c.found.join(", ")}` : c.error || "Not found yet"}</span>}</td></tr>); })}
          </tbody></table></div>
        </div></div>}
        {p.domain && method === "ns" && <div className="dm-step"><span className="dm-n">3</span><div className="grow">
          <b>Change your nameservers</b><p className="mut sm">At your registrar → your domain → <b>Nameservers → Custom</b> → replace the existing ones with these four. Save.</p>
          {!(p.nsServers && p.nsServers.length) ? <button className="pri" disabled={busy === "ns" || !canServer} onClick={getNS}>{busy === "ns" ? "Getting nameservers…" : "Get my nameservers"}</button>
            : <div className="dm-ns">{p.nsServers.map((x) => <div key={x}><code>{x}</code><Copy v={x} /></div>)}</div>}
          <p className="mut sm">⚠️ Moving nameservers moves all DNS for this domain. If you use email on it (Gmail/Zoho), re-add those MX records in Netlify → Domains → DNS, or use the DNS records option instead.</p>
        </div></div>}
        {p.domain && <div className="dm-step"><span className="dm-n">4</span><div className="grow">
          <b>Verify the connection</b><p className="mut sm">We check the live public DNS. {method === "ns" ? "Nameserver changes can take 1–24 hours." : "New records usually work in 5–30 minutes, sometimes up to 48 hours."}</p>
          <div className="row"><button className="pri" disabled={busy === "verify" || missing || (method === "ns" && !(p.nsServers && p.nsServers.length))} onClick={verify}>{busy === "verify" ? "Checking DNS…" : "Verify now"}</button>
            {chk && <span className={chk.ok ? "green" : "mut"}>{chk.ok ? `✓ Connected — checked ${ago(chk.ts)}` : chk.ns ? `Not yet — nameservers found: ${(chk.found || []).join(", ") || "none"} (${ago(chk.ts)})` : `Not ready yet — checked ${ago(chk.ts)}`}</span>}</div>
          {chk && chk.ok && <div className="dm-ok"><b>Domain connected 🎉</b> {nl ? "Netlify issues the free HTTPS certificate automatically within a few minutes." : "In your host's dashboard, also add the domain so it issues the free SSL certificate."}</div>}
          <div className="row" style={{ marginTop: 10 }}><button onClick={() => onOpen(p.id)}>Open in editor</button><a className="btn" href={`https://${p.domain}`} target="_blank" rel="noopener">Visit https://{p.domain}</a></div>
        </div></div>}
      </div>}
    </div>
  );
}

/* ---------- sites published on your own hosting (lb-server.php) ---------- */
/* one row = one target (whole website or a single page), each with its own domain */
function DomainRow({ label, sub: subLabel, url, folder, obj, onSave, route, integ, onOpen }) {
  const srv = (integ && integ.server) || {};
  const [open, setOpen] = useState(false), [val, setVal] = useState(obj.domain || ""), [where, setWhere] = useState(obj.domainWhere || "hostinger");
  const [busy, setBusy] = useState(""), [err, setErr] = useState(""), [adv, setAdv] = useState(false);
  const [ip, setIpRaw] = useState(() => localStorage.getItem("lb_site_ip") || ""), ipOk = /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
  const setIp = (v) => { const x = v.trim(); setIpRaw(x); localStorage.setItem("lb_site_ip", x); };
  const st = STATUS[obj.domain ? obj.domainStatus || "pending" : "none"], chk = obj.domainCheck || null;
  const d = cleanDomain(val).replace(/^www\./, ""), isSub = d && !isApex(d), subName = isSub ? d.slice(0, -(rootDomain(d).length + 1)) : "offer";
  const C = ({ v }) => <><code>{v}</code> <Copy v={v} /></>;

  /* one button does everything: save → route (parked mode) → copy site into the domain's own website (Add-website mode) → check */
  const check = async (dom = obj.domain) => {
    if (!dom || !serverOn(integ)) return;
    setBusy("check"); let state = "dns";
    try {
      let found = []; try { found = await dnsLookup(dom, "A"); } catch { found = []; }
      const r = await phpCall(srv, { action: "probe", domain: dom });
      if (r.ours && (!r.page || r.page < 400)) state = "live";
      else if (r.site) state = "live";
      else if (r.folder) state = "folder";
      else if (r.code === 403 || r.code === 404) state = "attach";
      else state = found.length ? "attach" : "dns";
      onSave({ domainStatus: state === "live" ? "connected" : "pending", domainCheck: { state, found, ts: Date.now() } });
    } catch (e) { setErr(e.message); }
    setBusy("");
  };
  const connect = async () => {
    setErr("");
    if (!validDomain(d)) return setErr("Type a domain like mybrand.com or offer.mybrand.com");
    if (!serverOn(integ)) return setErr("Publish this website once first — then connect the domain.");
    setVal(d); setBusy("connect");
    onSave({ domain: d, domainWhere: where, domainStatus: "pending", domainCheck: null });
    try {
      await phpCall(srv, { action: "domain", domain: d, ...route });                 // works if the domain is parked
      const r = await phpCall(srv, { action: "deploy", domain: d, ...route });       // works if the domain was added as its own website
      if (r.deployed) onSave({ domainCopy: true });
    } catch (e) { setErr(e.message); }
    setBusy(""); await check(d);
  };
  const remove = async () => {
    if (!window.confirm(`Disconnect ${obj.domain}?`)) return;
    if (serverOn(integ)) { try { await phpCall(srv, { action: "domain", domain: "", ...route }); } catch { /* ignore */ } }
    onSave({ domain: "", domainStatus: "", domainCheck: null, domainCopy: false }); setVal("");
  };
  useEffect(() => { if (open && obj.domain) check(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = chk && chk.state;
  const ADD_SITE = ["Add the domain as a website in Hostinger", <>hPanel → <b>Websites</b> → <b>+ Add website</b> → <b>Empty website</b> (or “Skip, start with an empty site”) → {where === "hostinger" ? <>pick <b>{d || "your domain"}</b></> : <>choose <b>“Use an existing domain”</b> → type <b>{d || "your domain"}</b></>} → finish.
    <div className="row" style={{ marginTop: 8 }}><a className="btn" href="https://hpanel.hostinger.com/websites" target="_blank" rel="noopener">Open hPanel → Websites ↗</a></div></>];
  const GO = ["Press “Connect & check” below", <>LaunchBuilder puts your website on the domain and checks that it opens. When you publish again, the domain updates by itself.</>];
  const STEPS = where === "hostinger" ? [ADD_SITE, GO]
    : where === "ns" ? [
      ["Change the nameservers where you bought the domain", <>At GoDaddy / Namecheap / BigRock… → your domain → <b>Nameservers</b> → <b>Custom</b> → enter these two → Save:<div className="dm-ns" style={{ margin: "8px 0" }}>{HOSTINGER_NS.map((x) => <div key={x}><C v={x} /></div>)}</div><span className="mut sm">Hostinger then manages the DNS for you. Can take a few hours to update.</span></>],
      ADD_SITE, GO]
    : [
      ADD_SITE,
      ["Add 2 DNS records where your domain's DNS is", <>Delete any old <b>A</b> record on <b>@</b> and any <b>CNAME</b> on <b>www</b>, then add:
        <div className="ltable" style={{ margin: "8px 0" }}><table><thead><tr><th>Type</th><th>Name</th><th>Value</th></tr></thead><tbody>
          <tr><td><b>A</b></td><td><C v="@" /></td><td>{ipOk ? <C v={ip} /> : <span>your Website IP ↓</span>}</td></tr>
          <tr><td><b>CNAME</b></td><td><C v="www" /></td><td><C v={d || "mybrand.com"} /></td></tr></tbody></table></div>
        <div className="dm-ip"><b>Website IP</b><span className="mut sm">hPanel → Websites → <b>{d || "the domain"}</b>'s website → Dashboard → “IP address”</span><input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="e.g. 2.57.91.91" className={ip && !ipOk ? "bad" : ""} /></div></>],
      GO];
  const STATE = {
    live: ["ok", "🎉 Live! " + (obj.domain || "") + " shows this " + (route.page ? "page" : "website") + "."],
    folder: ["warn", "Almost there — the domain exists in Hostinger. Press “Connect & check” to put your website into it."],
    attach: ["warn", "The domain reaches Hostinger, but isn't added as a website yet. Do the step “Add the domain as a website in Hostinger”, then press “Connect & check”."],
    dns: ["wait", "Waiting for the domain to point to Hostinger. " + (where === "hostinger" ? "If you just bought it, wait 10–30 minutes." : "Nameserver changes can take a few hours.") + " Then press “Check again”."],
  };
  return (
    <div className={"dr" + (open ? " open" : "")}>
      <div className="dr-h" onClick={() => setOpen(!open)}>
        <div className="dr-l"><b>{label}</b><span className="mut sm">{subLabel}</span></div>
        <div className="dr-d">{obj.domain ? <><code className="dm-own">{obj.domain}</code><span className={"badge " + st[0]}>{obj.domainStatus === "connected" ? "● Live" : "Setting up"}</span></> : <a href={url} target="_blank" rel="noopener" className="mut sm" onClick={(e) => e.stopPropagation()}>{url.replace(/^https?:\/\//, "")} ↗</a>}</div>
        <button className={obj.domain ? "" : "pri"} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>{open ? "Close" : obj.domain ? "Manage" : "Connect domain"}</button>
      </div>
      {open && <div className="dm-body cw">
        <div className="cw-field"><label>Your domain</label>
          <div className="row"><input value={val} placeholder="mybrand.com  or  offer.mybrand.com" onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && connect()} />
            {obj.domain && <button className="red" onClick={remove}>Disconnect</button>}</div></div>
        <div className="cw-field"><label>How do you want to connect it?</label>
          <div className="dm-kind cw-3">{[["hostinger", "🟢 Bought on Hostinger", "Easiest — 2 steps"], ["ns", "Elsewhere — Nameservers", "GoDaddy, Namecheap… · simple"], ["dns", "Elsewhere — DNS records", "Keep your DNS · for email users"]].map(([k, l, ex]) => <button key={k} className={where === k ? "on" : ""} onClick={() => setWhere(k)}><b>{l}</b><span>{ex}</span></button>)}</div></div>
        <ol className="cw-steps">{STEPS.map(([t, body], i) => <li key={i}><span className="dm-n">{i + 1}</span><div><b>{t}</b><div className="mut">{body}</div></div></li>)}</ol>
        <div className="cw-go"><button className="pri big" disabled={!!busy || !d} onClick={connect}>{busy === "connect" ? "Connecting…" : busy === "check" ? "Checking…" : obj.domain ? "Connect & check again" : "Connect & check"}</button>
          {obj.domain && <button disabled={!!busy} onClick={() => check()}>Check again</button>}</div>
        {err && <div className="cw-st bad">✕ {err}</div>}
        {state && STATE[state] && <div className={"cw-st " + STATE[state][0]}>{STATE[state][1]} <span className="mut sm">({ago(chk.ts)})</span>
          {state === "live" && <div className="row" style={{ marginTop: 8 }}><a className="btn pri" href={`http://${obj.domain}`} target="_blank" rel="noopener">Open {obj.domain} ↗</a><span className="mut sm">“Not secure”? Hostinger adds free SSL within ~30 min — or hPanel → Security → SSL.</span></div>}</div>}

        <button className="link cw-adv" onClick={() => setAdv(!adv)}>{adv ? "▾" : "▸"} Advanced: park the domain on the builder instead</button>
        {adv && <div className="cw-advbox">
          <p className="mut sm"><b>Park on the builder's site</b> (instead of adding a website): hPanel → Websites → {(srv.base || "").replace(/^https?:\/\//, "") || "your builder's site"} → Domains → Parked domains → add <C v={d || "mybrand.com"} />. Routing is already done.</p>
          {isSub && <p className="mut sm"><b>Subdomain</b>: hPanel → Domains → Subdomains → name <C v={subName} /> → custom folder <C v={folder.replace(/^public_html\//, "")} />.</p>}
        </div>}
        {onOpen && <div className="row" style={{ marginTop: 6 }}><button onClick={onOpen}>Open in editor</button></div>}
      </div>}
    </div>
  );
}

function ServerCard({ p, onPatch, onPatchPage, onOpen, integ, onSetup }) {
  const folder = p.host.folder || `public_html/sites/${p.host.slug}`, base = p.host.url.replace(/\/$/, "");
  const multi = p.type === "website" && p.pages.length > 1;
  return (
    <div className="panel dm">
      <div className="dm-h"><div><b>{p.name}</b><div className="mut sm">● Live on your hosting · {p.pages.length} page{p.pages.length > 1 ? "s" : ""}</div></div><div className="grow" />
        <a className="btn" href={p.host.url} target="_blank" rel="noopener">Open site ↗</a></div>
      <div className="dr-list">
        <DomainRow label={multi ? "Whole website" : "This page"} sub={multi ? "Home page + all pages and menus" : p.pages[0].name} url={p.host.url} folder={folder}
          obj={p} onSave={(o) => onPatch(p.id, o)} route={{ slug: p.host.slug }} integ={integ} onSetup={onSetup} onOpen={() => onOpen(p.id)} />
        {multi && p.pages.filter((x) => x.file !== "index.html").map((pg) => (
          <DomainRow key={pg.id} label={pg.name} sub={"Only this page · " + pg.file} url={`${base}/${pg.file}`} folder={`${folder}/p/${pg.file.replace(/\.html$/, "")}`}
            obj={pg} onSave={(o) => onPatchPage(p.id, pg.id, o)} route={{ slug: p.host.slug, page: pg.file }} integ={integ} onSetup={onSetup} onOpen={() => onOpen(p.id)} />))}
      </div>
      {multi && <p className="mut sm" style={{ margin: "10px 2px 0" }}>Tip: give a landing page its own domain (e.g. <b>offer.mybrand.com</b> → Offer page) while the main domain shows the whole website. Republish after adding new pages.</p>}
    </div>
  );
}

export default function Domains({ projects, onPatch, onPatchPage, onOpen, integ, onSetup, onPublish }) {
  return (
    <>
      <div className="top"><div><h1>Domains</h1><p className="mut">Every website — and every single page — can have its own domain or subdomain. Connect with DNS records or nameservers.</p></div></div>
      <div className="stats">
        <div className="stat"><span>Live sites</span><b>{projects.filter((p) => p.netlify || p.host).length}</b></div>
        <div className="stat"><span>Custom domains</span><b>{projects.filter((p) => p.domain).length}</b></div>
        <div className="stat"><span>Connected</span><b>{projects.filter((p) => p.domainStatus === "connected").length}</b></div>
      </div>
      {!projects.length ? <div className="empty"><b>No projects yet</b><p className="mut">Create a page or website first, then publish and connect a domain.</p></div>
        : projects.map((p) => p.host ? <ServerCard key={p.id} p={p} onPatch={onPatch} onPatchPage={onPatchPage} onOpen={onOpen} integ={integ} onSetup={onSetup} /> : <DomainCard key={p.id} p={p} onPatch={onPatch} onOpen={onOpen} integ={integ} onSetup={onSetup} onPublish={onPublish} />)}
    </>
  );
}
