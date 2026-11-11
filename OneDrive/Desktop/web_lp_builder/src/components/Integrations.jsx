// LaunchBuilder v10 — Integrations.jsx
import { useState } from "react";
import { WA_PROVIDERS, AI_PROVIDERS, callAI, serverCall, serverUrl, phpCall, defaultServerUrl, lovableUrl, boltText } from "../lib.js";

/* ================= Integrations: WhatsApp automation, payments, AI providers ================= */
const WA_HELP = {
  webhook: "Create a webhook trigger in Pabbly Connect, Make, Zapier or n8n, paste its URL here, then add a “Send WhatsApp message” step (AiSensy, WATI, Interakt, Gupshup or the official WhatsApp Cloud API).",
  aisensy: "AiSensy → API Campaigns. Connect it through Pabbly/Make: webhook trigger → AiSensy “Send API campaign”. Paste the trigger's webhook URL here.",
  wati: "WATI → Integrations → Webhooks / Zapier. Use a webhook trigger that calls WATI “Send template message”. Paste the trigger URL here.",
  interakt: "Interakt → Developer settings. Use Pabbly/Make: webhook trigger → Interakt “Send template message”. Paste the trigger URL here.",
  gupshup: "Gupshup → WhatsApp API. Route through Pabbly/Make/n8n (webhook trigger → Gupshup send message). Paste the trigger URL here.",
  myappz: "If your CRM/automation tool gives you an incoming webhook URL (e.g. Lead Automation → Webhook), paste it here. It receives each lead with the phone number and message.",
};
const GAS = `// LaunchBuilder server v3 (free): sends form emails from YOUR Gmail + publishes sites to Netlify.
// Publishing setup: Project Settings (⚙) → Script properties → add NETLIFY_TOKEN and PUBLISH_KEY.
var P = PropertiesService.getScriptProperties();
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function api(method, path, payload, type) {
  var o = { method: method, muteHttpExceptions: true, headers: { Authorization: "Bearer " + P.getProperty("NETLIFY_TOKEN") } };
  if (payload !== undefined) { o.payload = payload; o.contentType = type || "application/json"; }
  var r = UrlFetchApp.fetch("https://api.netlify.com/api/v1" + path, o), j = {};
  try { j = JSON.parse(r.getContentText() || "{}"); } catch (e) { j = { message: r.getContentText() }; }
  return { code: r.getResponseCode(), body: j };
}
function doPost(e) {
  var d = JSON.parse(e.postData.contents || "{}");
  if (d.event === "email.send" && d.to) {
    MailApp.sendEmail({ to: d.to, subject: d.subject || "Thank you", htmlBody: d.html || "", name: d.from || "LaunchBuilder", replyTo: d.replyTo || "" });
    return out({ ok: true });
  }
  if (!P.getProperty("PUBLISH_KEY") || d.key !== P.getProperty("PUBLISH_KEY")) return out({ ok: false, error: "Publish key doesn't match the PUBLISH_KEY in Script properties." });
  if (!P.getProperty("NETLIFY_TOKEN")) return out({ ok: false, error: "Add NETLIFY_TOKEN in Script properties." });
  if (d.event === "ping") { var me = api("get", "/user"); return out({ ok: me.code < 300, user: me.body.email || "", error: me.code < 300 ? "" : "Netlify token rejected: " + (me.body.message || me.code) }); }
  if (d.event === "publish") {
    var zip = Utilities.base64Decode(d.zip), r = api("post", d.siteId ? "/sites/" + d.siteId + "/deploys" : "/sites", zip, "application/zip");
    if (r.code >= 300) return out({ ok: false, error: "Netlify: " + (r.body.message || r.code) });
    var id = d.siteId || r.body.id, site = api("get", "/sites/" + id).body;
    return out({ ok: true, siteId: id, name: site.name, url: site.ssl_url || site.url, admin: site.admin_url });
  }
  if (d.event === "sites") {
    var l = api("get", "/sites?filter=all&per_page=100");
    if (l.code >= 300) return out({ ok: false, error: "Netlify: " + (l.body.message || l.code) });
    return out({ ok: true, sites: (l.body || []).map(function (x) { return { id: x.id, name: x.name, url: x.ssl_url || x.url, domain: x.custom_domain || "", updated: x.updated_at }; }) });
  }
  if (d.event === "domain") {
    var s = api("patch", "/sites/" + d.siteId, JSON.stringify({ custom_domain: d.domain || null }));
    return out({ ok: s.code < 300, error: s.code < 300 ? "" : "Netlify: " + (s.body.message || s.code) });
  }
  if (d.event === "nameservers") {
    var z = api("post", "/dns_zones", JSON.stringify({ name: d.domain, site_id: d.siteId }));
    if (z.code >= 300) { var all = api("get", "/dns_zones").body || []; for (var i = 0; i < all.length; i++) if (all[i].name === d.domain) z = { code: 200, body: all[i] }; }
    return out({ ok: z.code < 300, servers: z.body.dns_servers || [], error: z.code < 300 ? "" : "Netlify: " + (z.body.message || z.code) });
  }
  return out({ ok: false, error: "Unknown request" });
}
function test() { MailApp.sendEmail(Session.getActiveUser().getEmail(), "LaunchBuilder test", "It works!"); }`;
const SAMPLE = { event: "whatsapp.send", to: "919876543210", message: "Hi Priya, thanks for registering!", name: "Priya", lead: { form: "Workshop registration", data: { name: "Priya", phone: "9876543210", email: "priya@example.com" }, payment: { status: "paid", amount: 21 } } };
/* each integration's settings open in a side panel */
const Card = ({ id, sel, onClose, ic, t, sub, on, children }) => sel !== id ? null : (
  <div className="igd-ov" onClick={onClose}><div className="igd" onClick={(e) => e.stopPropagation()}>
    <div className="igd-h"><span className={"igd-ic ic-" + id}>{ic}</span><div className="grow"><b>{t}</b><div className="mut sm">{sub}</div></div>
      {on !== undefined && <span className={"badge " + (on ? "published" : "draft")}>{on ? "● Connected" : "Not connected"}</span>}<button className="igd-x" onClick={onClose} aria-label="Close">✕</button></div>
    <div className="igd-b ig">{children}</div>
  </div></div>
);

