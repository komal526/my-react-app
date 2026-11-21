// LaunchBuilder v102 — EasyConnect.jsx
// SheetLink: connect a Google Sheet by pasting its link (the server's Google "robot" writes the rows — no code).
// RobotSetup: the admin adds that robot once (a Google service-account JSON key, stored encrypted on the server).
// EmailEasy: connect your mailbox with email + password (Gmail needs an App password) — emails go out from your own address.
import { useEffect, useRef, useState } from "react";
import { gsStatus, gsSetup, gsCheck, hooksSave, hooksTest, mailGet, mailSave, mailOff, ago } from "../lib.js";

/* ---------------- admin: add the Google robot once ---------------- */
export function RobotSetup({ st, onDone }) {
  const [json, setJson] = useState(""), [busy, setBusy] = useState(false), [msg, setMsg] = useState(null), [open, setOpen] = useState(!st.ready);
  const file = useRef(null);
  const save = async (txt) => {
    setBusy(true); setMsg(null);
    try { const r = await gsSetup({ json: txt || json }); setMsg(["ok", "✓ Robot added: " + r.robot]); setJson(""); setTimeout(() => setOpen(false), 2500); onDone(); } catch (e) { setMsg(["bad", e.message]); }
    setBusy(false);
  };
  const pick = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; f.text().then((t) => { setJson(t); save(t); }); e.target.value = ""; };
  const remove = async () => { if (!window.confirm("Remove the Google robot? Sheets connected by link will stop getting leads.")) return; try { await gsSetup({ remove: 1 }); onDone(); } catch (e) { setMsg(["bad", e.message]); } };
  return (
    <div className="ec-admin">
      <button className="ec-admin-h" onClick={() => setOpen(!open)}><span>🛡️ Admin · Google robot</span><b className={st.ready ? "ok" : ""}>{st.ready ? "● On" : "Not set up"}</b><i>{open ? "▴" : "▾"}</i></button>
      {open && <div className="ec-admin-b">
        {st.ready && <p className="sm">Robot email: <code>{st.robot}</code> — every user shares their sheet with this email. <button className="xs red" onClick={remove}>Remove</button></p>}
        <p className="mut sm">One-time setup (5 minutes). After this, all your users connect sheets by just pasting the link.</p>
        <ol className="ec-steps">
          <li>Open <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener">Google Cloud → New project</a> (any name) and select it.</li>
          <li>Turn on <a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" target="_blank" rel="noopener">Google Sheets API</a> → <b>Enable</b>.</li>
          <li>Go to <a href="https://console.cloud.google.com/iam-admin/serviceaccounts/create" target="_blank" rel="noopener">IAM → Service accounts → Create</a>, name it <b>leads-robot</b> → <b>Done</b> (no roles needed).</li>
          <li>Click the robot → <b>Keys → Add key → Create new key → JSON</b>. A small file downloads.</li>
          <li>Choose that file here (or open it and paste everything below).</li>
        </ol>
        <div className="ec-row"><button className="ec-go" disabled={busy} onClick={() => file.current && file.current.click()}>{busy ? "Checking…" : "📄 Choose the JSON file"}</button><input ref={file} type="file" accept=".json,application/json" hidden onChange={pick} /></div>
        <textarea className="ec-json" rows={3} value={json} onChange={(e) => setJson(e.target.value)} placeholder='…or paste it: { "type": "service_account", "client_email": "…", "private_key": "…" }' />
        {json.trim() && <button className="ec-go" disabled={busy} onClick={() => save()}>{busy ? "Checking…" : "Save robot"}</button>}
        {msg && <div className={"gs-msg " + msg[0]}>{msg[1]}</div>}
        <p className="mut sm">🔒 The key is saved encrypted on your server and never shown again or sent to browsers. Don't put it in GitHub or chat.</p>
      </div>}
    </div>
  );
}

