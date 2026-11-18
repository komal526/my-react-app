// LaunchBuilder v78 — SheetsCard.jsx
// Google Sheets + email alerts in one easy setup: a small Apps Script in YOUR Google Sheet receives every new lead,
// adds it as a row, emails you, and (optional) sends the person a thank-you email. The server forwards each lead to it.
import { useEffect, useState } from "react";
import { hooksSave, hooksGet, hooksTest, ago } from "../lib.js";
import { BRAND } from "../brand.js";

export const SHEET_SCRIPT = String.raw`// ${BRAND.product} → Google Sheets + email alerts
// Paste this whole file in Extensions → Apps Script, then Deploy → New deployment → Web app (Who has access: Anyone).
function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}'), lead = d.lead || {}, data = lead.data || {}, o = d.options || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName('Leads') || ss.insertSheet('Leads', 0);
    var head = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].filter(String) : [];
    if (!head.length) head = ['Date', 'Form', 'Page', 'Website'];
    Object.keys(data).forEach(function (k) { if (head.indexOf(k) < 0) head.push(k); });
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#fff4cc'); sh.setFrozenRows(1);
    sh.appendRow(head.map(function (h) {
      if (h === 'Date') return new Date(lead.ts || Date.now()); if (h === 'Form') return lead.form || ''; if (h === 'Page') return lead.page || lead.url || ''; if (h === 'Website') return lead.site || '';
      var v = data[h]; return v == null ? '' : String(v);
    }));
    var get = function (re) { for (var k in data) if (re.test(k)) return String(data[k] || ''); return ''; };
    var name = get(/^(name|full.?name|your.?name)$/i) || get(/name/i), email = get(/e-?mail/i), mailed = false;
    var rows = Object.keys(data).map(function (k) { return '<tr><td style="padding:6px 12px;color:#5d6785">' + esc(k) + '</td><td style="padding:6px 12px"><b>' + esc(data[k]) + '</b></td></tr>'; }).join('');
    if (o.notify) {
      MailApp.sendEmail({ to: o.notify, name: o.from || 'New leads', subject: 'New lead: ' + (name || email || 'someone') + ' — ' + (lead.form || 'Form'),
        htmlBody: '<div style="font-family:Arial,sans-serif"><h2>New lead 🎉</h2><table style="border-collapse:collapse">' + rows + '</table><p style="color:#5d6785">' + esc(lead.form || '') + ' · ' + esc(lead.page || lead.url || '') + '</p><p><a href="' + ss.getUrl() + '">Open the sheet</a></p></div>' });
      mailed = true;
    }
    if (o.autoreply && /@/.test(email)) {
      MailApp.sendEmail({ to: email, name: o.from || '', replyTo: o.notify || '', subject: o.subject || 'Thank you!',
        htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">' + esc(o.reply || 'Hi {{name}}, thank you — we received your details and will contact you soon.').replace(/\{\{name\}\}/g, esc(name || 'there')).replace(/\n/g, '<br>') + '</div>' });
    }
    return out({ ok: true, sheet: ss.getUrl(), mailed: mailed });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}
function doGet() { return out({ ok: true, ready: true }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
`;

