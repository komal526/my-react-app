// LaunchBuilder v27 — lib.js
import { DESIGNS } from "./designs.js";
// Helpers, page templates, saving/loading projects, leads and preview links


/* ==================== helpers, templates, saving/loading projects ==================== */
/* ================= default page (TGAI workshop) ================= */
// Helpers, default page templates and saving/loading of projects
export const LIMIT = 10;
export const uid = () => Math.random().toString(36).slice(2, 9);
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";
export const slugify = slug;
export const uniqFile = (ps, name) => { let f = slug(name) + ".html", i = 2; while (ps.some((p) => p.file === f)) f = slug(name) + "-" + i++ + ".html"; return f; };
export const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} hours ago` : `${Math.floor(m / 1440)} days ago`; };
/* the address people use: connected custom domain → Netlify link → (not live yet) */
export const addr = (p) => (p.domain && p.domainStatus === "connected" ? p.domain : p.netlify && p.netlify.url ? p.netlify.url.replace(/^https?:\/\//, "") : p.domain || `${p.slug}.netlify.app`);
export const pg = (name, file, html) => ({ id: uid(), name, file, html });


/* ================= default page (TGAI workshop) ================= */
export const TEMPLATE = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workshop</title>
<style>
body{margin:0;background:#f8f9fb;font-family:Inter,system-ui,sans-serif;color:#111827}
.wrap{max-width:1100px;margin:40px auto;display:flex;flex-wrap:wrap;background:#fff;border-radius:12px;box-shadow:0 2px 14px rgba(0,0,0,.08);overflow:hidden}
.l{flex:1.1 1 420px;padding:40px}.r{flex:1 1 380px;padding:40px;background:#f6f7f9}
h1{font-size:34px;line-height:1.2;margin:0 0 16px}
.card{display:flex;gap:16px;padding:20px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);margin:20px 0;background:#fff}
.card img{width:80px;height:80px;border-radius:50%;object-fit:cover}
label{display:block;font-weight:500;font-size:14px;margin-bottom:14px}
input{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:14px;border:1px solid #d1d5db;border-radius:8px;font-size:15px}
.btn{display:block;width:100%;padding:16px;border:0;border-radius:8px;background:#1d4ed8;color:#fff;font-size:18px;font-weight:600}
.r h3{font-size:22px;font-weight:600;margin:24px 0 8px}.r ul{list-style:none;padding:0;margin:0}.r li{padding:7px 0}
@media(max-width:640px){.wrap{margin:0;border-radius:0}.l,.r{padding:24px}h1{font-size:26px}}
</style></head><body>
<div class="wrap"><div class="l">
<h1>Master AI Ad Creation &amp; Start Earning with AI — Even If You're Starting from Scratch</h1>
<p style="font-size:18px;color:#4b5563;margin:0">Register Now @ ₹21 🚀</p>
<div class="card"><img src="https://placehold.co/120x120/cbd5e1/475569?text=DK" alt=""><div><b style="font-size:18px">Deenu Khan</b><div style="color:#6b7280;line-height:1.6;margin-top:4px">AI Educator | Machine Learning Engineer | Founder - TGAI (The Gurukul of AI) | Helping Students, Freelancers &amp; Businesses Master AI Ad Creation and Build Income-Generating Skills</div></div></div>
<form><label>Name *<input required></label><label>Email *<input type="email" required></label><label>Whatsapp Number *<input type="tel" required></label>
<p style="color:#6b7280;font-size:14px">You will get updates on your WhatsApp</p><button class="btn" type="submit">Register Now at ₹21</button></form></div>
<div class="r"><img src="https://placehold.co/700x700/d8efe6/0b3d2e?text=Workshop+Poster" alt="" style="width:100%;border-radius:8px">
<h3>Workshop Timings:</h3><div>📅 27th September (Sunday)</div><div style="padding-top:10px">🕒 03 PM</div>
<h3>Workshop Highlights:</h3><ul><li>✅ AI UGC Ads</li><li>✅ Product Demo Videos</li><li>✅ AI Influencer Ads</li><li>✅ Viral Hooks &amp; Scripts</li><li>✅ AI Characters &amp; Visuals</li><li>✅ Faceless Brand Videos</li><li>✅ AI Ad Creation Workflow</li><li>✅ Freelancing &amp; Agency Roadmap</li></ul>
<h3>Contact Creator</h3><div>✉️ support@thegurukulofai.com</div><div style="padding-top:8px">📞 7827876564</div></div></div>
</body></html>`;

