// LaunchBuilder v7 — Domains.jsx
import { useState } from "react";
import { addr, HOSTS, cleanDomain, validDomain, dnsRecords, verifyDomain, isApex, rootDomain, ago, serverCall, publishReady, verifyNS, NETLIFY_A } from "../lib.js";

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

export default function Domains({ projects, onPatch, onOpen, integ, onSetup, onPublish }) {
  return (
    <>
      <div className="top"><div><h1>Domains</h1><p className="mut">Publish for a free link, then connect your own domain with DNS records or nameservers.</p></div></div>
      <div className="stats">
        <div className="stat"><span>Live sites</span><b>{projects.filter((p) => p.netlify).length}</b></div>
        <div className="stat"><span>Custom domains</span><b>{projects.filter((p) => p.domain).length}</b></div>
        <div className="stat"><span>Connected</span><b>{projects.filter((p) => p.domainStatus === "connected").length}</b></div>
      </div>
      {!projects.length ? <div className="empty"><b>No projects yet</b><p className="mut">Create a page or website first, then publish and connect a domain.</p></div>
        : projects.map((p) => <DomainCard key={p.id} p={p} onPatch={onPatch} onOpen={onOpen} integ={integ} onSetup={onSetup} onPublish={onPublish} />)}
    </>
  );
}