export default function SheetsCard({ value = {}, onSave, userEmail = "" }) {
  const [v, setV] = useState({ url: "", email: userEmail, notify: true, autoreply: false, subject: "Thank you!", reply: "Hi {{name}},\nthank you — we received your details and will contact you soon.", from: BRAND.product, ...value });
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(null), [copied, setCopied] = useState(false), [srv, setSrv] = useState(null);
  useEffect(() => { hooksGet().then((r) => { setSrv(r.hooks); if (r.hooks) setV((x) => ({ ...x, ...Object.fromEntries(Object.entries(r.hooks).filter(([k, val]) => val !== "" && k !== "last" && k !== "saved")) })); }).catch(() => setSrv(null)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), msg[0] === "ok" ? 9000 : 14000); return () => clearTimeout(t); }, [msg]);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const copy = () => { navigator.clipboard.writeText(SHEET_SCRIPT).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }, () => {}); };
  const save = async () => {
    setMsg(null); if (!/^https:\/\//.test(v.url.trim())) return setMsg(["bad", "Paste the Web app URL first (step 3)."]);
    setBusy(true);
    try {
      const r = await hooksSave({ ...v, url: v.url.trim() }); setSrv(r.hooks); onSave({ ...v, url: v.url.trim(), ok: true });
      setMsg(["wait", "Saved — sending a test lead…"]);
      const t = await hooksTest();
      setMsg(["ok", <>✓ Working! A test row was added{t.sheet ? <> to <a href={t.sheet} target="_blank" rel="noopener">your sheet ↗</a></> : ""}{t.mailed ? <> and an alert email was sent to <b>{v.email}</b></> : ""}. Every new lead will arrive the same way.</>]);
    } catch (e) { setMsg(["bad", e.message]); onSave({ ...v, url: v.url.trim(), ok: false }); }
    setBusy(false);
  };
  const remove = async () => { if (!window.confirm("Stop sending leads to this sheet?")) return; try { await hooksSave({ url: "" }); } catch { /* ignore */ } setSrv(null); onSave({}); setV({ ...v, url: "" }); setMsg(["ok", "Disconnected."]); };
  return (
    <div className="gs">
      <ol className="gs-steps">
        <li><span>1</span><div><b>Create a Google Sheet</b><small>Any sheet works — new leads go into a tab called “Leads”.</small><a className="btn" href="https://sheets.new" target="_blank" rel="noopener">Open a new Google Sheet ↗</a></div></li>
        <li><span>2</span><div><b>Add the script</b><small>In the sheet: <b>Extensions → Apps Script</b>. Delete what's there, paste this code, press <b>Save</b> 💾.</small>
          <button className="gs-copy" onClick={copy}>{copied ? "✓ Code copied" : "Copy the code"}</button>
          <details><summary>See the code</summary><pre>{SHEET_SCRIPT}</pre></details></div></li>
        <li><span>3</span><div><b>Publish it as a Web app</b><small><b>Deploy → New deployment</b> → ⚙ type <b>Web app</b> → Execute as <b>Me</b> → Who has access <b>Anyone</b> → <b>Deploy</b>. Google asks for permission once: <b>Authorize → your account → Advanced → Go to … → Allow</b>. Copy the <b>Web app URL</b>.</small></div></li>
        <li><span>4</span><div><b>Paste the Web app URL</b>
          <input className="gs-url" value={v.url} onChange={set("url")} placeholder="https://script.google.com/macros/s/…/exec" /></div></li>
      </ol>
      <div className="gs-opts">
        <label className="gs-chk"><input type="checkbox" checked={!!v.notify} onChange={set("notify")} /> Email me every new lead at</label>
        <input className="gs-em" value={v.email} onChange={set("email")} placeholder="you@gmail.com" disabled={!v.notify} />
        <label className="gs-chk"><input type="checkbox" checked={!!v.autoreply} onChange={set("autoreply")} /> Send a thank-you email to the person (when the form has an email field)</label>
        {v.autoreply && <div className="gs-reply"><input value={v.subject} onChange={set("subject")} placeholder="Subject" /><textarea rows={3} value={v.reply} onChange={set("reply")} /><small className="mut">{"{{name}}"} becomes the person's name. Emails go from your Gmail.</small></div>}
      </div>
      <div className="gs-row">
        <button className="gs-go" disabled={busy || !v.url.trim()} onClick={save}>{busy ? "Testing…" : srv ? "Save & send a test" : "Connect & send a test"}</button>
        {srv && <button className="xs red" onClick={remove}>Disconnect</button>}
        {srv && srv.last && <span className="mut sm">Last lead sent {ago(srv.last.t * 1000)}{srv.last.err ? " — failed: " + srv.last.err : ""}</span>}
      </div>
      {msg && <div className={"gs-msg " + msg[0]}>{msg[1]}</div>}
      <p className="mut sm">Works for every published page and form. Leads also stay in your Leads & Pipeline here. Free — Gmail sends up to ~100 emails a day.</p>
    </div>
  );
}
