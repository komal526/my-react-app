// LaunchBuilder v3 — Domains.jsx
import { useState } from "react";
import { addr, HOSTS, cleanDomain, validDomain, dnsRecords, verifyDomain, isApex, ago } from "../lib.js";

/* ================= Domains: connect a custom domain to each project and verify DNS ================= */
const copy = (t) => (navigator.clipboard ? navigator.clipboard.writeText(t).catch(() => window.prompt("Copy:", t)) : window.prompt("Copy:", t));
const STATUS = { connected: ["published", "✓ Connected"], pending: ["pending", "Waiting for DNS"], none: ["draft", "No custom domain"] };

function DomainCard({ p, onPatch, onOpen }) {
  const [open, setOpen] = useState(false), [val, setVal] = useState(p.domain || ""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const host = p.domainHost || { id: "vercel", a: HOSTS[0].a, cname: HOSTS[0].cname }, preset = HOSTS.find((h) => h.id === host.id) || HOSTS[0];
  const recs = dnsRecords(p.domain, host), chk = p.domainCheck, st = STATUS[p.domain ? p.domainStatus || "pending" : "none"];
  const setHost = (o) => onPatch(p.id, { domainHost: { ...host, ...o }, domainStatus: p.domain ? "pending" : "", domainCheck: null });
  const save = () => {
    const d = cleanDomain(val); setErr("");
    if (!validDomain(d)) return setErr("Enter a domain like mybrand.com or offer.mybrand.com");
    onPatch(p.id, { domain: d, domainHost: host, domainStatus: "pending", domainCheck: null }); setVal(d);
  };
  const verify = async () => { setBusy(true); const r = await verifyDomain(p.domain, host); setBusy(false); onPatch(p.id, { domainCheck: r, domainStatus: r.ok ? "connected" : "pending" }); };
  const missing = recs.some((r) => !r.value);

  return (
    <div className="panel dm">
      <div className="dm-h">
        <div><b>{p.name}</b><div className="mut sm">{p.type === "website" ? `Website · ${p.pages.length} pages` : "Landing page"} · {p.status === "published" ? "Published" : "Draft"}</div></div>
        <div className="grow" />
        <span className={"badge " + st[0]}>{st[1]}</span>
        <button className={open ? "" : "pri"} onClick={() => setOpen(!open)}>{open ? "Close" : p.domain ? "Manage" : "Connect domain"}</button>
      </div>
      <div className="dm-addr">
        <div><span className="mut sm">Free address</span><code>{p.slug}.launchbuilder.com</code></div>
        {p.domain && <div><span className="mut sm">Custom domain</span><code className="dm-own">{p.domain}</code></div>}
        <div><span className="mut sm">Live address</span><code>{addr(p)}</code></div>
      </div>
      {open && <div className="dm-body">
        <div className="dm-step"><span className="dm-n">1</span><div className="grow">
          <b>Enter your domain</b><p className="mut sm">A main domain (mybrand.com) or a subdomain (offer.mybrand.com). Buy one at GoDaddy, Hostinger, Namecheap or BigRock.</p>
          <div className="row"><input value={val} placeholder="mybrand.com" onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} /><button className="pri" onClick={save}>{p.domain ? "Update" : "Add domain"}</button>
            {p.domain && <button className="red" onClick={() => { if (window.confirm(`Remove ${p.domain} from this project?`)) { onPatch(p.id, { domain: "", domainStatus: "", domainCheck: null }); setVal(""); } }}>Remove</button>}</div>
          {err && <p className="red sm">{err}</p>}
        </div></div>
        <div className="dm-step"><span className="dm-n">2</span><div className="grow">
          <b>Where is the site hosted?</b><p className="mut sm">Upload the exported .zip there (Editor → Export). Pick the host so we show the right DNS values.</p>
          <div className="dm-hosts">{HOSTS.map((h) => <button key={h.id} className={host.id === h.id ? "on" : ""} onClick={() => setHost({ id: h.id, a: h.a, cname: h.cname })}>{h.name}</button>)}</div>
          {(preset.askA || preset.ask) && <div className="row dm-in">
            <label>Server IP (A record)<input value={host.a || ""} placeholder="e.g. 185.212.71.10" onChange={(e) => setHost({ a: e.target.value.trim() })} /></label>
            <label>CNAME target{preset.ask ? ` (e.g. ${preset.ask})` : " (optional)"}<input value={host.cname || ""} placeholder={preset.ask || "optional"} onChange={(e) => setHost({ cname: cleanDomain(e.target.value) })} /></label>
          </div>}
          <p className="mut sm">{preset.note}</p>
        </div></div>
        {p.domain && <div className="dm-step"><span className="dm-n">3</span><div className="grow">
          <b>Add these records at your domain provider</b><p className="mut sm">Open your registrar → DNS / Manage DNS → add each record. Delete any old A record on the same host. {isApex(p.domain) ? "" : "Subdomains only need the CNAME."}</p>
          {missing && <p className="red sm">Fill in the server IP / CNAME target in step 2 first.</p>}
          <div className="ltable"><table><thead><tr><th>Type</th><th>Host / Name</th><th>Value / Points to</th><th>TTL</th><th>Status</th></tr></thead><tbody>
            {recs.map((r) => { const c = chk && chk.checks.find((x) => x.name === r.name && x.type === r.type); return (
              <tr key={r.name + r.type}><td><b>{r.type}</b></td><td><code>{r.host}</code> <button className="xs" onClick={() => copy(r.host)}>Copy</button></td>
                <td><code>{r.value || "—"}</code> {r.value && <button className="xs" onClick={() => copy(r.value)}>Copy</button>}</td><td>Auto</td>
                <td>{!c ? <span className="mut">Not checked</span> : c.ok ? <span className="badge published">✓ Correct</span> : <span className="badge pending" title={c.error || ""}>{c.found.length ? `Points to ${c.found.join(", ")}` : c.error || "Not found yet"}</span>}</td></tr>); })}
          </tbody></table></div>
        </div></div>}
        {p.domain && <div className="dm-step"><span className="dm-n">4</span><div className="grow">
          <b>Verify the connection</b><p className="mut sm">We check the live public DNS. New records usually work in 5–30 minutes, sometimes up to 48 hours.</p>
          <div className="row"><button className="pri" disabled={busy || missing} onClick={verify}>{busy ? "Checking DNS…" : "Verify DNS now"}</button>
            {chk && <span className={chk.ok ? "green" : "mut"}>{chk.ok ? `✓ All records are correct — checked ${ago(chk.ts)}` : `Not ready yet — checked ${ago(chk.ts)}`}</span>}</div>
          {chk && chk.ok && <div className="dm-ok"><b>Domain connected.</b> In your host's dashboard, also add <code>{p.domain}</code> as a custom domain so it serves your site and issues the free SSL (https) certificate.</div>}
          <div className="row" style={{ marginTop: 10 }}><button onClick={() => onOpen(p.id)}>Open in editor</button><a className="btn" href={`https://${p.domain}`} target="_blank" rel="noopener">Visit https://{p.domain}</a></div>
        </div></div>}
      </div>}
    </div>
  );
}

export default function Domains({ projects, onPatch, onOpen }) {
  return (
    <>
      <div className="top"><div><h1>Domains</h1><p className="mut">Connect your own domain to each project and check that DNS is set up correctly.</p></div></div>
      <div className="stats">
        <div className="stat"><span>Projects</span><b>{projects.length}</b></div>
        <div className="stat"><span>Custom domains added</span><b>{projects.filter((p) => p.domain).length}</b></div>
        <div className="stat"><span>Connected</span><b>{projects.filter((p) => p.domainStatus === "connected").length}</b></div>
      </div>
      {!projects.length ? <div className="empty"><b>No projects yet</b><p className="mut">Create a page or website first, then connect a domain to it.</p></div>
        : projects.map((p) => <DomainCard key={p.id} p={p} onPatch={onPatch} onOpen={onOpen} />)}
      <div className="panel"><b>How it works</b>
        <p className="mut">Export your project as a .zip from the editor and upload it to your host (Vercel, Netlify, Hostinger…). Add the DNS records shown above at your domain provider, then click Verify. Your host issues the free SSL certificate once the domain points to it.</p></div>
    </>
  );
}
