// LaunchBuilder v13 — Domains.jsx
import { useState } from "react";
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
function DomainRow({ label, sub: subLabel, url, folder, obj, onSave, route, integ, onSetup, onOpen }) {
  const [open, setOpen] = useState(false), [kind, setKind] = useState(obj.domain && !isApex(obj.domain) ? "sub" : "domain");
  const [val, setVal] = useState(obj.domain || ""), [busy, setBusy] = useState(""), [err, setErr] = useState(""), [note, setNote] = useState(""), [ns, setNs] = useState(false);
  const srv = (integ && integ.server) || {}, ip = srv.ip || "", st = STATUS[obj.domain ? obj.domainStatus || "pending" : "none"], chk = obj.domainCheck;
  const d = cleanDomain(val).replace(/^www\./, ""), sub = d && !isApex(d) ? d.slice(0, -(rootDomain(d).length + 1)) : "offer";
  const save = async () => {
    setErr(""); setNote("");
    if (!validDomain(d)) return setErr("Type a domain like mybrand.com or offer.mybrand.com");
    const k = isApex(d) ? "domain" : "sub"; setKind(k); setVal(d);   // detect automatically — no wrong-tab errors
    onSave({ domain: d, domainStatus: "pending", domainCheck: null });
    if (!serverOn(integ)) { setNote(`✓ Saved ${d}. Publish this site once so it can be routed.`); return; }
    setBusy("route");
    try { await phpCall(srv, { action: "domain", domain: d, ...route }); setNote(`✓ ${d} is connected to this ${route.page ? "page" : "website"}. It opens as soon as the domain points to your hosting (steps below).`); }
    catch (e) { setNote(`✓ Saved ${d}.`); setErr("Routing on the server didn't go through: " + e.message); }
    setBusy("");
  };
  const remove = async () => {
    if (!window.confirm(`Disconnect ${obj.domain}?`)) return;
    if (serverOn(integ)) { try { await phpCall(srv, { action: "domain", domain: "", ...route }); } catch { /* ignore */ } }
    onSave({ domain: "", domainStatus: "", domainCheck: null }); setVal("");
  };
  const verify = async () => {
    setBusy("verify"); let ok = false, found = [];
    if (ns) { const r = await verifyNS(obj.domain, HOSTINGER_NS); ok = r.ok; found = r.found; }
    else { try { found = await dnsLookup(obj.domain, "A"); ok = found.length > 0 && (!ip || found.includes(ip)); } catch { found = []; } }
    onSave({ domainCheck: { ok, found, ts: Date.now(), ns }, domainStatus: ok ? "connected" : "pending" }); setBusy("");
  };
  const C = ({ v }) => <><code>{v}</code> <Copy v={v} /></>;
  return (
    <div className={"dr" + (open ? " open" : "")}>
      <div className="dr-h" onClick={() => setOpen(!open)}>
        <div className="dr-l"><b>{label}</b><span className="mut sm">{subLabel}</span></div>
        <div className="dr-d">{obj.domain ? <><code className="dm-own">{obj.domain}</code><span className={"badge " + st[0]}>{st[1]}</span></> : <a href={url} target="_blank" rel="noopener" className="mut sm" onClick={(e) => e.stopPropagation()}>{url.replace(/^https?:\/\//, "")} ↗</a>}</div>
        <button className={obj.domain ? "" : "pri"} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>{open ? "Close" : obj.domain ? "Manage" : "Connect domain"}</button>
      </div>
      {open && <div className="dm-body">
        <div className="dm-kind">{[["domain", "Domain", "mybrand.com"], ["sub", "Subdomain", "offer.mybrand.com"]].map(([k, l, ex]) => <button key={k} className={kind === k ? "on" : ""} onClick={() => { setKind(k); setErr(""); setNote(""); }}><b>{l}</b><span>{ex}</span></button>)}</div>
        <div className="dm-step"><span className="dm-n">1</span><div className="grow"><b>Type your domain or subdomain</b> <span className="mut sm">— we detect which one it is</span>
          <div className="row" style={{ marginTop: 8 }}><input value={val} placeholder="mybrand.com or offer.mybrand.com" onChange={(e) => { setVal(e.target.value); const c = cleanDomain(e.target.value).replace(/^www\./, ""); if (validDomain(c)) setKind(isApex(c) ? "domain" : "sub"); }} onKeyDown={(e) => e.key === "Enter" && save()} />
            <button className="pri" disabled={busy === "route"} onClick={save}>{busy === "route" ? "Connecting…" : obj.domain ? "Update" : "Connect"}</button>{obj.domain && <button className="red" onClick={remove}>Disconnect</button>}</div>
          {note && <p className="green sm">{note}</p>}{err && <p className="red sm">{err}</p>}</div></div>
        {kind === "sub" ? <div className="dm-step"><span className="dm-n">2</span><div className="grow"><b>Create the subdomain in Hostinger</b>
          <p className="mut sm">hPanel → <b>Domains → Subdomains</b> → name <C v={sub} /> → tick <b>Custom folder for subdomain</b> → folder <C v={folder.replace(/^public_html\//, "")} /> → <b>Create</b>.</p>
          <p className="mut sm">Main domain's DNS somewhere else (GoDaddy, Namecheap…)? Add there: <b>A</b> record, host <C v={sub} />, value <C v={ip || "your server IP (hPanel → Hosting → Details)"} />.</p></div></div>
        : <>
          <div className="dm-step"><span className="dm-n">2</span><div className="grow"><b>Point the domain to your hosting — pick one</b>
            <div className="dm-methods" style={{ marginTop: 8 }}>
              <button className={!ns ? "on" : ""} onClick={() => setNs(false)}><b>DNS records</b><span>Keep your DNS where it is — add 2 records</span></button>
              <button className={ns ? "on" : ""} onClick={() => setNs(true)}><b>Nameservers</b><span>Easiest — change 2 nameservers once</span></button></div>
            {ns ? <div className="dm-ns" style={{ marginTop: 10 }}>{HOSTINGER_NS.map((x) => <div key={x}><C v={x} /></div>)}<p className="mut sm">At your registrar → Nameservers → Custom → enter these two → Save.</p></div>
              : <div className="ltable" style={{ marginTop: 10 }}><table><thead><tr><th>Type</th><th>Host</th><th>Points to</th></tr></thead><tbody>
                <tr><td><b>A</b></td><td><C v="@" /></td><td>{ip ? <C v={ip} /> : <span className="mut">Server IP from hPanel → Hosting → Details</span>}</td></tr>
                <tr><td><b>CNAME</b></td><td><C v="www" /></td><td><C v={d || "mybrand.com"} /></td></tr></tbody></table></div>}
          </div></div>
          <div className="dm-step"><span className="dm-n">3</span><div className="grow"><b>Park the domain on this hosting</b>
            <p className="mut sm">hPanel → <b>Websites</b> → your builder's site → <b>Domains → Parked domains</b> → enter <C v={d || "mybrand.com"} /> → <b>Park domain</b>. The routing to this {route.page ? "page" : "website"} is already done.</p></div></div>
        </>}
        {obj.domain && <div className="dm-step"><span className="dm-n">{kind === "sub" ? 3 : 4}</span><div className="grow"><b>Verify &amp; secure</b>
          <div className="row" style={{ marginTop: 6 }}><button className="pri" disabled={busy === "verify"} onClick={verify}>{busy === "verify" ? "Checking…" : "Verify now"}</button>
            {chk && <span className={chk.ok ? "green" : "mut"}>{chk.ok ? `✓ Connected — checked ${ago(chk.ts)}` : `Not yet — DNS shows ${(chk.found || []).join(", ") || "nothing"} (${ago(chk.ts)}). Can take a few hours.`}</span>}</div>
          <p className="mut sm">Then hPanel → <b>Security → SSL</b> → install the free SSL for <b>{obj.domain}</b>.</p>
          <div className="row"><a className="btn" href={`http://${obj.domain}`} target="_blank" rel="noopener">Visit {obj.domain}</a>{onOpen && <button onClick={onOpen}>Open in editor</button>}</div></div></div>}
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