export const BLANK = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New page</title><style>body{margin:0;font-family:Inter,system-ui,sans-serif;color:#111827}</style></head><body><section style="padding:90px 24px;text-align:center"><h1 style="font-size:44px;margin:0 0 12px">Your headline here</h1><p style="color:#6b7280;font-size:18px;margin:0">Drag elements from the left panel to build your page.</p></section></body></html>`;

/* ---- website template (Home / About / Contact with a shared header + footer) ---- */
const LINKS = [["Home", "index.html"], ["About", "about.html"], ["Contact", "contact.html"]];
const A = 'style="display:inline-block;background:#2f4bff;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600"';
const shell = (n, title, body) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – ${n}</title><style>body{margin:0;font-family:Inter,system-ui,sans-serif;color:#111827}</style></head><body><header style="display:flex;justify-content:space-between;align-items:center;padding:18px 32px;border-bottom:1px solid #e5e7eb;flex-wrap:wrap;gap:12px"><b style="font-size:20px">${n}</b><nav data-lb-autonav data-lb-name="Menu" style="display:flex;gap:22px;flex-wrap:wrap">${LINKS.map(([t, f]) => `<a href="${f}" style="color:#374151;text-decoration:none;font-weight:500">${t}</a>`).join("")}</nav></header>${body}<footer style="padding:28px;text-align:center;color:#6b7280;border-top:1px solid #e5e7eb">© ${n}. All rights reserved.</footer></body></html>`;
const site = (name) => {
  const n = name.replace(/[<>&]/g, "");
  return [
    pg("Home", "index.html", shell(n, "Home", `<section style="padding:90px 24px;text-align:center;background:#eef2ff"><h1 style="font-size:46px;margin:0 0 12px">Welcome to ${n}</h1><p style="color:#6b7280;font-size:18px;margin:0 0 24px">A short line about what you do.</p><a href="contact.html" ${A}>Get in touch</a></section>`)),
    pg("About", "about.html", shell(n, "About", `<section style="max-width:760px;margin:0 auto;padding:70px 24px"><h1 style="font-size:38px;margin:0 0 16px">About us</h1><p style="line-height:1.7;color:#4b5563">Tell your story here.</p></section>`)),
    pg("Contact", "contact.html", shell(n, "Contact", `<section style="max-width:560px;margin:0 auto;padding:70px 24px"><h1 style="font-size:38px;margin:0 0 16px">Contact us</h1><p style="color:#4b5563">Email: hello@example.com</p></section>`)),
  ];
};
export const TEMPLATES = [
  ...DESIGNS.map((d) => ({ ...d, make: () => d.pages().map((x) => pg(x.name, x.file, x.html)) })),
  { key: "workshop", type: "landing", cat: "Events & courses", hidden: true, name: "Workshop registration", note: "Two-column signup page with form", make: () => [pg("Home", "index.html", TEMPLATE)] },
  { key: "business", type: "website", cat: "Basics", hidden: true, name: "Business website", note: "Home, About and Contact pages with a shared menu", make: site },
  { key: "blank-l", type: "landing", cat: "Basics", hidden: true, name: "Blank landing page", note: "One empty page", make: () => [pg("Home", "index.html", BLANK)] },
  { key: "blank-w", type: "website", cat: "Basics", hidden: true, name: "Blank website", note: "One empty page — add more pages in the editor", make: () => [pg("Home", "index.html", BLANK)] },
];


const key = (email) => "lb_pages_" + email;
// Loads this user's projects (also upgrades older single-page data).
export const loadProjects = (email) => {
  try { return JSON.parse(localStorage.getItem(key(email)) || "[]").map((p) => (p.pages ? p : { ...p, type: "landing", pages: [pg("Home", "index.html", p.html)] })); }
  catch { return []; }
};
export const saveProjects = (email, list) => { try { localStorage.setItem(key(email), JSON.stringify(list)); return true; } catch { return false; } };

/* ==================== leads (form submissions) + temporary preview links ==================== */
// Leads (form submissions) and temporary preview links. Stored in this browser until a backend is added.

const LK = (email) => "lb_leads_" + email;
export const loadLeads = (email) => { try { return JSON.parse(localStorage.getItem(LK(email)) || "[]"); } catch { return []; } };
export const saveLeads = (email, list) => {
  try { localStorage.setItem(LK(email), JSON.stringify(list)); } catch { alert("Browser storage is full. Export and delete old leads."); }
  window.dispatchEvent(new Event("lb-leads"));
};
export const addLead = (email, lead) => saveLeads(email, [{ id: uid(), status: "new", note: "", ts: Date.now(), ...lead }, ...loadLeads(email)]);
export const payLead = (email, lid, payment) => saveLeads(email, loadLeads(email).map((l) => (l.lid === lid ? { ...l, payment: { ...(l.payment || {}), ...payment } } : l)));
export const LEAD_STATUS = [["new", "New"], ["contacted", "Contacted"], ["qualified", "Qualified"], ["won", "Won"], ["lost", "Lost"]];

/* ---- temporary preview links: #/preview/<token>/<page.html> ---- */
const PK = "lb_previews", HOURS = 72;
const readAll = () => { try { return JSON.parse(localStorage.getItem(PK) || "{}"); } catch { return {}; } };
export const previewToken = (email, pid) => {
  const all = readAll(), now = Date.now();
  Object.keys(all).forEach((k) => all[k].exp < now && delete all[k]);
  let t = Object.keys(all).find((k) => all[k].pid === pid && all[k].email === email && all[k].exp - now > 3600e3);
  if (!t) { t = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10); all[t] = { email, pid, exp: now + HOURS * 3600e3 }; }
  localStorage.setItem(PK, JSON.stringify(all));
  return t;
};
export const readToken = (t) => { const v = readAll()[t]; return v ? { ...v, expired: v.exp < Date.now() } : null; };
export const previewUrl = (token, file = "index.html") => `${location.origin}${location.pathname}#/preview/${token}/${file}`;

/* ==================== forms (Dashboard → Forms) ==================== */
const FK = (email) => "lb_forms_" + email;
export const loadForms = (email) => { try { return JSON.parse(localStorage.getItem(FK(email)) || "[]"); } catch { return []; } };
export const saveForms = (email, list) => { try { localStorage.setItem(FK(email), JSON.stringify(list)); } catch { alert("Browser storage is full."); } };
export const FIELD_TYPES = [
  ["text", "Short text"], ["email", "Email"], ["tel", "Phone / WhatsApp"], ["number", "Number"], ["textarea", "Long text"],
  ["select", "Dropdown"], ["radio", "Single choice"], ["checkboxes", "Multiple choice"], ["date", "Date"], ["time", "Time"],
  ["url", "Website link"], ["consent", "Consent checkbox"], ["heading", "Heading / text"],
];
export const FORM_DEF = { title: "", subtitle: "", submit: "Submit", success: "Thank you! We'll be in touch soon.", redirect: "", webhook: "", color: "#4f46e5", radius: 10, style: "card", width: 560 };
const f_ = (type, label, o = {}) => ({ id: uid(), type, label, name: o.name || slug(label).replace(/-/g, "_").slice(0, 30), placeholder: "", required: true, width: "full", options: [], help: "", ...o });
const OPT = (...a) => ({ options: a });
export const FORM_TEMPLATES = [
  { key: "lead", name: "Lead capture", note: "Name, email and WhatsApp — the classic", settings: { title: "Get started today", submit: "Get my free call", success: "Thanks! We'll contact you on WhatsApp shortly." }, fields: () => [f_("text", "Full name", { name: "name" }), f_("email", "Email", { name: "email" }), f_("tel", "WhatsApp number", { name: "phone" })] },
  { key: "contact", name: "Contact us", note: "General enquiries with a message", settings: { title: "Contact us", subtitle: "We reply within one working day.", submit: "Send message" }, fields: () => [f_("text", "Name", { name: "name", width: "half" }), f_("email", "Email", { name: "email", width: "half" }), f_("tel", "Phone", { name: "phone", required: false }), f_("textarea", "Message", { name: "message" })] },
  { key: "workshop", name: "Workshop registration", note: "Webinar / event signup with source", settings: { title: "Reserve your seat", submit: "Register now", success: "You're registered! Joining link is coming on WhatsApp." }, fields: () => [f_("text", "Full name", { name: "name" }), f_("email", "Email", { name: "email", width: "half" }), f_("tel", "WhatsApp number", { name: "phone", width: "half" }), f_("text", "City", { name: "city", required: false, width: "half" }), f_("select", "How did you hear about us?", { name: "source", width: "half", required: false, ...OPT("Instagram", "YouTube", "Facebook", "Friend", "Other") })] },
  { key: "newsletter", name: "Newsletter", note: "Just an email address", settings: { title: "Get weekly tips", subtitle: "One email a week. Unsubscribe anytime.", submit: "Subscribe", success: "You're subscribed!" }, fields: () => [f_("email", "Email", { name: "email", placeholder: "you@example.com" })] },
  { key: "appointment", name: "Book an appointment", note: "Date, time and service", settings: { title: "Book an appointment", submit: "Request booking", success: "Booking request received. We'll confirm on WhatsApp." }, fields: () => [f_("text", "Name", { name: "name", width: "half" }), f_("tel", "Phone", { name: "phone", width: "half" }), f_("select", "Service", { name: "service", ...OPT("Consultation", "Follow-up", "Demo") }), f_("date", "Preferred date", { name: "date", width: "half" }), f_("time", "Preferred time", { name: "time", width: "half" })] },
  { key: "quote", name: "Request a quote", note: "Project details and budget", settings: { title: "Get a free quote", submit: "Get my quote" }, fields: () => [f_("text", "Name", { name: "name", width: "half" }), f_("email", "Email", { name: "email", width: "half" }), f_("text", "Company", { name: "company", required: false }), f_("checkboxes", "Services needed", { name: "services", required: false, ...OPT("Website", "Ads", "SEO", "Branding") }), f_("select", "Budget", { name: "budget", ...OPT("Under ₹25,000", "₹25,000 – ₹1,00,000", "Above ₹1,00,000") }), f_("textarea", "Project details", { name: "details" })] },
  { key: "callback", name: "Callback request", note: "Phone and best time to call", settings: { title: "Request a callback", submit: "Call me back" }, fields: () => [f_("text", "Name", { name: "name" }), f_("tel", "Phone", { name: "phone" }), f_("radio", "Best time to call", { name: "best_time", ...OPT("Morning", "Afternoon", "Evening") })] },
  { key: "feedback", name: "Feedback", note: "Rating and comments", settings: { title: "How did we do?", submit: "Send feedback", success: "Thanks for your feedback!" }, fields: () => [f_("radio", "Your rating", { name: "rating", ...OPT("⭐ 1", "⭐ 2", "⭐ 3", "⭐ 4", "⭐ 5") }), f_("textarea", "What can we improve?", { name: "comments", required: false })] },
  { key: "rsvp", name: "Event RSVP", note: "Attending yes/no and guests", settings: { title: "Will you join us?", submit: "Send RSVP" }, fields: () => [f_("text", "Name", { name: "name" }), f_("email", "Email", { name: "email" }), f_("radio", "Attending?", { name: "attending", ...OPT("Yes", "No", "Maybe") }), f_("number", "Number of guests", { name: "guests", required: false })] },
  { key: "job", name: "Job application", note: "Role, experience and LinkedIn", settings: { title: "Apply now", submit: "Submit application" }, fields: () => [f_("text", "Full name", { name: "name" }), f_("email", "Email", { name: "email", width: "half" }), f_("tel", "Phone", { name: "phone", width: "half" }), f_("select", "Position", { name: "position", ...OPT("Designer", "Developer", "Marketing", "Sales") }), f_("number", "Years of experience", { name: "experience", width: "half" }), f_("url", "LinkedIn / portfolio", { name: "link", width: "half", required: false }), f_("textarea", "Why you?", { name: "cover" })] },
  { key: "paid", name: "Paid registration (₹21)", note: "Workshop signup that collects payment first", settings: { title: "Book your seat — ₹21", subtitle: "Pay securely, get the joining link on WhatsApp.", submit: "Register now", success: "Payment received — you're registered! 🎉", pay: { enabled: true, amount: 21, mode: "razorpay" } }, fields: () => [f_("text", "Full name", { name: "name" }), f_("email", "Email", { name: "email", width: "half" }), f_("tel", "WhatsApp number", { name: "phone", width: "half" })] },
  { key: "course", name: "Course enquiry", note: "Student, class and preferred batch", settings: { title: "Get course details", submit: "Send me details" }, fields: () => [f_("text", "Student name", { name: "name", width: "half" }), f_("tel", "Parent's phone", { name: "phone", width: "half" }), f_("select", "Course", { name: "course", ...OPT("JEE", "NEET", "Class 9–10", "Spoken English") }), f_("radio", "Preferred batch", { name: "batch", ...OPT("Morning", "Evening", "Weekend") })] },
  { key: "property", name: "Property enquiry", note: "Budget, type and site-visit request", settings: { title: "Enquire about this property", submit: "Request a call back" }, fields: () => [f_("text", "Name", { name: "name", width: "half" }), f_("tel", "Phone", { name: "phone", width: "half" }), f_("select", "Looking for", { name: "type", width: "half", ...OPT("2 BHK", "3 BHK", "4 BHK", "Villa") }), f_("select", "Budget", { name: "budget", width: "half", ...OPT("Under ₹75 L", "₹75 L – 1.5 Cr", "Above ₹1.5 Cr") }), f_("consent", "I'd like a site visit", { name: "site_visit", required: false })] },
  { key: "survey", name: "Customer survey", note: "Satisfaction, recommendation and comments", settings: { title: "Help us improve", subtitle: "Takes 30 seconds.", submit: "Submit survey", success: "Thank you for your feedback! 💛" }, fields: () => [f_("radio", "How satisfied are you?", { name: "satisfaction", ...OPT("😍 Very", "🙂 Somewhat", "😐 Neutral", "🙁 Not really") }), f_("radio", "Would you recommend us?", { name: "recommend", ...OPT("Yes", "Maybe", "No") }), f_("checkboxes", "What did you like?", { name: "liked", required: false, ...OPT("Quality", "Price", "Support", "Speed") }), f_("textarea", "Anything else?", { name: "comments", required: false })] },
  { key: "blank", name: "Blank form", note: "Start from scratch", settings: { title: "" }, fields: () => [f_("text", "Name", { name: "name" })] },
];
export const newForm = (tpl) => ({ id: "f" + uid(), name: tpl.key === "blank" ? "Untitled form" : tpl.name, template: tpl.key, fields: tpl.fields(), settings: { ...FORM_DEF, ...tpl.settings }, created: Date.now(), updated: Date.now() });
export const newField = (type) => f_(type, (FIELD_TYPES.find((t) => t[0] === type) || [, "Field"])[1], { required: type !== "heading" && type !== "checkboxes", options: /select|radio|checkboxes/.test(type) ? ["Option 1", "Option 2"] : [] });
export const findForm = (id) => { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("lb_forms_")) { try { const f = JSON.parse(localStorage.getItem(k)).find((x) => x.id === id); if (f) return { form: f, email: k.slice(9) }; } catch { /* skip */ } } } return null; };
export const formUrl = (id) => `${location.origin}${location.pathname}#/form/${id}`;

