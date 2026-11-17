// LaunchBuilder v66 — Admin.jsx
// Admin: every account (who signed up, who logged in, last active, websites, domains, free subdomains), pause/limit accounts,
// and white-label clients — your software on THEIR domain (app.abc.com) with their name, logo and colours. No code leaves your server.
// A white-label owner sees the same page as "My clients", limited to their own workspace.
import { useState, useEffect, useMemo } from "react";
import { admin, ago, rootDomain } from "../lib.js";

const day = (t) => (t ? new Date(t * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const since = (t) => (t ? ago(t * 1000) : "never");
const copy = (v) => { try { navigator.clipboard.writeText(v); } catch { /* old browser */ } };
const Copy = ({ v }) => <button className="xs" onClick={() => copy(v)}>Copy</button>;
const C = ({ v }) => <><code>{v}</code> <Copy v={v} /></>;
const EMPTY = { name: "", product: "", logo: "", color: "#f5b301", color2: "#ffd35c", app_domain: "", sites_domain: "", owner_email: "", max_users: "", sub_limit: 5, support_email: "", whatsapp: "", active: true };

export default function Admin({ me }) {
  const owner = me.role === "owner";
  const [tab, setTab] = useState("users");
  return (
    <div className="adm">
      <div className="top"><div><h1>{owner ? "My clients" : "Admin"}</h1>
        <p className="mut">{owner ? "Everyone who uses your workspace — who signed up, when they last logged in, and what they've published." : "Every account on your platform, and the clients who use your software under their own brand."}</p></div></div>
      <div className="adm-tabs">
        <button className={tab === "users" ? "on" : ""} onClick={() => setTab("users")}>Accounts</button>
        <button className={tab === "wl" ? "on" : ""} onClick={() => setTab("wl")}>{owner ? "My brand" : "White-label clients"}</button>
      </div>
      {tab === "users" ? <Users me={me} /> : <WhiteLabel me={me} />}
    </div>
  );
}

/* ---------------- accounts ---------------- */
function Users({ me }) {
  const [d, setD] = useState(null), [err, setErr] = useState(""), [q, setQ] = useState(""), [f, setF] = useState("all"), [ws, setWs] = useState(""), [busy, setBusy] = useState("");
  const load = () => admin("users").then((r) => { setD(r); setErr(""); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);
  const set = async (u, o) => { setBusy(u.uid); try { await admin("user", { uid: u.uid, ...o }); await load(); } catch (e) { window.alert(e.message); } setBusy(""); };
  const list = useMemo(() => {
    if (!d) return [];
    const now = Date.now() / 1000, s = q.trim().toLowerCase();
    return d.users.filter((u) => (!s || (u.email + " " + u.name).toLowerCase().includes(s))
      && (f === "all" || (f === "active" && u.last_seen > now - 7 * 86400) || (f === "paused" && u.disabled) || (f === "never" && (u.never || !u.sites)))
      && (!ws || (ws === "_main" ? !u.tenant : u.tenant === ws)));
  }, [d, q, f, ws]);
  if (err) return <div className="panel adm-err"><b>Couldn't load accounts</b><p className="mut">{/Unknown action/i.test(err) ? "The server file is old — push the new files and run lb-deploy on the VPS." : err}</p></div>;
  if (!d) return <div className="lazy-load"><span className="pub-spin" /></div>;
  const t = d.totals, wsList = [...new Map(d.users.filter((u) => u.tenant).map((u) => [u.tenant, u.tenantName || u.tenant])).entries()];
  const csv = () => {
    const rows = [["Email", "Name", "Workspace", "Signed up", "Last login", "Last active", "Websites", "Domains", "Subdomains", "Status"], ...list.map((u) => [u.email, u.name, u.tenantName || "Main", day(u.created), day(u.last_login), day(u.last_seen), u.sites, u.domains, u.subs, u.disabled ? "Paused" : "Active"])];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" })); a.download = "accounts.csv"; a.click();
  };
  return (
    <>
      {!me.accounts && <div className="ver-warn"><b>⚠ Accounts aren't switched on on the server yet.</b><span>On the VPS run <code>bash /opt/launchbuilder/vps/lb-saas-setup.sh</code> once — until then only your own sites are separated.</span></div>}
      {d.warn && <div className="ver-warn"><b>⚠ {d.warn}</b></div>}
      <div className="adm-stats">
        {[["Accounts", t.users], ["Active · 7 days", t.active7], ["Websites", t.sites], ["Custom domains", t.domains], ["Free subdomains", t.subs], ...(me.role === "admin" ? [["White-label clients", t.tenants]] : [])].map(([l, v]) => <div key={l} className="adm-stat"><span>{l}</span><b>{v}</b></div>)}
      </div>
      <div className="adm-bar">
        <input className="adm-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or name…" />
        <select value={f} onChange={(e) => setF(e.target.value)}><option value="all">All accounts</option><option value="active">Active in 7 days</option><option value="never">Nothing published</option><option value="paused">Paused</option></select>
        {me.role === "admin" && wsList.length > 0 && <select value={ws} onChange={(e) => setWs(e.target.value)}><option value="">Every workspace</option><option value="_main">Main (yours)</option>{wsList.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>}
        <div className="grow" /><button onClick={load}>↻ Refresh</button><button onClick={csv}>⬇ Export CSV</button>
      </div>
      {!d.serviceKey && me.role === "admin" && <p className="mut sm adm-hint">Shows accounts that opened the builder. To also list accounts that only signed up, add the Supabase secret key when running <code>lb-saas-setup.sh</code>.</p>}
      <div className="adm-table"><table>
        <thead><tr><th>Account</th>{me.role === "admin" && <th>Workspace</th>}<th>Signed up</th><th>Last login</th><th>Last active</th><th>Websites</th><th>Domains</th><th>Free subdomains</th><th>Status</th></tr></thead>
        <tbody>{list.map((u) => (
          <tr key={u.uid} className={u.disabled ? "off" : ""}>
            <td><div className="adm-who"><span className="av">{(u.name || u.email || "?")[0].toUpperCase()}</span><div><b>{u.name || u.email.split("@")[0]}</b><small>{u.email}</small>
              <div className="adm-tags">{u.admin && <em className="t-adm">Admin</em>}{u.never && <em>Never opened</em>}{u.confirmed === false && <em>Email not confirmed</em>}</div></div></div></td>
            {me.role === "admin" && <td>{u.tenantName || <span className="mut">Main</span>}</td>}
            <td>{day(u.created)}</td><td>{since(u.last_login)}</td>
            <td>{since(u.last_seen)}{u.dev && <small className="mut"> · {u.dev}</small>}{u.ip && <small className="mut adm-ip">{u.ip}</small>}</td>
            <td><b>{u.sites}</b></td><td><b>{u.domains}</b></td>
            <td>{u.subs} / {me.role === "admin" && !u.admin && !u.never ? <input className="adm-lim" type="number" min="0" defaultValue={u.sub_limit ?? ""} placeholder="5" title="Free subdomains for this account (empty = default)" onBlur={(e) => { const v = e.target.value; if (String(v) !== String(u.sub_limit ?? "")) set(u, { sub_limit: v === "" ? null : +v }); }} /> : u.admin ? "∞" : (u.sub_limit ?? "5")}</td>
            <td>{u.admin || u.never ? <span className="badge published">Active</span> : <button className={"xs " + (u.disabled ? "pri" : "red")} disabled={busy === u.uid} onClick={() => { if (u.disabled || window.confirm(`Pause ${u.email}? They can't publish or change anything until you switch them back on. Their live websites keep working.`)) set(u, { disabled: !u.disabled }); }}>{u.disabled ? "▶ Switch on" : "⏸ Pause"}</button>}</td>
          </tr>))}
          {!list.length && <tr><td colSpan="9" className="mut adm-none">No accounts match.</td></tr>}
        </tbody></table></div>
    </>
  );
}

/* ---------------- white-label clients ---------------- */
function WhiteLabel({ me }) {
  const owner = me.role === "owner";
  const [d, setD] = useState(null), [err, setErr] = useState(""), [edit, setEdit] = useState(null), [chk, setChk] = useState({}), [busy, setBusy] = useState("");
  const load = () => admin("tenants").then((r) => { setD(r); setErr(""); if (owner && r.tenants[0]) setEdit((e) => e || { ...EMPTY, ...r.tenants[0] }); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const check = async (t) => { setChk((c) => ({ ...c, [t.id]: "busy" })); try { const r = await admin("tenant_check", { id: t.id }); setChk((c) => ({ ...c, [t.id]: r })); } catch (e) { setChk((c) => ({ ...c, [t.id]: { error: e.message } })); } };
  const toggle = async (t) => { setBusy(t.id); try { await admin("tenant_save", { tenant: { id: t.id, active: !t.active } }); await load(); } catch (e) { window.alert(e.message); } setBusy(""); };
  const del = async (t) => { if (!window.confirm(`Delete the workspace "${t.name}"?`)) return; try { await admin("tenant_del", { id: t.id }); await load(); } catch (e) { window.alert(e.message); } };
  if (err) return <div className="panel adm-err"><b>Couldn't load</b><p className="mut">{err}</p></div>;
  if (!d) return <div className="lazy-load"><span className="pub-spin" /></div>;
  if (owner) return edit ? <TenantForm t={edit} owner ip={d.ip} onDone={() => { setEdit(null); load(); }} /> : <p className="mut">No workspace found.</p>;
  return (
    <>
      <div className="panel wl-how">
        <b>How white-label works</b>
        <ol><li>Your client points <b>their</b> domain to your server with 2 DNS records — nothing to install, no code given.</li>
          <li>They open the builder at their address (like <b>app.theirbrand.com</b>) with their name, logo and colours.</li>
          <li>Their customers sign up there, and get free subdomains like <b>shop.theirbrand.com</b>. Custom domains work too.</li>
          <li>You see and control everything here. Switch a client off any time.</li></ol>
        <button className="pri" onClick={() => setEdit({ ...EMPTY })}>＋ Add white-label client</button>
      </div>
      {edit && <TenantForm t={edit} ip={d.ip} main={d.main} onDone={() => { setEdit(null); load(); }} onCancel={() => setEdit(null)} />}
      {d.tenants.map((t) => {
        const c = chk[t.id], appRoot = t.app_domain ? rootDomain(t.app_domain) : "", appName = t.app_domain && t.app_domain !== appRoot ? t.app_domain.slice(0, -(appRoot.length + 1)) : "@";
        const subRoot = t.sites_domain ? rootDomain(t.sites_domain) : "", subName = t.sites_domain && t.sites_domain !== subRoot ? "*." + t.sites_domain.slice(0, -(subRoot.length + 1)) : "*";
        return (
          <div key={t.id} className={"panel wl-card" + (t.active === false ? " off" : "")}>
            <div className="wl-h">
              <span className="wl-logo" style={{ background: t.color || "#f5b301" }}>{t.logo ? <img src={t.logo} alt="" /> : (t.product || t.name || "?")[0].toUpperCase()}</span>
              <div><b>{t.name}</b><small>{t.product || t.name} · {t.users}{t.max_users ? " / " + t.max_users : ""} accounts · {t.sub_limit === "" || t.sub_limit == null ? 5 : t.sub_limit} free subdomains each</small></div>
              <div className="grow" />
              <span className={"badge " + (t.active === false ? "draft" : "published")}>{t.active === false ? "Paused" : "● Active"}</span>
              {t.app_domain && <a className="btn" href={"https://" + t.app_domain} target="_blank" rel="noopener">Open ↗</a>}
              <button onClick={() => setEdit({ ...EMPTY, ...t })}>Edit</button>
              <button disabled={busy === t.id} onClick={() => toggle(t)}>{t.active === false ? "▶ Switch on" : "⏸ Pause"}</button>
              {!t.users && <button className="red" onClick={() => del(t)}>Delete</button>}
            </div>
            <div className="wl-grid">
              <div><span className="mut sm">Builder address</span><b>{t.app_domain || "—"}</b></div>
              <div><span className="mut sm">Their customers' subdomains</span><b>{t.sites_domain ? "name." + t.sites_domain : "—"}</b></div>
              <div><span className="mut sm">Owner (sees “My clients”)</span><b>{t.owner_email || "—"}</b></div>
            </div>
            <details className="wl-dns" open={!t.https}>
              <summary>Send these steps to your client {t.https ? "· ✓ live" : ""}</summary>
              <p className="mut sm">In the DNS records of <b>{appRoot || "their domain"}</b>{subRoot && subRoot !== appRoot ? <> and <b>{subRoot}</b></> : null} add:</p>
              <div className="ltable"><table><thead><tr><th>Type</th><th>Name</th><th>Value</th><th>For</th></tr></thead><tbody>
                <tr><td><b>A</b></td><td><C v={appName} /></td><td><C v={d.ip || "your VPS IP"} /></td><td>the builder at {t.app_domain}</td></tr>
                {t.sites_domain && <tr><td><b>A</b></td><td><C v={subName} /></td><td><C v={d.ip || "your VPS IP"} /></td><td>free subdomains name.{t.sites_domain}</td></tr>}
              </tbody></table></div>
              <p className="mut sm">Delete any old <b>A</b> or <b>AAAA</b> records with the same names. https is added automatically ~2 minutes after the records work.</p>
              <p className="mut sm"><b>You (once per client):</b> Supabase → Authentication → URL Configuration → Redirect URLs → add <C v={"https://" + (t.app_domain || "app.theirbrand.com") + "/**"} /> so sign-up emails bring people back to their address.</p>
              <div className="row"><button onClick={() => check(t)} disabled={c === "busy"}>{c === "busy" ? "Checking…" : "Check DNS"}</button></div>
              {c && c !== "busy" && (c.error ? <div className="cw-st bad">{c.error}</div> : <div className="wl-chk">
                <div className={c.app_ok ? "ok" : "bad"}>{c.app_ok ? "✓" : "✕"} {t.app_domain} → {c.app.length ? c.app.join(", ") : "no A record yet"}{c.app_ok && !c.app_opens ? " (points here — the server answers within a minute)" : ""}</div>
                {t.sites_domain && <div className={c.wild_ok ? "ok" : "bad"}>{c.wild_ok ? "✓" : "✕"} *.{t.sites_domain} → {c.wild.length ? c.wild.join(", ") : "no wildcard record yet"}</div>}
                <div className={c.app_https ? "ok" : "wait"}>{c.app_https ? "✓ https is on" : "… https comes automatically after the records work"}</div>
              </div>)}
            </details>
          </div>
        );
      })}
      {!d.tenants.length && !edit && <p className="mut adm-none">No white-label clients yet.</p>}
    </>
  );
}

function TenantForm({ t, ip, main, owner = false, onDone, onCancel }) {
  const [v, setV] = useState(t), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [ok, setOk] = useState("");
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const logoFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 250 * 1024) return setErr("Logo file is too big — use a PNG/SVG under 250 KB, or paste an https:// link.");
    const r = new FileReader(); r.onload = () => setV((x) => ({ ...x, logo: r.result })); r.readAsDataURL(f);
  };
  const save = async () => {
    setErr(""); setOk(""); setBusy(true);
    try { const r = await admin("tenant_save", { tenant: v }); setV({ ...v, id: r.id }); if (owner) setOk("Saved — reload your builder address to see it."); else onDone(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const F = ({ k, l, ph, hint, type = "text" }) => <label className="wl-f">{l}<input type={type} value={v[k] ?? ""} onChange={set(k)} placeholder={ph} />{hint && <small className="mut">{hint}</small>}</label>;
  return (
    <div className="panel wl-form">
      <div className="wl-fh"><b>{owner ? "Your brand" : v.id ? "Edit " + v.name : "New white-label client"}</b>
        <div className="wl-prev"><span className="wl-logo" style={{ background: v.color || "#f5b301" }}>{v.logo ? <img src={v.logo} alt="" /> : (v.product || v.name || "A")[0].toUpperCase()}</span><b>{v.product || v.name || "Brand name"}</b><i style={{ background: v.color }} /><i style={{ background: v.color2 }} /></div></div>
      <div className="wl-fg">
        {!owner && F({ k: "name", l: "Client name", ph: "ABC Digital Agency" })}
        {F({ k: "product", l: "Software name (shown in the builder)", ph: "ABC Sites", hint: "Replaces your product name everywhere for their users." })}
        <label className="wl-f">Logo<input value={v.logo && v.logo.startsWith("data:") ? "(uploaded image)" : v.logo || ""} onChange={set("logo")} placeholder="https://… or upload" /><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={logoFile} /></label>
        <label className="wl-f">Main colour<div className="wl-col"><input type="color" value={v.color || "#f5b301"} onChange={set("color")} /><input value={v.color || ""} onChange={set("color")} /></div></label>
        <label className="wl-f">Light colour<div className="wl-col"><input type="color" value={v.color2 || "#ffd35c"} onChange={set("color2")} /><input value={v.color2 || ""} onChange={set("color2")} /></div></label>
        {!owner && F({ k: "app_domain", l: "Builder address (their domain)", ph: "app.abcagency.com", hint: "Where they and their customers log in." })}
        {!owner && F({ k: "sites_domain", l: "Domain for their customers' free subdomains", ph: "abcagency.com", hint: "Customers get name.abcagency.com. Leave empty to give none." })}
        {!owner && F({ k: "owner_email", l: "Owner login email", ph: "owner@abcagency.com", hint: "This login sees “My clients” for this workspace only." })}
        {!owner && F({ k: "max_users", l: "Max accounts", ph: "Unlimited", type: "number" })}
        {!owner && F({ k: "sub_limit", l: "Free subdomains per account", ph: "5", type: "number" })}
        {F({ k: "support_email", l: "Support email (shown to their users)", ph: "support@abcagency.com" })}
        {F({ k: "whatsapp", l: "Support WhatsApp", ph: "919876543210" })}
        {!owner && <label className="wl-f wl-chk2"><input type="checkbox" checked={v.active !== false} onChange={set("active")} /> Active (switch off to pause the whole workspace)</label>}
      </div>
      {err && <div className="cw-st bad">{err}</div>}{ok && <div className="cw-st ok">{ok}</div>}
      {!owner && !v.id && <p className="mut sm">After saving, send your client the 2 DNS records shown on their card (server IP {ip || "—"}). Your own platform stays on {main || "your main domain"}.</p>}
      <div className="row"><button className="pri" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>{onCancel && <button onClick={onCancel}>Cancel</button>}</div>
    </div>
  );
}
