// LaunchBuilder v102 — Integrations.jsx
import { BRAND } from "../brand.js";
import { useEffect, useRef, useState } from "react";
import SheetsCard from "./SheetsCard.jsx";
import { EmailEasy, PlacesConnect, LeadApi } from "./EasyConnect.jsx";
import { WA_PROVIDERS, AI_PROVIDERS, callAI, detectAI, listModels, serverCall, serverUrl, phpCall, defaultServerUrl, lovableUrl, boltText, mailReady } from "../lib.js";

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
  const emOk = mailReady(em);
  /* the Lead Finder tile shows the real state from the server */
  const [view, setView0] = useState(() => { try { return localStorage.getItem("lb_ig_view") || "flow"; } catch { return "flow"; } });
  const setView = (v) => { setView0(v); try { localStorage.setItem("lb_ig_view", v); } catch { /* ignore */ } };
  const [narrow, setNarrow] = useState(() => window.innerWidth < 900);
  useEffect(() => { const f = () => setNarrow(window.innerWidth < 900); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const [gsN, setGsN] = useState(0);
  /* v124 — AI agent call */
  const [cl, setCl] = useState({ provider: "vapi", agent: "", from: "", url: "", task: "", cc: "91", auto: true, has: false, tail: "", log: [] }), [clKey, setClKey] = useState(""), [clMsg, setClMsg] = useState(null), [clBusy, setClBusy] = useState(false), [clTo, setClTo] = useState("");
  const clLoad = () => phpCall(srv, { action: "call_get" }).then((r) => r && r.ok && setCl((c) => ({ ...c, ...r, provider: r.provider || c.provider, auto: r.provider ? !!r.auto : c.auto, agent: r.provider ? r.agent : c.agent, from: r.provider ? r.from : c.from, url: r.provider ? r.url : c.url, saved: !!r.provider }))).catch(() => {});
  useEffect(() => { clLoad(); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  const clSave = async (auto = cl.auto) => { setClBusy(true); setClMsg(null); try { await phpCall(srv, { action: "call_save", provider: cl.provider, agent: cl.agent, from: cl.from, url: cl.url, task: cl.task, cc: cl.cc, auto, ckey: clKey.trim() }); setClKey(""); setClMsg(["ok", "✓ Saved — " + (auto ? "every new lead gets a call within seconds." : "calls are paused.")]); clLoad(); } catch (e) { setClMsg(["bad", e.message]); } setClBusy(false); };
  const clTest = async () => { setClBusy(true); setClMsg(null); try { const r = await phpCall(srv, { action: "call_test", to: clTo }); setClMsg(["ok", "✓ " + r.msg + " — your phone should ring now."]); clLoad(); } catch (e) { setClMsg(["bad", e.message]); } setClBusy(false); };
  const clOff = async () => { if (!window.confirm("Disconnect the AI agent call? No more leads will be called.")) return; await phpCall(srv, { action: "call_off" }).catch(() => {}); setCl((c) => ({ ...c, has: false, saved: false, tail: "" })); clLoad(); };
  useEffect(() => { phpCall(srv, { action: "gs_status" }).then((r) => setGsN(+r.sheets || 0)).catch(() => {}); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { phpCall(srv, { action: "lf_status" }).then((r) => { const ok = !!r.ready, own = !!r.own; if (ok !== !!(integ.places && integ.places.ok) || own !== !!(integ.places && integ.places.own)) onChange({ ...integ, places: { ok, own } }); }).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [emWay, setEmWay] = useState(null), emP = emWay || (em.provider === "gmail" && !em.webhook ? "smtp" : em.provider || "smtp");
  const pub = integ.publish || {}, [pubTest, setPubTest] = useState("");
  const genKey = () => set("publish", { key: "lb_" + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("") });
  const testPub = async () => { setPubTest("Testing…"); try { const r = await serverCall(integ, { event: "ping" }); setPubTest("✓ Connected to Netlify" + (r.user ? " as " + r.user : "")); set("publish", { ok: true, user: r.user || "" }); } catch (e) { setPubTest("✕ " + e.message); } };
  const testMail = async () => {
    if (!em.ownerEmail) return flash("Add your email address first");
    try {
      if (em.provider !== "emailjs") { await fetch(em.webhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ event: "email.send", to: em.ownerEmail, subject: BRAND.product + " test email", html: "It works! 🎉 Your form emails will arrive like this.", from: em.fromName || BRAND.product, test: true }) }); return flash(em.provider === "gmail" ? "Test sent — check your Gmail inbox in a few seconds" : "Test sent to your webhook"); }
      const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service_id: em.serviceId, template_id: em.templateId, user_id: em.publicKey, template_params: { to_email: em.ownerEmail, subject: BRAND.product + " test email", message: "It works! 🎉<br>Your form emails will look like this.", from_name: em.fromName || BRAND.product, reply_to: em.ownerEmail } }) });
      const t = await r.text(); flash(r.ok ? "✓ Test email sent — check your inbox (and spam)" : "✕ EmailJS: " + t.slice(0, 120));
    } catch { flash("✕ Couldn't reach EmailJS — check your internet"); }
  };
  const keyOk = /^rzp_(test|live)_[A-Za-z0-9]{8,}$/.test(pay.razorpayKey), upiOk = /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(pay.upiId);
  /* v108: webhooks that need a secret key (401 Unauthorized) are sent by the server, with the key added there */
  const [waKey, setWaKey] = useState(""), [waHdr, setWaHdr] = useState("hmac"), [waSrv, setWaSrv] = useState(null), [waBusy, setWaBusy] = useState(false), [waMsg, setWaMsg] = useState(null), [waOpen, setWaOpen] = useState(false);
  useEffect(() => { phpCall(srv, { action: "wa_get" }).then((r) => { setWaSrv(r.wa); if (r.wa) { setWaHdr(r.wa.hdr); setWaOpen(true); } }).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const waSave = async () => {
    setWaBusy(true); setWaMsg(["wait", "Saving and sending a test…"]);
    try {
      const r = await phpCall(srv, { action: "wa_save", url: wa.webhook, hdr: waHdr, wkey: waKey.trim() }); setWaSrv(r.wa); setWaKey("");
      set("wa", { srvKey: true });
      await phpCall(srv, { action: "wa_test", payload: SAMPLE });
      setWaMsg(["ok", "✓ Saved — the test reached your webhook. Publish/Update your pages once so forms use it."]);
    } catch (e) { setWaMsg(["bad", e.message]); }
    setWaBusy(false);
  };
  const waRemove = async () => { try { await phpCall(srv, { action: "wa_save", remove: 1 }); } catch { /* ignore */ } setWaSrv(null); set("wa", { srvKey: false }); setWaMsg(["ok", "Secret key removed."]); };
  const sendTest = async () => {
    if (!wa.webhook) return flash("Paste a webhook URL first");
    if (waSrv && waSrv.url === wa.webhook) { try { await phpCall(srv, { action: "wa_test", payload: SAMPLE }); flash("✓ Test reached your webhook"); } catch (e) { flash("✕ " + e.message); } return; }
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
  /* connect with ONLY the key: check it, pick the best model automatically (the Model box stays optional).
     A key pasted into the wrong card (e.g. a Gemini key in OpenAI) is moved to the right one. */
  const [checked, setChecked] = useState({});
  const connectKey = async (id, key) => {
    setChecked((c) => ({ ...c, [id]: key })); setTest((t) => ({ ...t, [id]: "Checking the key…" }));
    let prov = id, model = "";
    try { model = await listModels(id, key); }
    catch (e) {
      try { const r = await detectAI(key); prov = r.provider; model = r.model; }
      catch { set("ai", { keys: { ...(ai.keys || {}), [id]: key } }); setTest((t) => ({ ...t, [id]: "✕ " + String(e.message || "Key not accepted").slice(0, 120) })); return; }
    }
    const keys = { ...(ai.keys || {}), [prov]: key }; if (prov !== id && keys[id] === key) delete keys[id];
    set("ai", { provider: prov, keys, autoModels: { ...(ai.autoModels || {}), [prov]: model } });
    const nm = (AI_PROVIDERS.find((x) => x.id === prov) || {}).name;
    setTest((t) => ({ ...t, [id]: prov !== id ? "" : t[id], [prov]: (prov !== id ? "✓ This is a " + nm + " key — moved here, using " : "✓ Connected — using ") + "" + model }));
  };
  const testAI = async (id) => {
    setTest({ ...test, [id]: "Testing…" });
    try { const r = await callAI({ ...ai, provider: id }, "Reply with exactly: OK", "Say OK", 20); setTest((t) => ({ ...t, [id]: /ok/i.test(r) ? "✓ Works" : "✓ Connected" })); }
    catch (e) { setTest((t) => ({ ...t, [id]: "✕ " + e.message.slice(0, 120) })); }
  };

  return (
    <>
      <div className="top ig-top">
        {/* <div><h1>Integrations</h1><p className="mut">Connect the tools you already use — every new lead flows to them automatically.</p></div> */}
        <div className="ig-topr">{note && <span className="fb-note">{note}</span>}{!narrow && view !== "flow" && <div className="igf-view">{[["flow", "Flow"], ["cards", "Cards"]].map(([k, l]) => <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)}>{l}</button>)}</div>}</div></div>
      {(() => {
        const aiOn = AI_PROVIDERS.some((p) => (ai.keys || {})[p.id]), hostOn = !!(serverUrl(integ) && pub.key && pub.ok);
        const APPS = [
          /* Netlify removed from the list — websites publish to your own server */
          { id: "sheets", cat: "Automation", ic: "▦", name: "Google Sheets", desc: "Paste your sheet link, match your form fields — every submission becomes a new row.", on: !!(integ.sheets && (integ.sheets.url || integ.sheets.link) && integ.sheets.ok) || gsN > 0, extra: gsN ? gsN + (gsN > 1 ? " sheets" : " sheet") : "" },
          { id: "email", cat: "Automation", ic: "✉", name: "Email automation", desc: "Auto-reply to every lead and get new-lead alerts — connect your email with just email + password.", on: emOk },
          { id: "places", cat: "Lead Finder", ic: "🔍", name: "Google Places (Lead Finder)", desc: "Connect your own Google key to find local businesses with phone numbers and websites.", on: !!(integ.places && integ.places.ok), extra: integ.places && integ.places.own ? "Your key" : "" },
          { id: "wa", cat: "Automation", ic: "💬", name: "WhatsApp automation", desc: "Send leads to your WhatsApp CRM instantly — or let it fetch them with the Lead API.", on: !!wa.webhook },
          { id: "pay", cat: "Payments", ic: "₹", name: "Razorpay & UPI", desc: "Collect payments before registration — cards, UPI, GPay, PhonePe, Paytm.", on: keyOk || upiOk, extra: pay.razorpayKey && pay.razorpayKey.includes("_test_") ? "Test mode" : "" },
          { id: "call", cat: "AI agent", ic: "📞", name: "AI agent call", desc: "An AI voice agent phones every new lead within seconds — Vapi, Retell, Bland or your own calling tool.", on: !!(cl.saved && cl.auto), extra: cl.saved ? ({ vapi: "Vapi", retell: "Retell", bland: "Bland", webhook: "Webhook" })[cl.provider] : "" },
          { id: "ai", cat: "AI", ic: "✦", name: "AI builders", desc: "Claude, ChatGPT, Gemini, DeepSeek — plus Lovable and Bolt.new.", on: aiOn, extra: aiOn ? (AI_PROVIDERS.find((p) => p.id === ai.provider) || {}).name : "" },
        ];
        const n = APPS.filter((a) => a.on).length, total = APPS.filter((a) => !a.free).length;
        return <>
          {void n}{void total}
          {view === "flow" && !narrow ? <FlowCanvas apps={APPS} sel={sel} onOpen={setSel} view={view} setView={setView} /> : <div className="ig-tiles">{APPS.map((a) => (
            <button key={a.id} className={"ig-tile" + (a.on ? " on" : "")} onClick={() => setSel(a.id)}>
              <div className="ig-top"><span className={"igd-ic ic-" + a.id}>{a.ic}</span><span className="ig-cat2">{a.cat}</span></div>
              <div className="ig-tt"><b>{a.name}</b><span className={"ig-st" + (a.on ? " on" : "")}>{a.free ? "No setup needed" : a.on ? "● Connected" + (a.extra ? " · " + a.extra : "") : "Not connected"}</span></div>
              <p>{a.desc}</p><em>{a.free ? "Open →" : a.on ? "Manage →" : "Connect →"}</em>
            </button>))}</div>}
        </>;
      })()}

      <Card id="call" sel={sel} onClose={close} ic="📞" t="AI agent call" sub="An AI voice agent calls every new lead within seconds — it greets them by name, answers questions and books the next step." on={!!(cl.saved && cl.auto)}>
        <div className="cl-prov">{[["vapi", "Vapi"], ["retell", "Retell AI"], ["bland", "Bland AI"], ["webhook", "Other tool (webhook)"]].map(([k, l]) => <button key={k} className={cl.provider === k ? "on" : ""} onClick={() => setCl({ ...cl, provider: k })}>{l}</button>)}</div>
        <p className="mut sm">{({ vapi: "Vapi dashboard → API Keys (private key) · Assistants → copy the Assistant ID · Phone Numbers → copy the Phone Number ID.", retell: "Retell dashboard → API Keys · Agents → copy the Agent ID · Phone Numbers → the number you bought (e.g. +14155550123).", bland: "Bland dashboard → API key · Pathways → copy the Pathway ID (or leave it empty and write what the agent should say). Your Bland number is optional.", webhook: "Any AI calling tool (Synthflow, Air, n8n, Make…) — crecapo sends every new lead to this URL with the phone number and name; your tool places the call." })[cl.provider]}</p>
        <div className="ig-g">
          {cl.provider !== "webhook" && <label>API key<input type="password" value={clKey} onChange={(e) => setClKey(e.target.value)} placeholder={cl.has ? "•••• " + cl.tail + " saved — type only to change" : "paste your API key"} autoComplete="off" /></label>}
          {cl.provider === "webhook" && <label>Webhook URL<input value={cl.url} onChange={(e) => setCl({ ...cl, url: e.target.value.trim() })} placeholder="https://…" /></label>}
          {cl.provider === "webhook" && <label>Secret <small>(optional — sent as Bearer)</small><input type="password" value={clKey} onChange={(e) => setClKey(e.target.value)} placeholder={cl.has ? "•••• saved" : "optional"} autoComplete="off" /></label>}
          {cl.provider !== "webhook" && <label>{({ vapi: "Assistant ID", retell: "Agent ID (optional)", bland: "Pathway ID (optional)" })[cl.provider]}<input value={cl.agent} onChange={(e) => setCl({ ...cl, agent: e.target.value.trim() })} placeholder={cl.provider === "vapi" ? "e.g. 5b0a…-…" : "optional"} /></label>}
          {cl.provider !== "webhook" && <label>{({ vapi: "Phone Number ID", retell: "Your Retell number (from)", bland: "Your Bland number (optional)" })[cl.provider]}<input value={cl.from} onChange={(e) => setCl({ ...cl, from: e.target.value.trim() })} placeholder={cl.provider === "vapi" ? "e.g. 9c3f…-…" : "+1 415 555 0123"} /></label>}
          <label>Default country code<input value={cl.cc} onChange={(e) => setCl({ ...cl, cc: e.target.value.replace(/\D/g, "") })} placeholder="91" /></label>
        </div>
        {cl.provider === "bland" && !cl.agent && <label className="ig-l">What should the agent say? <span className="mut sm">(used when there's no Pathway ID)</span><textarea rows={3} value={cl.task} onChange={(e) => setCl({ ...cl, task: e.target.value })} placeholder="You are Priya from TGAI Academy. Thank {{name}} for registering for the webinar, confirm the date and ask if they have questions." /></label>}
        <label className="cl-auto"><input type="checkbox" checked={!!cl.auto} onChange={(e) => setCl({ ...cl, auto: e.target.checked })} /><i />Call every new lead automatically <span className="mut sm">(forms with payment: after they pay)</span></label>
        <div className="row"><button className="pri" disabled={clBusy} onClick={() => clSave()}>{clBusy ? "Saving…" : "Save"}</button>{cl.saved && <button className="xs red" onClick={clOff}>Disconnect</button>}</div>
        {cl.saved && <div className="cl-test"><input value={clTo} onChange={(e) => setClTo(e.target.value)} placeholder="Your phone for a test call, e.g. 98765 43210" /><button disabled={clBusy || !clTo.trim()} onClick={clTest}>📞 Test call</button></div>}
        {clMsg && <div className={"gs-msg " + clMsg[0]}>{clMsg[1]}</div>}
        {cl.log && cl.log.length > 0 && <div className="cl-log"><b>Recent calls</b>{cl.log.slice(0, 8).map((x, i) => <div key={i} className={x.ok ? "ok" : "bad"}><span>{x.ok ? "✓" : "✕"}</span><em>{x.name || "Lead"} {x.to}</em><small>{x.msg} · {new Date(x.t * 1000).toLocaleString()}</small></div>)}</div>}
        <p className="mut sm">🔒 Your API key is saved encrypted on your server — it never goes into your website. The agent receives the lead's answers as variables (name, email, form… — e.g. {"{{name}}"} in your Vapi/Retell prompt).</p>
      </Card>

      <Card id="places" sel={sel} onClose={close} ic="🔍" t="Google Places — Lead Finder" sub="Search businesses on Google by city and type. Your key is used only for your account." on={!!(integ.places && integ.places.ok)}>
        <PlacesConnect srv={srv} onDone={(r) => { if (r && r.ok !== undefined && (!!r.ready !== !!(integ.places && integ.places.ok) || !!r.own !== !!(integ.places && integ.places.own))) onChange({ ...integ, places: { ok: !!r.ready, own: !!r.own } }); }} />
      </Card>

      <Card id="wa" sel={sel} onClose={close} ic="💬" t="WhatsApp automation" sub="Connect your WhatsApp CRM — crecapo sends each new lead to it instantly, or your CRM fetches leads with the Lead API." on={!!wa.webhook}>
        <div className="wa-sec-h"><span>1</span><div><b>WhatsApp automation <em>Push · recommended</em></b><small>crecapo sends every new lead to your CRM's webhook within seconds — your CRM then sends the WhatsApp.</small></div></div>
        <div className="ig-g">
          <label>Your WhatsApp tool<select value={wa.provider} onChange={(e) => set("wa", { provider: e.target.value })}>{WA_PROVIDERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label>Default country code<input value={wa.country} onChange={(e) => set("wa", { country: e.target.value.replace(/\D/g, "") })} placeholder="91" /></label>
        </div>
        <p className="mut sm">{WA_HELP[wa.provider]}</p>
        <label className="ig-l">Webhook URL<input value={wa.webhook} onChange={(e) => set("wa", { webhook: e.target.value.trim() })} placeholder="https://connect.pabbly.com/workflow/sendwebhookdata/…" /></label>
        <label className="ig-l">Default message <span className="mut sm">— use {"{{name}}"}, {"{{email}}"}, {"{{phone}}"} or any field key</span><textarea rows={3} value={wa.template} onChange={(e) => set("wa", { template: e.target.value })} /></label>
        <div className="row"><button onClick={sendTest}>Send test</button><span className="mut sm">Then turn it on per form: Forms → your form → Settings → WhatsApp automation.</span></div>
        <div className="wa-key">
          <button type="button" className="wa-key-h" onClick={() => setWaOpen(!waOpen)}><b>🔑 My webhook needs a secret key</b><span className="mut sm">{waSrv ? "On · ••••" + waSrv.tail : "Use this if Send test shows 401 / Unauthorized"}</span><i>{waOpen ? "▴" : "▾"}</i></button>
          {waOpen && <div className="wa-key-b">
            <p className="mut sm">Copy the <b>secret / API key</b> shown with the webhook in your WhatsApp tool. It's saved encrypted on your server and added to every request there — it never goes into your website.</p>
            <div className="ig-g">
              <label>Send the key as<select value={waHdr} onChange={(e) => setWaHdr(e.target.value)}><option value="hmac">Signed request (HMAC-SHA256) — apiautomation.live</option><option value="bearer">Authorization: Bearer …</option><option value="x-api-key">x-api-key</option><option value="x-webhook-secret">x-webhook-secret</option><option value="x-webhook-token">x-webhook-token</option><option value="x-auth-token">x-auth-token</option></select></label>
              <label>Secret key<input type="password" value={waKey} onChange={(e) => setWaKey(e.target.value)} placeholder={waSrv ? "•••• saved — type only to change" : "paste the key"} autoComplete="off" /></label>
            </div>
            <div className="row"><button className="pri" disabled={waBusy || !wa.webhook || (!waKey.trim() && !waSrv)} onClick={waSave}>{waBusy ? "Saving…" : "Save key & test"}</button>{waSrv && <button className="xs red" onClick={waRemove}>Remove key</button>}</div>
            {waMsg && <div className={"gs-msg " + waMsg[0]}>{waMsg[1]}</div>}
          </div>}
        </div>
        <details className="ig-d"><summary>What your webhook receives</summary><pre>{JSON.stringify(SAMPLE, null, 2)}</pre><p className="mut sm">Phone numbers with 10 digits get the country code added. If a form collects payment, the message is sent after payment.</p></details>
        <p className="mut sm">🔒 Never paste a WhatsApp API key here — it would be visible inside your published website. The webhook keeps your keys safe inside your automation tool.</p>
              <div className="wa-sec">
          <div className="wa-sec-h"><span>2</span><div><b>Lead API <em>Advanced</em></b><small>Let your CRM <b>fetch</b> leads from crecapo (also old leads). Only needed if your CRM developer builds this — for instant messages, section 1 above is enough.</small></div></div>
          <details className="wa-adv"><summary>Show Lead API</summary><LeadApi /></details>
        </div>
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

      <Card id="sheets" sel={sel} onClose={close} ic="▦" t="Google Sheets" sub="Paste your Google Sheet link, match your form fields to columns, then Connect & test. Every new form submission is saved as a new row." on={!!(integ.sheets && (integ.sheets.url || integ.sheets.link) && integ.sheets.ok)}>
        <SheetsCard value={integ.sheets || {}} userEmail={(() => { try { return JSON.parse(localStorage.getItem("lb_session") || "{}").email || ""; } catch { return ""; } })()} onSave={(o) => onChange({ ...integ, sheets: o })} mailOn={!!(em.provider === "smtp" && em.smtpOk)} />
      </Card>
      <Card id="email" sel={sel} onClose={close} ic="✉" t="Email automation" sub="Send an automatic email to everyone who fills a form, and get notified of new leads." on={emOk}>
        <div className="chips" style={{ margin: "0 0 12px" }}>
          <button className={emP === "smtp" ? "on" : ""} onClick={() => setEmWay("smtp")}>Email + password (easiest)</button>
          <button className={emP === "gmail" ? "on" : ""} onClick={() => { setEmWay("gmail"); set("email", { provider: "gmail" }); }}>Gmail script</button>
          <button className={emP === "emailjs" ? "on" : ""} onClick={() => { setEmWay("emailjs"); set("email", { provider: "emailjs" }); }}>EmailJS</button>
          <button className={emP === "webhook" ? "on" : ""} onClick={() => { setEmWay("webhook"); set("email", { provider: "webhook" }); }}>Webhook (Pabbly, Make, Zapier)</button></div>
        {emP === "smtp" && <EmailEasy em={em} userEmail={(() => { try { return JSON.parse(localStorage.getItem("lb_session") || "{}").email || ""; } catch { return ""; } })()} onSave={(o) => { setEmWay(null); onChange({ ...integ, email: { ...em, ...o } }); }} />}
        {emP === "gmail" && <>
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
        {emP === "webhook" && <label className="ig-l">Webhook URL<input value={em.webhook} onChange={(e) => set("email", { webhook: e.target.value.trim() })} placeholder="https://hooks.zapier.com/…" /></label>}
        {emP === "emailjs" && <>
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
        {emP !== "smtp" && <><div className="ig-g">
          <label>Your email (for new-lead alerts & replies)<input value={em.ownerEmail} onChange={(e) => set("email", { ownerEmail: e.target.value.trim() })} placeholder="you@yourbrand.com" /></label>
          <label>Sender name<input value={em.fromName} onChange={(e) => set("email", { fromName: e.target.value })} placeholder="BYB Academy" /></label>
        </div>
        <div className="row"><button onClick={testMail}>Send test email</button><span className="mut sm">Then turn it on per form: Forms → your form → Settings → Email automation.</span></div></>}
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
              <div className="row"><input type={show[p.id] ? "text" : "password"} value={k} placeholder={p.hint} onChange={(e) => set("ai", { keys: { ...ai.keys, [p.id]: e.target.value.trim() } })}
                onPaste={(e) => { const v = e.clipboardData.getData("text").trim(); if (v) { e.preventDefault(); connectKey(p.id, v); } }} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== checked[p.id]) connectKey(p.id, v); }} />
                <button className="xs" onClick={() => setShow({ ...show, [p.id]: !show[p.id] })}>{show[p.id] ? "Hide" : "Show"}</button></div></label>
            <label><span>Model <span className="ig-opt">optional</span></span><input value={m} placeholder={(ai.autoModels || {})[p.id] ? "Automatic: " + ai.autoModels[p.id] : "Automatic — best model"} onChange={(e) => set("ai", { models: { ...ai.models, [p.id]: e.target.value.trim() } })} /></label>
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
          <p className="mut sm">When you like the result: download its code → in {BRAND.product} <b>My pages → Import HTML</b> → pick the <code>index.html</code>. Your prompt already asks them for a single static page so it imports cleanly.</p>
        </div>
        <p className="mut sm">Use it: <b>+ Create new → Create with AI</b> for a full page or website, or in the editor <b>Add → AI section</b>. Keys stay in this browser and are sent only to that AI company. Each generation uses your API credits. If a provider shows a network/CORS error, it doesn't allow browser calls — use another one.</p>
      </Card>
    </>
  );
}


/* ==================== v129 — Integrations flow: round "New Lead" hub in the middle, tools around it, drag anywhere ==================== */
const FLOW_H = 640, NODE_W = 262, NH = 104, HUB = 196, MIN_W = 980;
const FLOW_EDGE = { sheets: "New Row", email: "Auto-reply", wa: "WhatsApp", pay: "Payment", places: "Find Leads", ai: "Build Pages", call: "Calls enabled" };
const FLOW_DEF = { hub: [0.5, 186], pay: [0.04, 78], places: [0, 288], ai: [0.07, 494], sheets: [0.98, 66], email: [1, 280], call: [1, 456], wa: [0.6, 520] };
const FLOW_COL = { pay: "#2563eb", places: "#0ea5e9", ai: "#06b6d4", sheets: "#16a34a", email: "#f97316", call: "#a855f7", wa: "#10b981" };
function FlowCanvas({ apps, sel, onOpen, view, setView }) {
  const wrap = useRef(null), drag = useRef(null), [ww, setWw] = useState(1100), [dragging, setDragging] = useState("");
  const cw = Math.max(MIN_W, ww), scale = Math.min(1, ww / MIN_W), PAD = 30;
  const [rel, setRel] = useState(() => { try { return { ...FLOW_DEF, ...(JSON.parse(localStorage.getItem("lb_ig_pos3") || "{}")) }; } catch { return { ...FLOW_DEF }; } });
  useEffect(() => { const f = () => setWw(wrap.current ? wrap.current.clientWidth : 1100); f(); const ro = window.ResizeObserver ? new ResizeObserver(f) : null; if (ro && wrap.current) ro.observe(wrap.current); window.addEventListener("resize", f); return () => { window.removeEventListener("resize", f); if (ro) ro.disconnect(); }; }, []);
  const wOf = (id) => (id === "hub" ? HUB : NODE_W), hOf = (id) => (id === "hub" ? HUB : NH);
  const px = (id) => { const r = rel[id] || FLOW_DEF[id] || [0.5, 0]; return [PAD + r[0] * (cw - 2 * PAD - wOf(id)), r[1]]; };
  const down = (id) => (e) => { if (e.button !== undefined && e.button !== 0) return; const [x, y] = px(id); drag.current = { id, sx: e.clientX, sy: e.clientY, ox: x, oy: y, moved: false }; e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => {
    const d = drag.current; if (!d) return;
    const dx = (e.clientX - d.sx) / scale, dy = (e.clientY - d.sy) / scale; if (!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    d.moved = true; setDragging(d.id);
    const free = cw - 2 * PAD - wOf(d.id), x = Math.max(PAD, Math.min(cw - PAD - wOf(d.id), d.ox + dx)), y = Math.max(70, Math.min(FLOW_H - hOf(d.id) - 10, d.oy + dy));
    setRel((r) => ({ ...r, [d.id]: [free > 0 ? (x - PAD) / free : 0.5, y] }));
  };
  const up = () => { const d = drag.current; drag.current = null; setDragging(""); if (!d) return; if (d.moved) setRel((r) => { try { localStorage.setItem("lb_ig_pos3", JSON.stringify(r)); } catch { /* ignore */ } return r; }); else if (d.id !== "hub") onOpen(d.id); };
  const reset = () => { setRel({ ...FLOW_DEF }); try { localStorage.removeItem("lb_ig_pos3"); } catch { /* ignore */ } };
  const hub = px("hub"), R = HUB / 2, hcx = hub[0] + R, hcy = hub[1] + R;
  const edge = (a) => {
    const n = px(a.id), ncx = n[0] + NODE_W / 2, ncy = n[1] + NH / 2;
    let x2, y2, tx, ty;   /* end point on the box + direction the line arrives from */
    if (Math.abs(ncx - hcx) < NODE_W / 2 + R * 0.4) { const below = ncy > hcy; x2 = n[0] + 2; y2 = ncy; tx = -1; ty = 0; if (!below) { x2 = ncx; y2 = n[1] + NH; tx = 0; ty = 1; } else { x2 = n[0]; y2 = ncy; } }
    else if (ncx > hcx) { x2 = n[0]; y2 = ncy; tx = -1; ty = 0; } else { x2 = n[0] + NODE_W; y2 = ncy; tx = 1; ty = 0; }
    const ang = Math.atan2(y2 - hcy, x2 - hcx), x1 = hcx + Math.cos(ang) * (R + 2), y1 = hcy + Math.sin(ang) * (R + 2);
    const len = Math.hypot(x2 - x1, y2 - y1), c = Math.max(40, len * 0.45);
    const d = `M${x1},${y1} C${x1 + Math.cos(ang) * c},${y1 + Math.sin(ang) * c} ${x2 + tx * c},${y2 + ty * c} ${x2},${y2}`;
    /* label at the middle of the curve */
    const t = 0.5, mt = 1 - t, c1x = x1 + Math.cos(ang) * c, c1y = y1 + Math.sin(ang) * c, c2x = x2 + tx * c, c2y = y2 + ty * c;
    return { d, x1, y1, x2, y2, mx: mt ** 3 * x1 + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t ** 3 * x2, my: mt ** 3 * y1 + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t ** 3 * y2 };
  };
  return (
    <div className="igf-wrap igf2" ref={wrap}>
      <div className="igf-stage" style={{ height: FLOW_H * scale }}>
        <div className={"igf" + (dragging ? " dragging" : "")} style={{ width: cw, height: FLOW_H, transform: `scale(${scale})` }} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <div className="igf2-legend"><span className="on"><i />Connected</span><span><i />Not Connected</span></div>
          <div className="igf2-right">
            <button className="igf2-reset" onClick={reset} title="Put the boxes back in their places">↺</button>
            <div className="igf2-view">{[["flow", "Flow", "M4 6h4v4H4zM16 4h4v4h-4zM16 16h4v4h-4zM8 8l8-2M8 9l8 8"], ["cards", "Cards", "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"]].map(([k, l, ic]) => <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d={ic} /></svg>{l}</button>)}</div>
          </div>
          <svg className="igf-lines" width={cw} height={FLOW_H}>
            {apps.map((a) => { const e = edge(a); return <g key={a.id} className={"igf-e" + (a.on ? " on" : "") + (sel === a.id ? " sel" : "")}>
              <path d={e.d} className="bg" /><path d={e.d} className="fg" /><circle cx={e.x1} cy={e.y1} r="5" /><circle cx={e.x2} cy={e.y2} r="5" /></g>; })}
          </svg>
          {apps.map((a) => { const e = edge(a); return <span key={a.id + "l"} className={"igf-lab" + (a.on ? " on" : "")} style={{ left: e.mx, top: e.my }}>{FLOW_EDGE[a.id] || ""}</span>; })}
          <div className="igf2-hub" style={{ left: hub[0], top: hub[1], width: HUB, height: HUB }} onPointerDown={down("hub")} title="Every form and page sends its new leads here">
            <span className="igf2-bulb">💡</span><b>New Lead</b><small>Form • Every Form<br />&amp; Page</small>
          </div>
          {apps.map((a) => { const [x, y] = px(a.id); return (
            <div key={a.id} className={"igf-n igf2-n" + (a.on ? " on" : "") + (sel === a.id ? " sel" : "") + (dragging === a.id ? " drag" : "")} style={{ left: x, top: y, width: NODE_W, height: NH, "--c": FLOW_COL[a.id] || "#7c4dff" }}
              onPointerDown={down(a.id)} role="button" tabIndex={0} onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") onOpen(a.id); }} title={a.desc}>
              <span className={"igd-ic ic-" + a.id}>{a.ic}</span>
              <div className="igf-t"><b>{a.name}</b><small className={a.on ? "on" : ""}><i />{a.on ? "Connected" : "Not connected"}</small><em>{a.cat}</em></div>
            </div>); })}
        </div>
      </div>
    </div>
  );
}
