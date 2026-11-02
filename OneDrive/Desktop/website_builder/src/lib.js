/* ================= default page (TGAI workshop) ================= */
// Helpers, default page templates and saving/loading of projects
export const LIMIT = 5;
export const uid = () => Math.random().toString(36).slice(2, 9);
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";
export const slugify = slug;
export const uniqFile = (ps, name) => { let f = slug(name) + ".html", i = 2; while (ps.some((p) => p.file === f)) f = slug(name) + "-" + i++ + ".html"; return f; };
export const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} hours ago` : `${Math.floor(m / 1440)} days ago`; };
export const addr = (p) => (p.domain ? p.domain : `${p.slug}.launchbuilder.com`);
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
const shell = (n, title, body) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – ${n}</title><style>body{margin:0;font-family:Inter,system-ui,sans-serif;color:#111827}</style></head><body><header style="display:flex;justify-content:space-between;align-items:center;padding:18px 32px;border-bottom:1px solid #e5e7eb;flex-wrap:wrap;gap:12px"><b style="font-size:20px">${n}</b><nav style="display:flex;gap:22px">${LINKS.map(([t, f]) => `<a href="${f}" style="color:#374151;text-decoration:none;font-weight:500">${t}</a>`).join("")}</nav></header>${body}<footer style="padding:28px;text-align:center;color:#6b7280;border-top:1px solid #e5e7eb">© ${n}. All rights reserved.</footer></body></html>`;
const site = (name) => {
  const n = name.replace(/[<>&]/g, "");
  return [
    pg("Home", "index.html", shell(n, "Home", `<section style="padding:90px 24px;text-align:center;background:#eef2ff"><h1 style="font-size:46px;margin:0 0 12px">Welcome to ${n}</h1><p style="color:#6b7280;font-size:18px;margin:0 0 24px">A short line about what you do.</p><a href="contact.html" ${A}>Get in touch</a></section>`)),
    pg("About", "about.html", shell(n, "About", `<section style="max-width:760px;margin:0 auto;padding:70px 24px"><h1 style="font-size:38px;margin:0 0 16px">About us</h1><p style="line-height:1.7;color:#4b5563">Tell your story here.</p></section>`)),
    pg("Contact", "contact.html", shell(n, "Contact", `<section style="max-width:560px;margin:0 auto;padding:70px 24px"><h1 style="font-size:38px;margin:0 0 16px">Contact us</h1><p style="color:#4b5563">Email: hello@example.com</p></section>`)),
  ];
};
export const TEMPLATES = [
  { type: "landing", name: "Blank landing page", note: "One empty page", make: () => [pg("Home", "index.html", BLANK)] },
  { type: "landing", name: "Workshop registration", note: "Two-column signup page with form", make: () => [pg("Home", "index.html", TEMPLATE)] },
  { type: "website", name: "Business website", note: "Home, About and Contact pages with a shared menu", make: site },
  { type: "website", name: "Blank website", note: "One empty page — add more pages in the editor", make: () => [pg("Home", "index.html", BLANK)] },
];


const key = (email) => "lb_pages_" + email;
// Loads this user's projects (also upgrades older single-page data).
export const loadProjects = (email) => {
  try { return JSON.parse(localStorage.getItem(key(email)) || "[]").map((p) => (p.pages ? p : { ...p, type: "landing", pages: [pg("Home", "index.html", p.html)] })); }
  catch { return []; }
};
export const saveProjects = (email, list) => { try { localStorage.setItem(key(email), JSON.stringify(list)); return true; } catch { return false; } };
