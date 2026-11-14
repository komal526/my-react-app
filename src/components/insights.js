// LaunchBuilder v48 — insights.js
// AI Consultant, step 1: a rules-based audit of each page + live performance checks.
// Runs instantly in the browser and costs nothing. The AI (chat / "AI review") builds on top of this.

const DAY = 864e5;
export const AREAS = [
  ["content", "Content & headline"], ["cta", "Call to action"], ["form", "Form"],
  ["mobile", "Mobile experience"], ["speed", "Speed & technical"], ["conv", "Conversion"],
];
export const areaName = (k) => (AREAS.find((a) => a[0] === k) || [k, k])[1];
const GENERIC_CTA = /^(submit|send|click here|click|learn more|more|go|ok|continue|read more|next|button)$/i;
const words = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;
const txt = (el) => (el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "");

/* ---------- 1. audit a page's HTML ---------- */
export function auditPage(html, { isWebsite = false } = {}) {
  const d = new DOMParser().parseFromString(html || "", "text/html"), body = d.body || d.createElement("body");
  const issues = [], add = (area, sev, title, fix) => issues.push({ area, sev, title, fix });
  const all = (s) => [...body.querySelectorAll(s)];

  /* content & headline */
  const h1s = all("h1"), h1 = h1s[0], h1t = txt(h1);
  if (!h1) add("content", 3, "No main headline (H1)", "Add one clear headline at the top that says what the visitor gets — e.g. “Learn to read your birth chart in 2 hours”.");
  else {
    if (h1s.length > 1) add("content", 1, `${h1s.length} main headlines (H1)`, "Keep one H1 at the top; make the others H2 so Google and visitors see one main promise.");
    if (words(h1t) < 4) add("content", 2, "Headline is very short", `“${h1t}” doesn't say the benefit. Write the result the visitor gets, in 6–12 words.`);
    if (words(h1t) > 16) add("content", 1, "Headline is long", "Cut the headline to 6–12 words and move the detail into the sub-headline.");
  }
  const firstSec = body.querySelector("section,header,main>div") || body;
  const sub = h1 && (h1.nextElementSibling && /^(P|H2|H3|DIV)$/.test(h1.nextElementSibling.tagName) ? h1.nextElementSibling : null);
  if (h1 && (!sub || words(txt(sub)) < 6)) add("content", 1, "No sub-headline under the headline", "Add one line under the headline: who it's for and why now (date, price, bonus).");
  const allText = txt(body), wc = words(allText);
  if (!isWebsite && wc < 120) add("content", 2, "Very little text on the page", "Add what's included, who it's for, a short FAQ and proof (reviews, numbers). Pages with real detail convert better.");
  if (!/(review|testimonial|students|clients|customers|rated|★|⭐|trusted|happy)/i.test(allText)) add("content", 2, "No social proof", "Add 2–3 short reviews with names and photos, or numbers like “1,200+ students”.");

  /* calls to action */
  const ctas = all("a[href],button").filter((b) => !b.closest("nav,footer,form,[data-lb-autonav]") && txt(b).length > 1 && txt(b).length < 50);
  const firstCtaInHero = !!(firstSec && [...firstSec.querySelectorAll("a[href],button")].some((b) => !b.closest("nav,[data-lb-autonav]") && txt(b).length > 1));
  if (!ctas.length) add("cta", 3, "No call-to-action button", "Add a big button in the first screen — e.g. “Reserve my seat” — that scrolls to the form.");
  else {
    if (!firstCtaInHero) add("cta", 2, "No button in the first screen", "Put the main button right under the headline so visitors can act without scrolling.");
    const gen = ctas.filter((b) => GENERIC_CTA.test(txt(b)));
    if (gen.length) add("cta", 2, `Generic button text: “${txt(gen[0])}”`, "Say what happens next: “Get my free guide”, “Book my call”, “Reserve my seat”.");
    const labels = new Set(ctas.map((b) => txt(b).toLowerCase()));
    if (labels.size > 6) add("cta", 1, `${labels.size} different button actions`, "Too many choices lower clicks. Use one main action and repeat the same button 2–3 times down the page.");
    if (ctas.length < 2 && wc > 300) add("cta", 1, "Only one button on a long page", "Repeat the main button after each big section and at the end.");
  }

  /* form */
  const forms = all("form");
  if (!forms.length && !isWebsite) add("form", 3, "No form on the page", "Add a form (Forms → your form → Add to page) so visitors can sign up — leads go straight to your CRM.");
  forms.forEach((f) => {
    const fields = [...f.querySelectorAll("input,select,textarea")].filter((i) => !/^(hidden|submit|button)$/i.test(i.type || ""));
    const name = f.getAttribute("data-lb-form") || "Your form";
    if (fields.length > 6) add("form", 2, `${name}: ${fields.length} fields`, "Every extra field loses sign-ups. Keep name, phone/WhatsApp and email; ask the rest later.");
    if (!fields.some((i) => /tel|phone|whats|mobile/i.test((i.type || "") + (i.name || "") + (i.placeholder || "")))) add("form", 1, `${name}: no phone/WhatsApp field`, "In India most follow-up happens on WhatsApp — add a phone field so you can reach leads fast.");
    const btn = f.querySelector("button,[type=submit]");
    if (btn && GENERIC_CTA.test(txt(btn) || btn.value || "")) add("form", 2, `${name}: button says “${txt(btn) || btn.value}”`, "Change it to the result: “Send me the details”, “Book my free call”.");
    if (fields.some((i) => !i.labels?.length && !i.placeholder && !i.getAttribute("aria-label"))) add("form", 1, `${name}: some fields have no label`, "Give every field a label or placeholder so people know what to type.");
  });

  /* mobile */
  if (!d.querySelector('meta[name="viewport"]')) add("mobile", 3, "Missing mobile viewport tag", "Without it phones show a tiny desktop page. LaunchBuilder adds it on publish — republish the page.");
  const css = all("style").map((s) => s.textContent).join("\n");
  if (!/@media[^{]*max-width/i.test(css) && !/@media/i.test(html)) add("mobile", 2, "No mobile layout rules", "The page has no phone-specific styles. Check it in the editor's phone view and stack columns on small screens.");
  const wide = all("[style]").filter((e) => { const m = (e.getAttribute("style") || "").match(/(?:^|;)\s*width\s*:\s*(\d{3,4})px/i); return m && +m[1] > 480; });
  if (wide.length) add("mobile", 2, `${wide.length} element(s) with a fixed width over 480px`, "Fixed widths overflow on phones. Use max-width:100% (Inspector → Size) instead.");
  const tiny = all("[style]").filter((e) => { const m = (e.getAttribute("style") || "").match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/i); return m && +m[1] < 13 && words(txt(e)) > 6; });
  if (tiny.length) add("mobile", 1, "Small text (under 13px)", "Body text should be at least 15–16px on phones.");

  /* speed & technical */
  const kb = Math.round((html || "").length / 1024);
  const b64 = ((html || "").match(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g) || []).reduce((n, s) => n + s.length * 0.75, 0);
  if (b64 > 600 * 1024) add("speed", 3, `${Math.round(b64 / 1024)} KB of images inside the page`, "Big pasted images slow the first load. Compress them (tinypng.com) or use smaller sizes — aim under 200 KB each.");
  else if (kb > 900) add("speed", 2, `Page is ${kb} KB`, "Large pages load slowly on 4G. Remove unused sections and compress images.");
  const imgs = all("img");
  const noAlt = imgs.filter((i) => !(i.getAttribute("alt") || "").trim());
  if (noAlt.length) add("speed", 1, `${noAlt.length} image(s) without alt text`, "Describe each image (Inspector → Image → Alt). Helps Google and screen readers.");
  if (imgs.length > 3 && !imgs.some((i) => i.getAttribute("loading") === "lazy")) add("speed", 1, "Images all load at once", "Lazy-load images below the first screen so the top appears faster.");
  if (!txt(d.querySelector("title"))) add("speed", 2, "No page title", "Set a title in Site → SEO. It's what shows in Google and the browser tab.");
  if (!d.querySelector('meta[name="description"]')) add("speed", 1, "No meta description", "Add a 150-character summary in Site → SEO so Google shows a good preview.");
  const ids = new Set(all("[id]").map((e) => e.id));
  const broken = all('a[href^="#"]').filter((a) => { const h = a.getAttribute("href").slice(1); return h && !ids.has(decodeURIComponent(h)); });
  if (broken.length) add("speed", 2, `${broken.length} button/link(s) point to a missing section`, `“${txt(broken[0]) || broken[0].getAttribute("href")}” jumps to ${broken[0].getAttribute("href")}, which doesn't exist. Fix the link in the Inspector.`);

  return { issues, h1: h1t, kb, ctas: ctas.length, forms: forms.length, words: wc };
}