/* ==================== analytics events (recorded in Preview + form links) ==================== */
const EK = (email) => "lb_events_" + email;
export const loadEvents = (email) => { try { return JSON.parse(localStorage.getItem(EK(email)) || "[]"); } catch { return []; } };
export const addEvent = (email, e) => {
  let sid = ""; try { sid = sessionStorage.getItem("lb_sid") || Math.random().toString(36).slice(2, 10); sessionStorage.setItem("lb_sid", sid); } catch { /* ignore */ }
  const list = [...loadEvents(email), { ts: Date.now(), sid, ...e }].slice(-5000);
  try { localStorage.setItem(EK(email), JSON.stringify(list)); } catch { /* full */ }
};

/* ==================== domains ==================== */
export const HOSTS = [
  { id: "vercel", name: "Vercel", a: "76.76.21.21", cname: "cname.vercel-dns.com", note: "Free SSL issued automatically after DNS connects." },
  { id: "netlify", name: "Netlify", a: "75.2.60.5", cname: "", ask: "your-site.netlify.app", note: "Use your Netlify site address as the CNAME. SSL is automatic." },
  { id: "github", name: "GitHub Pages", a: "185.199.108.153", cname: "", ask: "username.github.io", note: "Enable HTTPS in the repo's Pages settings after DNS connects." },
  { id: "hostinger", name: "Hostinger / cPanel", a: "", cname: "", askA: true, note: "Find your server IP in hPanel → Hosting → Details. Enable free SSL there." },
  { id: "custom", name: "Other host", a: "", cname: "", askA: true, note: "Ask your host for the A record IP and CNAME target." },
];
export const cleanDomain = (v) => (v || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/?#].*$/, "").replace(/^\.+|\.+$/g, "");
export const validDomain = (d) => /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(d);
export const rootDomain = (d) => { const p = d.split("."); return p.length >= 3 && /^(co|com|net|org|gov|edu|ac|in)$/.test(p[p.length - 2]) && p[p.length - 1].length === 2 ? p.slice(-3).join(".") : p.slice(-2).join("."); };
export const isApex = (d) => rootDomain(d) === d;
/* the DNS records the user must add at their domain registrar (GoDaddy, Hostinger, Namecheap…) */
export const dnsRecords = (domain, host) => {
  if (!domain) return [];
  if (!isApex(domain)) return [{ type: "CNAME", host: domain.slice(0, -(rootDomain(domain).length + 1)), name: domain, value: host.cname || "" }];
  const r = [{ type: "A", host: "@", name: domain, value: host.a || "" }];
  if (host.cname) r.push({ type: "CNAME", host: "www", name: "www." + domain, value: host.cname });
  return r;
};
export const dnsLookup = (name, type) => dns(name, type);
const dns = async (name, type) => {
  const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
  const j = await r.json();
  return (j.Answer || []).filter((a) => a.type === (type === "A" ? 1 : 5)).map((a) => String(a.data).replace(/\.$/, "").toLowerCase());
};
/* checks the live public DNS (Google DNS) — works from the browser, no backend needed */
export const verifyDomain = async (domain, host) => {
  const recs = dnsRecords(domain, host), checks = [];
  for (const r of recs) {
    try {
      const found = await dns(r.name, r.type), want = (r.value || "").toLowerCase().replace(/\.$/, "");
      checks.push({ ...r, found, ok: !!want && found.includes(want) });
    } catch { checks.push({ ...r, found: [], ok: false, error: "Couldn't reach DNS — check your internet" }); }
  }
  return { ok: checks.length > 0 && checks.every((c) => c.ok), checks, ts: Date.now() };
};

/* ==================== integrations (WhatsApp, payments, AI) — saved in this browser only ==================== */
const IK = (email) => "lb_integrations_" + email;
export const INTEG_DEF = {
  wa: { enabled: false, provider: "webhook", webhook: "", country: "91", template: "Hi {{name}}, thanks for registering! We'll share the details on WhatsApp soon." },
  pay: { razorpayKey: "", upiId: "", payee: "", currency: "INR" },
  ai: { provider: "claude", keys: {}, models: {} },
  publish: { url: "", key: "" },
  server: { url: "", key: "", ok: false, ip: "", base: "" },
  email: { provider: "gmail", serviceId: "", templateId: "", publicKey: "", webhook: "", ownerEmail: "", fromName: "" },
};
export const loadInteg = (email) => { try { const v = JSON.parse(localStorage.getItem(IK(email)) || "{}"); return { wa: { ...INTEG_DEF.wa, ...v.wa }, pay: { ...INTEG_DEF.pay, ...v.pay }, ai: { ...INTEG_DEF.ai, ...v.ai }, email: { ...INTEG_DEF.email, ...v.email }, publish: { ...INTEG_DEF.publish, ...v.publish }, server: { ...INTEG_DEF.server, ...v.server } }; } catch { return JSON.parse(JSON.stringify(INTEG_DEF)); } };
export const saveInteg = (email, v) => localStorage.setItem(IK(email), JSON.stringify(v));
export const WA_PROVIDERS = [
  ["webhook", "Any webhook (Pabbly, Make, Zapier, n8n)"], ["aisensy", "AiSensy"], ["wati", "WATI"], ["interakt", "Interakt"], ["gupshup", "Gupshup"], ["myappz", "My CRM / own automation"],
];

/* ---- AI providers: called straight from the browser with the user's own key ---- */
export const AI_PROVIDERS = [
  { id: "claude", name: "Claude (Anthropic)", model: "claude-sonnet-5-5", keyUrl: "https://console.anthropic.com/settings/keys", hint: "sk-ant-…" },
  { id: "openai", name: "OpenAI (ChatGPT)", model: "gpt-4o", keyUrl: "https://platform.openai.com/api-keys", hint: "sk-…" },
  { id: "gemini", name: "Google Gemini", model: "gemini-flash-latest", keyUrl: "https://aistudio.google.com/app/apikey", hint: "AIza…" },
  { id: "deepseek", name: "DeepSeek", model: "deepseek-chat", keyUrl: "https://platform.deepseek.com/api_keys", hint: "sk-…" },
];
const strip = (t) => { let v = String(t || "").trim(); const m = v.match(/```(?:html)?[^\n]*\n([\s\S]*?)```/i); if (m) v = m[1]; return v.trim(); };
export async function callAI(ai, system, prompt, maxTokens = 12000) {
  const pr = AI_PROVIDERS.find((p) => p.id === ai.provider) || AI_PROVIDERS[0], key = (ai.keys || {})[pr.id], model = (ai.models || {})[pr.id] || pr.model;
  if (!key) throw new Error(`Add your ${pr.name} API key in Integrations → AI first.`);
  let r, j, text = "";
  if (pr.id === "claude") {
    r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] }) });
    j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
    text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  } else if (pr.id === "gemini") {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens } }) });
    j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
    text = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map((p) => p.text || "").join("");
  } else {
    const url = pr.id === "deepseek" ? "https://api.deepseek.com/chat/completions" : "https://api.openai.com/v1/chat/completions";
    r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + key }, body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: prompt }], max_tokens: Math.min(maxTokens, 8000) }) });
    j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
    text = (((j.choices || [])[0] || {}).message || {}).content || "";
  }
  if (!text.trim()) throw new Error("The AI returned an empty answer. Try again or change the model.");
  return text;
}
const AI_RULES = `Rules: plain HTML + CSS only, all CSS inside one <style> in <head>, no JavaScript, no external CSS frameworks. Fully responsive (mobile first, use flex/grid and a @media (max-width:767px) block). Use Google Fonts via <link> if you want. Images: use https://placehold.co/WIDTHxHEIGHT/e9e7ff/4f46e5?text=Label. Put each part in its own <section> with a meaningful id (hero, features, pricing, faq, contact…). Every form must be <form data-lb-form="Form name" data-lb-success="Thank-you text"> with name attributes on inputs (name, email, phone…). Buttons that link to sections use href="#id". Write real, specific, persuasive copy for the business described (no lorem ipsum).`;
export async function aiWebsite(ai, brief, multi) {
  const sys = multi
    ? `You are a senior web designer. Create a small multi-page website. Output ONLY the pages, each one a complete HTML document (<!DOCTYPE html>…</html>) preceded by a line exactly like: ===PAGE Home|index.html=== . First page must be index.html. 3 to 5 pages. Every page has the same header with a <nav data-lb-autonav> containing links to every page file, and the same footer. ${AI_RULES}`
    : `You are a senior web designer. Create ONE high-converting landing page. Output ONLY one complete HTML document (<!DOCTYPE html>…</html>), nothing else. ${AI_RULES}`;
  const out = await callAI(ai, sys, brief, 16000);
  if (!multi) { const h = strip(out), k = h.search(/<!doctype|<html/i); return [{ name: "Home", file: "index.html", html: k > 0 ? h.slice(k) : h }]; }
  const parts = out.split(/^===PAGE\s+(.+?)\|(.+?)===\s*$/m), pages = [];
  for (let i = 1; i < parts.length; i += 3) pages.push({ name: parts[i].trim(), file: parts[i + 1].trim().replace(/[^\w.-]/g, "-"), html: strip(parts[i + 2]) });
  if (!pages.length) return [{ name: "Home", file: "index.html", html: strip(out) }];
  return pages;
}
export const aiSection = (ai, brief) => callAI(ai, `You are a senior web designer. Output ONLY one HTML fragment: a single <section> element with ALL styling as inline style="" attributes (no <style>, no classes, no JavaScript). Responsive: use flex-wrap and max-width containers. Images: https://placehold.co/WIDTHxHEIGHT/e9e7ff/4f46e5?text=Label. Forms: <form data-lb-form="Form name"> with name attributes. Real, specific copy.`, brief, 6000).then((raw) => { const t = strip(raw), i = t.search(/<section/i), k = t.toLowerCase().lastIndexOf("</section>"); return i >= 0 && k > i ? t.slice(i, k + 10) : t; });