/* ---------------- connect a sheet with its link ---------------- */
export function SheetLink({ value, onSave, userEmail, st, srv, setSrv, mailOn }) {
  const [v, setV] = useState({ link: "", tab: "", email: userEmail, notify: true, autoreply: false, subject: "Thank you!", reply: "Hi {{name}},\nthank you — we received your details and will contact you soon.", ...value });
  const [info, setInfo] = useState(null), [checking, setChecking] = useState(false), [busy, setBusy] = useState(false), [msg, setMsg] = useState(null), [copied, setCopied] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  useEffect(() => { if (srv && srv.sid) setV((x) => ({ ...x, link: x.link || srv.link || "", tab: srv.tab || x.tab, email: srv.email || x.email, notify: !!srv.notify, autoreply: !!srv.autoreply, subject: srv.subject || x.subject, reply: srv.reply || x.reply })); }, [srv]); // eslint-disable-line react-hooks/exhaustive-deps
  /* look at the sheet as soon as a link is pasted */
  useEffect(() => {
    if (!st.ready || !/spreadsheets\/d\/[\w-]{20,}/.test(v.link)) { setInfo(null); return; }
    let live = true; setChecking(true);
    const t = setTimeout(() => gsCheck(v.link, "").then((r) => { if (live) { setInfo(r); setMsg(null); } }).catch((e) => { if (live) { setInfo({ error: e.message }); } }).finally(() => live && setChecking(false)), 450);
    return () => { live = false; clearTimeout(t); };
  }, [v.link, st.ready]);
  const copyRobot = () => navigator.clipboard.writeText(st.robot).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }, () => window.prompt("Copy this email:", st.robot));
  const tabs = info && info.tabs ? info.tabs : [], tabNow = v.tab || (info && info.tab) || "";
  const save = async () => {
    setBusy(true); setMsg(["wait", "Connecting and adding a test row…"]);
    try {
      const r = await hooksSave({ link: v.link.trim(), tab: tabNow, email: v.email, notify: v.notify, autoreply: v.autoreply, subject: v.subject, reply: v.reply });
      setSrv(r.hooks);
      const t = await hooksTest();
      onSave({ link: v.link.trim(), tab: r.hooks.tab, title: r.hooks.title, ok: true, mode: "link" });
      setMsg(["ok", <>✓ Connected! A test row was added to <a href={t.sheet} target="_blank" rel="noopener">“{r.hooks.title}” → {r.hooks.tab} ↗</a>{t.mailed ? <> and an alert email went to <b>{v.email}</b></> : ""}. Every new lead will arrive the same way.{t.mailNote ? <><br /><small>Email: {t.mailNote}</small></> : ""}</>]);
    } catch (e) { setMsg(["bad", e.message]); }
    setBusy(false);
  };
  const remove = async () => { if (!window.confirm("Stop sending leads to this sheet?")) return; try { await hooksSave({ url: "" }); } catch { /* ignore */ } setSrv(null); onSave({}); setInfo(null); setV({ ...v, link: "", tab: "" }); setMsg(["ok", "Disconnected."]); };
  if (!st.ready) return <div className="ec-wait">⏳ Easy connect isn't switched on for this server yet. {st.admin ? "Add the Google robot above (one time)." : "Ask your admin to add the Google robot — or use “Apps Script” instead."}</div>;
  const linked = srv && srv.sid;
  return (
    <div className="ec">
      <ol className="ec-steps big">
        <li><span>1</span><div><b>Share your sheet with our robot</b><small>In your Google Sheet click <b>Share</b> → paste this email → choose <b>Editor</b> → <b>Send</b>.</small>
          <div className="ec-robot"><code>{st.robot}</code><button onClick={copyRobot}>{copied ? "✓ Copied" : "Copy"}</button></div>
          <a className="ec-mini" href="https://sheets.new" target="_blank" rel="noopener">No sheet yet? Create one ↗</a></div></li>
        <li><span>2</span><div><b>Paste the sheet link</b><small>Copy it from the address bar of your sheet (the tab you're on is picked automatically).</small>
          <input className="gs-url" value={v.link} onChange={(e) => setV({ ...v, link: e.target.value.trim(), tab: "" })} placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=0" />
          {checking && <div className="ec-chk mut sm">Checking your sheet…</div>}
          {info && info.error && <div className="ec-chk bad">✕ {info.error}</div>}
          {info && !info.error && <div className="ec-chk ok">✓ Found <b>“{info.title}”</b> — leads go into the tab
            <select value={tabNow} onChange={(e) => setV({ ...v, tab: e.target.value === "__new" ? "Leads" : e.target.value })}>
              {tabs.map((t) => <option key={t.id} value={t.title}>{t.title}</option>)}
              {!tabs.some((t) => t.title === tabNow) && tabNow && <option value={tabNow}>{tabNow} (new tab)</option>}
              {!tabs.some((t) => t.title === "Leads") && tabNow !== "Leads" && <option value="__new">➕ New tab “Leads”</option>}
            </select></div>}
          {v.link && !/spreadsheets\/d\//.test(v.link) && <div className="ec-chk bad">That doesn't look like a Google Sheet link.</div>}</div></li>
      </ol>
      <div className="gs-opts">
        <label className="gs-chk"><input type="checkbox" checked={!!v.notify} onChange={set("notify")} /> Email me every new lead at</label>
        <input className="gs-em" value={v.email} onChange={set("email")} placeholder="you@gmail.com" disabled={!v.notify} />
        <label className="gs-chk"><input type="checkbox" checked={!!v.autoreply} onChange={set("autoreply")} /> Send a thank-you email to the person (when the form has an email field)</label>
        {v.autoreply && <div className="gs-reply"><input value={v.subject} onChange={set("subject")} placeholder="Subject" /><textarea rows={3} value={v.reply} onChange={set("reply")} /><small className="mut">{"{{name}}"} becomes the person's name.</small></div>}
        {(v.notify || v.autoreply) && !mailOn && <p className="ec-note">✉ Emails are sent from your own mailbox — connect it once in <b>Email automation</b> (email + password). The sheet works without it.</p>}
      </div>
      <div className="gs-row">
        <button className="gs-go" disabled={busy || !info || !!info.error} onClick={save}>{busy ? "Connecting…" : linked ? "Save & send a test" : "Connect & send a test"}</button>
        {linked && <button className="xs red" onClick={remove}>Disconnect</button>}
        {linked && srv.last && <span className="mut sm">Last lead {ago(srv.last.t * 1000)}{srv.last.err ? " — " + srv.last.err : " ✓"}</span>}
      </div>
      {msg && <div className={"gs-msg " + msg[0]}>{msg[1]}</div>}
    </div>
  );
}

/* the sheet card's status (+ admin robot box) */
export function useRobot() {
  const [st, setSt] = useState({ ready: false, robot: "", admin: false, loaded: false });
  const load = () => gsStatus().then((r) => setSt({ ...r, loaded: true })).catch(() => setSt((x) => ({ ...x, loaded: true })));
  useEffect(() => { load(); }, []);
  return [st, load];
}

/* ---------------- email with email + password ---------------- */
const PROV = [
  ["gmail", "Gmail", "📧"], ["zoho", "Zoho Mail", "🟥"], ["hostinger", "Hostinger email", "🟪"], ["titan", "Titan / GoDaddy", "🟦"], ["yahoo", "Yahoo", "🟣"], ["custom", "Other (SMTP)", "⚙️"],
];
export function EmailEasy({ em, onSave, userEmail }) {
  const [v, setV] = useState({ provider: "gmail", user: userEmail || "", pass: "", from: em.fromName || "", owner: em.ownerEmail || userEmail || "", host: "", port: "465", sec: "ssl" });
  const [cur, setCur] = useState(null), [busy, setBusy] = useState(false), [msg, setMsg] = useState(null), [show, setShow] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  useEffect(() => { mailGet().then((r) => { if (r.mail) { setCur(r.mail); setV((x) => ({ ...x, provider: r.mail.provider, user: r.mail.user, from: r.mail.from || x.from, owner: r.mail.owner || x.owner, host: r.mail.provider === "custom" ? r.mail.host : x.host, port: String(r.mail.port || 465), sec: r.mail.sec || "ssl" })); } }).catch(() => {}); }, []);
  const g = v.provider === "gmail", y = v.provider === "yahoo";
  const connect = async () => {
    setBusy(true); setMsg(["wait", "Signing in to your mailbox and sending a test email…"]);
    try {
      const r = await mailSave({ ...v, port: +v.port || 465 });
      setCur(r.mail); setV((x) => ({ ...x, pass: "" }));
      onSave({ provider: "smtp", smtpOk: true, ownerEmail: r.mail.owner, fromName: r.mail.from, smtpUser: r.mail.user });
      setMsg(["ok", <>✓ Connected! A test email was sent to <b>{r.mail.owner}</b> — check your inbox (and spam). Now turn it on per form: <b>Forms → your form → Settings → Email automation</b>.</>]);
    } catch (e) { setMsg(["bad", e.message]); }
    setBusy(false);
  };
  const off = async () => { if (!window.confirm("Disconnect this email? Forms will stop sending emails.")) return; try { await mailOff(); } catch { /* ignore */ } setCur(null); onSave({ provider: "smtp", smtpOk: false }); setMsg(["ok", "Disconnected."]); };
  return (
    <div className="ec">
      {cur && <div className="ec-on">✓ Sending from <b>{cur.user}</b>{cur.last && cur.last.t ? <span className="mut sm"> · last email {ago(cur.last.t * 1000)}{cur.last.err ? " — failed: " + cur.last.err : ""}</span> : null}<button className="xs red" onClick={off}>Disconnect</button></div>}
      <div className="ec-prov">{PROV.map(([k, l, ic]) => <button key={k} className={v.provider === k ? "on" : ""} onClick={() => setV({ ...v, provider: k })}><span>{ic}</span>{l}</button>)}</div>
      <div className="ig-g">
        <label>Your email address<input type="email" value={v.user} onChange={set("user")} placeholder={g ? "you@gmail.com" : "you@yourbrand.com"} autoComplete="off" /></label>
        <label>{g ? "Gmail App password" : y ? "Yahoo App password" : "Email password"}
          <span className="ec-pw"><input type={show ? "text" : "password"} value={v.pass} onChange={set("pass")} placeholder={cur ? "•••••• (saved — type only to change)" : g ? "16 letters, e.g. abcd efgh ijkl mnop" : "Your mailbox password"} autoComplete="new-password" /><button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></span></label>
      </div>
      {g && <div className="ec-help"><b>Gmail needs an App password</b> (Google blocks normal passwords for apps):
        <ol><li>Turn on <a href="https://myaccount.google.com/signinoptions/twosv" target="_blank" rel="noopener">2-Step Verification</a> (if it's off).</li>
          <li>Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener">myaccount.google.com/apppasswords</a> → type a name like <b>Leads</b> → <b>Create</b>.</li>
          <li>Copy the 16-letter password and paste it above.</li></ol></div>}
      {y && <div className="ec-help">Yahoo: Account info → <b>Account security → Generate app password</b>, then paste it above.</div>}
      {v.provider === "zoho" && <div className="ec-help">Zoho: use your normal password (or an app-specific password if 2-factor is on). For accounts on zoho.com (not .in) <button className="xs" onClick={() => setV({ ...v, provider: "zohocom" })}>use zoho.com</button></div>}
      {v.provider === "zohocom" && <div className="ec-help">Using smtp.zoho.com. <button className="xs" onClick={() => setV({ ...v, provider: "zoho" })}>Back to zoho.in</button></div>}
      {v.provider === "custom" && <div className="ig-g ec-custom">
        <label>SMTP server<input value={v.host} onChange={set("host")} placeholder="smtp.yourdomain.com" /></label>
        <label>Port<input value={v.port} onChange={set("port")} placeholder="465" inputMode="numeric" /></label>
        <label>Security<select value={v.sec} onChange={set("sec")}><option value="ssl">SSL (port 465)</option><option value="tls">STARTTLS (port 587)</option></select></label>
      </div>}
      <div className="ig-g">
        <label>Sender name<input value={v.from} onChange={set("from")} placeholder="Your business name" /></label>
        <label>Send new-lead alerts to<input type="email" value={v.owner} onChange={set("owner")} placeholder="you@gmail.com" /></label>
      </div>
      <div className="gs-row"><button className="gs-go" disabled={busy || !v.user || (!v.pass && !cur)} onClick={connect}>{busy ? "Connecting…" : cur ? "Save & send a test" : "Connect & send a test"}</button></div>
      {msg && <div className={"gs-msg " + msg[0]}>{msg[1]}</div>}
      <p className="mut sm">🔒 Your password is saved encrypted on the server and never shown again. Gmail sends ~500 emails a day; use a business mailbox for more.</p>
    </div>
  );
}