/* live events from your server carry the site name — link them to your projects (and drop sites that aren't yours) */
export function resolveEvents(events, projects) {
  const bySlug = {}; projects.forEach((p) => { if (p.host && p.host.slug) bySlug[p.host.slug] = p.id; });
  return events.map((e) => (e.pid ? e : bySlug[e.site] ? { ...e, pid: bySlug[e.site] } : null)).filter(Boolean);
}

/* ---------- 2. live numbers for one project (or all) ---------- */
export function metrics(events, leads, { pid = null, days = 7, now = Date.now() } = {}) {
  const inP = (e, a, b) => e.ts >= a && e.ts < b && (!pid || e.pid === pid);
  const leadIn = (l, a, b) => l.ts >= a && l.ts < b && (!pid || l.projectId === pid);
  const calc = (a, b) => {
    const ev = events.filter((e) => inP(e, a, b)), views = ev.filter((e) => e.t === "view");
    const visitors = new Set(views.map((e) => e.sid || e.ts)).size, clicks = ev.filter((e) => e.t === "cta").length, starts = ev.filter((e) => e.t === "fstart").length;
    const inL = leads.filter((l) => leadIn(l, a, b)), subs = inL.filter((l) => l.source !== "manual").length, allLeads = inL.length;
    const fuDone = leads.reduce((n, l) => n + (l.fuLog || []).filter((f) => f.done >= a && f.done < b && (!pid || l.projectId === pid)).length, 0);
    const mob = views.filter((e) => e.dev === "mobile").length;
    return { views: views.length, visitors, clicks, starts, subs, leads: allLeads, fuDone, conv: visitors ? (subs / visitors) * 100 : 0, mob, labels: ev.filter((e) => e.t === "cta").reduce((m, e) => { const k = e.label || "Button"; m[k] = (m[k] || 0) + 1; return m; }, {}) };
  };
  const cur = calc(now - days * DAY, now + 1), prev = calc(now - 2 * days * DAY, now - days * DAY);
  const ch = (a, b) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
  return { ...cur, prev, trend: { visitors: ch(cur.visitors, prev.visitors), clicks: ch(cur.clicks, prev.clicks), subs: ch(cur.subs, prev.subs), leads: ch(cur.leads, prev.leads), fuDone: ch(cur.fuDone, prev.fuDone), conv: Math.round((cur.conv - prev.conv) * 10) / 10 } };
}