export default function Integrations({ integ, onChange, initial = "" }) {
  const [note, setNote] = useState(""), [show, setShow] = useState({}), [test, setTest] = useState({}), [sel, setSel] = useState(initial), [sites, setSites] = useState(null);
  const srv = integ.server || {}, [srvMsg, setSrvMsg] = useState(""), [srvBusy, setSrvBusy] = useState(false), [srvKey, setSrvKey] = useState(""), [srvSites, setSrvSites] = useState(null), [hand, setHand] = useState("");
  const close = () => setSel("");
  const set = (k, o) => onChange({ ...integ, [k]: { ...integ[k], ...o } });
  const flash = (t) => { setNote(t); setTimeout(() => setNote(""), 3000); };
  const wa = integ.wa, pay = integ.pay, ai = integ.ai, em = integ.email || {};
  const emOk = em.provider === "emailjs" ? !!(em.serviceId && em.templateId && em.publicKey) : !!em.webhook;
  const pub = integ.publish || {}, [pubTest, setPubTest] = useState("");
  const genKey = () => set("publish", { key: "lb_" + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("") });
  const testPub = async () => { setPubTest("Testing…"); try { const r = await serverCall(integ, { event: "ping" }); setPubTest("✓ Connected to Netlify" + (r.user ? " as " + r.user : "")); set("publish", { ok: true, user: r.user || "" }); } catch (e) { setPubTest("✕ " + e.message); } };
  const testMail = async () => {
    if (!em.ownerEmail) return flash("Add your email address first");
    try {
      if (em.provider !== "emailjs") { await fetch(em.webhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ event: "email.send", to: em.ownerEmail, subject: "LaunchBuilder test email", html: "It works! 🎉 Your form emails will arrive like this.", from: em.fromName || "LaunchBuilder", test: true }) }); return flash(em.provider === "gmail" ? "Test sent — check your Gmail inbox in a few seconds" : "Test sent to your webhook"); }
      const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service_id: em.serviceId, template_id: em.templateId, user_id: em.publicKey, template_params: { to_email: em.ownerEmail, subject: "LaunchBuilder test email", message: "It works! 🎉<br>Your form emails will look like this.", from_name: em.fromName || "LaunchBuilder", reply_to: em.ownerEmail } }) });
      const t = await r.text(); flash(r.ok ? "✓ Test email sent — check your inbox (and spam)" : "✕ EmailJS: " + t.slice(0, 120));
    } catch { flash("✕ Couldn't reach EmailJS — check your internet"); }
  };
  const keyOk = /^rzp_(test|live)_[A-Za-z0-9]{8,}$/.test(pay.razorpayKey), upiOk = /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(pay.upiId);
  const sendTest = async () => {
    if (!wa.webhook) return flash("Paste a webhook URL first");
    try { await fetch(wa.webhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...SAMPLE, test: true }) }); flash("Test sent — check your automation's history"); }
    catch { flash("Couldn't send — check the URL"); }
  };
  const srvConnect = async (existingKey) => {
    setSrvBusy(true); setSrvMsg("");
    const url = srv.url || defaultServerUrl();
    const key = existingKey || "lbk_" + Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    try {
      const r = existingKey ? await phpCall({ url, key }, { action: "ping" }) : await phpCall({ url, key }, { action: "setup" });
      set("server", { url, key, ok: true, ip: r.ip || "", base: r.base || "" }); setSrvMsg("✓ Connected — Publish now goes to your own hosting");
    } catch (e) { setSrvMsg("✕ " + e.message); }
    setSrvBusy(false);
  };
  const srvList = async () => { setSrvSites("loading"); try { const r = await phpCall(srv, { action: "sites" }); setSrvSites(r.sites || []); } catch (e) { setSrvSites({ error: e.message }); } };
  const loadSites = async () => { setSites("loading"); try { const r = await serverCall(integ, { event: "sites" }); setSites(r.sites || []); } catch (e) { setSites({ error: e.message }); } };
  const testAI = async (id) => {
    setTest({ ...test, [id]: "Testing…" });
    try { const r = await callAI({ ...ai, provider: id }, "Reply with exactly: OK", "Say OK", 20); setTest((t) => ({ ...t, [id]: /ok/i.test(r) ? "✓ Works" : "✓ Connected" })); }
    catch (e) { setTest((t) => ({ ...t, [id]: "✕ " + e.message.slice(0, 120) })); }
  };

  return (
    <>
      <div className="top"><div><h1>Integrations</h1><p className="mut">Connect the tools you already use. Everything is saved in this browser.</p></div>{note && <span className="fb-note">{note}</span>}</div>
      {(() => {
        const aiOn = AI_PROVIDERS.some((p) => (ai.keys || {})[p.id]), hostOn = !!(serverUrl(integ) && pub.key && pub.ok);
        const APPS = [
          { id: "host", cat: "Hosting & domains", ic: "▲", name: "Netlify", desc: "Publish sites to a live link, link existing Netlify sites, connect domains (DNS or nameservers).", on: hostOn, extra: pub.user },
          { id: "email", cat: "Automation", ic: "✉", name: "Email automation", desc: "Auto-reply to every lead and get new-lead alerts — from your own Gmail.", on: emOk },
          { id: "wa", cat: "Automation", ic: "💬", name: "WhatsApp automation", desc: "Send an automatic WhatsApp message through AiSensy, WATI, Interakt, Pabbly or Make.", on: !!wa.webhook },
          { id: "pay", cat: "Payments", ic: "₹", name: "Razorpay & UPI", desc: "Collect payments before registration — cards, UPI, GPay, PhonePe, Paytm.", on: keyOk || upiOk, extra: pay.razorpayKey && pay.razorpayKey.includes("_test_") ? "Test mode" : "" },
          { id: "ai", cat: "AI", ic: "✦", name: "AI builders", desc: "Claude, ChatGPT, Gemini, DeepSeek — plus Lovable and Bolt.new.", on: aiOn, extra: aiOn ? (AI_PROVIDERS.find((p) => p.id === ai.provider) || {}).name : "" },
        ];
        const n = APPS.filter((a) => a.on).length, total = APPS.filter((a) => !a.free).length;
        return <>
          <div className="ig-sum"><div><b>{n} of {total} connected</b><span className="mut">Click an integration to set it up — each takes 2–5 minutes.</span></div><div className="ig-bar"><i style={{ width: (n / total) * 100 + "%" }} /></div></div>
          <div className="ig-tiles">{APPS.map((a) => (
            <button key={a.id} className={"ig-tile" + (a.on ? " on" : "")} onClick={() => setSel(a.id)}>
              <div className="ig-top"><span className={"igd-ic ic-" + a.id}>{a.ic}</span><span className="ig-cat2">{a.cat}</span></div>
              <div className="ig-tt"><b>{a.name}</b><span className={"ig-st" + (a.on ? " on" : "")}>{a.free ? "No setup needed" : a.on ? "● Connected" + (a.extra ? " · " + a.extra : "") : "Not connected"}</span></div>
              <p>{a.desc}</p><em>{a.free ? "Open →" : a.on ? "Manage →" : "Connect →"}</em>
            </button>))}</div>
        </>;
      })()}

      <Card id="wa" sel={sel} onClose={close} ic="💬" t="WhatsApp automation" sub="Send an automatic WhatsApp message to everyone who fills a form." on={!!wa.webhook}>
        <div className="ig-g">
          <label>Your WhatsApp tool<select value={wa.provider} onChange={(e) => set("wa", { provider: e.target.value })}>{WA_PROVIDERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label>Default country code<input value={wa.country} onChange={(e) => set("wa", { country: e.target.value.replace(/\D/g, "") })} placeholder="91" /></label>
        </div>
        <p className="mut sm">{WA_HELP[wa.provider]}</p>
        <label className="ig-l">Webhook URL<input value={wa.webhook} onChange={(e) => set("wa", { webhook: e.target.value.trim() })} placeholder="https://connect.pabbly.com/workflow/sendwebhookdata/…" /></label>
        <label className="ig-l">Default message <span className="mut sm">— use {"{{name}}"}, {"{{email}}"}, {"{{phone}}"} or any field key</span><textarea rows={3} value={wa.template} onChange={(e) => set("wa", { template: e.target.value })} /></label>
        <div className="row"><button onClick={sendTest}>Send test</button><span className="mut sm">Then turn it on per form: Forms → your form → Settings → WhatsApp automation.</span></div>
        <details className="ig-d"><summary>What your webhook receives</summary><pre>{JSON.stringify(SAMPLE, null, 2)}</pre><p className="mut sm">Phone numbers with 10 digits get the country code added. If a form collects payment, the message is sent after payment.</p></details>
        <p className="mut sm">🔒 Never paste a WhatsApp API key here — it would be visible inside your published website. The webhook keeps your keys safe inside your automation tool.</p>
      </Card>

      <Card id="pay" sel={sel} onClose={close} ic="₹" t="Razorpay & UPI payments" sub="Take payments before registration — Razorpay (cards, UPI, netbanking, wallets) or direct UPI (GPay, PhonePe, Paytm)." on={keyOk || upiOk}>
        <div className="ig-g">
          <label>Razorpay Key ID<input value={pay.razorpayKey} onChange={(e) => set("pay", { razorpayKey: e.target.value.trim() })} placeholder="rzp_live_xxxxxxxxxxxx" />
            {pay.razorpayKey && <span className={"sm " + (keyOk ? "green" : "red")}>{keyOk ? (pay.razorpayKey.includes("_test_") ? "✓ Test key — no real money is charged" : "✓ Live key") : "Should look like rzp_live_… or rzp_test_…"}</span>}</label>
          <label>Business / payee name<input value={pay.payee} onChange={(e) => set("pay", { payee: e.target.value })} placeholder="TGAI Academy" /></label>
          <label>UPI ID (for GPay / PhonePe / Paytm)<input value={pay.upiId} onChange={(e) => set("pay", { upiId: e.target.value.trim() })} placeholder="yourname@okhdfcbank" />
            {pay.upiId && <span className={"sm " + (upiOk ? "green" : "red")}>{upiOk ? "✓ Looks right" : "Should look like name@bank"}</span>}</label>
        </div>
        <p className="mut sm">Get the Key ID in Razorpay Dashboard → Account &amp; Settings → API Keys. Only the <b>Key ID</b> goes here — <b>never the Key Secret</b>. In Razorpay → Settings → Payment capture, turn on <b>automatic capture</b>.</p>
        <p className="mut sm">Then on any form: Forms → your form → <b>Payment</b> tab → set the amount (e.g. ₹21). The button becomes “Register for ₹21”.</p>
        <details className="ig-d"><summary>How payment confirmation works</summary><p className="mut sm"><b>Razorpay:</b> the lead is marked <b>Paid</b> with the payment ID as soon as checkout succeeds. For full security (verifying the payment signature) you'd later add a small server — until then, cross-check payments in your Razorpay dashboard.<br /><b>UPI / payment link:</b> the visitor taps “I have paid” and can enter the UTR; the lead is marked <b>Payment claimed</b> so you can confirm it in your bank app.</p></details>
      </Card>

      <Card id="email" sel={sel} onClose={close} ic="✉" t="Email automation" sub="Send an automatic email to everyone who fills a form, and get notified of new leads." on={emOk}>
        <div className="chips" style={{ margin: "0 0 12px" }}>
          <button className={em.provider === "gmail" ? "on" : ""} onClick={() => set("email", { provider: "gmail" })}>Your Gmail (free, recommended)</button>
          <button className={em.provider === "emailjs" ? "on" : ""} onClick={() => set("email", { provider: "emailjs" })}>EmailJS</button>
          <button className={em.provider === "webhook" ? "on" : ""} onClick={() => set("email", { provider: "webhook" })}>Webhook (Pabbly, Make, Zapier)</button></div>
        {em.provider === "gmail" && <>
          <ol className="ig-steps">
            <li>Open <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener">script.google.com → New project</a> (signed in with the Gmail you want to send from).</li>
            <li>Delete everything in the editor and paste this code: <button className="xs" onClick={() => { navigator.clipboard.writeText(GAS).then(() => flash("Script copied"), () => window.prompt("Copy:", GAS)); }}>Copy script</button></li>
          </ol>
          <pre className="ig-code">{GAS}</pre>
          <ol className="ig-steps" start={3}>
            <li>Click <b>Save</b> (💾), then <b>Run</b> ▶ with the <code>test</code> function selected → <b>Review permissions</b> → choose your account → <b>Advanced → Go to project → Allow</b>. You'll get a test email.</li>
            <li>Click <b>Deploy → New deployment</b> → type <b>Web app</b> → Execute as: <b>Me</b> → Who has access: <b>Anyone</b> → <b>Deploy</b>.</li>
            <li>Copy the <b>Web app URL</b> (ends with <code>/exec</code>) and paste it here:</li>
          </ol>
          <label className="ig-l">Web app URL<input value={em.webhook} onChange={(e) => set("email", { webhook: e.target.value.trim() })} placeholder="https://script.google.com/macros/s/…/exec" /></label>
          {em.webhook && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(em.webhook) && <p className="red sm">This should look like https://script.google.com/macros/s/…/exec</p>}
          <p className="mut sm">Emails come from your own Gmail address. Free Gmail accounts can send about 100 emails per day (Google Workspace: 1,500).</p>
        </>}
        {em.provider === "webhook" && <label className="ig-l">Webhook URL<input value={em.webhook} onChange={(e) => set("email", { webhook: e.target.value.trim() })} placeholder="https://hooks.zapier.com/…" /></label>}
        {em.provider === "emailjs" && <>
          <div className="ig-g">
            <label>Service ID<input value={em.serviceId} onChange={(e) => set("email", { serviceId: e.target.value.trim() })} placeholder="service_xxxxxxx" /></label>
            <label>Template ID<input value={em.templateId} onChange={(e) => set("email", { templateId: e.target.value.trim() })} placeholder="template_xxxxxxx" /></label>
            <label>Public key<input value={em.publicKey} onChange={(e) => set("email", { publicKey: e.target.value.trim() })} placeholder="AbCdEfGhIjKlMnOp" /></label>
          </div>
          <details className="ig-d" open={!emOk}><summary>Set up EmailJS in 5 minutes (free: 200 emails/month)</summary><ol className="ig-steps">
            <li>Sign up at <a href="https://www.emailjs.com" target="_blank" rel="noopener">emailjs.com</a>.</li>
            <li><b>Email Services → Add New Service → Gmail</b> (or Outlook) → connect your email → copy the <b>Service ID</b>.</li>
            <li><b>Email Templates → Create New Template</b>, then set: <b>Subject</b> = <code>{"{{subject}}"}</code>, <b>Content</b> = <code>{"{{{message}}}"}</code> (three brackets), <b>To Email</b> = <code>{"{{to_email}}"}</code>, <b>From Name</b> = <code>{"{{from_name}}"}</code>, <b>Reply To</b> = <code>{"{{reply_to}}"}</code>. Save → copy the <b>Template ID</b>.</li>
            <li><b>Account → General</b> → copy the <b>Public Key</b>.</li>
            <li>Paste all three above, add your email below, click <b>Send test email</b>.</li></ol>
            <p className="mut sm">You write the actual email text per form (Forms → your form → Settings → Email automation). This one template just carries it. In EmailJS → Account → Security you can allow only your domain.</p></details>
        </>}
        <div className="ig-g">
          <label>Your email (for new-lead alerts & replies)<input value={em.ownerEmail} onChange={(e) => set("email", { ownerEmail: e.target.value.trim() })} placeholder="you@yourbrand.com" /></label>
          <label>Sender name<input value={em.fromName} onChange={(e) => set("email", { fromName: e.target.value })} placeholder="BYB Academy" /></label>
        </div>
        <div className="row"><button onClick={testMail}>Send test email</button><span className="mut sm">Then turn it on per form: Forms → your form → Settings → Email automation.</span></div>
      </Card>

      <Card id="host" sel={sel} onClose={close} ic="▲" t="Netlify — hosting & domains" sub="Publish to a live link, use your existing Netlify sites, and connect custom domains." on={!!(serverUrl(integ) && pub.key && pub.ok)}>
        <ol className="ig-steps">
          <li>Create a free account at <a href="https://app.netlify.com/signup" target="_blank" rel="noopener">netlify.com</a>, then open <a href="https://app.netlify.com/user/applications#personal-access-tokens" target="_blank" rel="noopener">User settings → Applications → Personal access tokens</a> → <b>New access token</b> → copy it.</li>
          <li>Make sure your Google script is the <b>latest version</b> (Email automation → Your Gmail → <b>Copy script</b>, paste it over the old code, Save).</li>
          <li>Click <b>Generate key</b> below and copy it. <button className="xs" onClick={genKey}>Generate key</button></li>
          <li>In the script editor: <b>Project Settings (⚙) → Script properties → Add</b>: <code>NETLIFY_TOKEN</code> = your Netlify token, and <code>PUBLISH_KEY</code> = the key from step 3. Save.</li>
          <li><b>Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy</b> (the URL stays the same).</li>
          <li>Click <b>Test connection</b>.</li>
        </ol>
        <div className="ig-g">
          <label>Script Web app URL<input value={pub.url} placeholder={serverUrl({ ...integ, publish: {} }) || "https://script.google.com/macros/s/…/exec"} onChange={(e) => set("publish", { url: e.target.value.trim() })} />
            <span className="mut sm">{!pub.url && serverUrl(integ) ? "Using the same URL as your Gmail setup ✓" : ""}</span></label>
          <label>Publish key<div className="row"><input value={pub.key} placeholder="lb_…" onChange={(e) => set("publish", { key: e.target.value.trim() })} />{pub.key && <button className="xs" onClick={() => navigator.clipboard.writeText(pub.key)}>Copy</button>}</div></label>
        </div>
        <div className="row"><button onClick={testPub} disabled={!serverUrl(integ) || !pub.key}>Test connection</button>{pubTest && <span className={"sm " + (pubTest.startsWith("✓") ? "green" : pubTest.startsWith("✕") ? "red" : "mut")}>{pubTest}</span>}</div>
        <p className="mut sm">🔒 Your Netlify token stays inside your own Google script — it's never stored in the builder or on your website. The publish key stops anyone else from using your script to publish.</p>
        <div className="ig-sites"><div className="row between"><b>Your Netlify sites</b><button className="xs" disabled={!pub.ok} onClick={loadSites}>{sites === "loading" ? "Loading…" : "Load sites"}</button></div>
          {!pub.ok && <p className="mut sm">Test the connection first, then load your sites. You can publish any project to one of them from the Publish window.</p>}
          {sites && sites.error && <p className="red sm">{sites.error}{/Unknown request/.test(sites.error) ? " — paste the latest script (v3) and deploy a new version." : ""}</p>}
          {Array.isArray(sites) && (sites.length ? sites.map((x) => <div key={x.id} className="ig-site"><span className="igd-ic ic-host" style={{ width: 30, height: 30, fontSize: 13 }}>▲</span><div className="grow"><b>{x.name}</b><a href={x.url} target="_blank" rel="noopener" className="mut sm">{(x.domain || x.url || "").replace(/^https?:\/\//, "")} ↗</a></div></div>) : <p className="mut sm">No sites yet — click Publish on any project to create one.</p>)}
        </div>
      </Card>

      <Card id="ai" sel={sel} onClose={close} ic="✦" t="AI providers" sub="Use your own API key to create websites and sections from a prompt." on={AI_PROVIDERS.some((p) => (ai.keys || {})[p.id])}>
        <div className="ig-ai">{AI_PROVIDERS.map((p) => {
          const k = (ai.keys || {})[p.id] || "", m = (ai.models || {})[p.id] || "";
          return <div key={p.id} className={"ig-p" + (ai.provider === p.id ? " on" : "")}>
            <div className="row between"><label className="ig-radio"><input type="radio" checked={ai.provider === p.id} onChange={() => set("ai", { provider: p.id })} /><b>{p.name}</b></label>{ai.provider === p.id && <span className="badge published">Default</span>}</div>
            <label>API key <a href={p.keyUrl} target="_blank" rel="noopener" className="sm">Get a key ↗</a>
              <div className="row"><input type={show[p.id] ? "text" : "password"} value={k} placeholder={p.hint} onChange={(e) => set("ai", { keys: { ...ai.keys, [p.id]: e.target.value.trim() } })} /><button className="xs" onClick={() => setShow({ ...show, [p.id]: !show[p.id] })}>{show[p.id] ? "Hide" : "Show"}</button></div></label>
            <label>Model<input value={m} placeholder={p.model} onChange={(e) => set("ai", { models: { ...ai.models, [p.id]: e.target.value.trim() } })} /></label>
            <div className="row"><button disabled={!k} onClick={() => testAI(p.id)}>Test</button>{test[p.id] && <span className={"sm " + (test[p.id].startsWith("✓") ? "green" : test[p.id].startsWith("✕") ? "red" : "mut")}>{test[p.id]}</span>}</div>
          </div>;
        })}</div>
        <div className="ig-ext">
          <div className="ig-ext-h"><b>Lovable &amp; Bolt.new</b><span className="mut sm">No API key needed — opens their site with your idea, then import the result here.</span></div>
          <textarea rows={3} value={hand} onChange={(e) => setHand(e.target.value)} placeholder="Describe your page — e.g. Landing page for a ₹21 AI ads workshop, dark modern style, countdown, trainer bio, FAQ and registration form" />
          <div className="ig-ai">
            <div className="ig-p ig-lov"><div className="row between"><b>♥ Lovable</b><span className="badge draft">Free credits</span></div><p className="mut sm">Opens Lovable with your prompt already filled in — just press send.</p>
              <a className={"btn pri" + (hand.trim() ? "" : " dis")} href={hand.trim() ? lovableUrl(hand) : undefined} target="_blank" rel="noopener">Build in Lovable ↗</a></div>
            <div className="ig-p ig-bolt"><div className="row between"><b>⚡ Bolt.new</b><span className="badge draft">Free tier</span></div><p className="mut sm">Copies your prompt and opens Bolt — paste it (Ctrl+V) and press send.</p>
              <button className="pri" disabled={!hand.trim()} onClick={() => { navigator.clipboard.writeText(boltText(hand)).then(() => flash("Prompt copied — paste it in Bolt"), () => {}); window.open("https://bolt.new", "_blank"); }}>Copy &amp; open Bolt ↗</button></div>
          </div>
          <p className="mut sm">When you like the result: download its code → in LaunchBuilder <b>My pages → Import HTML</b> → pick the <code>index.html</code>. Your prompt already asks them for a single static page so it imports cleanly.</p>
        </div>
        <p className="mut sm">Use it: <b>+ Create new → Create with AI</b> for a full page or website, or in the editor <b>Add → AI section</b>. Keys stay in this browser and are sent only to that AI company. Each generation uses your API credits. If a provider shows a network/CORS error, it doesn't allow browser calls — use another one.</p>
      </Card>
    </>
  );
}
