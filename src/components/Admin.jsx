// LaunchBuilder v67 — Admin.jsx (shown at the bottom of the Domains page, only to the admin / a workspace owner)
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

export default function Admin({ me, ip = "" }) {
  const owner = me.role === "owner";
  const [tab, setTab] = useState("users");
  return (
    <div className="adm adm-embed">
      <div className="adm-head"><span className="adm-badge">🔒 {owner ? "Workspace owner" : "Admin"}</span>
        <div><h2>{owner ? "My clients" : "Admin panel"}</h2>
          <p className="mut">{owner ? "Everyone using your workspace — sign-ups, logins and what they've published. Only you see this." : "Only you see this. Users have every feature — here you control the users, and give your software to other businesses on their own domain."}</p></div></div>
      <div className="adm-tabs">
        <button className={tab === "users" ? "on" : ""} onClick={() => setTab("users")}>👥 Accounts</button>
        <button className={tab === "wl" ? "on" : ""} onClick={() => setTab("wl")}>{owner ? "🎨 My brand" : "🏷 Give software to a client"}</button>
        {!owner && <button className={tab === "dns" ? "on" : ""} onClick={() => setTab("dns")}>⚙ Free-subdomain DNS</button>}
      </div>
      {tab === "users" ? <Users me={me} /> : tab === "wl" ? <WhiteLabel me={me} /> : <div className="panel adm-dns">
        <b>One DNS record makes every free subdomain work</b>
        <p className="mut">In the DNS of <b>{me.subBase || "your domain"}</b> (Hostinger → Domains → {me.subBase || "your domain"} → DNS records) add:</p>
        <div className="ltable"><table><thead><tr><th>Type</th><th>Name</th><th>Value</th></tr></thead><tbody><tr><td><b>A</b></td><td><C v="*" /></td><td><C v={ip || me.ip || "your VPS IP"} /></td></tr></tbody></table></div>
        <p className="mut sm">Already done? Then nothing else is needed — users click “Live” and their subdomain opens within ~2 minutes.</p></div>}
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

/* ---------------- white-label: your software on a client's own domain ---------------- */
const msgFor = (t, ip) => {
  const root = rootDomain(t.app_domain), sub = t.app_domain !== root ? t.app_domain.slice(0, -(root.length + 1)) : "@";
  return `Hi! Your ${t.product || t.name} builder is ready.\n\nPlease add these 2 records in the DNS of ${root} (where you bought the domain):\n\n1) Type: A   Name: ${sub}   Value: ${ip}\n2) Type: A   Name: *   Value: ${ip}\n\nDelete any old A/AAAA records with the same names. In 10–30 minutes open https://${t.app_domain} and create your account with ${t.owner_email || "your email"}.`;
};
function WhiteLabel({ me }) {
  const owner = me.role === "owner";
  const [d, setD] = useState(null), [err, setErr] = useState(""), [edit, setEdit] = useState(null), [chk, setChk] = useState({}), [busy, setBusy] = useState(""), [copied, setCopied] = useState("");
  const load = () => admin("tenants").then((r) => { setD(r); setErr(""); if (owner && r.tenants[0]) setEdit((e) => e || { ...EMPTY, ...r.tenants[0] }); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const check = async (t) => { setChk((c) => ({ ...c, [t.id]: "busy" })); try { const r = await admin("tenant_check", { id: t.id }); setChk((c) => ({ ...c, [t.id]: r })); } catch (e) { setChk((c) => ({ ...c, [t.id]: { error: e.message } })); } };
  const toggle = async (t) => { setBusy(t.id); try { await admin("tenant_save", { tenant: { id: t.id, active: !t.active } }); await load(); } catch (e) { window.alert(e.message); } setBusy(""); };
  const del = async (t) => { if (!window.confirm(`Delete "${t.name}"?`)) return; try { await admin("tenant_del", { id: t.id }); await load(); } catch (e) { window.alert(e.message); } };
  if (err) return <div className="panel adm-err"><b>Couldn't load</b><p className="mut">{err}</p></div>;
  if (!d) return <div className="lazy-load"><span className="pub-spin" /></div>;
  if (owner) return edit ? <TenantForm t={edit} owner onDone={() => load()} /> : <p className="mut">No workspace found.</p>;
  return (
    <>
      {!edit && <div className="panel wl-how">
        <b>Give your software to a client — 3 simple steps</b>
        <div className="wl-steps">
          <div><span>1</span><b>Add the client</b><small>Their name, logo, colour and the address they want (like app.theirbrand.com).</small></div>
          <div><span>2</span><b>Send them 1 message</b><small>It has the 2 DNS records they add. No code, nothing to install.</small></div>
          <div><span>3</span><b>They're live</b><small>Their customers sign up on their address. You can pause them any time.</small></div>
        </div>
        <button className="adm-go" onClick={() => setEdit({ ...EMPTY })}>＋ Add a client</button>
      </div>}
      {edit && <TenantForm t={edit} onDone={() => { setEdit(null); load(); }} onCancel={() => setEdit(null)} />}
      {d.tenants.map((t) => {
        const c = chk[t.id];
        return (
          <div key={t.id} className={"panel wl-card" + (t.active === false ? " off" : "")}>
            <div className="wl-h">
              <span className="wl-logo" style={{ background: t.color || "#f5b301" }}>{t.logo ? <img src={t.logo} alt="" /> : (t.product || t.name || "?")[0].toUpperCase()}</span>
              <div><b>{t.name}</b><small><a href={"https://" + t.app_domain} target="_blank" rel="noopener">{t.app_domain} ↗</a> · {t.users}{t.max_users ? " / " + t.max_users : ""} accounts</small></div>
              <div className="grow" />
              <span className={"fs-st " + (t.active === false ? "wait" : t.https ? "on" : "wait")}>{t.active === false ? "Paused" : t.https ? "● Live" : "Waiting for their DNS"}</span>
              <button onClick={() => setEdit({ ...EMPTY, ...t })}>Edit</button>
              <button disabled={busy === t.id} onClick={() => toggle(t)}>{t.active === false ? "▶ Switch on" : "⏸ Pause"}</button>
              {!t.users && <button className="red" onClick={() => del(t)}>Delete</button>}
            </div>
            {!t.https && t.active !== false && <div className="wl-send">
              <b>Send this to {t.name}:</b>
              <pre>{msgFor(t, d.ip || "your VPS IP")}</pre>
              <div className="row">
                <button className="adm-go" onClick={() => { copy(msgFor(t, d.ip)); setCopied(t.id); setTimeout(() => setCopied(""), 1600); }}>{copied === t.id ? "✓ Copied" : "Copy message"}</button>
                <a className="btn" href={"https://wa.me/?text=" + encodeURIComponent(msgFor(t, d.ip))} target="_blank" rel="noopener">Send on WhatsApp</a>
                <button onClick={() => check(t)} disabled={c === "busy"}>{c === "busy" ? "Checking…" : "Check their DNS"}</button>
              </div>
              <p className="mut sm">You, once: Supabase → Authentication → URL Configuration → Redirect URLs → add <C v={"https://" + t.app_domain + "/**"} /></p>
              {c && c !== "busy" && (c.error ? <div className="cw-st bad">{c.error}</div> : <div className="wl-chk">
                <div className={c.app_ok ? "ok" : "bad"}>{c.app_ok ? "✓" : "✕"} {t.app_domain} → {c.app.length ? c.app.join(", ") : "not added yet"}</div>
                {t.sites_domain && <div className={c.wild_ok ? "ok" : "bad"}>{c.wild_ok ? "✓" : "✕"} * (subdomains) → {c.wild.length ? c.wild.join(", ") : "not added yet"}</div>}
                <div className={c.app_https ? "ok" : "wait"}>{c.app_https ? "✓ https is on — they're live" : "… https turns on by itself ~2 minutes after the records work"}</div>
              </div>)}
            </div>}
          </div>
        );
      })}
    </>
  );
}

function TenantForm({ t, owner = false, onDone, onCancel }) {
  const [v, setV] = useState(t), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [ok, setOk] = useState("");
  useEffect(() => { if (!ok && !err) return; const x = setTimeout(() => { setOk(""); setErr(""); }, ok ? 5000 : 9000); return () => clearTimeout(x); }, [ok, err]);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  /* any picture (PNG, JPG, WEBP, GIF, SVG, AVIF, BMP, ICO, any size) → shrunk to a crisp 256 px PNG */
  const [drag, setDrag] = useState(false);
  const logoFile = (f) => {
    if (!f) return; setErr("");
    if (!/^image\//.test(f.type) && !/\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)$/i.test(f.name)) return setErr("Please choose a picture file (PNG, JPG, SVG, WEBP…).");
    if (f.size > 15 * 1024 * 1024) return setErr("That picture is bigger than 15 MB — choose a smaller one.");
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 256, h = img.naturalHeight || 256, k = Math.min(1, 256 / Math.max(w, h));
      const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      setV((x) => ({ ...x, logo: c.toDataURL("image/png") }));
    };
    img.onerror = () => { URL.revokeObjectURL(url); setErr("This picture can't be opened in the browser — try PNG or JPG."); };
    img.src = url;
  };
  const save = async () => {
    setErr(""); setOk(""); setBusy(true);
    const app = String(v.app_domain || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    /* simple defaults: software name = client name, their customers' subdomains under their own domain */
    const send = owner ? v : { ...v, app_domain: app, product: v.product || v.name, sites_domain: v.sites_domain || (app ? rootDomain(app) : "") };
    try { const r = await admin("tenant_save", { tenant: send }); setV({ ...send, id: r.id }); if (owner) setOk("Saved — reload your builder address to see it."); else onDone(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const F = ({ k, l, ph, hint, type = "text" }) => <label className="wl-f">{l}<input type={type} value={v[k] ?? ""} onChange={set(k)} placeholder={ph} />{hint && <small className="mut">{hint}</small>}</label>;
  const logo = <div className="wl-f">Logo
    <label className={"wl-drop" + (drag ? " on" : "")} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); logoFile(e.dataTransfer.files[0]); }}>
      {v.logo ? <img src={v.logo} alt="" /> : <span className="wl-drop-ic">⬆</span>}
      <span><b>{v.logo ? "Change logo" : "Upload logo"}</b><small>Click or drop any picture</small></span>
      <input type="file" hidden accept="image/*,.svg,.ico" onChange={(e) => { logoFile(e.target.files[0]); e.target.value = ""; }} />
    </label>
    <div className="wl-logo-in"><input value={v.logo && v.logo.startsWith("data:") ? "" : v.logo || ""} onChange={set("logo")} placeholder="…or paste an https:// image link" />{v.logo && <button type="button" onClick={() => setV({ ...v, logo: "" })}>Remove</button>}</div></div>;
  /* theme colours: main = buttons, active menu, highlights · second = text & glows on the dark parts (e.g. "Upgrade to Pro") */
  const PRESETS = [["Gold (default)", "#f5b301", "#ffd35c"], ["Green", "#10b981", "#6ee7b7"], ["Blue", "#2563eb", "#93c5fd"], ["Purple", "#7c3aed", "#c4b5fd"], ["Pink", "#db2777", "#f9a8d4"], ["Orange", "#ea580c", "#fdba74"], ["Red", "#dc2626", "#fca5a5"], ["Teal", "#0d9488", "#5eead4"]];
  const c1 = v.color || "#f5b301", c2 = v.color2 || "#ffd35c";
  const color = <div className="wl-f wl-theme">Theme colours
    <div className="wl-presets">{PRESETS.map(([n, a, b]) => <button key={n} type="button" title={n} className={c1 === a && c2 === b ? "on" : ""} onClick={() => setV({ ...v, color: a, color2: b })}><i style={{ background: a }} /><i style={{ background: b }} /></button>)}</div>
    <div className="wl-two">
      <label>Main colour<small>buttons, active menu, highlights</small><div className="wl-col"><input type="color" value={c1} onChange={set("color")} /><input value={v.color || ""} placeholder="#f5b301" onChange={set("color")} /></div></label>
      <label>Second colour<small>text & glows on the dark parts</small><div className="wl-col"><input type="color" value={c2} onChange={set("color2")} /><input value={v.color2 || ""} placeholder="#ffd35c" onChange={set("color2")} /></div></label>
    </div>
    <div className="wl-mock"><div className="wl-mock-side"><span className="wl-mock-logo" style={{ background: c1 }} /><em style={{ color: c1 }}>● Domains</em><em>Projects</em><b style={{ color: c2, borderColor: c1 }}>👑 Upgrade to Pro</b></div>
      <div className="wl-mock-main"><span>Preview</span><button type="button" style={{ background: "#0d1324", color: c1 }}>🚀 Live</button><button type="button" style={{ background: c1, color: "#0d1324" }}>Use</button><i style={{ background: c2 }} /></div></div>
    <button type="button" className="wl-reset" onClick={() => setV({ ...v, color: "#f5b301", color2: "#ffd35c" })}>Reset to default colours</button>
  </div>;
  return (
    <div className="panel wl-form">
      <div className="wl-fh"><b>{owner ? "Your brand" : v.id ? "Edit " + v.name : "Add a client"}</b>
        <div className="wl-prev"><span className="wl-logo" style={{ background: v.color || "#f5b301" }}>{v.logo ? <img src={v.logo} alt="" /> : (v.product || v.name || "A")[0].toUpperCase()}</span><b>{v.product || v.name || "Their brand"}</b><i style={{ background: v.color || "#f5b301" }} /></div></div>
      <div className="wl-fg">
        {owner ? F({ k: "product", l: "Software name", ph: "ABC Sites" }) : F({ k: "name", l: "Client / brand name", ph: "ABC Sites" })}
        {!owner && F({ k: "app_domain", l: "Their address for the builder", ph: "app.theirbrand.com", hint: "Use a NEW address like app.theirbrand.com — not a domain that already shows a website. Their customers get name.theirbrand.com" })}
        {!owner && F({ k: "owner_email", l: "Client's login email", ph: "owner@theirbrand.com", hint: "The client's own email (not yours). They sign up with it on their address and see their customers." })}
        {logo}{color}
      </div>
      <details className="wl-more"><summary>More options</summary>
        <div className="wl-fg">
          {!owner && F({ k: "product", l: "Software name (if different)", ph: v.name || "Same as client name" })}
          {!owner && F({ k: "sites_domain", l: "Domain for their customers' subdomains", ph: v.app_domain ? rootDomain(String(v.app_domain).replace(/^https?:\/\//, "")) : "theirbrand.com" })}
          {!owner && F({ k: "max_users", l: "Max accounts", ph: "Unlimited", type: "number" })}
          {!owner && F({ k: "sub_limit", l: "Free subdomains per account", ph: "5", type: "number" })}
          {F({ k: "support_email", l: "Support email", ph: "support@theirbrand.com" })}
          {F({ k: "whatsapp", l: "Support WhatsApp", ph: "919876543210" })}
          {!owner && <label className="wl-f wl-chk2"><input type="checkbox" checked={v.active !== false} onChange={set("active")} /> Active</label>}
        </div></details>
      {err && <div className="cw-st bad">{err}</div>}{ok && <div className="cw-st ok">{ok}</div>}
      <div className="row"><button className="adm-go" disabled={busy} onClick={save}>{busy ? "Saving…" : owner ? "Save" : v.id ? "Save" : "Save & get the message for the client"}</button>{onCancel && <button onClick={onCancel}>Cancel</button>}</div>
    </div>
  );
}