/* ---------- 3. live performance checks → direct, actionable suggestions ---------- */
export function liveIssues(m) {
  const out = [], add = (sev, title, fix) => out.push({ area: "conv", sev, title, fix, live: true });
  if (m.visitors >= 20 && m.clicks / m.visitors < 0.05) add(3, `Only ${m.clicks} button clicks from ${m.visitors} visitors`, "Visitors read but don't act. Make the first button bigger, higher and more specific, and add a reason to act now (date, seats left, bonus).");
  if (m.starts >= 5 && m.subs / m.starts < 0.4) add(3, `${m.starts} people started the form, only ${m.subs} finished`, "The form is losing people. Remove optional fields, make the button say what they get, and show the price/time near the form.");
  if (m.visitors >= 50 && m.conv < 2) add(2, `Conversion is ${m.conv.toFixed(1)}%`, "Good landing pages get 5–15%. Start with the headline and the first button — those change results the most.");
  if (m.views >= 20 && m.mob / m.views > 0.6 && m.conv < 3) add(2, `${Math.round((m.mob / m.views) * 100)}% of visitors are on phones`, "Check the page in phone view: the button and form should be reachable within one or two thumb scrolls.");
  if (m.prev.visitors >= 10 && m.visitors < m.prev.visitors * 0.6) add(1, `Visitors down ${Math.round((1 - m.visitors / m.prev.visitors) * 100)}% vs the last period`, "Traffic dropped — check your ads or posts are still running and the link in them is the live page.");
  if (m.visitors >= 10 && m.conv >= 10) add(0, `Great: ${m.conv.toFixed(1)}% conversion`, "This page works. Send more traffic to it and copy its headline style to your other pages.");
  return out;
}