/* ---- AI: change one selected section/element ---- */
export async function aiEdit(ai, html, instruction) {
  const imgs = [];   // uploaded images are huge data: URLs — swap them out, put them back after
  const slim = html.replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, (m) => { imgs.push(m); return `LBIMG${imgs.length - 1}`; });
  const sys = `You edit ONE element of a web page. You get its current HTML and an instruction. Return ONLY the full updated HTML of that element (same root tag), no markdown, no explanation. Keep styling as inline style="" attributes. Keep every data-lb-* attribute, id, form/input name attributes, links and LBIMG placeholders unless the instruction asks to change them. Make it responsive (flex-wrap, max-width). Images you add: https://placehold.co/WIDTHxHEIGHT/e9e7ff/4f46e5?text=Label.`;
  const raw = await callAI(ai, sys, `Instruction: ${instruction}\n\nCurrent HTML:\n${slim}`, 8000);
  let out = strip(raw); const k = out.search(/<[a-z]/i); if (k > 0) out = out.slice(k);
  return out.replace(/LBIMG(\d+)/g, (m, i) => imgs[+i] || m);
}

/* ==================== publishing (Google Apps Script → Netlify) ==================== */
/* Netlify blocks direct browser uploads, so your free Apps Script (same one that sends Gmail) does it server-side. */
export const serverUrl = (integ) => (integ.publish && integ.publish.url) || (integ.email && integ.email.provider === "gmail" ? integ.email.webhook : "");
export const publishReady = (integ) => !!(serverUrl(integ) && integ.publish && integ.publish.key);
export async function serverCall(integ, body) {
  const url = serverUrl(integ);
  if (!url) throw new Error("Set up publishing first: Integrations → Publishing.");
  let r;
  try { r = await fetch(url, { method: "POST", body: JSON.stringify({ ...body, key: (integ.publish || {}).key || "" }) }); }
  catch { throw new Error("Couldn't reach your Apps Script. Check the Web app URL and your internet."); }
  let j; try { j = await r.json(); } catch { throw new Error("Your Apps Script didn't answer correctly. Paste the latest script, then Deploy → Manage deployments → Edit → New version."); }
  if (!j.ok) throw new Error(j.error || "Publishing failed.");
  return j;
}
export const blobToBase64 = (blob) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
export const NETLIFY_A = "75.2.60.5";
/* checks that the domain's nameservers are the ones Netlify gave */
export const verifyNS = async (domain, servers) => {
  try {
    const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(rootDomain(domain))}&type=NS`), j = await r.json();
    const found = (j.Answer || []).filter((a) => a.type === 2).map((a) => String(a.data).replace(/\.$/, "").toLowerCase());
    return { ok: servers.length > 0 && servers.every((x) => found.includes(x.toLowerCase())), found, ts: Date.now() };
  } catch { return { ok: false, found: [], ts: Date.now(), error: "Couldn't reach DNS — check your internet" }; }
};

/* ==================== your own server (lb-server.php on Hostinger / any PHP hosting) ==================== */
/* Publishes to https://your-site/sites/<name>/ and collects leads from live sites — no third-party service. */
export const defaultServerUrl = () => `${location.origin}${location.pathname.replace(/[^/]*$/, "")}lb-server.php`;
export const serverOn = (integ) => !!(integ && integ.server && integ.server.ok && integ.server.key);
export const accountKey = () => { const e = localStorage.getItem("lb_hostkey_active"); return (e && localStorage.getItem("lb_hostkey_" + e)) || ""; };
export async function phpCall(srv, body) {
  const url = (srv && srv.url) || defaultServerUrl();
  let r;
  try { r = await fetch(url, { method: "POST", body: JSON.stringify({ ...body, key: (srv && srv.key) || "" }) }); }
  catch { throw new Error("Couldn't reach lb-server.php. Make sure it's uploaded next to your builder (public_html)."); }
  if (r.status === 404) throw new Error("lb-server.php was not found at " + url + ". Upload it to the same folder as the builder.");
  let j; try { j = await r.json(); } catch { throw new Error("The server didn't answer correctly. Does your hosting support PHP? (Hostinger web hosting does.)"); }
  /* key from an older browser session? try the key that comes from your login */
  if (!j.ok && /wrong key/i.test(j.error || "") && srv && !body._acct) { const ak = accountKey(); if (ak && ak !== srv.key) { srv.key = ak; return phpCall(srv, { ...body, _acct: true }); } }
  if (!j.ok && /not set up yet/i.test(j.error || "") && body.action !== "setup" && srv && srv.key && !body._healed) {
    /* the server's lb-data folder was reset (e.g. files re-uploaded) — reconnect with the same key and retry once */
    await phpCall(srv, { action: "setup" });
    return phpCall(srv, { ...body, _healed: true });
  }
  if (!j.ok) throw new Error(j.error || "Server error");
  return j;
}
const bytes64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
export const filesForServer = (files) => files.map((f) => ({ name: f.name, b64: bytes64(typeof f.data === "string" ? new TextEncoder().encode(f.data) : f.data) }));
/* pull leads collected by live sites into the CRM (merged by lead id) */
const SK = (email) => "lb_leads_sync_" + email;
export async function syncServerLeads(email, integ, projects = []) {
  if (!serverOn(integ)) return 0;
  const since = +(localStorage.getItem(SK(email)) || 0);
  const r = await phpCall(integ.server, { action: "leads", since });
  const list = loadLeads(email), byLid = new Map(list.filter((l) => l.lid).map((l) => [l.lid, l]));
  let added = 0;
  (r.leads || []).forEach((l) => {
    const proj = projects.find((p) => p.host && p.host.slug === l.site), old = byLid.get(l.lid);
    if (old) { if (l.payment) old.payment = { ...(old.payment || {}), ...l.payment }; return; }
    const n = { id: uid(), status: "new", note: "", ...l, projectId: proj ? proj.id : "", projectName: proj ? proj.name : l.site || "Live site" };
    list.unshift(n); byLid.set(l.lid, n); added++;
  });
  saveLeads(email, list.sort((a, b) => b.ts - a.ts));
  localStorage.setItem(SK(email), String(r.now || Date.now()));
  return added;
}
export const HOSTINGER_NS = ["ns1.dns-parking.com", "ns2.dns-parking.com"];

/* ==================== Lovable / Bolt.new hand-off ==================== */
const HANDOFF = "\n\nImportant: build it as a single static index.html file with all CSS inline (no React build step), so it can be imported into LaunchBuilder.";
export const lovableUrl = (prompt) => "https://lovable.dev/#prompt=" + encodeURIComponent(prompt + HANDOFF);
export const boltText = (prompt) => prompt + HANDOFF;

/* ==================== Calendar: bookable event types ==================== */
const CK = (email) => "lb_cal_" + email;
export const loadCal = (email) => { try { return JSON.parse(localStorage.getItem(CK(email)) || "[]"); } catch { return []; } };
export const saveCal = (email, list) => { try { localStorage.setItem(CK(email), JSON.stringify(list)); } catch { alert("Browser storage is full."); } };
export const LOCATIONS = [["meet", "Google Meet"], ["zoom", "Zoom"], ["phone", "Phone call"], ["whatsapp", "WhatsApp call"], ["inperson", "In person"]];
export const newEvent = (o = {}) => ({
  id: "ev" + uid(), name: "30-minute call", slug: "", org: "", desc: "A quick call to understand your goals and answer your questions.", duration: 30, kind: "One-on-One",
  location: "meet", locationNote: "", color: "#3d6bff", days: [1, 2, 3, 4, 5], start: "10:00", end: "17:00", step: 30, ahead: 30, notice: 2, tz: "Asia/Kolkata",
  fields: { phone: true, company: false, notes: true, custom: "" }, success: "✅ You're booked! A confirmation is on its way.", redirect: "",
  pay: { enabled: false, amount: 0, mode: "razorpay" }, email: { enabled: false }, wa: { enabled: false }, questions: [], blocked: [], maxPerDay: 0, button: "Confirm booking", created: Date.now(), updated: Date.now(), ...o,
});
export const EVENT_TEMPLATES = [
  { key: "discovery", ic: "☎", label: "Discovery call", note: "Free 30-min intro call with new leads", o: { name: "Free discovery call", duration: 30, color: "#3d6bff", desc: "A 30-minute call to understand your goals and see if we're a good fit." } },
  { key: "demo", ic: "🖥", label: "Product demo", note: "Walk prospects through your product", o: { name: "Product demo", duration: 45, color: "#0ea5e9", desc: "A live walkthrough of the product, tailored to your use case. Bring your questions!", fields: { phone: true, company: true, notes: true, custom: "" }, questions: [{ label: "Company size", type: "select", options: "1–10, 11–50, 51–200, 200+", required: true }] } },
  { key: "consult", ic: "💼", label: "Paid consultation", note: "Charge before the meeting is confirmed", o: { name: "1:1 consultation", duration: 60, color: "#7c3aed", desc: "A focused 60-minute session with a personalised action plan.", pay: { enabled: true, amount: 499, mode: "razorpay" } } },
  { key: "class", ic: "🎓", label: "Workshop seat", note: "Weekend group class, ₹21 entry", o: { name: "Live workshop seat", duration: 60, kind: "Group", color: "#f97316", desc: "Reserve your seat for the next live session.", days: [0, 6], start: "11:00", end: "13:00", step: 60, pay: { enabled: true, amount: 21, mode: "razorpay" } } },
  { key: "sales", ic: "📈", label: "Sales call", note: "Qualify leads with budget questions", o: { name: "Sales call", duration: 30, color: "#16a34a", desc: "Let's discuss your requirements and find the right plan for you.", questions: [{ label: "Monthly budget", type: "select", options: "Under ₹10k, ₹10k–50k, ₹50k+", required: true }, { label: "What are you looking for?", type: "textarea", required: false }] } },
  { key: "interview", ic: "🧑‍💼", label: "Job interview", note: "Candidates pick a slot with your team", o: { name: "Interview — first round", duration: 45, color: "#0f766e", desc: "A conversation about your experience and the role.", fields: { phone: true, company: false, notes: false, custom: "" }, questions: [{ label: "Position applying for", type: "text", required: true }, { label: "LinkedIn / portfolio link", type: "text", required: false }], maxPerDay: 6 } },
  { key: "coaching", ic: "🌱", label: "Coaching session", note: "Weekly 1:1 sessions for clients", o: { name: "Coaching session", duration: 50, color: "#db2777", desc: "Your 1:1 coaching session. Come with one challenge you want to solve.", step: 60, pay: { enabled: true, amount: 1499, mode: "razorpay" } } },
  { key: "clinic", ic: "🩺", label: "Clinic appointment", note: "15-min slots, 6 days a week", o: { name: "Doctor appointment", duration: 15, color: "#0f766e", location: "inperson", locationNote: "Main Bazaar, Hamirpur", desc: "Book a consultation slot at the clinic.", days: [1, 2, 3, 4, 5, 6], start: "09:00", end: "20:00", step: 15, notice: 1, questions: [{ label: "Reason for visit", type: "select", options: "General check-up, Follow-up, Dental, Child care, Other", required: true }] } },
  { key: "salon", ic: "💇", label: "Salon / spa booking", note: "Pick a service and a time", o: { name: "Salon appointment", duration: 45, color: "#e11d48", location: "inperson", locationNote: "Mall Road, Shimla", desc: "Choose your service and a time that suits you.", days: [0, 1, 2, 3, 4, 5, 6], start: "10:00", end: "20:00", step: 30, questions: [{ label: "Service", type: "select", options: "Haircut, Hair colour, Facial, Manicure, Massage", required: true }] } },
  { key: "property", ic: "🏡", label: "Property site visit", note: "Weekend visits with directions", o: { name: "Site visit", duration: 60, color: "#c9a45c", location: "inperson", locationNote: "Aurelia show apartment", desc: "Visit the show apartment with our relationship manager.", days: [0, 5, 6], start: "10:00", end: "18:00", step: 60, questions: [{ label: "Looking for", type: "select", options: "3 BHK, 4 BHK, Villa", required: true }] } },
  { key: "tutor", ic: "📚", label: "Tutoring / demo class", note: "Free demo class for students", o: { name: "Free demo class", duration: 40, color: "#2563eb", desc: "Meet the teacher and try a class — free.", start: "16:00", end: "20:00", step: 60, fields: { phone: true, company: false, notes: false, custom: "" }, questions: [{ label: "Class / grade", type: "select", options: "Class 8, Class 9, Class 10, Class 11, Class 12", required: true }, { label: "Subject", type: "text", required: true }] } },
];
export const eventSlug = (e) => (e.slug || slug(e.name) || "event").slice(0, 40);
export const eventUrl = (e, integ) => (e.host && e.host.url) || `${location.origin}${location.pathname}#/book/${e.id}`;
export const gcalLink = (title, date, time, mins, details = "") => {
  if (!date || !time) return "";
  const [y, m, d] = date.split("-").map(Number), [hh, mm] = time.split(":").map(Number), a = new Date(y, m - 1, d, hh, mm), b = new Date(a.getTime() + (mins || 30) * 60000);
  const f = (x) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${f(a)}/${f(b)}&details=${encodeURIComponent(details)}`;
};
export const findEvent = (id) => { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("lb_cal_")) { try { const e = JSON.parse(localStorage.getItem(k)).find((x) => x.id === id); if (e) return { ev: e, email: k.slice(7) }; } catch { /* skip */ } } } return null; };
/* first publish on your own hosting connects automatically (no setup screen) */
export async function autoServer(integ, onInteg, urlOverride) {
  if (serverOn(integ) && !urlOverride) return { ok: true, integ };
  const url = urlOverride || (integ.server && integ.server.url) || defaultServerUrl();
  const chk = await checkServer(url);
  if (!chk.ok) return { ok: false, reason: urlOverride ? "diag" : "none", diag: chk.reason, url };
  const info = chk.info;
  const ak = accountKey();
  if (info.configured) {
    /* already connected — if it was connected with this same login, reconnect silently */
    if (ak) { try { const r = await phpCall({ url, key: ak, _noheal: 1 }, { action: "ping" }); const next = { ...integ, server: { url, key: ak, ok: true, ip: r.ip || "", base: r.base || "", sitesDomain: info.sitesDomain || "" } }; onInteg(next); return { ok: true, integ: next }; } catch { /* different key */ } }
    return { ok: false, reason: "key", url };
  }
  const key = ak || "lbk_" + Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  try { const r = await phpCall({ url, key }, { action: "setup" }); const next = { ...integ, server: { url, key, ok: true, ip: r.ip || "", ip6: r.ip6 || "", base: r.base || "", sitesDomain: info.sitesDomain || "" } }; onInteg(next); return { ok: true, integ: next }; }
  catch (e) { return { ok: false, reason: "error", error: e.message }; }
}

/* "darkgreen-crocodile-802080.hostingersite.com" or a full URL → the lb-server.php address */
export const serverUrlFrom = (v) => { let u = String(v || "").trim(); if (!u) return ""; if (!/^https?:\/\//.test(u)) u = "https://" + u; u = u.replace(/\/+$/, ""); return /lb-server\.php$/.test(u) ? u : u + "/lb-server.php"; };

/* find out exactly why a server address doesn't work, in plain words */
export async function checkServer(url) {
  let r;
  try { r = await fetch(url, { method: "POST", body: JSON.stringify({ action: "info" }) }); }
  catch {
    let reachable = false;
    try { await fetch(url, { mode: "no-cors" }); reachable = true; } catch { reachable = false; }
    return reachable ? { ok: false, reason: "blocked" } : { ok: false, reason: "unreachable" };
  }
  if (r.status === 404) return { ok: false, reason: "missing" };
  const txt = await r.text();
  if (/^\s*<\?php/.test(txt)) return { ok: false, reason: "nophp" };
  let j; try { j = JSON.parse(txt); } catch { return { ok: false, reason: "notjson" }; }
  if (!j || j.app !== "launchbuilder") return { ok: false, reason: "other" };
  return { ok: true, info: j };
}
export const SERVER_HELP = {
  unreachable: "Can't reach this address at all. Open it in a new tab — if the website itself doesn't load, the domain isn't pointing to your hosting yet (or the address has a typo).",
  blocked: "The website loads, but lb-server.php didn't answer. Most likely the file isn't uploaded there (the site shows its 404 page). Upload the latest dist folder contents to that website's folder.",
  missing: "lb-server.php is not on this website (404). Upload the latest dist folder contents — it includes lb-server.php — into this website's folder (public_html, or the subdomain's folder).",
  nophp: "The file is there but PHP isn't running — the server shows the code instead of running it. This needs Hostinger web hosting (not the Website Builder plan).",
  notjson: "Something answered, but it isn't LaunchBuilder's server file. Make sure the file at this address is the latest lb-server.php.",
  other: "Something answered, but it isn't LaunchBuilder's server file. Upload the latest lb-server.php.",
};

/* automatic subdomain for a published site: <slug>.<sites domain> */
export const subUrl = (integ, slug) => (integ && integ.server && integ.server.sitesDomain && slug ? `https://${slug}.${integ.server.sitesDomain}/` : "");

/* ==================== Tracking pixels (Meta, Google) — account-wide defaults ==================== */
export const PIXEL_OK = (v) => /^[A-Za-z0-9_-]{3,40}$/.test(v || "");
export const pixelsFor = (integ, project) => {
  const px = integ && integ.pixels; if (!px || px.off) return null;
  if (px.scope === "some" && !(px.ids || []).includes(project && project.id)) return null;
  const o = {}; ["meta", "ga4", "gtm", "ads", "adsLabel"].forEach((k) => { if (px[k] && (k === "adsLabel" || PIXEL_OK(px[k]))) o[k] = px[k].trim(); });
  return Object.keys(o).length ? o : null;
};

/* ==================== My templates (saved from your own websites / landing pages) ==================== */
const MT = (email) => "lb_mytpl_" + email;
export const loadMyTpl = (email) => { try { return JSON.parse(localStorage.getItem(MT(email)) || "[]"); } catch { return []; } };
export const saveMyTpl = (email, list) => { try { localStorage.setItem(MT(email), JSON.stringify(list)); } catch { alert("Browser storage is full — delete an old template first."); } };
/* turn a saved template into the same shape as the built-in ones */
export const asTemplate = (m) => ({ key: "my_" + m.id, mine: true, id: m.id, type: m.type, cat: "My templates", name: m.name, note: m.note || (m.type === "website" ? `${m.pages.length} pages · saved by you` : "Saved by you"), accent: "#f5b301",
  make: () => m.pages.map((x) => pg(x.name, x.file, x.html)) });

/* ==================== Lead pipelines (several boards, each fed by chosen forms) ==================== */
export const PIPE_COLORS = ["#3b82f6", "#f97316", "#06b6d4", "#a855f7", "#ec4899", "#22c55e", "#eab308", "#94a3b8"];
export const defaultPipe = () => ({ id: "default", name: "Sales Pipeline", def: true, forms: [], stages: [
  { id: "new", name: "New", c: "#3b82f6" }, { id: "contacted", name: "Contacted", c: "#f97316" }, { id: "qualified", name: "Qualified", c: "#06b6d4" },
  { id: "won", name: "Won", c: "#22c55e" }, { id: "lost", name: "Lost", c: "#94a3b8" }] });
const PIPEK = (email) => "lb_pipes_" + email;
export const loadPipes = (email) => { try { const l = JSON.parse(localStorage.getItem(PIPEK(email)) || "[]"); return l.length ? l : [defaultPipe()]; } catch { return [defaultPipe()]; } };
export const savePipes = (email, list) => localStorage.setItem(PIPEK(email), JSON.stringify(list));

/* ==================== Template library — real pages, loaded only when previewed or used ==================== */
export const FILE_TEMPLATES = [
  {"key": "f-ai-video-editor-masterclass", "file": "templates/ai-video-editor-masterclass.html", "thumb": "templates/thumbs/ai-video-editor-masterclass.webp", "name": "AI Video Editor Masterclass", "type": "landing", "cat": "Courses & webinars", "note": "Free live masterclass with registration form", "accent": "#d4a843"},
  {"key": "f-astrology-workshop", "file": "templates/astrology-workshop.html", "thumb": "templates/thumbs/astrology-workshop.webp", "name": "Astrology Workshop", "type": "landing", "cat": "Courses & webinars", "note": "Live workshop — understand your birth chart", "accent": "#e3b448"},
  {"key": "f-landingcraft-webinar", "file": "templates/landingcraft-webinar.html", "thumb": "templates/thumbs/landingcraft-webinar.webp", "name": "LandingCraft AI Webinar", "type": "landing", "cat": "Courses & webinars", "note": "Webinar registration with agenda and countdown", "accent": "#7c3aed"},
  {"key": "f-marketian-meta-ads", "file": "templates/marketian-meta-ads.html", "thumb": "templates/thumbs/marketian-meta-ads.webp", "name": "Marketian — Meta Ads Masterclass", "type": "landing", "cat": "Courses & webinars", "note": "Course bundle sales page with offer pricing", "accent": "#6e9bff"},
  {"key": "f-yoga-workshop", "file": "templates/yoga-workshop.html", "thumb": "templates/thumbs/yoga-workshop.webp", "name": "Yoga Workshop", "type": "landing", "cat": "Health & wellness", "note": "Calm workshop page with booking form", "accent": "#c07a5b"},
  {"key": "f-kashmir-journeys", "file": "templates/kashmir-journeys.html", "thumb": "templates/thumbs/kashmir-journeys.webp", "name": "Kashmir Journeys", "type": "website", "cat": "Travel & hotels", "note": "Travel agency — tours, packages and enquiries", "accent": "#c9a96e"},
  {"key": "f-grand-luxe-hotel", "file": "templates/grand-luxe-hotel.html", "thumb": "templates/thumbs/grand-luxe-hotel.webp", "name": "The Grand Luxe", "type": "website", "cat": "Travel & hotels", "note": "Luxury hotel — rooms, dining and bookings", "accent": "#c9a84c"},
  {"key": "f-securelife-insurance", "file": "templates/securelife-insurance.html", "thumb": "templates/thumbs/securelife-insurance.webp", "name": "SecureLife Insurance", "type": "website", "cat": "Finance & insurance", "note": "Insurance plans, quotes and trust sections", "accent": "#0ea5e9"},
  {"key": "f-vireo-digital", "file": "templates/vireo-digital.html", "thumb": "templates/thumbs/vireo-digital.webp", "name": "Vireo Digital", "type": "website", "cat": "Agencies & marketing", "note": "Digital marketing agency with services and results", "accent": "#22c55e"},
  {"key": "f-leadpipeline", "file": "templates/leadpipeline.html", "thumb": "templates/thumbs/leadpipeline.webp", "name": "LeadPipeline", "type": "website", "cat": "Agencies & marketing", "note": "WhatsApp marketing platform — features and pricing", "accent": "#ff6b6b"},
  {"key": "f-prosell-hub", "file": "templates/prosell-hub.html", "thumb": "templates/thumbs/prosell-hub.webp", "name": "ProSell Hub", "type": "website", "cat": "Agencies & marketing", "note": "Communication agency — services and portfolio", "accent": "#16a34a"},
  {"key": "f-zenflow-yoga", "file": "templates/zenflow-yoga.html", "thumb": "templates/thumbs/zenflow-yoga.webp", "name": "ZenFlow Yoga Center", "type": "website", "cat": "Health & wellness", "note": "Yoga studio — classes, teachers and schedule", "accent": "#2a9d8f"},
  {"key": "f-basera-real-estate", "file": "templates/basera-real-estate.html", "thumb": "templates/thumbs/basera-real-estate.webp", "name": "Basera Real Estate", "type": "website", "cat": "Real estate", "note": "Property portal — listings, search and enquiries", "accent": "#ffd394"},
  {"key": "f-brew-and-co", "file": "templates/brew-and-co.html", "thumb": "templates/thumbs/brew-and-co.webp", "name": "Brew & Co. Café", "type": "website", "cat": "Food & cafés", "note": "Premium café — menu, story and reservations", "accent": "#d4a574"},
  {"key": "f-prince-public-school", "file": "templates/prince-public-school.html", "thumb": "templates/thumbs/prince-public-school.webp", "name": "Prince Public School", "type": "website", "cat": "Education", "note": "School website — academics, admissions and campus", "accent": "#d4a843"},
  {"key": "f-velocita-cars", "file": "templates/velocita-cars.html", "thumb": "templates/thumbs/velocita-cars.webp", "name": "Velocita Cars", "type": "website", "cat": "Automotive", "note": "Car showroom — models, features and test drives", "accent": "#c9a84c"}
];
export const tplUrl = (t) => (import.meta.env.BASE_URL || "/") + t.file;
export const loadTemplateHtml = async (t) => {
  const r = await fetch(tplUrl(t), { cache: "force-cache" });
  if (!r.ok) throw new Error("Couldn't load the template (" + r.status + "). Check that the templates folder was uploaded.");
  return r.text();
};
