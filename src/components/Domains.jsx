// LaunchBuilder v67 — Domains.jsx (free subdomains · your own domains · admin panel at the bottom)
import { useState, useEffect, lazy, Suspense } from "react";
import { addr, HOSTS, cleanDomain, validDomain, dnsRecords, verifyDomain, isApex, rootDomain, ago, serverCall, publishReady, verifyNS, NETLIFY_A, serverOn, phpCall, dnsLookup, HOSTINGER_NS, defaultServerUrl, subUrl, subList, subClaim, subDelete, subsCache, liveAddr, domainState } from "../lib.js";
const AdminPanel = lazy(() => import("./Admin.jsx"));
import { BRAND } from "../brand.js";

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
        {nl || (p.domain && p.domainStatus === "connected") ? <div><span className="mut sm">Live address</span><code>{addr(p)}</code></div> : <div><span className="mut sm">Live address</span><span className="mut">Not live yet — publish first</span></div>}
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
/* plain-language checklist: which of the 6 steps is missing */
function Diag({ r, domain, builder }) {
  if (r.old) return <div className="cw-diag"><div className="dg bad"><i>✕</i><div><b>Your server file is old</b><p>Upload the newest builder files: run <code>npm run build</code> and upload everything inside <code>dist</code> to {builder || "the builder's"} <code>public_html</code> (keep the <code>sites</code> and <code>lb-data</code> folders). Then run this check again.</p></div></div></div>;
  if (r.error) return <div className="cw-diag"><div className="dg bad"><i>✕</i><div><b>The check couldn't run</b><p>{r.error}</p></div></div></div>;
  r = { dns: [], websites: [], files: [], ...r };
  const items = [];
  const add = (st, t, p) => items.push([st, t, p]);
  add("ok", BRAND.product + " server is up to date", null);
  add("ok", "Your website is published", null);
  if (r.dns.length) add("ok", "The domain points to Hostinger", <>DNS answers <code>{r.dns.join(", ")}</code>.</>);
  else add("bad", "The domain doesn't point anywhere yet", <>If you bought it on Hostinger: hPanel → Domains → {domain} → DNS / Nameservers → choose <b>Use Hostinger nameservers</b> → then <b>Reset DNS records</b>. Bought elsewhere: set nameservers <code>ns1.dns-parking.com</code> and <code>ns2.dns-parking.com</code>. Updates take 10 min – a few hours.</>);
  if (r.folder) add("ok", "The domain is added as a website in Hostinger", null);
  else add("bad", "The domain is not added as a website in Hostinger yet", <>hPanel → <b>Websites</b> → <b>+ Add website</b> → <b>Empty website</b> → choose <b>{domain}</b> → finish.
    {r.can_list ? <> Websites I can see on this hosting: {r.websites.length ? r.websites.map((w) => <code key={w} style={{ marginRight: 4 }}>{w}</code>) : "none"}.{" "}If you already added it but it's not in this list, it was added to a <b>different hosting plan</b> — add it to the same plan as the builder.</> : " (I can't list the other websites on this hosting — that usually means it's on a different plan.)"}</>);
  if (r.folder) {
    if (r.copied) add("ok", "Your website is copied into the domain", null);
    else if (!r.writable) add("bad", "Hostinger doesn't let " + BRAND.product + " write into the domain's folder", <>File Manager → <code>domains/{domain}/public_html</code> → right-click → Permissions → <b>755</b>. Then press <b>Connect &amp; check</b>.</>);
    else if ((r.files || []).some((f) => /wp-config|index\.php/.test(f))) add("bad", "That website already has another site inside (WordPress/PHP)", <>Files found: {r.files.map((f) => <code key={f} style={{ marginRight: 4 }}>{f}</code>)}. Delete them in File Manager (or use an empty website), then press <b>Connect &amp; check</b>.</>);
    else add("bad", "Your website isn't copied into the domain yet", <>Press <b>Connect &amp; check</b> above.</>);
  }
  if (r.marker_ok) add("ok", "The domain opens your website", null);
  else if (r.dns.length && r.folder && r.copied) add("bad", r.http_marker === 403 ? "The domain shows “403 Forbidden”" : "The domain doesn't open your website yet",
    <>{r.http_marker === 403 ? "The domain reaches a Hostinger server that doesn't know it. " : ""}Its DNS points somewhere else than its website. Fix: hPanel → Domains → {domain} → DNS / Nameservers → <b>Use Hostinger nameservers</b> → <b>Reset DNS records</b>. Delete any A records you added by hand. Wait 10–30 min and check again.</>);
  else if (!r.marker_ok) add("wait", "The domain will open your website", "Finish the steps above first.");
  if (r.marker_ok) add(r.https_home >= 200 && r.https_home < 400 ? "ok" : "wait", r.https_home >= 200 && r.https_home < 400 ? "Secure (https) is on" : "Secure (https) is not on yet", r.https_home >= 200 && r.https_home < 400 ? null : <>hPanel → <b>Security → SSL</b> → install the free SSL for {domain}. It can take up to an hour.</>);
  const first = items.find((x) => x[0] === "bad");
  return <div className="cw-diag">
    <div className="dg-h"><b>Full check for {domain}</b>{first ? <span className="dg-pill bad">1 thing to fix</span> : <span className="dg-pill ok">All good</span>}</div>
    {items.map(([st, t, p], i) => <div key={i} className={"dg " + st + (first && first[1] === t ? " focus" : "")}><i>{st === "ok" ? "✓" : st === "bad" ? "✕" : "…"}</i><div><b>{t}</b>{p && <p>{p}</p>}</div></div>)}
  </div>;
}

/* VPS checklist: 5 plain steps, the first one that fails is highlighted */
function VDiag({ r: r0 }) {
  const r = { dns: [], ...r0 };
  const it = [
    [r.dns.length ? "ok" : "bad", "The domain has an A record", r.dns.length ? <>It points to <code>{r.dns.join(", ")}</code>.</> : "Add the A record on @ where you bought the domain."],
    [r.points_here ? "ok" : r.dns.length ? "bad" : "wait", "It points to your server", r.points_here ? null : <>Must be <code>{r.server_ip || "your VPS IP"}</code>. {r.dns.length ? <>It's <code>{r.dns.join(", ")}</code> now — that's another server (often the registrar's parking page). Edit the A record and delete any extra A records on @.</> : null}</>],
    ...(r.bad_aaaa && r.bad_aaaa.length ? [["bad", "Remove the old IPv6 (AAAA) record", <>The domain also has an <b>AAAA</b> record → <code>{r.bad_aaaa.join(", ")}</code> (another server). Some visitors see that server and https can't be issued. In your DNS records delete every <b>AAAA</b> record on <b>@</b> and <b>www</b>.</>]] : []),
    [r.mine === false ? "bad" : r.connected ? "ok" : "wait", "The domain is connected to a website", r.mine === false ? "This domain is connected by another account. If it's yours, contact support." : r.connected ? null : "Press “Connect & check”."],
    [r.ours && r.opens >= 200 && r.opens < 400 ? "ok" : r.points_here && r.connected ? "bad" : "wait", "The domain opens your website", r.ours ? (r.opens >= 400 ? <>The server answers but the site gives error {r.opens}. Publish the site again.</> : null) : r.points_here ? "The VPS isn't answering for this domain yet — run the one-time nginx setup (vps/nginx-domains.sh) on the VPS." : "Finish the steps above first."],
    [r.https >= 200 && r.https < 400 ? "ok" : "wait", "Secure https", r.https >= 200 && r.https < 400 ? null : r.ours ? "The free certificate is added automatically within ~5 minutes after the site opens." : "Comes automatically after the steps above."],
  ];
  const first = it.find((x) => x[0] === "bad");
  return <div className="cw-diag"><div className="dg-h"><b>Check for {r.domain}</b>{first ? <span className="dg-pill bad">1 thing to fix</span> : it.every((x) => x[0] === "ok") ? <span className="dg-pill ok">All good</span> : <span className="dg-pill">In progress</span>}</div>
    {it.map(([st, t, p], i) => <div key={i} className={"dg " + st + (first && first[1] === t ? " focus" : "")}><i>{st === "ok" ? "✓" : st === "bad" ? "✕" : "…"}</i><div><b>{t}</b>{p && <p>{p}</p>}</div></div>)}</div>;
}

/* not published yet → one clear step */
function PublishFirst({ p, onPublish }) {
  return <div className="panel dm"><div className="dm-h"><div><b>{p.name}</b><div className="mut sm">{p.type === "website" ? `Website · ${p.pages.length} pages` : "Landing page"} · not published yet</div></div><div className="grow" />
    <span className="badge draft">No domain</span><button className="pri" onClick={() => onPublish(p)}>Publish to connect a domain</button></div>
    <p className="mut sm" style={{ margin: "10px 2px 0" }}>Publish once — it goes live on your {BRAND.product} server. Then come back here, type the domain, add 2 DNS records and press <b>Connect &amp; check</b>.</p></div>;
}

function DomainRow({ label, sub: subLabel, url, folder, obj, onSave, route, integ, onOpen, vps = null }) {
  const srv = (integ && integ.server) || {};
  const [open, setOpen] = useState(false), [val, setVal] = useState(obj.domain || ""), [where, setWhere] = useState(obj.domainWhere || "hostinger");
  const [busy, setBusy] = useState(""), [err, setErr] = useState(""), [adv, setAdv] = useState(false), [diag, setDiag] = useState(null);
  const [ip, setIpRaw] = useState(() => localStorage.getItem("lb_site_ip") || ""), ipOk = /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
  const setIp = (v) => { const x = v.trim(); setIpRaw(x); localStorage.setItem("lb_site_ip", x); };
  const st = STATUS[obj.domain ? obj.domainStatus || "pending" : "none"], chk = obj.domainCheck || null;
  const d = cleanDomain(val).replace(/^www\./, ""), isSub = d && !isApex(d), subName = isSub ? d.slice(0, -(rootDomain(d).length + 1)) : "offer";
  const C = ({ v }) => <><code>{v}</code> <Copy v={v} /></>;

  /* one button does everything: save → route (parked mode) → copy site into the domain's own website (Add-website mode) → check */
  const check = async (dom = obj.domain) => {
    if (!dom) return;
    if (vps) {
      setBusy("check");
      try {
        const r = await phpCall(srv.url ? srv : { url: defaultServerUrl(), key: srv.key }, { action: "vcheck", domain: dom });
        const live = r.ours && r.opens >= 200 && r.opens < 400;
        const state = live ? "live" : !r.dns.length ? "nodns" : !r.points_here ? "wrongip" : !r.connected ? "notconn" : "wait";
        onSave({ domainStatus: live ? "connected" : "pending", domainCheck: { state, found: r.dns, ts: Date.now() } }); setDiag({ v: r, ts: Date.now() });
      } catch (e) { setErr(/unknown action/i.test(e.message) ? "Your server file is old — run lb-deploy on the VPS, then try again." : e.message); }
      setBusy(""); return;
    }
    if (!serverOn(integ)) return;
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
      if (state !== "live") { try { const g = await phpCall(srv, { action: "diag", domain: dom }); setDiag(g && g.version ? { ...g, ts: Date.now() } : { old: true, ts: Date.now() }); } catch (e2) { setDiag({ old: /unknown action/i.test(e2.message), error: e2.message, ts: Date.now() }); } }
      else setDiag(null);
    } catch (e) { setErr(e.message); }
    setBusy("");
  };
  const runDiag = async (dom = obj.domain || d) => {
    if (!dom) return;
    setBusy("diag");
    try { const r = await phpCall(srv, { action: "diag", domain: dom }); setDiag(r && r.version ? { ...r, ts: Date.now() } : { old: true, ts: Date.now() }); }
    catch (e) { setDiag({ old: /unknown action/i.test(e.message), error: e.message, ts: Date.now() }); }
    setBusy("");
  };
  const connect = async () => {
    setErr("");
    if (!validDomain(d)) return setErr("Type a domain like mybrand.com or offer.mybrand.com");
    if (!serverOn(integ) && !vps) return setErr("Publish this website once first — then connect the domain.");
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
    if (vps || serverOn(integ)) {
      setBusy("disc"); setErr("");
      try { await phpCall(srv.url ? srv : { url: defaultServerUrl(), key: srv.key }, { action: "domain", domain: "", remove: obj.domain, ...route }); }
      catch (e) { setBusy(""); setOpen(true); setErr("Could not disconnect: " + e.message); return; }   // keep it shown as connected — the server still serves it
      setBusy("");
    }
    onSave({ domain: "", domainStatus: "", domainCheck: null, domainCopy: false }); setVal("");
  };
  useEffect(() => { if (open && obj.domain) check(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = chk && chk.state;
  const ADD_SITE = ["Add the domain as a website in Hostinger", <>hPanel → <b>Websites</b> → <b>+ Add website</b> → <b>Empty website</b> (or “Skip, start with an empty site”) → {where === "hostinger" ? <>pick <b>{d || "your domain"}</b></> : <>choose <b>“Use an existing domain”</b> → type <b>{d || "your domain"}</b></>} → finish.
    <div className="row" style={{ marginTop: 8 }}><a className="btn" href="https://hpanel.hostinger.com/websites" target="_blank" rel="noopener">Open hPanel → Websites ↗</a></div></>];
  const GO = ["Press “Connect & check” below", <>{BRAND.product} puts your website on the domain and checks that it opens. When you publish again, the domain updates by itself.</>];
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
  /* VPS: the server accepts any domain — customers only add DNS records */
  const VSTEPS = vps ? [
    ["Add these DNS records where you bought the domain", <>{isSub ? <>Add <b>one</b> record (GoDaddy, Namecheap, Hostinger… → DNS settings):</> : <>Delete any old <b>A</b> record on <b>@</b> and any <b>CNAME</b> on <b>www</b>, then add:</>}
      <div className="ltable" style={{ margin: "8px 0" }}><table><thead><tr><th>Type</th><th>Name</th><th>Value</th></tr></thead><tbody>
        {isSub ? <tr><td><b>A</b></td><td><C v={subName} /></td><td><C v={vps.ip || "your server IP"} /></td></tr>
          : <><tr><td><b>A</b></td><td><C v="@" /></td><td><C v={vps.ip || "your server IP"} /></td></tr><tr><td><b>CNAME</b></td><td><C v="www" /></td><td><C v={d || "mybrand.com"} /></td></tr></>}
      </tbody></table></div><span className="mut sm">Usually works in 10–30 minutes (sometimes a few hours). https is added automatically.</span></>],
    ["Press “Connect & check” below", <>{BRAND.product} connects the domain to this {route.page ? "page" : "website"} and checks that it opens.</>],
  ] : null;
  const VSTATE = {
    live: ["ok", "🎉 Live! " + (obj.domain || "") + " opens this " + (route.page ? "page" : "website") + "."],
    nodns: ["wait", "The domain has no A record yet. Add the records above, wait 10–30 minutes, then press “Check again”."],
    wrongip: ["bad", "The domain points to " + ((chk && chk.found) || []).join(", ") + " — not to your server (" + ((vps && vps.ip) || "server IP") + "). Change the A record on @ to " + ((vps && vps.ip) || "the server IP") + " and delete the old one."],
    notconn: ["warn", "DNS is correct. Press “Connect & check” to connect it to this " + (route.page ? "page" : "website") + "."],
    wait: ["warn", "DNS is correct and the domain is connected, but the server isn't answering for it yet. The one-time nginx setup on the VPS may be missing (see the note at the top)."],
  };
  const STATE = {
    live: ["ok", "🎉 Live! " + (obj.domain || "") + " shows this " + (route.page ? "page" : "website") + "."],
    folder: ["warn", "Almost there — the domain exists in Hostinger. Press “Connect & check” to put your website into it."],
    attach: ["warn", "The domain reaches Hostinger, but isn't added as a website yet. Do the step “Add the domain as a website in Hostinger”, then press “Connect & check”."],
    dns: ["wait", "Waiting for the domain to point to Hostinger. " + (where === "hostinger" ? "If you just bought it, wait 10–30 minutes." : "Nameserver changes can take a few hours.") + " Then press “Check again”."],
  };
  const SM = vps ? VSTATE : STATE;
  return (
    <div className={"dr" + (open ? " open" : "")}>
      <div className="dr-h" onClick={() => setOpen(!open)}>
        <div className="dr-l"><b>{label}</b><span className="mut sm">{subLabel}</span></div>
        <div className="dr-d">{obj.domain ? <><a className="dm-link" href={"https://" + obj.domain} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>{obj.domain} ↗</a><span className={"badge " + st[0]}>{obj.domainStatus === "connected" ? "● Live" : "Setting up"}</span></>
          : <a href={url} target="_blank" rel="noopener" className={"sm " + (/\/sites\//.test(url) ? "mut" : "dm-link")} onClick={(e) => e.stopPropagation()}>{url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗</a>}</div>
        {obj.domain && <button className="dm-disc" disabled={busy === "disc"} onClick={(e) => { e.stopPropagation(); remove(); }} title="Disconnect this domain">{busy === "disc" ? "Disconnecting…" : "✕ Disconnect"}</button>}
        <button className={obj.domain ? "" : "pri"} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>{open ? "Close" : obj.domain ? "Manage" : "Connect domain"}</button>
      </div>
      {open && <div className="dm-body cw">
        <div className="cw-field"><label>Your domain</label>
          <div className="row"><input value={val} placeholder="mybrand.com  or  offer.mybrand.com" onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && connect()} />
            {obj.domain && <button className="red" onClick={remove}>Disconnect</button>}</div></div>
        {!vps && <div className="cw-field"><label>How do you want to connect it?</label>
          <div className="dm-kind cw-3">{[["hostinger", "🟢 Bought on Hostinger", "Easiest — 2 steps"], ["ns", "Elsewhere — Nameservers", "GoDaddy, Namecheap… · simple"], ["dns", "Elsewhere — DNS records", "Keep your DNS · for email users"]].map(([k, l, ex]) => <button key={k} className={where === k ? "on" : ""} onClick={() => setWhere(k)}><b>{l}</b><span>{ex}</span></button>)}</div></div>}
        <ol className="cw-steps">{(VSTEPS || STEPS).map(([t, body], i) => <li key={i}><span className="dm-n">{i + 1}</span><div><b>{t}</b><div className="mut">{body}</div></div></li>)}</ol>
        <div className="cw-go"><button className="pri big" disabled={!!busy || !d} onClick={connect}>{busy === "connect" ? "Connecting…" : busy === "check" ? "Checking…" : obj.domain ? "Connect & check again" : "Connect & check"}</button>
          {obj.domain && <button disabled={!!busy} onClick={() => check()}>Check again</button>}</div>
        {err && <div className="cw-st bad">✕ {err}</div>}
        {state && SM[state] && (vps || state === "live" || !diag || diag.old || diag.error) && <div className={"cw-st " + SM[state][0]}>{SM[state][1]} <span className="mut sm">({ago(chk.ts)})</span>
          {state === "live" && <div className="row" style={{ marginTop: 8 }}><a className="btn pri" href={`http://${obj.domain}`} target="_blank" rel="noopener">Open {obj.domain} ↗</a><span className="mut sm">“Not secure”? Hostinger adds free SSL within ~30 min — or hPanel → Security → SSL.</span></div>}</div>}

        {vps && diag && diag.v && <VDiag r={diag.v} />}
        {!vps && obj.domain && <button className="link cw-adv" disabled={!!busy} onClick={() => runDiag()}>{busy === "diag" ? "Checking every step…" : "🔍 Why isn't it working? Run full check"}</button>}
        {!vps && diag && <Diag r={diag} domain={obj.domain || d} builder={(srv.base || "").replace(/^https?:\/\//, "")} />}
        {!vps && <button className="link cw-adv" onClick={() => setAdv(!adv)}>{adv ? "▾" : "▸"} Advanced: park the domain on the builder instead</button>}
        {!vps && adv && <div className="cw-advbox">
          <p className="mut sm"><b>Park on the builder's site</b> (instead of adding a website): hPanel → Websites → {(srv.base || "").replace(/^https?:\/\//, "") || "your builder's site"} → Domains → Parked domains → add <C v={d || "mybrand.com"} />. Routing is already done.</p>
          {isSub && <p className="mut sm"><b>Subdomain</b>: hPanel → Domains → Subdomains → name <C v={subName} /> → custom folder <C v={folder.replace(/^public_html\//, "")} />.</p>}
        </div>}
        {onOpen && <div className="row" style={{ marginTop: 6 }}><button onClick={onOpen}>Open in editor</button></div>}
      </div>}
    </div>
  );
}

function ServerCard({ p, onPatch, onPatchPage, onOpen, integ, onSetup, vps = null, subs = [] }) {
  /* the address it's really live at: its own domain → free subdomain → temporary link */
  const live = liveAddr(p, subs) || subUrl(integ, p.host.slug) || p.host.url;
  const folder = p.host.folder || `public_html/sites/${p.host.slug}`, base = p.host.url.replace(/\/$/, "");
  const multi = p.type === "website" && p.pages.length > 1;
  return (
    <div className="panel dm">
      <div className="dm-h"><div><b>{p.name}</b><div className="mut sm">● Live on your hosting · {p.pages.length} page{p.pages.length > 1 ? "s" : ""}</div></div><div className="grow" />
        <a className="btn" href={live} target="_blank" rel="noopener">Open site ↗</a></div>
      <div className="dr-list">
        <DomainRow label={multi ? "Whole website" : "This page"} sub={multi ? "Home page + all pages and menus" : p.pages[0].name} url={live} folder={folder}
          obj={p} onSave={(o) => onPatch(p.id, o)} route={{ slug: p.host.slug }} integ={integ} onSetup={onSetup} onOpen={() => onOpen(p.id)} vps={vps} />
        {multi && p.pages.filter((x) => x.file !== "index.html").map((pg) => (
          <DomainRow key={pg.id} label={pg.name} sub={"Only this page · " + pg.file} url={`${base}/${pg.file}`} folder={`${folder}/p/${pg.file.replace(/\.html$/, "")}`}
            obj={pg} onSave={(o) => onPatchPage(p.id, pg.id, o)} route={{ slug: p.host.slug, page: pg.file }} integ={integ} onSetup={onSetup} onOpen={() => onOpen(p.id)} vps={vps} />))}
      </div>
      {multi && <p className="mut sm" style={{ margin: "10px 2px 0" }}>Tip: give a landing page its own domain (e.g. <b>offer.mybrand.com</b> → Offer page) while the main domain shows the whole website. Republish after adding new pages.</p>}
    </div>
  );
}

export const SERVER_VERSION = 18;

/* ---------- free subdomains: name.crecapo.tech (or name.<white-label domain>) — no DNS for the user, limited per account ---------- */
/* messages that disappear by themselves (ok after 5 s, errors after 9 s) */
function useFlash() {
  const [m, setM] = useState(null);
  useEffect(() => { if (!m) return; const t = setTimeout(() => setM(null), m[0] === "bad" ? 9000 : 5000); return () => clearTimeout(t); }, [m]);
  return [m, setM];
}

/* project picker: every project, with the address it's live at (domain / subdomain / temporary link) */
function ProjectPick({ projects, subs, value, onChange }) {
  const [open, setOpen] = useState(false), cur = projects.find((p) => p.id === value);
  useEffect(() => { if (!open) return; const f = () => setOpen(false); setTimeout(() => window.addEventListener("click", f), 0); return () => window.removeEventListener("click", f); }, [open]);
  const addr = (p) => { const a = p.host || p.netlify ? liveAddr(p, subs) : ""; return a ? a.replace(/^https?:\/\//, "").replace(/\/$/, "") : ""; };
  const tag = (p) => { const s = domainState(p, subs); return s === "connected" ? ["on", "Connected"] : s === "needs" ? ["tmp", "Temporary link"] : ["off", "Not published"]; };
  return (
    <div className={"pp" + (open ? " open" : "")}>
      <button type="button" className="pp-btn" onClick={() => setOpen(!open)}>
        {cur ? <span className="pp-cur"><b>{cur.name}</b><small className={tag(cur)[0]}>{addr(cur) || "Not published yet"}</small></span> : <span className="mut">Choose a project</span>}<span className="pp-chev">▾</span></button>
      {open && <div className="pp-list">{projects.map((p) => { const t = tag(p), a = addr(p); return (
        <div key={p.id} className={"pp-it" + (p.id === value ? " on" : "")} onClick={() => { onChange(p.id); setOpen(false); }}>
          <div><b>{p.name}</b>{a ? <a href={"https://" + a} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>{a} ↗</a> : <small className="mut">Publish it first</small>}</div>
          <span className={"pp-tag " + t[0]}>{t[1]}</span></div>); })}</div>}
    </div>
  );
}

function FreeSubs({ projects, me, onPublish = () => {} }) {
  const [data, setData] = useState(null), [name, setName] = useState(""), [pid, setPid] = useState(""), [page, setPage] = useState(""), [busy, setBusy] = useState(""), [msg, setMsg] = useFlash();
  const load = () => subList().then(setData).catch((e) => setData({ error: e.message }));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!pid && projects[0]) setPid((projects.find((p) => p.host) || projects[0]).id); }, [projects.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const subs = (data && data.subs) || [], pending = subs.some((s) => !s.https);
  /* while a new subdomain is still getting its https lock, check every 20 s so it flips to "Live" by itself */
  useEffect(() => { if (!pending) return; const t = setInterval(load, 20000); return () => clearInterval(t); }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps
  const proj = projects.find((p) => p.id === pid), base = (data && data.base) || (me && me.subBase) || "", limit = (data && data.limit) || (me && me.subLimit) || 5;
  const unlimited = limit >= 1000, full = !unlimited && subs.length >= limit, needPub = proj && !(proj.host && proj.host.slug);
  const label = (t) => { const [sl, pg] = String(t).split("/"); const p = projects.find((x) => x.host && x.host.slug === sl); return (p ? p.name : sl) + (pg ? " · " + pg.replace(/\.html$/, "") : ""); };
  const nm = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+/, "").slice(0, 40);
  const create = async () => {
    setMsg(null); if (!nm || /-$/.test(nm)) return setMsg(["bad", "Type a name — letters, numbers and dashes."]); if (!proj) return setMsg(["bad", "Choose a project."]);
    if (needPub) return setMsg(["bad", <>“{proj.name}” isn't published yet — <button className="link" onClick={() => onPublish(proj)}>publish it first</button>, then click Live.</>]);
    setBusy("add");
    try { const r = await subClaim(nm, proj.host.slug, page); setData({ ...(data || {}), subs: r.subs }); setName(""); setMsg(["ok", <>🎉 <b>{r.host}</b> is created — it goes live in about <b>2 minutes</b>.</>]); }
    catch (e) { setMsg(["bad", e.message]); }
    setBusy("");
  };
  const del = async (h) => { if (!window.confirm(`Remove ${h}? The address stops working and the name becomes free for others.`)) return; setBusy(h); try { const r = await subDelete(h); setData({ ...(data || {}), subs: r.subs }); setMsg(["ok", <>Removed <b>{h}</b>.</>]); } catch (e) { setMsg(["bad", e.message]); } setBusy(""); };
  if (data && data.error) return <div className="panel fsub"><div className="fs-h"><div><b>🎁 Free subdomains</b><span className="mut sm">{/Unknown action/i.test(data.error) ? "Needs the new server file — run lb-deploy on the VPS." : data.error}</span></div></div></div>;
  if (!base) return null;
  return (
    <div className="panel fsub">
      <div className="fs-h"><span className="fs-ic">🎁</span><div><b>Free subdomain</b><span className="mut sm">Put a website live at <b className="fs-base">yourname.{base}</b> in one click — no domain to buy, no DNS.</span></div>
        <span className={"fs-count" + (full ? " full" : "")}>{unlimited ? `${subs.length} used` : `${subs.length} / ${limit} used`}</span></div>
      {!full ? <div className="fs-add">
        <div className="fs-name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="yourname" onKeyDown={(e) => e.key === "Enter" && create()} /><span>.{base}</span></div>
        <ProjectPick projects={projects} subs={subs} value={pid} onChange={(v) => { setPid(v); setPage(""); }} />
        {proj && proj.host && proj.type === "website" && proj.pages.length > 1 && <select value={page} onChange={(e) => setPage(e.target.value)}><option value="">Whole website</option>{proj.pages.filter((x) => x.file !== "index.html").map((x) => <option key={x.id} value={x.file}>Only: {x.name}</option>)}</select>}
        <button className="fs-go" disabled={!!busy || !projects.length} onClick={create}>{busy === "add" ? "Creating…" : "🚀 Live"}</button>
      </div> : <p className="mut sm fs-full">You've used all {limit} free subdomains. Remove one to add another{me && me.domLimit > 0 ? "." : " — or connect your own domain below (unlimited)."}</p>}
      {nm && !full && <p className="mut sm fs-prev">Will open at <b>https://{nm}.{base}</b></p>}
      {msg && <div className={"cw-st fs-toast " + msg[0]}>{msg[1]}<button className="fs-x" onClick={() => setMsg(null)} aria-label="Close">✕</button></div>}
      {subs.length > 0 && <div className="fs-list"><span className="fs-lh">Your subdomains</span>{subs.map((s) => (
        <div key={s.host} className="fs-row"><span className="fs-dot" /><a href={"https://" + s.host} target="_blank" rel="noopener"><b>{s.host}</b> ↗</a><span className="mut sm">→ {label(s.target)}</span><div className="grow" />
          {s.https ? <span className="fs-st on">● Live</span> : <span className="fs-st wait" title="https is being set up — usually 1–2 minutes"><i className="pub-spin" /> Going live · ~2 min</span>}
          <Copy v={"https://" + s.host} />
          <button className="xs red" disabled={busy === s.host} onClick={() => del(s.host)}>Remove</button></div>))}</div>}
    </div>
  );
}
const C2 = ({ v }) => <><code>{v}</code> <Copy v={v} /></>;
/* ---------- automatic subdomains: publish → <name>.<your domain> is live instantly ---------- */
function AutoSub({ integ, onInteg, projects, info }) {
  const vps = info && info.vps ? info : null;
  const srv = (integ && integ.server) || {}, cur = srv.sitesDomain || (info && info.sitesDomain) || "";
  const [open, setOpen] = useState(!cur), [val, setVal] = useState(cur || (vps && vps.builder) || ""), [busy, setBusy] = useState(""), [msg, setMsg] = useState(null);
  useEffect(() => { if (!val && (cur || (vps && vps.builder))) setVal(cur || vps.builder); }, [cur, vps && vps.builder]); // eslint-disable-line react-hooks/exhaustive-deps
  const d = cleanDomain(val).replace(/^(\*\.|www\.)/, ""), root = d ? rootDomain(d) : "mybrand.com", label = d && d !== root ? d.slice(0, -(root.length + 1)) : "";
  const builder = (srv.base || "").replace(/^https?:\/\//, "") || "your builder's website";
  const sample = (projects.find((p) => p.host) || {}).host;
  const C = ({ v }) => <><code>{v}</code> <Copy v={v} /></>;
  const save = async (value) => {
    setBusy("save"); setMsg(null);
    try {
      const r = await phpCall(srv, { action: "sitesdomain", domain: value });
      onInteg({ ...integ, server: { ...srv, sitesDomain: r.sitesDomain } });
      if (!r.sitesDomain) { setMsg(["ok", "Automatic subdomains turned off."]); setBusy(""); return; }
      if (sample) {
        const host = `${sample.slug}.${r.sitesDomain}`, t = await phpCall(srv, { action: "probe", domain: host });
        setMsg(t.site ? ["ok", `🎉 Working! ${host} opens your website.`] : ["warn", `Saved. Now finish the Hostinger steps above — then ${host} will open your website (DNS can take 10–30 min). Press “Activate & test” again to check.`]);
      } else setMsg(["ok", "Saved. Publish a website and it gets its own subdomain automatically."]);
    } catch (e) { setMsg(["bad", /unknown action/i.test(e.message) ? "Your lb-server.php is old — upload the newest files first (see the orange note)." : e.message]); }
    setBusy("");
  };
  return (
    <div className="panel autosub">
      <div className="as-h"><div><b>⚡ Automatic subdomains</b><span className="mut sm">{cur ? <>Every published website is live at <code>name.{cur}</code> — no setup per site.</> : "Every website you publish goes live instantly at its own subdomain, like name.mybrand.com."}</span></div>
        {cur && <span className="badge published">● On</span>}<button onClick={() => setOpen(!open)}>{open ? "Close" : cur ? "Settings" : "Set up"}</button></div>
      {open && <div className="cw" style={{ marginTop: 12 }}>
        <div className="cw-field"><label>Domain for your websites' subdomains</label>
          <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="mybrand.com  or  sites.mybrand.com" />
          <span className="mut sm">Sites will open at <b>{"neelam"}.{d || "mybrand.com"}</b>, <b>{"clinic"}.{d || "mybrand.com"}</b>… Use a domain you own (it can be your agency/tool domain).</span></div>
        {vps ? <ol className="cw-steps">
          <li><span className="dm-n">1</span><div><b>Add one DNS record for <code>{root}</code></b><div className="mut">Where you manage {root}'s DNS (hPanel → <b>Domains → {root} → DNS records</b>) add:
            <div className="ltable" style={{ margin: "8px 0" }}><table><thead><tr><th>Type</th><th>Name</th><th>Value</th></tr></thead><tbody><tr><td><b>A</b></td><td><C v={label ? "*." + label : "*"} /></td><td><C v={vps.ip || "your server IP"} /></td></tr></tbody></table></div>
            Every website then opens at <b>name.{d || root}</b> with https created automatically.</div></div></li>
          <li><span className="dm-n">2</span><div><b>Press “Activate & test”</b><div className="mut">Works within 10–30 minutes after adding the record.</div></div></li>
        </ol> : <ol className="cw-steps">
          <li><span className="dm-n">1</span><div><b>Add <code>{root}</code> to your builder's website (once)</b><div className="mut">hPanel → <b>Websites</b> → <b>{builder}</b> → <b>Domains</b> → <b>Parked domains</b> → add <C v={root} />. (Skip if {root} is already the builder's domain.)</div></div></li>
          <li><span className="dm-n">2</span><div><b>Create a “wildcard” subdomain</b><div className="mut">Same website → <b>Domains → Subdomains</b> → in the name box type <C v={label ? "*." + label : "*"} /> (choose <b>{root}</b>) → tick <b>Custom folder</b> → enter <C v="public_html/sites" /> → <b>Create</b>.</div></div></li>
          <li><span className="dm-n">3</span><div><b>Check the DNS (usually automatic)</b><div className="mut">hPanel → <b>Domains → {root} → DNS records</b>: there should be an <b>A</b> record named <C v={label ? "*." + label : "*"} /> pointing to your Website IP. Add it if missing.</div></div></li>
          <li><span className="dm-n">4</span><div><b>Press “Activate & test”</b><div className="mut">{BRAND.product} sets up the routing and tests one of your published websites.</div></div></li>
        </ol>}
        <div className="cw-go"><button className="pri big" disabled={!!busy || !validDomain(d)} onClick={() => save(d)}>{busy ? "Working…" : cur ? "Save & test again" : "Activate & test"}</button>{cur && <button className="red" disabled={!!busy} onClick={() => { setVal(""); save(""); }}>Turn off</button>}</div>
        {msg && <div className={"cw-st " + msg[0]}>{msg[1]}</div>}
        {!vps && <p className="mut sm">🔒 https: Hostinger's free SSL may not cover wildcard subdomains on every plan. If a subdomain shows “Not secure”, install SSL for it in hPanel → Security → SSL, or put the domain on Cloudflare (free), which secures all subdomains automatically.</p>}
      </div>}
    </div>
  );
}

export default function Domains({ projects, onPatch, onPatchPage, onOpen, integ, onSetup, onPublish, onInteg = () => {}, me = null, focus = null }) {
  /* is the lb-server.php on the server as new as this builder? */
  const [srvVer, setSrvVer] = useState(null), [info, setInfo] = useState(null), [subs, setSubs] = useState(subsCache);
  useEffect(() => {
    fetch((integ && integ.server && integ.server.url) || defaultServerUrl(), { method: "POST", body: JSON.stringify({ action: "info" }) }).then((r) => r.json()).then((j) => { setSrvVer(+j.version || 1); setInfo(j); }).catch(() => setSrvVer(0));
    const f = () => setSubs(subsCache()); window.addEventListener("lb-subs", f); return () => window.removeEventListener("lb-subs", f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const vps = { vps: true, ip: "", ...(info || {}) };
  /* projects grouped: needs a domain (live on the temporary link) · connected · drafts */
  const st = (p) => domainState(p, subs);
  const groups = { needs: projects.filter((p) => st(p) === "needs"), connected: projects.filter((p) => st(p) === "connected"), draft: projects.filter((p) => st(p) === "draft") };
  const [tab, setTab] = useState(groups.needs.length ? "needs" : "all");
  /* "🌐 Domain" on a project card → open this page on that project */
  useEffect(() => {
    if (!focus) return; const p = projects.find((x) => x.id === focus.id); if (!p) return;
    setTab(st(p)); setTimeout(() => { const el = document.getElementById("dm-" + p.id); if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); el.classList.add("dm-flash"); setTimeout(() => el.classList.remove("dm-flash"), 1800); } }, 250);
  }, [focus && focus.ts]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = tab === "all" ? projects : groups[tab];
  /* two projects publishing to the same link (e.g. made twice from one template) → mark the newer one as the copy */
  const dupOf = (p) => { if (!p.host || !p.host.slug) return null; const t = projects.filter((x) => x.host && x.host.slug === p.host.slug).sort((a, b) => (a.created || 0) - (b.created || 0) || String(a.id).localeCompare(String(b.id))); return t.length > 1 && t[0].id !== p.id ? t[0] : null; };
  const isAdmin = me && (me.role === "admin" || me.role === "owner");
  return (
    <>
      {srvVer !== null && srvVer < SERVER_VERSION && <div className="ver-warn"><b>{srvVer === 0 ? "⚠ The server file isn't answering." : `⚠ The server has an old file (v${srvVer}) — this builder needs v${SERVER_VERSION}.`}</b>
        <span>Push the latest code to GitHub, then run <code>lb-deploy</code> on the VPS.</span></div>}
      <div className="top"><div><h1>Domains</h1><p className="mut">Give every website — or a single page — its own domain (as many as you like). Add 2 DNS records; {BRAND.product} does the rest, including free https.</p></div></div>
      {vps && <div className="mode-note ok"><b>Your server:</b> point domains to <code>{vps.ip || "your VPS IP"}</code> <Copy v={vps.ip || ""} /></div>}
      {me && me.role !== "admin" && (me.siteLimit > 0 || me.domLimit > 0) && <div className="plan-note">Your plan: {me.siteLimit > 0 ? <><b>{me.sitesUsed}/{me.siteLimit}</b> live websites · </> : null}<b>{me.subsUsed}/{me.subLimit}</b> free subdomains{me.domLimit > 0 ? <> · <b>{me.domsUsed}/{me.domLimit}</b> own domains</> : null}</div>}
      <FreeSubs projects={projects} me={me} onPublish={onPublish} />
      {serverOn(integ) && me && me.role === "admin" && (vps.sitesDomain || (integ.server && integ.server.sitesDomain)) && <AutoSub integ={integ} onInteg={onInteg} projects={projects} info={vps} />}
      <div className="stats">
        <div className="stat"><span>Live sites</span><b>{projects.filter((p) => p.netlify || p.host).length}</b></div>
        <div className="stat"><span>Need a domain</span><b>{groups.needs.length}</b></div>
        <div className="stat"><span>Connected</span><b>{groups.connected.length}</b></div>
      </div>
      {!projects.length ? <div className="empty"><b>No projects yet</b><p className="mut">Create a page or website first, then publish and connect a domain.</p></div> : <>
        <div className="dm-tabs">{[["needs", "Need a domain", groups.needs.length], ["connected", "Connected", groups.connected.length], ["draft", "Not published", groups.draft.length], ["all", "All projects", projects.length]].map(([k, l, n]) =>
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l} <span>{n}</span></button>)}</div>
        {!shown.length ? <div className="empty dm-empty"><b>{tab === "needs" ? "🎉 Every live project has a domain" : tab === "connected" ? "Nothing connected yet" : tab === "draft" ? "Everything is published" : "No projects"}</b>
          <p className="mut">{tab === "needs" ? "Projects that are live only on the temporary link show up here." : tab === "connected" ? "Give a live project a free subdomain above, or connect your own domain under “Need a domain”." : ""}</p></div>
          : shown.map((p) => { const twin = dupOf(p); return <div key={p.id} id={"dm-" + p.id} className={"dm-wrap s-" + st(p)}>
            {twin && <div className="dm-dup"><b>⚠ Same live link as “{twin.name}”.</b> These are 2 projects publishing to the same address, so one replaces the other.
              <div className="row"><button onClick={() => { if (window.confirm(`Make this copy a draft? Its content stays — publish it later with its own link name. "${twin.name}" stays live.`)) onPatch(p.id, { host: null, status: "draft", domain: "", domainStatus: "", domainCheck: null }); }}>Unlink this copy</button>
                <button onClick={() => onOpen(p.id)}>Open it</button></div></div>}
            <span className={"dm-tag " + st(p)}>{st(p) === "connected" ? "● Connected · " + liveAddr(p, subs).replace(/^https?:\/\//, "").replace(/\/$/, "") : st(p) === "needs" ? "Needs a domain" : "Not published"}</span>
            {p.host ? <ServerCard p={p} onPatch={onPatch} onPatchPage={onPatchPage} onOpen={onOpen} integ={integ} onSetup={onSetup} vps={vps} subs={subs} /> : p.netlify ? <DomainCard p={p} onPatch={onPatch} onOpen={onOpen} integ={integ} onSetup={onSetup} onPublish={onPublish} /> : <PublishFirst p={p} onPublish={onPublish} />}</div>; })}
      </>}
      {isAdmin && <Suspense fallback={<div className="lazy-load"><span className="pub-spin" /></div>}><AdminPanel me={me} ip={vps.ip} /></Suspense>}
    </>
  );
}