/* ---------- 4. everything together, best first ---------- */
export function consult(projects, events, leads, { days = 7 } = {}) {
  const res = projects.map((p) => {
    const home = (p.pages || [])[0] || { html: "" };
    const a = auditPage(home.html, { isWebsite: p.type === "website" }), m = metrics(events, leads, { pid: p.id, days });
    const all = [...liveIssues(m), ...a.issues];
    const pts = AREAS.map(([k]) => { const lost = all.filter((i) => i.area === k).reduce((n, i) => n + [0, 6, 14, 26][i.sev], 0); return [k, Math.max(0, 100 - lost)]; });
    const score = Math.round(pts.reduce((n, [, v]) => n + v, 0) / pts.length);
    return { p, audit: a, m, issues: all.sort((x, y) => y.sev - x.sev || (y.live ? 1 : 0) - (x.live ? 1 : 0)), areas: Object.fromEntries(pts), score };
  });
  /* published pages and pages with traffic first — that's where a fix pays off */
  const weight = (r) => (r.p.status === "published" ? 2 : 1) * (1 + Math.min(5, r.m.visitors / 20));
  const tips = res.flatMap((r) => r.issues.filter((i) => i.sev > 0).map((i) => ({ ...i, p: r.p, rank: i.sev * weight(r) + (i.live ? 2 : 0) }))).sort((a, b) => b.rank - a.rank);
  return { res, tips };
}

/* text the AI gets so it answers about THIS user's real page and numbers */
export function contextFor(r) {
  if (!r) return "";
  const m = r.m, d = new DOMParser().parseFromString((r.p.pages[0] || {}).html || "", "text/html");
  d.querySelectorAll("script,style,svg,noscript").forEach((n) => n.remove());
  const outline = [...d.body.querySelectorAll("h1,h2,h3,p,li,a,button,label")].map((n) => `${n.tagName.toLowerCase()}: ${(n.textContent || "").replace(/\s+/g, " ").trim()}`).filter((s) => s.length > 4).slice(0, 140).join("\n").slice(0, 9000);
  const topBtns = Object.entries(m.labels).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} (${v})`).join(", ") || "none yet";
  return `PAGE: ${r.p.name} (${r.p.type === "website" ? "website" : "landing page"}, ${r.p.status === "published" ? "published" : "draft"})
LIVE NUMBERS (last period): ${m.visitors} visitors, ${m.views} page views, ${m.clicks} CTA clicks (most clicked: ${topBtns}), ${m.starts} form starts, ${m.subs} form submissions, conversion ${m.conv.toFixed(1)}%, ${m.views ? Math.round((m.mob / m.views) * 100) : 0}% mobile. Previous period: ${m.prev.visitors} visitors, ${m.prev.subs} submissions.
AUDIT SCORES (0-100): ${AREAS.map(([k, n]) => `${n} ${r.areas[k]}`).join(", ")}. Overall ${r.score}.
AUDIT FINDINGS:
${r.issues.map((i) => `- [${areaName(i.area)}] ${i.title}`).join("\n") || "- none"}
PAGE CONTENT (outline):
${outline}`;
}
