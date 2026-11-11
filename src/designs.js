// LaunchBuilder v8 — designs.js
// Professional starter templates (landing pages + multi-page websites).
// Each design: { key, type, name, note, cat, accent, pages: () => [{ name, file, html }] }
// Menus use data-lb-autonav so they update when pages are added/renamed. Forms use data-lb-form → Leads.

const doc = (title, fonts, css, body) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fonts}&display=swap">
<style>*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}img{max-width:100%;display:block}a{text-decoration:none;color:inherit}.lbw-burger{display:none;background:none;border:0;font-size:24px;cursor:pointer;color:inherit}@media(max-width:767px){.lbw-burger{display:block}}${css}</style></head><body>${body}</body></html>`;
const ph = (w, h, t, bg, fg) => `https://placehold.co/${w}x${h}/${bg}/${fg}?text=${encodeURIComponent(t)}`;

/* =====================================================================
   1. LAUNCH — SaaS product (dark, aurora glow, bento grid)
   ===================================================================== */
const launchCss = `body{background:#07080d;color:#e9ecf5;font-family:Inter,system-ui,sans-serif}
.l-wrap{max-width:1160px;margin:0 auto;padding:0 24px}
.l-nav{position:sticky;top:0;z-index:40;background:rgba(7,8,13,.72);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.06)}
.l-nav .l-wrap{display:flex;align-items:center;justify-content:space-between;height:68px;gap:20px}
.l-logo{font:800 20px "Bricolage Grotesque",sans-serif;letter-spacing:-.03em;display:flex;align-items:center;gap:9px}
.l-logo i{width:26px;height:26px;border-radius:8px;background:conic-gradient(from 210deg,#7c5cff,#2ee6b0,#3d6bff,#7c5cff);display:inline-block}
.l-links{display:flex;gap:30px;font-size:14.5px;color:#a7adc2}.l-links a:hover{color:#fff}
.l-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:12px;font-weight:600;font-size:15px;background:#fff;color:#07080d}
.l-btn.ghost{background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.12)}
.l-hero{position:relative;padding:110px 0 70px;text-align:center;overflow:hidden}
.l-hero::before{content:"";position:absolute;inset:-20% -10% auto;height:620px;background:radial-gradient(40% 50% at 30% 40%,rgba(124,92,255,.55),transparent 70%),radial-gradient(35% 45% at 70% 35%,rgba(46,230,176,.35),transparent 70%);filter:blur(30px);z-index:-1}
.l-pill{display:inline-flex;gap:8px;align-items:center;padding:7px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);font-size:13px;color:#cfd5ea}
.l-pill b{color:#2ee6b0}
.l-hero h1{font:800 clamp(42px,7vw,84px)/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.045em;margin:24px auto 20px;max-width:920px}
.l-hero h1 span{background:linear-gradient(90deg,#a78bfa,#2ee6b0);-webkit-background-clip:text;background-clip:text;color:transparent}
.l-hero p{font-size:19px;line-height:1.6;color:#a7adc2;max-width:620px;margin:0 auto 34px}
.l-cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.l-shot{margin:64px auto 0;max-width:1040px;border-radius:20px;padding:10px;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.02));box-shadow:0 50px 120px -40px rgba(124,92,255,.6)}
.l-shot img{border-radius:12px;width:100%}
.l-logos{display:flex;flex-wrap:wrap;justify-content:center;gap:44px;padding:50px 0 10px;opacity:.55;font:700 18px "Bricolage Grotesque",sans-serif;letter-spacing:-.02em}
.l-sec{padding:96px 0}
.l-kick{color:#2ee6b0;font-weight:700;font-size:13px;letter-spacing:.16em;text-transform:uppercase}
.l-h2{font:800 clamp(32px,4.5vw,52px)/1.05 "Bricolage Grotesque",sans-serif;letter-spacing:-.035em;margin:14px 0 16px;max-width:700px}
.l-sub{color:#a7adc2;font-size:17px;line-height:1.7;max-width:600px;margin:0}
.l-bento{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-top:48px}
.l-card{background:linear-gradient(180deg,#11131c,#0c0e15);border:1px solid rgba(255,255,255,.07);border-radius:22px;padding:30px;position:relative;overflow:hidden}
.l-card h3{font:700 22px "Bricolage Grotesque",sans-serif;margin:16px 0 8px;letter-spacing:-.02em}.l-card p{color:#a7adc2;line-height:1.65;margin:0}
.l-card .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:20px;background:rgba(124,92,255,.18)}
.c-a{grid-column:span 4}.c-b{grid-column:span 2}.c-c{grid-column:span 2}.c-d{grid-column:span 2}.c-e{grid-column:span 2}
.l-stat{font:800 56px "Bricolage Grotesque",sans-serif;letter-spacing:-.04em;background:linear-gradient(90deg,#fff,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent}
.l-price{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
.l-plan{border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:32px;background:#0c0e15}
.l-plan.hot{background:linear-gradient(180deg,rgba(124,92,255,.22),#0c0e15 60%);border-color:rgba(167,139,250,.5)}
.l-plan .amt{font:800 46px "Bricolage Grotesque",sans-serif;letter-spacing:-.03em;margin:14px 0}.l-plan .amt small{font-size:15px;color:#a7adc2;font-weight:500}
.l-plan ul{list-style:none;padding:0;margin:20px 0 26px;color:#cfd5ea;line-height:2.1}.l-plan li::before{content:"✓  ";color:#2ee6b0}
.l-plan .l-btn{width:100%;justify-content:center}
.l-faq{max-width:760px;margin:44px auto 0;display:grid;gap:10px}
.l-faq details{border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px 22px;background:#0c0e15}
.l-faq summary{font-weight:600;font-size:17px}.l-faq p{color:#a7adc2;line-height:1.7;margin:12px 0 0}
.l-final{margin:0 24px 80px;border-radius:30px;padding:90px 24px;text-align:center;background:radial-gradient(60% 80% at 50% 0%,rgba(124,92,255,.5),transparent),#10121b;border:1px solid rgba(255,255,255,.08)}
.l-final form{display:flex;gap:10px;max-width:480px;margin:28px auto 0;flex-wrap:wrap}
.l-final input{flex:1;min-width:220px;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#fff;font:inherit}
.l-final button{padding:14px 22px;border-radius:12px;border:0;background:#fff;color:#07080d;font:600 15px Inter,sans-serif;cursor:pointer}
.l-foot{border-top:1px solid rgba(255,255,255,.06);padding:34px 0;color:#6f7590;font-size:14px}
.l-foot .l-wrap{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}
@media(max-width:860px){.l-links{display:none}.l-bento,.l-price{grid-template-columns:1fr}.c-a,.c-b,.c-c,.c-d,.c-e{grid-column:auto}.l-hero{padding:80px 0 50px}}`;
const launch = () => [{ name: "Home", file: "index.html", html: doc("Launch — ship faster", "Bricolage+Grotesque:wght@600;700;800&family=Inter:wght@400;500;600", launchCss, `
<header class="l-nav lbw-header" data-lb-name="Header"><div class="l-wrap"><a href="#" class="l-logo"><i></i>Orbit</a>
<nav class="l-links lbw-nav"><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></nav>
<div style="display:flex;gap:10px;align-items:center"><a href="#start" class="l-btn">Start free →</a><button class="lbw-burger" data-lb-burger aria-label="Menu" style="color:#fff">☰</button></div></div></header>
<section class="l-hero" data-lb-name="Hero"><div class="l-wrap">
<span class="l-pill"><b>New</b> AI workflows are here →</span>
<h1>Run your whole business on <span>one calm dashboard</span></h1>
<p>Orbit brings leads, payments and automations into one place — so your team spends time on customers, not tabs.</p>
<div class="l-cta"><a href="#start" class="l-btn">Start free — no card</a><a href="#features" class="l-btn ghost">▶ Watch 2-min demo</a></div>
<div class="l-shot"><img src="${ph(1600, 900, "Product screenshot", "11131c", "a78bfa")}" alt="Product dashboard"></div>
<div class="l-logos"><span>Northwind</span><span>Acme</span><span>Lumen</span><span>Vertex</span><span>Halcyon</span></div></div></section>
<section class="l-sec" id="features" data-lb-name="Features"><div class="l-wrap">
<div class="l-kick">Features</div><h2 class="l-h2">Everything you need. Nothing you don't.</h2><p class="l-sub">Built for small teams that want enterprise-grade tools without the enterprise-grade setup.</p>
<div class="l-bento">
<div class="l-card c-a"><div class="ic">⚡</div><h3>Automations that just work</h3><p>Trigger WhatsApp messages, emails and tasks the moment a lead comes in. No code, no zaps to babysit.</p><img src="${ph(900, 360, "Workflow builder", "151827", "2ee6b0")}" alt="" style="margin-top:22px;border-radius:14px"></div>
<div class="l-card c-b"><div class="ic">📈</div><div class="l-stat" style="margin-top:14px">3.4×</div><p>more replies on average after switching to Orbit.</p></div>
<div class="l-card c-c"><div class="ic">🔒</div><h3>Bank-grade security</h3><p>Encrypted at rest and in transit. Your data stays yours.</p></div>
<div class="l-card c-d"><div class="ic">💬</div><h3>Shared inbox</h3><p>Email, WhatsApp and chat in one thread per customer.</p></div>
<div class="l-card c-e"><div class="ic">🧠</div><h3>AI assistant</h3><p>Drafts replies, summarises calls and spots hot leads.</p></div>
</div></div></section>
<section class="l-sec" id="pricing" data-lb-name="Pricing" style="padding-top:20px"><div class="l-wrap" style="text-align:center">
<div class="l-kick">Pricing</div><h2 class="l-h2" style="margin-left:auto;margin-right:auto">Simple plans that grow with you</h2>
<div class="l-price" style="text-align:left">
<div class="l-plan"><b>Starter</b><div class="amt">₹0<small>/mo</small></div><p style="color:#a7adc2;margin:0">For trying things out.</p><ul><li>1 workspace</li><li>500 contacts</li><li>Basic automations</li></ul><a href="#start" class="l-btn ghost">Get started</a></div>
<div class="l-plan hot"><b>Growth</b> <span class="l-pill" style="margin-left:6px;padding:3px 10px;font-size:11px">Most popular</span><div class="amt">₹1,499<small>/mo</small></div><p style="color:#a7adc2;margin:0">For growing teams.</p><ul><li>5 seats</li><li>Unlimited contacts</li><li>AI assistant</li><li>WhatsApp automation</li></ul><a href="#start" class="l-btn">Start 14-day trial</a></div>
<div class="l-plan"><b>Scale</b><div class="amt">₹4,999<small>/mo</small></div><p style="color:#a7adc2;margin:0">For serious operations.</p><ul><li>Unlimited seats</li><li>Priority support</li><li>Custom integrations</li></ul><a href="#start" class="l-btn ghost">Talk to sales</a></div>
</div></div></section>
<section class="l-sec" id="faq" data-lb-name="FAQ" style="padding-top:20px"><div class="l-wrap" style="text-align:center">
<div class="l-kick">FAQ</div><h2 class="l-h2" style="margin-left:auto;margin-right:auto">Questions, answered</h2>
<div class="l-faq" style="text-align:left">
<details class="lbw-acc"><summary>Is there really a free plan?</summary><p>Yes. Starter is free forever — no credit card needed.</p></details>
<details class="lbw-acc"><summary>Can I import my existing contacts?</summary><p>Upload a CSV or connect your CRM. It takes about two minutes.</p></details>
<details class="lbw-acc"><summary>Do you offer support in Hindi?</summary><p>Yes — our support team replies in English and Hindi, 7 days a week.</p></details>
</div></div></section>
<section class="l-final" id="start" data-lb-name="Call to action"><h2 class="l-h2" style="margin:0 auto">Ready when you are.</h2><p class="l-sub" style="margin:14px auto 0">Join 4,000+ teams running on Orbit.</p>
<form data-lb-form="Orbit signup" data-lb-success="You're in! Check your inbox for the next step."><input type="email" name="email" required placeholder="you@company.com"><button type="submit">Get early access</button></form></section>
<footer class="l-foot"><div class="l-wrap"><span>© 2026 Orbit Labs</span><span>Privacy · Terms · Contact</span></div></footer>`) }];

/* =====================================================================
   2. MASTERCLASS — workshop / webinar (editorial cream, bold serif, ₹ registration)
   ===================================================================== */
const mcCss = `body{background:#f4efe6;color:#141210;font-family:"DM Sans",system-ui,sans-serif}
.m-wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.m-bar{background:#141210;color:#f4efe6;text-align:center;font-size:14px;padding:10px 16px;font-weight:500}.m-bar b{color:#ff6a2b}
.m-nav .m-wrap{display:flex;justify-content:space-between;align-items:center;height:76px}
.m-logo{font:400 28px "Instrument Serif",serif;font-style:italic}
.m-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;background:#ff6a2b;color:#fff;font-weight:700;font-size:16px;box-shadow:0 10px 30px -12px rgba(255,106,43,.8)}
.m-btn.dark{background:#141210;box-shadow:none}
.m-hero{padding:40px 0 70px}.m-hero .m-wrap{display:grid;grid-template-columns:1.25fr 1fr;gap:56px;align-items:center}
.m-tag{display:inline-flex;gap:8px;padding:8px 14px;border:1.5px solid #141210;border-radius:999px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.m-hero h1{font:400 clamp(48px,7.4vw,96px)/.95 "Instrument Serif",serif;letter-spacing:-.02em;margin:22px 0}
.m-hero h1 em{color:#ff6a2b}
.m-hero p{font-size:19px;line-height:1.6;color:#4a443c;max-width:560px}
.m-meta{display:flex;gap:28px;flex-wrap:wrap;margin:28px 0 34px}
.m-meta div{border-left:3px solid #ff6a2b;padding-left:12px}.m-meta b{display:block;font-size:18px}.m-meta span{font-size:13px;color:#6d665b}
.m-card{background:#fff;border-radius:28px;padding:32px;box-shadow:0 40px 80px -40px rgba(20,18,16,.35);border:1.5px solid #141210}
.m-card h3{font:400 34px "Instrument Serif",serif;margin:0 0 4px}
.m-price{display:flex;align-items:baseline;gap:12px;margin:6px 0 18px}.m-price b{font-size:44px;letter-spacing:-.03em}.m-price s{color:#8d867a}
.m-card label{display:block;font-weight:700;font-size:14px;margin-bottom:14px}
.m-card input{display:block;width:100%;margin-top:6px;padding:14px;border:1.5px solid #d7cfbf;border-radius:12px;font:inherit;background:#fbf8f2}
.m-card button{width:100%;padding:16px;border:0;border-radius:999px;background:#ff6a2b;color:#fff;font:700 17px "DM Sans",sans-serif;cursor:pointer}
.m-cd{display:flex;gap:10px;margin:0 0 20px}.m-cd div{flex:1;background:#141210;color:#f4efe6;border-radius:14px;padding:12px 6px;text-align:center}
.m-cd b{display:block;font-size:26px}.m-cd span{font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.1em}
.m-sec{padding:90px 0}
.m-h2{font:400 clamp(38px,5vw,64px)/1 "Instrument Serif",serif;margin:0 0 18px;letter-spacing:-.01em}
.m-learn{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}
.m-learn div{background:#fff;border-radius:22px;padding:28px;border:1.5px solid #e6dccb}
.m-learn i{font-style:normal;font:400 46px "Instrument Serif",serif;color:#ff6a2b}.m-learn h4{font-size:20px;margin:6px 0 8px}.m-learn p{color:#5b554b;line-height:1.65;margin:0}
.m-host{display:grid;grid-template-columns:.9fr 1.1fr;gap:50px;align-items:center;background:#141210;color:#f4efe6;border-radius:34px;padding:56px}
.m-host img{border-radius:22px;width:100%}.m-host p{color:#c9c1b2;line-height:1.75;font-size:17px}
.m-agenda{margin-top:34px;border-top:1.5px solid #141210}
.m-agenda div{display:grid;grid-template-columns:120px 1fr;gap:20px;padding:22px 0;border-bottom:1.5px solid #141210;font-size:18px}.m-agenda b{font-weight:700;color:#ff6a2b}
.m-quotes{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}
.m-quotes blockquote{margin:0;background:#fff;border-radius:22px;padding:26px;font:400 23px/1.3 "Instrument Serif",serif;border:1.5px solid #e6dccb}
.m-quotes cite{display:block;font:600 14px "DM Sans",sans-serif;color:#6d665b;margin-top:16px;font-style:normal}
.m-end{text-align:center;padding:100px 24px;background:#ff6a2b;color:#141210}
.m-foot{padding:26px 0;font-size:14px;color:#6d665b;text-align:center}
@media(max-width:900px){.m-hero .m-wrap,.m-host{grid-template-columns:1fr}.m-learn,.m-quotes{grid-template-columns:1fr}.m-host{padding:30px}.m-agenda div{grid-template-columns:1fr;gap:4px}}`;
const masterclass = () => [{ name: "Home", file: "index.html", html: doc("Masterclass — live workshop", "Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;700", mcCss, `
<div class="m-bar" data-lb-name="Announcement bar">🔥 Early-bird price ends Sunday — <b>only 37 seats left</b></div>
<header class="m-nav" data-lb-name="Header"><div class="m-wrap"><span class="m-logo">The Masterclass</span><a href="#register" class="m-btn dark">Reserve my seat</a></div></header>
<section class="m-hero" data-lb-name="Hero"><div class="m-wrap"><div>
<span class="m-tag">● Live online · 2 hours</span>
<h1>Create AI ads that <em>actually sell</em> — even from scratch.</h1>
<p>A hands-on live session where you'll build three ready-to-run ad creatives using free AI tools. No design or tech background needed.</p>
<div class="m-meta"><div><b>Sun, 27 Sept</b><span>Date</span></div><div><b>3:00 PM IST</b><span>Time</span></div><div><b>Zoom</b><span>Platform</span></div></div>
<a href="#register" class="m-btn">Register for ₹21 →</a></div>
<div class="m-card" id="register" data-lb-name="Registration card">
<h3>Save your seat</h3><div class="m-price"><b>₹21</b><s>₹999</s><span style="color:#ff6a2b;font-weight:700">98% off</span></div>
<div class="m-cd" data-lb-countdown="2026-12-31T15:00"><div><b data-lb-cd="d">00</b><span>Days</span></div><div><b data-lb-cd="h">00</b><span>Hrs</span></div><div><b data-lb-cd="m">00</b><span>Min</span></div><div><b data-lb-cd="s">00</b><span>Sec</span></div></div>
<form data-lb-form="Masterclass registration" data-lb-success="🎉 You're registered! The joining link is coming on WhatsApp.">
<label>Full name<input name="name" required placeholder="Your name"></label>
<label>Email<input type="email" name="email" required placeholder="you@example.com"></label>
<label>WhatsApp number<input type="tel" name="phone" required placeholder="98765 43210"></label>
<button type="submit">Register now · ₹21</button></form>
<p style="text-align:center;font-size:13px;color:#8d867a;margin:12px 0 0">🔒 100% money-back if you don't love it</p></div></div></section>
<section class="m-sec" data-lb-name="What you'll learn"><div class="m-wrap"><h2 class="m-h2">What you'll walk away with</h2>
<div class="m-learn"><div><i>01</i><h4>The 3-hook formula</h4><p>Write openings that stop the scroll in the first two seconds.</p></div><div><i>02</i><h4>AI creative workflow</h4><p>Go from idea to polished video ad in under 20 minutes.</p></div><div><i>03</i><h4>Your first client</h4><p>A simple outreach script to land your first paid project.</p></div></div></div></section>
<section class="m-sec" style="padding-top:0" data-lb-name="Host"><div class="m-wrap"><div class="m-host"><img src="${ph(700, 760, "Your photo", "2a2622", "ff6a2b")}" alt="Host">
<div><span class="m-tag" style="border-color:#f4efe6">Your host</span><h2 class="m-h2" style="margin-top:18px">Hi, I'm Deenu.</h2><p>AI educator and founder of TGAI. I've helped 12,000+ students and freelancers turn AI skills into real income — and I teach everything step by step, in Hindi and English.</p>
<div class="m-agenda" style="border-color:#f4efe6"><div style="border-color:#f4efe6"><b>12,000+</b>students taught</div><div style="border-color:#f4efe6"><b>4.9 ★</b>average rating</div></div></div></div></div></section>
<section class="m-sec" style="padding-top:0" data-lb-name="Agenda"><div class="m-wrap"><h2 class="m-h2">The 2-hour plan</h2>
<div class="m-agenda"><div><b>0:00</b>Why AI ads win in 2026 — with real examples</div><div><b>0:30</b>Live build: product demo video with AI</div><div><b>1:15</b>UGC-style ads and AI influencers</div><div><b>1:45</b>Pricing your services + live Q&amp;A</div></div></div></section>
<section class="m-sec" style="padding-top:0" data-lb-name="Testimonials"><div class="m-wrap"><h2 class="m-h2">Loved by 12,000+ learners</h2>
<div class="m-quotes"><blockquote>“I made my first ₹15,000 from AI ads two weeks after this session.”<cite>— Riya, Delhi</cite></blockquote><blockquote>“Clear, practical, zero fluff. Best ₹21 I've spent.”<cite>— Arjun, Pune</cite></blockquote><blockquote>“Finally understood how to use AI for my own shop's ads.”<cite>— Meera, Jaipur</cite></blockquote></div></div></section>
<section class="m-end" data-lb-name="Final call"><h2 class="m-h2">Seats are filling fast.</h2><p style="font-size:19px;margin:0 0 28px">Join live on Sunday — recording included for registered students.</p><a href="#register" class="m-btn dark">Register for ₹21 →</a></section>
<footer class="m-foot">© 2026 The Masterclass · support@yourbrand.com</footer>`) }];

/* =====================================================================
   3. WAITLIST — app coming soon (minimal, soft gradient, phone mockup)
   ===================================================================== */
const wlCss = `body{background:#fbfaf7;color:#18181b;font-family:"Plus Jakarta Sans",system-ui,sans-serif;overflow-x:hidden}
.w-top{display:flex;justify-content:space-between;align-items:center;max-width:1160px;margin:0 auto;padding:26px 24px}
.w-logo{font-weight:800;font-size:20px;letter-spacing:-.03em;display:flex;align-items:center;gap:10px}.w-logo i{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ff8a65,#ffd166);display:inline-block}
.w-hero{max-width:1160px;margin:0 auto;padding:50px 24px 90px;display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;position:relative}
.w-hero::before{content:"";position:absolute;right:-10%;top:-10%;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#ffd9c7,#ffeec2 45%,transparent 70%);z-index:-1;filter:blur(10px)}
.w-badge{display:inline-flex;gap:8px;align-items:center;font-size:13px;font-weight:700;background:#fff;border:1px solid #ece8df;padding:8px 14px;border-radius:999px}
.w-badge i{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.18)}
.w-hero h1{font-size:clamp(44px,6.4vw,76px);line-height:1.02;letter-spacing:-.045em;margin:22px 0;font-weight:800}
.w-hero h1 span{font-family:"Instrument Serif",serif;font-style:italic;font-weight:400;color:#ff7043}
.w-hero p{font-size:19px;line-height:1.6;color:#52525b;max-width:520px}
.w-form{display:flex;gap:8px;background:#fff;border:1px solid #ece8df;border-radius:16px;padding:6px;max-width:480px;margin-top:30px;box-shadow:0 20px 40px -24px rgba(0,0,0,.2)}
.w-form input{flex:1;border:0;padding:12px 14px;font:inherit;font-size:16px;outline:0;background:transparent;min-width:0}
.w-form button{border:0;border-radius:12px;padding:12px 20px;background:#18181b;color:#fff;font:700 15px "Plus Jakarta Sans",sans-serif;cursor:pointer;white-space:nowrap}
.w-avatars{display:flex;align-items:center;gap:12px;margin-top:18px;font-size:14px;color:#52525b}.w-avatars span{display:flex}.w-avatars span i{width:30px;height:30px;border-radius:50%;border:2px solid #fbfaf7;margin-left:-8px;display:block}
.w-phone{justify-self:center;width:300px;height:610px;border-radius:48px;background:#18181b;padding:12px;box-shadow:0 60px 100px -40px rgba(255,112,67,.55);transform:rotate(4deg)}
.w-screen{height:100%;border-radius:38px;background:linear-gradient(180deg,#fff6ef,#fff);padding:46px 18px 18px;display:flex;flex-direction:column;gap:12px}
.w-screen b{font-size:22px;letter-spacing:-.02em}.w-row{background:#fff;border:1px solid #f0ebe2;border-radius:16px;padding:14px;display:flex;gap:12px;align-items:center;font-size:14px}
.w-row i{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;font-style:normal;background:#fff1e8}
.w-feat{max-width:1160px;margin:0 auto;padding:30px 24px 100px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.w-feat div{background:#fff;border:1px solid #ece8df;border-radius:24px;padding:28px}.w-feat h3{font-size:19px;margin:14px 0 8px;letter-spacing:-.02em}.w-feat p{color:#52525b;line-height:1.65;margin:0}
.w-feat span{font-size:26px}
.w-foot{text-align:center;color:#a1a1aa;font-size:14px;padding:0 24px 40px}
@media(max-width:900px){.w-hero,.w-feat{grid-template-columns:1fr}.w-phone{transform:none;width:260px;height:520px}}`;
const waitlist = () => [{ name: "Home", file: "index.html", html: doc("Coming soon — join the waitlist", "Plus+Jakarta+Sans:wght@400;500;700;800&family=Instrument+Serif:ital@1", wlCss, `
<div class="w-top"><span class="w-logo"><i></i>Habitly</span><a href="#join" style="font-weight:700;font-size:15px">Join waitlist →</a></div>
<section class="w-hero" data-lb-name="Hero"><div>
<span class="w-badge"><i></i>Launching January 2026</span>
<h1>Build habits that <span>finally</span> stick.</h1>
<p>Habitly is a tiny daily coach in your pocket — 2 minutes a day, gentle nudges, and streaks you'll actually want to keep.</p>
<form class="w-form" id="join" data-lb-form="Waitlist" data-lb-success="You're on the list! 🎉 We'll email you before launch."><input type="email" name="email" required placeholder="Enter your email"><button type="submit">Get early access</button></form>
<div class="w-avatars"><span><i style="background:#ffb4a2;margin:0"></i><i style="background:#b5e48c"></i><i style="background:#a0c4ff"></i><i style="background:#ffd166"></i></span>2,481 people already joined</div></div>
<div class="w-phone"><div class="w-screen"><b>Good morning, Aanya ☀️</b><span style="color:#71717a;font-size:13px">3 habits left today</span>
<div class="w-row"><i>💧</i>Drink 2 glasses of water</div><div class="w-row"><i>📖</i>Read 10 pages</div><div class="w-row"><i>🧘</i>5-minute breathing</div>
<div class="w-row" style="background:#18181b;color:#fff;border:0;margin-top:auto"><i style="background:#ff7043">🔥</i>21-day streak — keep going!</div></div></div></section>
<section class="w-feat" data-lb-name="Features"><div><span>🌱</span><h3>Start tiny</h3><p>Habits that take two minutes, so you never skip a day.</p></div><div><span>🔔</span><h3>Gentle nudges</h3><p>Reminders at the moments you're most likely to act.</p></div><div><span>📊</span><h3>See your progress</h3><p>Beautiful streaks and weekly insights that keep you motivated.</p></div></section>
<footer class="w-foot">© 2026 Habitly · Made with care in India</footer>`) }];

/* =====================================================================
   4. COACH — personal brand / consultant (warm, serif, programs)
   ===================================================================== */
const coCss = `body{background:#fff;color:#1d2420;font-family:Manrope,system-ui,sans-serif}
.c-wrap{max-width:1140px;margin:0 auto;padding:0 24px}
.c-nav{border-bottom:1px solid #eef0ec}.c-nav .c-wrap{display:flex;justify-content:space-between;align-items:center;height:74px}
.c-logo{font:500 24px Fraunces,serif;letter-spacing:-.02em}
.c-links{display:flex;gap:28px;font-weight:600;font-size:15px;color:#4a544e}
.c-btn{display:inline-block;padding:14px 24px;border-radius:12px;background:#264d3b;color:#fff;font-weight:700}
.c-btn.out{background:transparent;color:#264d3b;border:1.5px solid #264d3b}
.c-hero{background:#f3f6f1}.c-hero .c-wrap{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;padding-top:70px;padding-bottom:70px}
.c-hero h1{font:400 clamp(42px,5.6vw,70px)/1.04 Fraunces,serif;letter-spacing:-.03em;margin:0 0 20px}.c-hero h1 i{color:#c1673f}
.c-hero p{font-size:18.5px;line-height:1.7;color:#4a544e;margin:0 0 30px}
.c-hero img{border-radius:200px 200px 24px 24px;width:100%;aspect-ratio:4/5;object-fit:cover}
.c-proof{display:flex;gap:34px;margin-top:34px;flex-wrap:wrap}.c-proof b{display:block;font:500 34px Fraunces,serif}.c-proof span{font-size:14px;color:#6b756f}
.c-sec{padding:96px 0}.c-h2{font:400 clamp(34px,4.4vw,52px)/1.08 Fraunces,serif;letter-spacing:-.02em;margin:0 0 14px}
.c-progs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:44px}
.c-prog{border:1px solid #e5e9e3;border-radius:22px;padding:30px;display:flex;flex-direction:column;gap:10px}
.c-prog.hl{background:#264d3b;color:#fff;border-color:#264d3b}.c-prog.hl p,.c-prog.hl li{color:#d6e3db}
.c-prog h3{font:500 25px Fraunces,serif;margin:0}.c-prog p{color:#5b655f;line-height:1.65;margin:0}
.c-prog ul{padding-left:18px;color:#4a544e;line-height:1.9;margin:4px 0 14px}
.c-prog .p{font:500 32px Fraunces,serif;margin-top:auto}
.c-quote{background:#fbf6f0;border-radius:30px;padding:60px;text-align:center}
.c-quote q{font:400 clamp(24px,3vw,36px)/1.35 Fraunces,serif;display:block;max-width:820px;margin:0 auto 22px}
.c-book{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start;background:#f3f6f1;border-radius:30px;padding:50px}
.c-book label{display:block;font-weight:700;font-size:14px;margin-bottom:14px}
.c-book input,.c-book select,.c-book textarea{display:block;width:100%;margin-top:6px;padding:13px 14px;border:1px solid #d5ddd6;border-radius:12px;font:inherit;background:#fff}
.c-book button{width:100%;padding:15px;border:0;border-radius:12px;background:#264d3b;color:#fff;font:700 16px Manrope,sans-serif;cursor:pointer}
.c-foot{padding:34px 0;border-top:1px solid #eef0ec;color:#6b756f;font-size:14px}.c-foot .c-wrap{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
@media(max-width:900px){.c-links{display:none}.c-hero .c-wrap,.c-book{grid-template-columns:1fr}.c-progs{grid-template-columns:1fr}.c-quote,.c-book{padding:30px}}`;
const coach = () => [{ name: "Home", file: "index.html", html: doc("Coach — book a free call", "Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Manrope:wght@400;600;700", coCss, `
<header class="c-nav lbw-header" data-lb-name="Header"><div class="c-wrap"><span class="c-logo">Ananya Rao</span><nav class="c-links lbw-nav"><a href="#programs">Programs</a><a href="#stories">Stories</a><a href="#book">Book a call</a></nav><button class="lbw-burger" data-lb-burger aria-label="Menu">☰</button></div></header>
<section class="c-hero" data-lb-name="Hero"><div class="c-wrap"><div>
<h1>Lead with clarity. <i>Grow</i> without burning out.</h1>
<p>I help first-time founders and managers build calm, high-performing teams — through 1:1 coaching, group programs and practical frameworks.</p>
<a href="#book" class="c-btn">Book a free 20-min call</a> <a href="#programs" class="c-btn out" style="margin-left:8px">See programs</a>
<div class="c-proof"><div><b>300+</b><span>leaders coached</span></div><div><b>9 yrs</b><span>experience</span></div><div><b>4.9/5</b><span>client rating</span></div></div></div>
<img src="${ph(800, 1000, "Your portrait", "dfe7df", "264d3b")}" alt="Coach portrait"></div></section>
<section class="c-sec" id="programs" data-lb-name="Programs"><div class="c-wrap"><h2 class="c-h2">Ways to work together</h2><p style="color:#5b655f;font-size:17px;max-width:560px">Pick the format that fits your stage. Every program starts with a free discovery call.</p>
<div class="c-progs">
<div class="c-prog"><h3>Clarity Session</h3><p>One deep-dive call to untangle your biggest challenge.</p><ul><li>90-minute session</li><li>Action plan PDF</li></ul><div class="p">₹4,900</div><a href="#book" class="c-btn out" style="text-align:center">Book</a></div>
<div class="c-prog hl"><h3>Leader Lab · 8 weeks</h3><p>Small-group program for new managers.</p><ul><li>8 live sessions</li><li>Peer circle</li><li>Templates &amp; playbooks</li></ul><div class="p">₹24,000</div><a href="#book" class="c-btn" style="background:#fff;color:#264d3b;text-align:center">Apply now</a></div>
<div class="c-prog"><h3>1:1 Coaching</h3><p>Ongoing partnership for founders and executives.</p><ul><li>2 calls / month</li><li>WhatsApp support</li></ul><div class="p">₹18,000<span style="font-size:16px">/mo</span></div><a href="#book" class="c-btn out" style="text-align:center">Enquire</a></div>
</div></div></section>
<section class="c-sec" id="stories" style="padding-top:0" data-lb-name="Testimonial"><div class="c-wrap"><div class="c-quote"><q>Working with Ananya changed how I run my company. My team is calmer, and so am I.</q><b>Rahul Mehta</b><div style="color:#6b756f;font-size:14px">Founder, Brightpath</div></div></div></section>
<section class="c-sec" id="book" style="padding-top:0" data-lb-name="Booking"><div class="c-wrap"><div class="c-book"><div><h2 class="c-h2">Book a free discovery call</h2><p style="color:#5b655f;line-height:1.7;font-size:17px">Tell me a little about yourself and pick a time. I'll reply within one working day with a calendar link.</p></div>
<form data-lb-form="Discovery call" data-lb-success="Thank you! I'll get back to you within one working day.">
<label>Name<input name="name" required></label><label>Email<input type="email" name="email" required></label>
<label>I'm interested in<select name="program"><option>Clarity Session</option><option>Leader Lab</option><option>1:1 Coaching</option><option>Not sure yet</option></select></label>
<label>What's your biggest challenge right now?<textarea name="message" rows="3"></textarea></label><button type="submit">Request my free call</button></form></div></div></section>
<footer class="c-foot"><div class="c-wrap"><span>© 2026 Ananya Rao Coaching</span><span>hello@ananyarao.com</span></div></footer>`) }];

/* =====================================================================
   5. AGENCY — multi-page website (dark + lime, big type)
   ===================================================================== */
const agCss = `body{background:#0e0f0c;color:#f2f2ea;font-family:"Space Grotesk",system-ui,sans-serif}
.a-wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.a-head{position:sticky;top:0;z-index:40;background:rgba(14,15,12,.85);backdrop-filter:blur(12px)}
.a-head .a-wrap{display:flex;justify-content:space-between;align-items:center;height:76px}
.a-logo{font-weight:700;font-size:22px;letter-spacing:-.03em}.a-logo b{color:#d4ff3f}
.a-nav{display:flex;gap:30px;font-size:15px;color:#b7b8ab}.a-nav a:hover{color:#d4ff3f}
.a-btn{display:inline-flex;gap:10px;align-items:center;padding:14px 24px;border-radius:999px;background:#d4ff3f;color:#0e0f0c;font-weight:700}
.a-btn.out{background:transparent;color:#f2f2ea;border:1px solid #3a3c33}
.a-hero{padding:100px 0 60px}.a-hero h1{font-size:clamp(54px,10vw,148px);line-height:.88;letter-spacing:-.06em;margin:0;font-weight:700}
.a-hero h1 em{font-style:normal;color:#d4ff3f}
.a-hero .row{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;flex-wrap:wrap;margin-top:44px}
.a-hero p{max-width:460px;font-size:19px;line-height:1.55;color:#b7b8ab;margin:0}
.a-marq{border-top:1px solid #2a2c24;border-bottom:1px solid #2a2c24;padding:22px 0;overflow:hidden;white-space:nowrap;font-size:28px;font-weight:700;color:#5d6052}
.a-marq span{margin-right:50px}.a-marq b{color:#d4ff3f;margin-right:50px}
.a-sec{padding:100px 0}.a-h2{font-size:clamp(38px,5.4vw,72px);line-height:.95;letter-spacing:-.05em;margin:0 0 20px;font-weight:700}
.a-svc{border-top:1px solid #2a2c24}.a-svc div{display:grid;grid-template-columns:80px 1.2fr 2fr;gap:24px;padding:30px 0;border-bottom:1px solid #2a2c24;align-items:baseline}
.a-svc i{font-style:normal;color:#d4ff3f;font-weight:700}.a-svc h3{font-size:30px;margin:0;letter-spacing:-.03em}.a-svc p{color:#b7b8ab;line-height:1.6;margin:0;font-size:17px}
.a-work{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:40px}
.a-work a{display:block}.a-work img{border-radius:20px;width:100%;aspect-ratio:4/3;object-fit:cover}
.a-work b{display:block;font-size:22px;margin-top:14px}.a-work span{color:#8b8d7f}
.a-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:40px}.a-stats b{display:block;font-size:56px;letter-spacing:-.05em;color:#d4ff3f}.a-stats span{color:#b7b8ab}
.a-cta{background:#d4ff3f;color:#0e0f0c;border-radius:36px;padding:80px 50px;text-align:center}.a-cta .a-btn{background:#0e0f0c;color:#d4ff3f}
.a-form{display:grid;grid-template-columns:1fr 1fr;gap:16px}.a-form label{font-size:14px;color:#b7b8ab;font-weight:500}
.a-form input,.a-form textarea,.a-form select{display:block;width:100%;margin-top:8px;padding:15px;background:#16170f;border:1px solid #2f3128;border-radius:14px;color:#f2f2ea;font:inherit}
.a-form .full{grid-column:1/-1}.a-form button{grid-column:1/-1;padding:17px;border:0;border-radius:999px;background:#d4ff3f;color:#0e0f0c;font:700 17px "Space Grotesk",sans-serif;cursor:pointer}
.a-foot{border-top:1px solid #2a2c24;padding:44px 0;color:#8b8d7f}.a-foot .a-wrap{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
.a-foot nav{display:flex;gap:22px}
@media(max-width:860px){.a-nav{display:none}.a-svc div{grid-template-columns:1fr;gap:6px}.a-work,.a-form{grid-template-columns:1fr}.a-stats{grid-template-columns:1fr 1fr}.a-cta{padding:50px 24px}}`;
const agHead = `<header class="a-head lbw-header" data-lb-name="Header"><div class="a-wrap"><a href="index.html" class="a-logo">north<b>.</b>studio</a>
<nav class="a-nav lbw-nav" data-lb-autonav><a href="index.html">Home</a><a href="services.html">Services</a><a href="work.html">Work</a><a href="contact.html">Contact</a></nav>
<div style="display:flex;gap:10px;align-items:center"><a href="contact.html" class="a-btn">Start a project ↗</a><button class="lbw-burger" data-lb-burger aria-label="Menu" style="color:#fff">☰</button></div></div></header>`;
const agFoot = `<footer class="a-foot" data-lb-name="Footer"><div class="a-wrap"><div><div class="a-logo">north<b>.</b>studio</div><p style="margin:8px 0 0">Brand, web &amp; growth for ambitious companies.</p></div>
<nav data-lb-autonav><a href="index.html">Home</a><a href="services.html">Services</a><a href="work.html">Work</a><a href="contact.html">Contact</a></nav><span>hello@north.studio</span></div></footer>`;
const agF = "Space+Grotesk:wght@400;500;700";
const agWork = [1, 2, 3, 4].map((i) => `<a href="work.html"><img src="${ph(900, 675, "Project " + i, ["1c1e17", "2a2c24", "222419", "191a14"][i - 1], "d4ff3f")}" alt=""><b>${["Lumen Bank", "Kiro Foods", "Atlas Travel", "Mono Fitness"][i - 1]}</b><span>${["Brand + website", "Packaging + e-commerce", "App design", "Campaign"][i - 1]}</span></a>`).join("");
const agency = () => [
  { name: "Home", file: "index.html", html: doc("North Studio — brand & web", agF, agCss, `${agHead}
<section class="a-hero" data-lb-name="Hero"><div class="a-wrap"><h1>We build brands<br>people <em>remember.</em></h1>
<div class="row"><p>An independent studio for strategy, identity and websites that turn attention into revenue.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a href="contact.html" class="a-btn">Book an intro call ↗</a><a href="work.html" class="a-btn out">See our work</a></div></div></div></section>
<div class="a-marq" data-lb-name="Marquee"><span>Strategy</span><b>✦</b><span>Identity</span><b>✦</b><span>Websites</span><b>✦</b><span>Campaigns</span><b>✦</b><span>Growth</span></div>
<section class="a-sec" data-lb-name="Selected work"><div class="a-wrap"><h2 class="a-h2">Selected work</h2><div class="a-work">${agWork}</div></div></section>
<section class="a-sec" style="padding-top:0" data-lb-name="Stats"><div class="a-wrap"><div class="a-stats"><div><b>120+</b><span>projects shipped</span></div><div><b>14</b><span>countries</span></div><div><b>3.2×</b><span>avg. conversion lift</span></div><div><b>9 yrs</b><span>in business</span></div></div></div></section>
<section class="a-sec" style="padding-top:0" data-lb-name="CTA"><div class="a-wrap"><div class="a-cta"><h2 class="a-h2">Have a project in mind?</h2><p style="font-size:19px;margin:0 0 28px">We take on four new clients each quarter.</p><a href="contact.html" class="a-btn">Let's talk ↗</a></div></div></section>${agFoot}`) },
  { name: "Services", file: "services.html", html: doc("Services — North Studio", agF, agCss, `${agHead}
<section class="a-hero" style="padding-bottom:30px" data-lb-name="Page title"><div class="a-wrap"><h1 style="font-size:clamp(48px,8vw,110px)">Services</h1><div class="row"><p>Everything you need to launch or relaunch — under one roof.</p></div></div></section>
<section class="a-sec" style="padding-top:30px" data-lb-name="Services list"><div class="a-wrap"><div class="a-svc">
<div><i>01</i><h3>Brand strategy</h3><p>Positioning, naming and messaging workshops that give your team one clear story.</p></div>
<div><i>02</i><h3>Visual identity</h3><p>Logos, type, colour and a flexible design system that scales across every touchpoint.</p></div>
<div><i>03</i><h3>Websites</h3><p>Fast, beautiful sites designed to convert — built so your team can edit everything.</p></div>
<div><i>04</i><h3>Growth &amp; ads</h3><p>Landing pages, ad creatives and experiments that turn traffic into customers.</p></div></div></div></section>${agFoot}`) },
  { name: "Work", file: "work.html", html: doc("Work — North Studio", agF, agCss, `${agHead}
<section class="a-hero" style="padding-bottom:30px" data-lb-name="Page title"><div class="a-wrap"><h1 style="font-size:clamp(48px,8vw,110px)">Work</h1><div class="row"><p>A few projects we're proud of.</p></div></div></section>
<section class="a-sec" style="padding-top:0" data-lb-name="Projects"><div class="a-wrap"><div class="a-work">${agWork}</div></div></section>${agFoot}`) },
  { name: "Contact", file: "contact.html", html: doc("Contact — North Studio", agF, agCss, `${agHead}
<section class="a-hero" style="padding-bottom:30px" data-lb-name="Page title"><div class="a-wrap"><h1 style="font-size:clamp(48px,8vw,110px)">Let's <em>talk.</em></h1><div class="row"><p>Tell us about your project. We reply within 24 hours.</p></div></div></section>
<section class="a-sec" style="padding-top:20px" data-lb-name="Contact form"><div class="a-wrap"><form class="a-form" data-lb-form="Agency enquiry" data-lb-success="Thanks! We'll get back to you within 24 hours.">
<label>Name<input name="name" required></label><label>Email<input type="email" name="email" required></label>
<label>Company<input name="company"></label><label>Budget<select name="budget"><option>Under ₹2L</option><option>₹2L – ₹5L</option><option>₹5L+</option></select></label>
<label class="full">About the project<textarea name="message" rows="5" required></textarea></label><button type="submit">Send enquiry ↗</button></form></div></section>${agFoot}`) },
];

/* =====================================================================
   6. CLINIC — local business website (clean teal, trust, appointment)
   ===================================================================== */
const clCss = `body{background:#fff;color:#0f2a2e;font-family:"Plus Jakarta Sans",system-ui,sans-serif}
.k-wrap{max-width:1160px;margin:0 auto;padding:0 24px}
.k-top{background:#0f766e;color:#e6fffb;font-size:13.5px}.k-top .k-wrap{display:flex;justify-content:space-between;gap:12px;padding:9px 24px;flex-wrap:wrap}
.k-head{background:#fff;border-bottom:1px solid #e6efee;position:sticky;top:0;z-index:40}.k-head .k-wrap{display:flex;justify-content:space-between;align-items:center;height:76px}
.k-logo{font-weight:800;font-size:21px;display:flex;gap:10px;align-items:center;letter-spacing:-.02em}.k-logo i{width:34px;height:34px;border-radius:10px;background:#0f766e;color:#fff;display:grid;place-items:center;font-style:normal}
.k-nav{display:flex;gap:28px;font-weight:600;color:#38575b;font-size:15px}
.k-btn{display:inline-block;padding:13px 22px;border-radius:12px;background:#0f766e;color:#fff;font-weight:700}
.k-btn.alt{background:#fff;color:#0f766e;border:1.5px solid #0f766e}
.k-hero{background:linear-gradient(180deg,#ecfdf9,#fff)}.k-hero .k-wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:50px;align-items:center;padding-top:64px;padding-bottom:64px}
.k-hero h1{font-size:clamp(40px,5.4vw,64px);line-height:1.05;letter-spacing:-.04em;margin:16px 0 18px;font-weight:800}.k-hero h1 span{color:#0f766e}
.k-hero p{font-size:18px;line-height:1.7;color:#4b6669;margin:0 0 28px}
.k-chip{display:inline-flex;gap:8px;align-items:center;background:#fff;border:1px solid #cdeee8;padding:7px 14px;border-radius:999px;font-size:13.5px;font-weight:700;color:#0f766e}
.k-hero img{border-radius:28px;width:100%;aspect-ratio:1/1;object-fit:cover}
.k-trust{display:flex;gap:26px;margin-top:30px;flex-wrap:wrap;color:#4b6669;font-size:14px}.k-trust b{display:block;color:#0f2a2e;font-size:22px}
.k-sec{padding:90px 0}.k-h2{font-size:clamp(32px,4vw,46px);letter-spacing:-.035em;margin:0 0 12px;font-weight:800}.k-sub{color:#4b6669;font-size:17px;line-height:1.7;max-width:600px;margin:0}
.k-svcs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}
.k-svc{border:1px solid #e3eeed;border-radius:22px;padding:28px;transition:box-shadow .2s,transform .2s}.k-svc:hover{transform:translateY(-4px);box-shadow:0 24px 40px -24px rgba(15,118,110,.35)}
.k-svc span{width:50px;height:50px;border-radius:14px;background:#ecfdf9;display:grid;place-items:center;font-size:24px}.k-svc h3{font-size:20px;margin:16px 0 8px}.k-svc p{color:#4b6669;line-height:1.65;margin:0}
.k-docs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}.k-docs img{border-radius:20px;width:100%;aspect-ratio:4/5;object-fit:cover}.k-docs b{display:block;margin-top:12px;font-size:18px}.k-docs span{color:#4b6669;font-size:14px}
.k-book{display:grid;grid-template-columns:1fr 1fr;gap:40px;background:#0f2a2e;color:#e6fffb;border-radius:30px;padding:50px}
.k-book p{color:#a9c7c6;line-height:1.7}.k-book label{display:block;font-size:14px;font-weight:600;margin-bottom:12px;color:#cfe9e6}
.k-book input,.k-book select{display:block;width:100%;margin-top:6px;padding:13px;border-radius:12px;border:1px solid #2b4a4d;background:#163639;color:#fff;font:inherit}
.k-book button{width:100%;padding:15px;border:0;border-radius:12px;background:#2dd4bf;color:#06302b;font:800 16px "Plus Jakarta Sans",sans-serif;cursor:pointer}
.k-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.k-info{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:30px}.k-info div{background:#f4faf9;border-radius:18px;padding:24px}.k-info b{display:block;margin-bottom:6px}
.k-foot{background:#f4faf9;padding:40px 0;color:#4b6669;font-size:14px}.k-foot .k-wrap{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.k-foot nav{display:flex;gap:20px}
@media(max-width:900px){.k-nav{display:none}.k-hero .k-wrap,.k-book{grid-template-columns:1fr}.k-svcs,.k-docs,.k-info{grid-template-columns:1fr}.k-book{padding:28px}}`;
const clHead = `<div class="k-top" data-lb-name="Top bar"><div class="k-wrap"><span>📍 Main Bazaar, Hamirpur</span><span>📞 +91 98765 43210 · Mon–Sat 9am–8pm</span></div></div>
<header class="k-head lbw-header" data-lb-name="Header"><div class="k-wrap"><a href="index.html" class="k-logo"><i>✚</i>CareWell Clinic</a>
<nav class="k-nav lbw-nav" data-lb-autonav><a href="index.html">Home</a><a href="services.html">Services</a><a href="about.html">About</a><a href="contact.html">Contact</a></nav>
<div style="display:flex;gap:10px;align-items:center"><a href="contact.html" class="k-btn">Book appointment</a><button class="lbw-burger" data-lb-burger aria-label="Menu">☰</button></div></div></header>`;
const clFoot = `<footer class="k-foot" data-lb-name="Footer"><div class="k-wrap"><div><b style="color:#0f2a2e">CareWell Clinic</b><br>Caring for families since 2012.</div>
<nav data-lb-autonav><a href="index.html">Home</a><a href="services.html">Services</a><a href="about.html">About</a><a href="contact.html">Contact</a></nav><span>© 2026 CareWell Clinic</span></div></footer>`;
const clF = "Plus+Jakarta+Sans:wght@400;600;700;800";
const clSvcs = [["🦷", "Dental care", "Check-ups, cleaning, fillings and smile makeovers."], ["❤️", "General medicine", "Diagnosis and treatment for everyday health concerns."], ["👶", "Child care", "Gentle care, vaccinations and growth check-ups."], ["🦴", "Physiotherapy", "Recovery plans for pain, injuries and posture."], ["🧪", "Lab tests", "Accurate reports, most within 24 hours."], ["🩺", "Health packages", "Annual check-ups for the whole family."]]
  .map(([i, t, d]) => `<div class="k-svc"><span>${i}</span><h3>${t}</h3><p>${d}</p></div>`).join("");
const clBook = `<div class="k-book" id="book" data-lb-name="Appointment"><div><h2 class="k-h2" style="color:#fff">Book an appointment</h2><p>Pick a service and a preferred time — we'll confirm on WhatsApp within an hour.</p><p>📞 Prefer to call? <b style="color:#2dd4bf">+91 98765 43210</b></p></div>
<form data-lb-form="Clinic appointment" data-lb-success="Request received! We'll confirm your appointment on WhatsApp shortly.">
<div class="k-two"><label>Name<input name="name" required></label><label>Phone<input type="tel" name="phone" required></label></div>
<label>Email<input type="email" name="email"></label>
<label>Service<select name="service"><option>General medicine</option><option>Dental care</option><option>Child care</option><option>Physiotherapy</option><option>Lab tests</option></select></label>
<div class="k-two"><label>Date<input type="date" name="date" required></label><label>Time<input type="time" name="time"></label></div>
<button type="submit">Request appointment</button></form></div>`;
const clinic = () => [
  { name: "Home", file: "index.html", html: doc("CareWell Clinic — trusted family care", clF, clCss, `${clHead}
<section class="k-hero" data-lb-name="Hero"><div class="k-wrap"><div><span class="k-chip">★ 4.9 rating · 2,300+ Google reviews</span>
<h1>Gentle, expert care for <span>your whole family.</span></h1><p>Experienced doctors, modern equipment and same-day appointments — right in the heart of the city.</p>
<a href="#book" class="k-btn">Book an appointment</a> <a href="tel:+919876543210" class="k-btn alt" style="margin-left:8px">📞 Call now</a>
<div class="k-trust"><div><b>12+ yrs</b>caring for families</div><div><b>15</b>specialist doctors</div><div><b>Same day</b>appointments</div></div></div>
<img src="${ph(800, 800, "Clinic photo", "d5f5ef", "0f766e")}" alt="Clinic"></div></section>
<section class="k-sec" data-lb-name="Services"><div class="k-wrap"><h2 class="k-h2">Our services</h2><p class="k-sub">Everything your family needs, under one roof.</p><div class="k-svcs">${clSvcs}</div></div></section>
<section class="k-sec" style="padding-top:0" data-lb-name="Booking"><div class="k-wrap">${clBook}</div></section>${clFoot}`) },
  { name: "Services", file: "services.html", html: doc("Services — CareWell Clinic", clF, clCss, `${clHead}
<section class="k-sec" data-lb-name="Services"><div class="k-wrap"><span class="k-chip">What we do</span><h2 class="k-h2" style="margin-top:14px">Services &amp; treatments</h2><p class="k-sub">From routine check-ups to specialist care — booked in minutes.</p><div class="k-svcs">${clSvcs}</div></div></section>
<section class="k-sec" style="padding-top:0" data-lb-name="Booking"><div class="k-wrap">${clBook}</div></section>${clFoot}`) },
  { name: "About", file: "about.html", html: doc("About — CareWell Clinic", clF, clCss, `${clHead}
<section class="k-sec" data-lb-name="About"><div class="k-wrap"><span class="k-chip">About us</span><h2 class="k-h2" style="margin-top:14px">Caring for our city since 2012</h2><p class="k-sub">We started with one doctor and a simple promise: listen first, treat with kindness, explain everything clearly.</p>
<div class="k-docs">${["Dr. Neha Sharma", "Dr. Arjun Verma", "Dr. Priya Thakur"].map((n, i) => `<div><img src="${ph(600, 750, n, "e6f7f4", "0f766e")}" alt="${n}"><b>${n}</b><span>${["General physician · 14 yrs", "Dental surgeon · 11 yrs", "Paediatrician · 9 yrs"][i]}</span></div>`).join("")}</div></div></section>${clFoot}`) },
  { name: "Contact", file: "contact.html", html: doc("Contact — CareWell Clinic", clF, clCss, `${clHead}
<section class="k-sec" data-lb-name="Contact"><div class="k-wrap"><h2 class="k-h2">Visit or contact us</h2><div class="k-info"><div><b>📍 Address</b>Main Bazaar, Hamirpur, HP 177001</div><div><b>📞 Phone</b>+91 98765 43210</div><div><b>🕘 Hours</b>Mon–Sat 9am–8pm · Sun 10am–2pm</div></div>
<div data-lb-map="Hamirpur, Himachal Pradesh" style="border-radius:22px;overflow:hidden;height:360px;margin-top:24px"><iframe src="https://maps.google.com/maps?q=Hamirpur%2C%20Himachal%20Pradesh&z=14&output=embed" loading="lazy" style="width:100%;height:100%;border:0"></iframe></div></div></section>
<section class="k-sec" style="padding-top:0" data-lb-name="Booking"><div class="k-wrap">${clBook}</div></section>${clFoot}`) },
];

/* small helpers shared by the designs below */
const navLinks = (links) => links.map(([t, f]) => `<a href="${f}">${t}</a>`).join("");
const burger = (c = "inherit") => `<button class="lbw-burger" data-lb-burger aria-label="Menu" style="color:${c}">☰</button>`;

/* =====================================================================
   7. ESTATE — luxury real-estate project (black + gold, serif)
   ===================================================================== */
const esCss = `body{background:#0d0c0a;color:#efe9dd;font-family:Jost,system-ui,sans-serif}
.e-w{max-width:1180px;margin:0 auto;padding:0 24px}.e-gold{color:#c9a45c}
.e-nav .e-w{display:flex;justify-content:space-between;align-items:center;height:84px}.e-logo{font:500 26px "Cormorant Garamond",serif;letter-spacing:.2em}
.e-links{display:flex;gap:32px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#bdb4a3}
.e-btn{display:inline-block;padding:15px 28px;border:1px solid #c9a45c;color:#c9a45c;font-size:13px;letter-spacing:.2em;text-transform:uppercase}.e-btn.f{background:#c9a45c;color:#0d0c0a}
.e-hero{position:relative;min-height:88vh;display:flex;align-items:flex-end;background:linear-gradient(0deg,#0d0c0a 5%,rgba(13,12,10,.2) 60%),url("${ph(1800, 1100, "Project exterior", "2a2722", "c9a45c")}") center/cover}
.e-hero .e-w{padding-bottom:80px;width:100%}.e-hero h1{font:400 clamp(52px,8vw,112px)/.95 "Cormorant Garamond",serif;margin:0 0 22px}.e-hero p{max-width:520px;font-size:18px;line-height:1.7;color:#cfc6b4}
.e-facts{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #2c2925;border-bottom:1px solid #2c2925}.e-facts div{padding:34px 24px;border-right:1px solid #2c2925}.e-facts div:last-child{border:0}
.e-facts b{display:block;font:400 42px "Cormorant Garamond",serif;color:#c9a45c}.e-facts span{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#9b9384}
.e-sec{padding:100px 0}.e-h2{font:400 clamp(38px,5vw,64px)/1.02 "Cormorant Garamond",serif;margin:0 0 18px}
.e-gal{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:260px 260px;gap:14px;margin-top:40px}.e-gal img{width:100%;height:100%;object-fit:cover}.e-gal img:first-child{grid-row:span 2}
.e-am{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#2c2925;margin-top:40px}.e-am div{background:#0d0c0a;padding:30px 22px}.e-am i{font-style:normal;font-size:26px}.e-am b{display:block;margin-top:12px;font-weight:500}
.e-plans{width:100%;border-collapse:collapse;margin-top:34px;font-size:17px}.e-plans td,.e-plans th{padding:22px 10px;border-bottom:1px solid #2c2925;text-align:left}.e-plans th{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9b9384;font-weight:500}
.e-visit{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}.e-visit label{display:block;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#9b9384;margin-bottom:18px}
.e-visit input,.e-visit select{display:block;width:100%;margin-top:8px;padding:14px 0;background:transparent;border:0;border-bottom:1px solid #3a362f;color:#efe9dd;font:inherit;font-size:17px}
.e-visit button{margin-top:10px;padding:17px 32px;border:0;background:#c9a45c;color:#0d0c0a;font:500 13px Jost,sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer}
.e-foot{padding:40px 0;border-top:1px solid #2c2925;color:#7d766a;font-size:13px;letter-spacing:.1em}
@media(max-width:860px){.e-links{display:none}.e-facts,.e-am{grid-template-columns:1fr 1fr}.e-gal{grid-template-columns:1fr;grid-template-rows:auto}.e-gal img{height:240px}.e-gal img:first-child{grid-row:auto}.e-visit{grid-template-columns:1fr}}`;
const estate = () => [{ name: "Home", file: "index.html", html: doc("The Aurelia — luxury residences", "Cormorant+Garamond:wght@400;500&family=Jost:wght@300;400;500", esCss, `
<header class="e-nav lbw-header" data-lb-name="Header" style="position:absolute;left:0;right:0;z-index:5"><div class="e-w"><span class="e-logo">AURELIA</span><nav class="e-links lbw-nav"><a href="#residences">Residences</a><a href="#amenities">Amenities</a><a href="#visit">Visit</a></nav><div style="display:flex;gap:10px;align-items:center"><a href="#visit" class="e-btn">Book a visit</a>${burger("#c9a45c")}</div></div></header>
<section class="e-hero" data-lb-name="Hero"><div class="e-w"><span class="e-gold" style="letter-spacing:.3em;font-size:13px">NOW BOOKING · PHASE II</span><h1>Live above<br>the <i class="e-gold">ordinary.</i></h1><p>3 &amp; 4 BHK sky residences with private decks, 40 acres of greens and a 5-star clubhouse — minutes from the city.</p><a href="#visit" class="e-btn f">Schedule a site visit</a></div></section>
<div class="e-facts" data-lb-name="Key facts"><div><b>3 &amp; 4</b><span>BHK residences</span></div><div><b>40</b><span>acres of greens</span></div><div><b>₹2.4 Cr*</b><span>starting price</span></div><div><b>2027</b><span>possession</span></div></div>
<section class="e-sec" id="residences" data-lb-name="Gallery"><div class="e-w"><span class="e-gold" style="letter-spacing:.3em;font-size:13px">THE RESIDENCES</span><h2 class="e-h2">Designed for light, space and quiet.</h2>
<div class="e-gal"><img src="${ph(900, 540, "Living room", "2a2722", "c9a45c")}" alt=""><img src="${ph(500, 400, "Bedroom", "24211d", "c9a45c")}" alt=""><img src="${ph(500, 400, "Deck", "1f1d19", "c9a45c")}" alt=""><img src="${ph(500, 400, "Kitchen", "1f1d19", "c9a45c")}" alt=""><img src="${ph(500, 400, "Bath", "24211d", "c9a45c")}" alt=""></div>
<table class="e-plans"><tr><th>Type</th><th>Carpet area</th><th>Price</th><th></th></tr><tr><td>3 BHK Residence</td><td>1,850 sq.ft</td><td class="e-gold">₹2.4 Cr onwards</td><td><a href="#visit" class="e-gold">Enquire →</a></td></tr><tr><td>4 BHK Sky Villa</td><td>2,900 sq.ft</td><td class="e-gold">₹3.9 Cr onwards</td><td><a href="#visit" class="e-gold">Enquire →</a></td></tr></table></div></section>
<section class="e-sec" id="amenities" style="padding-top:0" data-lb-name="Amenities"><div class="e-w"><h2 class="e-h2">Amenities</h2><div class="e-am"><div><i>🏊</i><b>Infinity pool</b></div><div><i>🏋️</i><b>Wellness club</b></div><div><i>🌳</i><b>Central park</b></div><div><i>🛡️</i><b>24×7 security</b></div><div><i>🎾</i><b>Sports courts</b></div><div><i>🍷</i><b>Sky lounge</b></div><div><i>👶</i><b>Kids' zone</b></div><div><i>🚗</i><b>EV parking</b></div></div></div></section>
<section class="e-sec" id="visit" style="padding-top:0" data-lb-name="Site visit"><div class="e-w e-visit"><div><h2 class="e-h2">Visit the <i class="e-gold">show apartment</i></h2><p style="color:#bdb4a3;line-height:1.8;font-size:17px">Our relationship manager will call you to confirm a time. Complimentary pick-up available.</p><p class="e-gold" style="font-size:20px">+91 98765 43210</p></div>
<form data-lb-form="Site visit" data-lb-success="Thank you — our team will call you shortly to confirm your visit."><label>Full name<input name="name" required></label><label>Phone<input type="tel" name="phone" required></label><label>Interested in<select name="type"><option>3 BHK Residence</option><option>4 BHK Sky Villa</option></select></label><label>Preferred date<input type="date" name="date"></label><button type="submit">Request visit</button></form></div></section>
<footer class="e-foot"><div class="e-w">© 2026 Aurelia Residences · RERA No. XXXX · *Prices exclusive of taxes</div></footer>`) }];

/* =====================================================================
   8. BREW — café landing (terracotta, playful serif, menu + reservation)
   ===================================================================== */
const brCss = `body{background:#fff8ef;color:#3b1f12;font-family:Outfit,system-ui,sans-serif}
.b-w{max-width:1140px;margin:0 auto;padding:0 24px}
.b-nav .b-w{display:flex;justify-content:space-between;align-items:center;height:80px}.b-logo{font:700 30px Fraunces,serif;color:#c2410c}
.b-links{display:flex;gap:28px;font-weight:600}.b-btn{display:inline-block;padding:14px 24px;border-radius:999px;background:#c2410c;color:#fff8ef;font-weight:700}
.b-hero .b-w{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;padding-top:40px;padding-bottom:80px}
.b-hero h1{font:600 clamp(48px,7vw,92px)/.95 Fraunces,serif;letter-spacing:-.03em;margin:0 0 22px}.b-hero h1 span{color:#c2410c;font-style:italic}
.b-hero p{font-size:19px;line-height:1.6;color:#6b4532;max-width:480px}
.b-blob{aspect-ratio:1;border-radius:46% 54% 42% 58%/52% 44% 56% 48%;overflow:hidden;border:10px solid #fde0c5}.b-blob img{width:100%;height:100%;object-fit:cover}
.b-hours{display:flex;gap:30px;margin-top:30px;flex-wrap:wrap}.b-hours b{display:block;font-size:20px}.b-hours span{font-size:14px;color:#8a6350}
.b-sec{padding:90px 0}.b-h2{font:600 clamp(36px,4.6vw,58px)/1 Fraunces,serif;margin:0 0 14px;letter-spacing:-.02em}
.b-menu{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px}
.b-item{background:#fff;border-radius:26px;padding:16px 16px 22px;box-shadow:0 20px 40px -30px rgba(120,50,10,.5)}.b-item img{border-radius:18px;width:100%;aspect-ratio:4/3;object-fit:cover}
.b-item .r{display:flex;justify-content:space-between;align-items:baseline;margin-top:14px}.b-item b{font:600 21px Fraunces,serif}.b-item em{font-style:normal;font-weight:700;color:#c2410c}.b-item p{color:#8a6350;margin:6px 0 0;line-height:1.55}
.b-res{background:#3b1f12;color:#fff8ef;border-radius:34px;padding:54px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
.b-res label{display:block;font-size:14px;font-weight:600;margin-bottom:12px;color:#fde0c5}.b-res input,.b-res select{display:block;width:100%;margin-top:6px;padding:13px;border-radius:14px;border:0;background:#fff8ef;color:#3b1f12;font:inherit}
.b-res button{width:100%;padding:15px;border:0;border-radius:999px;background:#fb923c;color:#3b1f12;font:800 16px Outfit,sans-serif;cursor:pointer;margin-top:6px}
.b-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.b-foot{padding:36px 0;text-align:center;color:#8a6350}
@media(max-width:860px){.b-links{display:none}.b-hero .b-w,.b-res{grid-template-columns:1fr}.b-menu{grid-template-columns:1fr}.b-res{padding:28px}}`;
const brew = () => [{ name: "Home", file: "index.html", html: doc("Brew & Bloom — café", "Fraunces:ital,wght@0,600;1,600&family=Outfit:wght@400;600;700;800", brCss, `
<header class="b-nav lbw-header" data-lb-name="Header"><div class="b-w"><span class="b-logo">brew&amp;bloom</span><nav class="b-links lbw-nav"><a href="#menu">Menu</a><a href="#visit">Visit</a><a href="#reserve">Reserve</a></nav><div style="display:flex;gap:8px;align-items:center"><a href="#reserve" class="b-btn">Book a table</a>${burger()}</div></div></header>
<section class="b-hero" data-lb-name="Hero"><div class="b-w"><div><h1>Slow coffee,<br><span>warm</span> people.</h1><p>Single-origin brews, fresh bakes every morning and a sunny corner to linger in. Your new favourite spot.</p><a href="#menu" class="b-btn">See the menu</a>
<div class="b-hours" id="visit"><div><b>8am – 10pm</b><span>Every day</span></div><div><b>Mall Road</b><span>Shimla</span></div><div><b>4.8 ★</b><span>1,900 reviews</span></div></div></div>
<div class="b-blob"><img src="${ph(800, 800, "Latte art", "fde0c5", "c2410c")}" alt="Coffee"></div></div></section>
<section class="b-sec" id="menu" style="padding-top:20px" data-lb-name="Menu"><div class="b-w"><h2 class="b-h2">Today's favourites</h2><p style="color:#8a6350;font-size:17px">Made fresh in our kitchen, every single day.</p>
<div class="b-menu">${[["Honey Oat Latte", "₹220", "Espresso, oat milk, wildflower honey."], ["Almond Croissant", "₹180", "Twice-baked, flaky, generous."], ["Shakshuka Bowl", "₹340", "Baked eggs, peppers, sourdough."]].map(([n, p, d]) => `<div class="b-item"><img src="${ph(600, 450, n, "fde0c5", "c2410c")}" alt=""><div class="r"><b>${n}</b><em>${p}</em></div><p>${d}</p></div>`).join("")}</div></div></section>
<section class="b-sec" id="reserve" style="padding-top:0" data-lb-name="Reservation"><div class="b-w"><div class="b-res"><div><h2 class="b-h2">Save your table</h2><p style="color:#fde0c5;line-height:1.7;font-size:17px">Weekend brunch fills up fast. Reserve and we'll keep your favourite spot ready.</p></div>
<form data-lb-form="Table reservation" data-lb-success="Table booked! We'll confirm on WhatsApp. See you soon ☕"><div class="b-two"><label>Name<input name="name" required></label><label>Phone<input type="tel" name="phone" required></label></div><div class="b-two"><label>Date<input type="date" name="date" required></label><label>Time<input type="time" name="time" required></label></div><label>Guests<select name="guests"><option>2</option><option>3</option><option>4</option><option>5+</option></select></label><button type="submit">Reserve table</button></form></div></div></section>
<footer class="b-foot">© 2026 Brew &amp; Bloom · Mall Road, Shimla · hello@brewbloom.in</footer>`) }];

/* =====================================================================
   9. PULSE — gym / fitness (black + red, condensed type)
   ===================================================================== */
const puCss = `body{background:#0a0a0a;color:#f5f5f5;font-family:Inter,system-ui,sans-serif}
.p-w{max-width:1200px;margin:0 auto;padding:0 24px}.p-red{color:#ff2e4d}
.p-nav .p-w{display:flex;justify-content:space-between;align-items:center;height:78px}.p-logo{font:700 30px Oswald,sans-serif;letter-spacing:.04em}
.p-links{display:flex;gap:30px;font:500 14px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#bbb}
.p-btn{display:inline-block;padding:15px 28px;background:#ff2e4d;color:#fff;font:600 15px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;clip-path:polygon(8% 0,100% 0,92% 100%,0 100%)}
.p-hero{position:relative;padding:90px 0 110px;overflow:hidden}.p-hero::after{content:"PULSE";position:absolute;right:-30px;bottom:-60px;font:700 300px/1 Oswald,sans-serif;color:rgba(255,255,255,.03);z-index:0}
.p-hero .p-w{position:relative;z-index:1;display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.p-hero h1{font:700 clamp(60px,9vw,130px)/.88 Oswald,sans-serif;text-transform:uppercase;margin:0 0 24px}
.p-hero p{font-size:18px;line-height:1.6;color:#bbb;max-width:460px;margin:0 0 30px}.p-hero img{width:100%;aspect-ratio:4/5;object-fit:cover;filter:grayscale(1) contrast(1.1)}
.p-strip{background:#ff2e4d;padding:20px 0;font:600 22px Oswald,sans-serif;letter-spacing:.1em;text-transform:uppercase;text-align:center}
.p-sec{padding:100px 0}.p-h2{font:700 clamp(42px,6vw,80px)/.9 Oswald,sans-serif;text-transform:uppercase;margin:0 0 20px}
.p-progs{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-top:40px}.p-prog{background:#161616;padding:34px 26px;min-height:260px;display:flex;flex-direction:column;transition:background .2s}.p-prog:hover{background:#ff2e4d}
.p-prog i{font-style:normal;font:700 54px Oswald,sans-serif;color:#2a2a2a}.p-prog:hover i{color:rgba(0,0,0,.25)}.p-prog h3{font:600 26px Oswald,sans-serif;text-transform:uppercase;margin:auto 0 8px}.p-prog p{color:#aaa;margin:0;line-height:1.55}.p-prog:hover p{color:#fff}
.p-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}.p-plan{border:1px solid #2a2a2a;padding:34px}.p-plan.hot{border-color:#ff2e4d;background:linear-gradient(180deg,rgba(255,46,77,.14),transparent)}
.p-plan b{font:600 22px Oswald,sans-serif;text-transform:uppercase;letter-spacing:.08em}.p-plan .a{font:700 54px Oswald,sans-serif;margin:12px 0}.p-plan .a small{font-size:16px;color:#888}.p-plan ul{list-style:none;padding:0;color:#bbb;line-height:2.2;margin:0 0 24px}
.p-trial{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:center;background:#161616;padding:56px}
.p-trial input{display:block;width:100%;padding:16px;margin-bottom:12px;background:#0a0a0a;border:1px solid #2a2a2a;color:#fff;font:inherit}
.p-trial button{width:100%;padding:17px;border:0;background:#ff2e4d;color:#fff;font:600 17px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
.p-foot{padding:34px 0;color:#666;font-size:14px;text-align:center}
@media(max-width:900px){.p-links{display:none}.p-hero .p-w,.p-trial{grid-template-columns:1fr}.p-progs{grid-template-columns:1fr 1fr}.p-plans{grid-template-columns:1fr}.p-trial{padding:28px}}`;
const pulse = () => [{ name: "Home", file: "index.html", html: doc("Pulse Fitness — train hard", "Oswald:wght@500;600;700&family=Inter:wght@400;500", puCss, `
<header class="p-nav lbw-header" data-lb-name="Header"><div class="p-w"><span class="p-logo">PULSE<span class="p-red">.</span></span><nav class="p-links lbw-nav"><a href="#programs">Programs</a><a href="#plans">Plans</a><a href="#trial">Free trial</a></nav><div style="display:flex;gap:10px;align-items:center"><a href="#trial" class="p-btn">Join now</a>${burger("#fff")}</div></div></header>
<section class="p-hero" data-lb-name="Hero"><div class="p-w"><div><span class="p-red" style="font:600 15px Oswald,sans-serif;letter-spacing:.2em">● OPEN 5AM – 11PM</span><h1>Stronger<br>every <span class="p-red">day.</span></h1><p>Coach-led strength, HIIT and boxing classes. All levels welcome — your first week is on us.</p><a href="#trial" class="p-btn">Claim free 7-day pass</a></div><img src="${ph(800, 1000, "Athlete training", "1f1f1f", "ff2e4d")}" alt=""></div></section>
<div class="p-strip" data-lb-name="Strip">No contracts · Certified coaches · 2,000+ members</div>
<section class="p-sec" id="programs" data-lb-name="Programs"><div class="p-w"><h2 class="p-h2">Programs</h2><div class="p-progs"><div class="p-prog"><i>01</i><h3>Strength</h3><p>Barbell basics to advanced lifting.</p></div><div class="p-prog"><i>02</i><h3>HIIT</h3><p>45 minutes, maximum burn.</p></div><div class="p-prog"><i>03</i><h3>Boxing</h3><p>Technique, cardio and confidence.</p></div><div class="p-prog"><i>04</i><h3>Yoga</h3><p>Mobility and recovery days.</p></div></div></div></section>
<section class="p-sec" id="plans" style="padding-top:0" data-lb-name="Plans"><div class="p-w"><h2 class="p-h2">Membership</h2><div class="p-plans">
<div class="p-plan"><b>Monthly</b><div class="a">₹2,499<small>/mo</small></div><ul><li>All classes</li><li>Locker access</li></ul><a href="#trial" class="p-btn">Start</a></div>
<div class="p-plan hot"><b>Quarterly</b><div class="a">₹6,499<small>/3 mo</small></div><ul><li>All classes</li><li>1 PT session/month</li><li>Diet plan</li></ul><a href="#trial" class="p-btn">Best value</a></div>
<div class="p-plan"><b>Annual</b><div class="a">₹19,999<small>/yr</small></div><ul><li>Everything</li><li>Guest passes</li></ul><a href="#trial" class="p-btn">Start</a></div></div></div></section>
<section class="p-sec" id="trial" style="padding-top:0" data-lb-name="Free trial"><div class="p-w"><div class="p-trial"><div><h2 class="p-h2">7 days.<br><span class="p-red">Free.</span></h2><p style="color:#bbb;font-size:17px;line-height:1.7">Try every class, meet the coaches, no strings attached.</p></div>
<form data-lb-form="Free trial pass" data-lb-success="Your free pass is booked! 💪 We'll WhatsApp you the details."><input name="name" required placeholder="Full name"><input type="tel" name="phone" required placeholder="WhatsApp number"><input type="email" name="email" placeholder="Email (optional)"><button type="submit">Get my free pass</button></form></div></div></section>
<footer class="p-foot">© 2026 Pulse Fitness · Sector 17, Chandigarh</footer>`) }];

/* =====================================================================
   10. EBOOK — lead magnet (soft blue, CSS 3D book)
   ===================================================================== */
const ebCss = `body{background:#f2f6ff;color:#0f1b3d;font-family:"Plus Jakarta Sans",system-ui,sans-serif}
.k2-w{max-width:1120px;margin:0 auto;padding:0 24px}
.k2-hero .k2-w{display:grid;grid-template-columns:1.1fr .9fr;gap:60px;align-items:center;padding-top:80px;padding-bottom:80px}
.k2-tag{display:inline-block;background:#dbe6ff;color:#2347c8;font-weight:800;font-size:13px;padding:7px 14px;border-radius:999px}
.k2-hero h1{font-size:clamp(40px,5.6vw,66px);line-height:1.04;letter-spacing:-.04em;margin:18px 0;font-weight:800}.k2-hero h1 span{color:#2347c8}
.k2-hero p{font-size:18px;line-height:1.7;color:#4a5578;margin:0 0 26px}
.k2-form{background:#fff;border-radius:20px;padding:22px;box-shadow:0 30px 60px -30px rgba(35,71,200,.4)}
.k2-form input{display:block;width:100%;padding:14px;border:1px solid #d7e0f5;border-radius:12px;font:inherit;margin-bottom:10px}
.k2-form button{width:100%;padding:15px;border:0;border-radius:12px;background:#2347c8;color:#fff;font:800 16px "Plus Jakarta Sans",sans-serif;cursor:pointer}
.k2-book{justify-self:center;width:280px;height:380px;border-radius:6px 16px 16px 6px;background:linear-gradient(135deg,#2347c8,#5b8cff);color:#fff;padding:34px 28px;transform:perspective(900px) rotateY(-18deg);box-shadow:24px 30px 60px -20px rgba(15,27,61,.45),inset 10px 0 0 rgba(0,0,0,.15);display:flex;flex-direction:column}
.k2-book b{font-size:34px;line-height:1.05;letter-spacing:-.03em}.k2-book span{margin-top:auto;font-size:13px;opacity:.85;letter-spacing:.1em;text-transform:uppercase}
.k2-sec{padding:80px 0}.k2-h2{font-size:clamp(30px,4vw,44px);letter-spacing:-.035em;margin:0 0 30px;font-weight:800}
.k2-ch{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.k2-ch div{background:#fff;border-radius:18px;padding:24px;display:flex;gap:16px}.k2-ch i{font-style:normal;font-weight:800;color:#2347c8;font-size:22px}.k2-ch b{display:block;font-size:18px;margin-bottom:4px}.k2-ch p{margin:0;color:#4a5578;line-height:1.6}
.k2-auth{display:flex;gap:22px;align-items:center;background:#0f1b3d;color:#fff;border-radius:24px;padding:34px}.k2-auth img{width:92px;height:92px;border-radius:50%}.k2-auth p{color:#b6c3e6;margin:6px 0 0;line-height:1.6}
.k2-foot{text-align:center;padding:30px;color:#7a86a8;font-size:14px}
@media(max-width:860px){.k2-hero .k2-w{grid-template-columns:1fr}.k2-ch{grid-template-columns:1fr}.k2-auth{flex-direction:column;text-align:center}}`;
const ebook = () => [{ name: "Home", file: "index.html", html: doc("Free guide — download", "Plus+Jakarta+Sans:wght@400;600;800", ebCss, `
<section class="k2-hero" data-lb-name="Hero"><div class="k2-w"><div><span class="k2-tag">FREE GUIDE · 42 PAGES</span><h1>The <span>Instagram Growth</span> Playbook for small businesses</h1><p>The exact 30-day plan we use to grow local brands from 0 to 10,000 followers — with templates, captions and posting calendars.</p>
<form class="k2-form" data-lb-form="Ebook download" data-lb-success="🎉 Check your inbox — your free playbook is on the way!"><input name="name" required placeholder="Your first name"><input type="email" name="email" required placeholder="Your best email"><button type="submit">Send me the free playbook →</button><p style="font-size:12.5px;color:#7a86a8;margin:10px 0 0;text-align:center">No spam. Unsubscribe anytime.</p></form></div>
<div class="k2-book" data-lb-name="Book cover"><b>Instagram Growth Playbook</b><p style="opacity:.85;line-height:1.5">30 days · 0 → 10K followers</p><span>By Growth Lab</span></div></div></section>
<section class="k2-sec" style="padding-top:0" data-lb-name="Chapters"><div class="k2-w"><h2 class="k2-h2">What's inside</h2><div class="k2-ch">${[["Your profile in 10 minutes", "Bio, highlights and grid that convert visitors."], ["The 3-post-type formula", "What to post each week without burning out."], ["Reels that get reach", "Hooks, length and trending audio — explained."], ["From followers to buyers", "DM scripts and story sequences that sell."]].map(([t, d], i) => `<div><i>0${i + 1}</i><div><b>${t}</b><p>${d}</p></div></div>`).join("")}</div></div></section>
<section class="k2-sec" style="padding-top:0" data-lb-name="Author"><div class="k2-w"><div class="k2-auth"><img src="${ph(200, 200, "Author", "2347c8", "ffffff")}" alt=""><div><b style="font-size:20px">Written by Kavya Iyer</b><p>Founder of Growth Lab. Helped 200+ Indian brands grow on Instagram since 2019.</p></div></div></div></section>
<footer class="k2-foot">© 2026 Growth Lab</footer>`) }];

/* =====================================================================
   11. SUMMIT — conference / event (electric blue + yellow)
   ===================================================================== */
const suCss = `body{background:#0626ff;color:#fff;font-family:Archivo,system-ui,sans-serif}
.s-w{max-width:1200px;margin:0 auto;padding:0 24px}.s-y{color:#fff200}
.s-nav .s-w{display:flex;justify-content:space-between;align-items:center;height:78px}.s-logo{font-weight:900;font-size:24px;letter-spacing:-.03em}
.s-btn{display:inline-block;padding:15px 26px;background:#fff200;color:#0626ff;font-weight:800;border-radius:6px}
.s-hero{padding:60px 0 90px}.s-hero h1{font-size:clamp(60px,11vw,170px);line-height:.84;letter-spacing:-.06em;font-weight:900;margin:0;text-transform:uppercase}
.s-hero .meta{display:flex;flex-wrap:wrap;gap:40px;margin-top:40px;align-items:flex-end;justify-content:space-between}.s-hero .meta div b{display:block;font-size:26px}.s-hero .meta span{opacity:.75}
.s-cd{display:flex;gap:10px}.s-cd div{background:rgba(255,255,255,.12);border-radius:10px;padding:12px 16px;text-align:center;min-width:76px}.s-cd b{display:block;font-size:32px;font-weight:900}.s-cd span{font-size:11px;letter-spacing:.14em;opacity:.8;text-transform:uppercase}
.s-white{background:#fff;color:#0b0f2e}.s-sec{padding:90px 0}.s-h2{font-size:clamp(40px,6vw,84px);line-height:.9;letter-spacing:-.05em;font-weight:900;margin:0 0 30px;text-transform:uppercase}
.s-spk{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.s-spk img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;filter:grayscale(1)}.s-spk b{display:block;margin-top:12px;font-size:18px}.s-spk span{color:#5a5f7d;font-size:14px}
.s-sch div{display:grid;grid-template-columns:140px 1fr auto;gap:20px;padding:24px 0;border-bottom:2px solid #0b0f2e;font-size:20px;align-items:center}.s-sch b{color:#0626ff;font-weight:900}.s-sch span{font-size:14px;color:#5a5f7d}
.s-tix{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.s-tix div{background:#0b0f2e;color:#fff;border-radius:16px;padding:32px}.s-tix div.hot{background:#fff200;color:#0b0f2e}
.s-tix b{font-size:20px;text-transform:uppercase}.s-tix .p{font-size:52px;font-weight:900;margin:12px 0;letter-spacing:-.04em}.s-tix ul{padding-left:18px;line-height:2;margin:0 0 20px}
.s-reg{max-width:640px}.s-reg form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.s-reg input,.s-reg select{padding:15px;border-radius:8px;border:2px solid #0b0f2e;font:inherit}.s-reg button{grid-column:1/-1;padding:17px;border:0;border-radius:8px;background:#0626ff;color:#fff;font:800 17px Archivo,sans-serif;cursor:pointer}
.s-foot{padding:30px 0;text-align:center;opacity:.8}
@media(max-width:900px){.s-spk{grid-template-columns:1fr 1fr}.s-tix{grid-template-columns:1fr}.s-sch div{grid-template-columns:1fr;gap:4px}.s-reg form{grid-template-columns:1fr}}`;
const summit = () => [{ name: "Home", file: "index.html", html: doc("Build Summit 2026", "Archivo:wght@400;600;800;900", suCss, `
<header class="s-nav" data-lb-name="Header"><div class="s-w"><span class="s-logo">BUILD/SUMMIT</span><a href="#tickets" class="s-btn">Get tickets</a></div></header>
<section class="s-hero" data-lb-name="Hero"><div class="s-w"><span class="s-y" style="font-weight:800;letter-spacing:.2em">INDIA'S BIGGEST BUILDER CONFERENCE</span><h1>Build<br><span class="s-y">Summit</span> 26</h1>
<div class="meta"><div style="display:flex;gap:40px;flex-wrap:wrap"><div><b>14–15 Dec</b><span>2026</span></div><div><b>Bengaluru</b><span>KTPO Convention</span></div><div><b>3,000+</b><span>founders &amp; makers</span></div></div>
<div class="s-cd" data-lb-countdown="2026-12-14T09:00"><div><b data-lb-cd="d">00</b><span>Days</span></div><div><b data-lb-cd="h">00</b><span>Hrs</span></div><div><b data-lb-cd="m">00</b><span>Min</span></div></div></div></div></section>
<section class="s-white s-sec" data-lb-name="Speakers"><div class="s-w"><h2 class="s-h2">Speakers</h2><div class="s-spk">${["Aditi Rao", "Vikram Shah", "Sara Khan", "Rohit Menon"].map((n, i) => `<div><img src="${ph(500, 500, n, "e6e9ff", "0626ff")}" alt=""><b>${n}</b><span>${["Founder, Lumen", "CTO, Kiro", "Partner, Atlas VC", "Design lead, Mono"][i]}</span></div>`).join("")}</div></div></section>
<section class="s-white s-sec" style="padding-top:0" data-lb-name="Schedule"><div class="s-w"><h2 class="s-h2">Schedule</h2><div class="s-sch"><div><b>09:30</b>Opening keynote: building in 2027<span>Main stage</span></div><div><b>11:00</b>Fundraising in a tough market<span>Stage 2</span></div><div><b>14:00</b>AI products people actually pay for<span>Main stage</span></div><div><b>17:30</b>Founders' night &amp; networking<span>Rooftop</span></div></div></div></section>
<section class="s-white s-sec" id="tickets" style="padding-top:0" data-lb-name="Tickets"><div class="s-w"><h2 class="s-h2">Tickets</h2><div class="s-tix"><div><b>Student</b><div class="p">₹999</div><ul><li>Both days</li><li>Talks &amp; expo</li></ul></div><div class="hot"><b>Standard</b><div class="p">₹2,999</div><ul><li>Both days</li><li>Workshops</li><li>Lunch included</li></ul></div><div><b>VIP</b><div class="p">₹9,999</div><ul><li>Front rows</li><li>Speaker dinner</li><li>Founders' night</li></ul></div></div>
<div class="s-reg" style="margin-top:40px"><h3 style="font-size:28px;margin:0 0 14px">Reserve your pass</h3><form data-lb-form="Summit tickets" data-lb-success="You're in! We'll email your ticket and payment link."><input name="name" required placeholder="Full name"><input type="email" name="email" required placeholder="Email"><input type="tel" name="phone" placeholder="Phone"><select name="ticket"><option>Student</option><option selected>Standard</option><option>VIP</option></select><button type="submit">Reserve my pass →</button></form></div></div></section>
<footer class="s-foot">© 2026 Build Summit · hello@buildsummit.in</footer>`) }];

/* =====================================================================
   12. APPIFY — mobile app download (clean white + green)
   ===================================================================== */
const apCss = `body{background:#fff;color:#0b1d16;font-family:"DM Sans",system-ui,sans-serif}
.ap-w{max-width:1140px;margin:0 auto;padding:0 24px}
.ap-nav .ap-w{display:flex;justify-content:space-between;align-items:center;height:76px}.ap-logo{font-weight:800;font-size:22px;display:flex;gap:10px;align-items:center}.ap-logo i{width:32px;height:32px;border-radius:10px;background:#12b76a;display:inline-block}
.ap-store{display:inline-flex;align-items:center;gap:10px;background:#0b1d16;color:#fff;padding:11px 18px;border-radius:12px}.ap-store small{display:block;font-size:10px;opacity:.75}.ap-store b{display:block;font-size:16px;line-height:1.1}
.ap-hero .ap-w{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding-top:50px;padding-bottom:80px}
.ap-hero h1{font-size:clamp(44px,6vw,74px);line-height:1;letter-spacing:-.045em;margin:0 0 20px;font-weight:800}.ap-hero h1 span{color:#12b76a}
.ap-hero p{font-size:19px;line-height:1.6;color:#4b5f57;margin:0 0 28px}
.ap-phones{position:relative;height:540px}.ap-ph{position:absolute;width:250px;height:510px;border-radius:40px;background:#0b1d16;padding:10px;box-shadow:0 40px 80px -30px rgba(18,183,106,.55)}
.ap-ph div{height:100%;border-radius:31px;background:linear-gradient(180deg,#e7fbf1,#fff);padding:40px 16px 16px}.ap-ph.a{left:6%;top:0;transform:rotate(-6deg)}.ap-ph.b{right:6%;top:30px;transform:rotate(5deg)}
.ap-card{background:#fff;border-radius:14px;padding:12px;margin-bottom:10px;font-size:13px;box-shadow:0 6px 16px -10px rgba(0,0,0,.25)}
.ap-sec{padding:80px 0}.ap-h2{font-size:clamp(32px,4.4vw,50px);letter-spacing:-.04em;margin:0 0 12px;font-weight:800;text-align:center}
.ap-feat{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}.ap-feat div{background:#f3fbf7;border-radius:24px;padding:30px}.ap-feat span{font-size:30px}.ap-feat b{display:block;font-size:20px;margin:14px 0 6px}.ap-feat p{margin:0;color:#4b5f57;line-height:1.6}
.ap-rate{display:flex;justify-content:center;gap:60px;flex-wrap:wrap;text-align:center;margin-top:30px}.ap-rate b{display:block;font-size:44px;letter-spacing:-.04em}.ap-rate span{color:#4b5f57}
.ap-cta{background:#0b1d16;color:#fff;border-radius:32px;padding:60px;text-align:center}.ap-cta .ap-store{background:#12b76a;color:#06281a}
.ap-foot{text-align:center;padding:30px;color:#7c8c85;font-size:14px}
@media(max-width:860px){.ap-hero .ap-w{grid-template-columns:1fr}.ap-feat{grid-template-columns:1fr}.ap-phones{height:460px}.ap-ph{width:200px;height:420px}.ap-cta{padding:34px 20px}}`;
const appify = () => [{ name: "Home", file: "index.html", html: doc("Spendly — money app", "DM+Sans:wght@400;500;700;800", apCss, `
<header class="ap-nav" data-lb-name="Header"><div class="ap-w"><span class="ap-logo"><i></i>Spendly</span><a href="#get" class="ap-store"><span>⬇</span><span><small>Free on</small><b>iOS &amp; Android</b></span></a></div></header>
<section class="ap-hero" data-lb-name="Hero"><div class="ap-w"><div><h1>Know where every <span>rupee</span> goes.</h1><p>Spendly tracks your spending automatically from SMS and UPI, sets smart budgets, and helps you save ₹5,000 more every month.</p>
<div style="display:flex;gap:10px;flex-wrap:wrap"><a href="#" class="ap-store"><span></span><span><small>Download on the</small><b>App Store</b></span></a><a href="#" class="ap-store"><span>▶</span><span><small>Get it on</small><b>Google Play</b></span></a></div>
<p style="margin-top:20px;font-size:15px">★★★★★ <b>4.8</b> · 1M+ downloads</p></div>
<div class="ap-phones"><div class="ap-ph a"><div><b style="font-size:20px">₹18,420</b><p style="font-size:12px;color:#4b5f57;margin:4px 0 14px">spent this month</p><div class="ap-card">🍔 Food · ₹4,200</div><div class="ap-card">🚕 Travel · ₹2,100</div><div class="ap-card">🛍 Shopping · ₹6,300</div></div></div>
<div class="ap-ph b"><div><b style="font-size:18px">Budget goals</b><div class="ap-card" style="margin-top:14px">🎯 Goa trip · 68%</div><div class="ap-card">💻 New laptop · 41%</div><div class="ap-card" style="background:#12b76a;color:#fff">You saved ₹5,240 🎉</div></div></div></div></div></section>
<section class="ap-sec" style="padding-top:0" data-lb-name="Features"><div class="ap-w"><h2 class="ap-h2">Money, made simple</h2><div class="ap-feat"><div><span>⚡</span><b>Auto-tracking</b><p>Every UPI and card payment sorted automatically.</p></div><div><span>🎯</span><b>Smart budgets</b><p>Gentle alerts before you overspend.</p></div><div><span>🔒</span><b>Private &amp; secure</b><p>Bank-grade encryption. Your data never leaves India.</p></div></div>
<div class="ap-rate"><div><b>1M+</b><span>downloads</span></div><div><b>4.8★</b><span>Play Store</span></div><div><b>₹120 Cr</b><span>saved by users</span></div></div></div></section>
<section class="ap-sec" id="get" style="padding-top:0" data-lb-name="Download"><div class="ap-w"><div class="ap-cta"><h2 class="ap-h2" style="color:#fff">Start saving today</h2><p style="color:#a9c2b7;font-size:18px;margin:0 0 26px">Free forever. Premium from ₹49/month.</p><a href="#" class="ap-store"><span>⬇</span><span><small>Download</small><b>Spendly free</b></span></a></div></div></section>
<footer class="ap-foot">© 2026 Spendly Technologies</footer>`) }];

/* =====================================================================
   13. FOLIO — personal portfolio website (monochrome editorial, 4 pages)
   ===================================================================== */
const foCss = `body{background:#f6f5f1;color:#111;font-family:Inter,system-ui,sans-serif}
.f-w{max-width:1200px;margin:0 auto;padding:0 28px}
.f-head .f-w{display:flex;justify-content:space-between;align-items:center;height:80px}.f-logo{font-weight:600;font-size:17px}.f-nav{display:flex;gap:28px;font-size:15px}.f-nav a{opacity:.6}.f-nav a.lb-current,.f-nav a:hover{opacity:1}
.f-hero{padding:90px 0 70px}.f-hero h1{font:400 clamp(44px,7.4vw,108px)/1 "Instrument Serif",serif;letter-spacing:-.02em;margin:0;max-width:1050px}.f-hero h1 i{color:#8a8a80}
.f-hero p{margin:34px 0 0;font-size:18px;color:#555;max-width:520px;line-height:1.6}
.f-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px 24px;padding-bottom:90px}.f-grid a{display:block}.f-grid img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:4px}
.f-grid .t{display:flex;justify-content:space-between;margin-top:12px;font-size:15px}.f-grid .t span{color:#888}
.f-sec{padding:80px 0}.f-h2{font:400 clamp(36px,5vw,64px)/1.05 "Instrument Serif",serif;margin:0 0 24px}
.f-about{display:grid;grid-template-columns:.8fr 1.2fr;gap:60px;align-items:start}.f-about img{width:100%;border-radius:4px}.f-about p{font-size:19px;line-height:1.75;color:#333}
.f-list div{display:grid;grid-template-columns:140px 1fr;padding:18px 0;border-top:1px solid #dcdad2}.f-list span{color:#888}
.f-contact a.big{font:400 clamp(30px,5vw,64px) "Instrument Serif",serif;border-bottom:1px solid #111}
.f-form{display:grid;gap:12px;max-width:560px;margin-top:40px}.f-form input,.f-form textarea{padding:15px 0;border:0;border-bottom:1px solid #c9c7bf;background:transparent;font:inherit;font-size:17px}.f-form button{justify-self:start;padding:14px 26px;border:0;border-radius:999px;background:#111;color:#fff;font:600 15px Inter,sans-serif;cursor:pointer}
.f-foot{padding:34px 0;border-top:1px solid #dcdad2;font-size:14px;color:#777}.f-foot .f-w{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
@media(max-width:800px){.f-nav{display:none}.f-grid,.f-about{grid-template-columns:1fr}.f-list div{grid-template-columns:1fr}}`;
const foHead = `<header class="f-head lbw-header" data-lb-name="Header"><div class="f-w"><a href="index.html" class="f-logo">Maya Kapoor</a><nav class="f-nav lbw-nav" data-lb-autonav><a href="index.html">Home</a><a href="work.html">Work</a><a href="about.html">About</a><a href="contact.html">Contact</a></nav>${burger()}</div></header>`;
const foFoot = `<footer class="f-foot" data-lb-name="Footer"><div class="f-w"><span>© 2026 Maya Kapoor</span><span>Instagram · Dribbble · LinkedIn</span></div></footer>`;
const foF = "Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600";
const foWork = ["Lumen app", "Kiro packaging", "Atlas rebrand", "Mono campaign"].map((n, i) => `<a href="work.html"><img src="${ph(900, 675, n, ["e4e2db", "d9d6cc", "cfccc1", "e9e7e0"][i], "555555")}" alt=""><div class="t"><b>${n}</b><span>${["Product design", "Packaging", "Brand identity", "Art direction"][i]}</span></div></a>`).join("");
const folio = () => [
  { name: "Home", file: "index.html", html: doc("Maya Kapoor — designer", foF, foCss, `${foHead}<section class="f-hero" data-lb-name="Hero"><div class="f-w"><h1>Product &amp; brand designer making <i>calm, useful</i> things for ambitious teams.</h1><p>Currently freelancing from Mumbai. Previously at Razorpay and Swiggy.</p></div></section><section data-lb-name="Selected work"><div class="f-w f-grid">${foWork}</div></section>${foFoot}`) },
  { name: "Work", file: "work.html", html: doc("Work — Maya Kapoor", foF, foCss, `${foHead}<section class="f-hero" style="padding-bottom:40px" data-lb-name="Page title"><div class="f-w"><h1>Selected <i>work</i></h1></div></section><section data-lb-name="Projects"><div class="f-w f-grid">${foWork}${foWork}</div></section>${foFoot}`) },
  { name: "About", file: "about.html", html: doc("About — Maya Kapoor", foF, foCss, `${foHead}<section class="f-sec" data-lb-name="About"><div class="f-w f-about"><img src="${ph(700, 860, "Portrait", "d9d6cc", "555555")}" alt=""><div><h2 class="f-h2">Hi, I'm Maya.</h2><p>For ten years I've helped startups turn complicated products into simple, lovable experiences. I care about clarity, craft and shipping.</p>
<div class="f-list"><div><span>Experience</span>Razorpay, Swiggy, independent</div><div><span>Services</span>Product design · Brand identity · Design systems</div><div><span>Clients</span>Lumen, Kiro, Atlas, Mono, Northwind</div></div></div></div></section>${foFoot}`) },
  { name: "Contact", file: "contact.html", html: doc("Contact — Maya Kapoor", foF, foCss, `${foHead}<section class="f-sec f-contact" data-lb-name="Contact"><div class="f-w"><h2 class="f-h2">Let's work together.</h2><a class="big" href="mailto:hello@mayakapoor.in">hello@mayakapoor.in</a>
<form class="f-form" data-lb-form="Portfolio enquiry" data-lb-success="Thanks for reaching out — I'll reply within 2 days."><input name="name" required placeholder="Your name"><input type="email" name="email" required placeholder="Email"><textarea name="message" rows="4" required placeholder="Tell me about your project"></textarea><button type="submit">Send message</button></form></div></section>${foFoot}`) },
];

/* =====================================================================
   14. ACADEMY — coaching institute website (navy + yellow, 4 pages)
   ===================================================================== */
const acCss = `body{background:#fff;color:#0c1a3d;font-family:Poppins,system-ui,sans-serif}
.c2-w{max-width:1160px;margin:0 auto;padding:0 24px}.c2-y{color:#f5b301}
.c2-head{background:#0c1a3d;color:#fff}.c2-head .c2-w{display:flex;justify-content:space-between;align-items:center;height:76px}.c2-logo{font-weight:700;font-size:21px}
.c2-nav{display:flex;gap:28px;font-size:15px;color:#c3cbe3}.c2-btn{display:inline-block;padding:13px 24px;border-radius:10px;background:#f5b301;color:#0c1a3d;font-weight:700}
.c2-hero{background:#0c1a3d;color:#fff;padding:60px 0 100px;position:relative;overflow:hidden}.c2-hero .c2-w{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.c2-hero h1{font-size:clamp(38px,5.4vw,62px);line-height:1.1;margin:0 0 18px;font-weight:700}.c2-hero p{color:#c3cbe3;font-size:18px;line-height:1.7;margin:0 0 28px}
.c2-hero img{width:100%;border-radius:24px}.c2-badges{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}.c2-badges span{background:rgba(255,255,255,.08);padding:10px 14px;border-radius:12px;font-size:14px}
.c2-sec{padding:90px 0}.c2-h2{font-size:clamp(30px,4vw,44px);margin:0 0 10px;font-weight:700}.c2-sub{color:#56628a;font-size:17px;margin:0 0 40px}
.c2-courses{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.c2-c{border:1px solid #e3e8f4;border-radius:20px;overflow:hidden}.c2-c .top{background:#eef2fb;padding:26px}.c2-c .top b{font-size:22px}.c2-c .top span{display:inline-block;background:#f5b301;color:#0c1a3d;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:10px}
.c2-c ul{padding:20px 26px 0 44px;margin:0;color:#56628a;line-height:2}.c2-c .bot{display:flex;justify-content:space-between;align-items:center;padding:20px 26px}.c2-c .bot b{font-size:22px}
.c2-res{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.c2-res div{text-align:center;background:#eef2fb;border-radius:20px;padding:24px}.c2-res img{width:96px;height:96px;border-radius:50%;margin:0 auto 12px}.c2-res b{display:block}.c2-res span{color:#f5b301;font-weight:700}
.c2-enq{display:grid;grid-template-columns:1fr 1fr;gap:40px;background:#0c1a3d;color:#fff;border-radius:28px;padding:50px}.c2-enq label{display:block;font-size:14px;margin-bottom:12px;color:#c3cbe3}
.c2-enq input,.c2-enq select{display:block;width:100%;margin-top:6px;padding:13px;border-radius:10px;border:0;font:inherit}.c2-enq button{width:100%;padding:15px;border:0;border-radius:10px;background:#f5b301;color:#0c1a3d;font:700 16px Poppins,sans-serif;cursor:pointer}
.c2-foot{background:#0c1a3d;color:#c3cbe3;padding:36px 0;font-size:14px}.c2-foot .c2-w{display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px}.c2-foot nav{display:flex;gap:18px}
@media(max-width:900px){.c2-nav{display:none}.c2-hero .c2-w,.c2-enq{grid-template-columns:1fr}.c2-courses{grid-template-columns:1fr}.c2-res{grid-template-columns:1fr 1fr}.c2-enq{padding:28px}}`;
const acHead = `<header class="c2-head lbw-header" data-lb-name="Header"><div class="c2-w"><a href="index.html" class="c2-logo">Vidya<span class="c2-y">Point</span></a><nav class="c2-nav lbw-nav" data-lb-autonav><a href="index.html">Home</a><a href="courses.html">Courses</a><a href="results.html">Results</a><a href="contact.html">Contact</a></nav><div style="display:flex;gap:10px;align-items:center"><a href="contact.html" class="c2-btn">Free demo class</a>${burger("#fff")}</div></div></header>`;
const acFoot = `<footer class="c2-foot" data-lb-name="Footer"><div class="c2-w"><span>© 2026 VidyaPoint Classes · Hamirpur</span><nav data-lb-autonav><a href="index.html">Home</a><a href="courses.html">Courses</a><a href="results.html">Results</a><a href="contact.html">Contact</a></nav></div></footer>`;
const acF = "Poppins:wght@400;500;600;700";
const acCourses = [["JEE Main + Advanced", "2-year program", "₹89,000"], ["NEET Medical", "2-year program", "₹79,000"], ["Class 9–10 Foundation", "1-year program", "₹39,000"]].map(([n, d, p]) => `<div class="c2-c"><div class="top"><span>${d}</span><br><b>${n}</b></div><ul><li>Live + recorded classes</li><li>Weekly tests &amp; analysis</li><li>Doubt-solving every day</li></ul><div class="bot"><b>${p}</b><a href="contact.html" class="c2-btn" style="padding:10px 16px">Enquire</a></div></div>`).join("");
const acEnq = `<div class="c2-enq" data-lb-name="Enquiry"><div><h2 class="c2-h2">Book a free demo class</h2><p style="color:#c3cbe3;line-height:1.7">Meet our teachers, see how we teach, and get a personalised study plan — free.</p><p class="c2-y" style="font-size:20px;font-weight:700">📞 +91 98765 43210</p></div>
<form data-lb-form="Demo class enquiry" data-lb-success="Thank you! Our counsellor will call you within 24 hours."><label>Student name<input name="name" required></label><label>Parent's phone<input type="tel" name="phone" required></label><label>Course<select name="course"><option>JEE</option><option>NEET</option><option>Foundation (9–10)</option></select></label><button type="submit">Book my free demo</button></form></div>`;
const academy = () => [
  { name: "Home", file: "index.html", html: doc("VidyaPoint — JEE & NEET coaching", acF, acCss, `${acHead}<section class="c2-hero" data-lb-name="Hero"><div class="c2-w"><div><span class="c2-y" style="font-weight:600">★ 1,200+ selections since 2015</span><h1>Crack JEE &amp; NEET with <span class="c2-y">India's best</span> mentors</h1><p>Small batches, daily doubt-solving and weekly tests — so no student is left behind.</p><a href="contact.html" class="c2-btn">Book free demo class</a><div class="c2-badges"><span>👩‍🏫 IIT/AIIMS faculty</span><span>📚 Batch size 25</span><span>📈 Weekly reports</span></div></div><img src="${ph(800, 640, "Classroom", "1b2b5a", "f5b301")}" alt=""></div></section>
<section class="c2-sec" data-lb-name="Courses"><div class="c2-w"><h2 class="c2-h2">Our programs</h2><p class="c2-sub">Choose the course that fits your goal.</p><div class="c2-courses">${acCourses}</div></div></section><section class="c2-sec" style="padding-top:0"><div class="c2-w">${acEnq}</div></section>${acFoot}`) },
  { name: "Courses", file: "courses.html", html: doc("Courses — VidyaPoint", acF, acCss, `${acHead}<section class="c2-sec" data-lb-name="Courses"><div class="c2-w"><h2 class="c2-h2">All courses</h2><p class="c2-sub">Offline in Hamirpur and live online across India.</p><div class="c2-courses">${acCourses}</div></div></section>${acFoot}`) },
  { name: "Results", file: "results.html", html: doc("Results — VidyaPoint", acF, acCss, `${acHead}<section class="c2-sec" data-lb-name="Results"><div class="c2-w"><h2 class="c2-h2">Our toppers</h2><p class="c2-sub">Hard work + the right guidance.</p><div class="c2-res">${[["Aarav S.", "AIR 312 · JEE Adv."], ["Diya T.", "AIR 845 · NEET"], ["Kabir R.", "99.6 %ile · JEE Main"], ["Meera P.", "AIIMS Delhi"]].map(([n, r]) => `<div><img src="${ph(200, 200, n.split(" ")[0], "dfe6f8", "0c1a3d")}" alt=""><b>${n}</b><span>${r}</span></div>`).join("")}</div></div></section>${acFoot}`) },
  { name: "Contact", file: "contact.html", html: doc("Contact — VidyaPoint", acF, acCss, `${acHead}<section class="c2-sec"><div class="c2-w">${acEnq}</div></section>${acFoot}`) },
];

/* =====================================================================
   15. HAVEN — interior design studio website (beige minimal, 4 pages)
   ===================================================================== */
const haCss = `body{background:#efe9df;color:#2b2620;font-family:Manrope,system-ui,sans-serif}
.h-w{max-width:1200px;margin:0 auto;padding:0 28px}
.h-head .h-w{display:flex;justify-content:space-between;align-items:center;height:84px}.h-logo{font:500 28px "Cormorant Garamond",serif;letter-spacing:.06em}.h-nav{display:flex;gap:30px;font-size:14px;letter-spacing:.08em;text-transform:uppercase}
.h-hero{padding:30px 0 80px}.h-hero .h-w{display:grid;grid-template-columns:1fr 1.2fr;gap:50px;align-items:end}
.h-hero h1{font:400 clamp(46px,6.6vw,96px)/.98 "Cormorant Garamond",serif;margin:0 0 24px}.h-hero p{font-size:17px;line-height:1.8;color:#5f574c;max-width:420px}
.h-hero img{width:100%;aspect-ratio:5/4;object-fit:cover;border-radius:0 0 0 160px}
.h-btn{display:inline-block;padding:15px 28px;background:#2b2620;color:#efe9df;font-size:13px;letter-spacing:.14em;text-transform:uppercase}
.h-sec{padding:90px 0}.h-h2{font:400 clamp(36px,4.8vw,62px)/1.05 "Cormorant Garamond",serif;margin:0 0 18px}
.h-proj{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.h-proj img{width:100%;aspect-ratio:3/4;object-fit:cover}.h-proj b{display:block;margin-top:12px;font:500 22px "Cormorant Garamond",serif}.h-proj span{font-size:13px;color:#7a7164;letter-spacing:.06em;text-transform:uppercase}
.h-svc{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#d6cdbf}.h-svc div{background:#efe9df;padding:34px 28px}.h-svc i{font:400 40px "Cormorant Garamond",serif;font-style:italic;color:#9a7b56}.h-svc b{display:block;font-size:19px;margin:10px 0 8px}.h-svc p{margin:0;color:#5f574c;line-height:1.7}
.h-form{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:760px}.h-form input,.h-form select,.h-form textarea{padding:15px 0;border:0;border-bottom:1px solid #b9ad9b;background:transparent;font:inherit;font-size:16px}.h-form .f{grid-column:1/-1}.h-form button{grid-column:1/-1;justify-self:start;padding:16px 30px;border:0;background:#2b2620;color:#efe9df;font:600 13px Manrope,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.h-foot{padding:40px 0;border-top:1px solid #d6cdbf;font-size:14px;color:#7a7164}.h-foot .h-w{display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px}.h-foot nav{display:flex;gap:20px}
@media(max-width:860px){.h-nav{display:none}.h-hero .h-w,.h-form{grid-template-columns:1fr}.h-proj,.h-svc{grid-template-columns:1fr}}`;
const haHead = `<header class="h-head lbw-header" data-lb-name="Header"><div class="h-w"><a href="index.html" class="h-logo">HAVEN</a><nav class="h-nav lbw-nav" data-lb-autonav><a href="index.html">Home</a><a href="projects.html">Projects</a><a href="services.html">Services</a><a href="contact.html">Contact</a></nav>${burger()}</div></header>`;
const haFoot = `<footer class="h-foot" data-lb-name="Footer"><div class="h-w"><span>© 2026 Haven Interiors · Gurugram</span><nav data-lb-autonav><a href="index.html">Home</a><a href="projects.html">Projects</a><a href="services.html">Services</a><a href="contact.html">Contact</a></nav></div></footer>`;
const haF = "Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Manrope:wght@400;600";
const haProj = [["The Oak House", "Residence · Gurugram"], ["Studio Lune", "Workspace · Delhi"], ["Casa Verde", "Villa · Goa"]].map(([n, l], i) => `<a href="projects.html"><img src="${ph(600, 800, n, ["d8cdbb", "cfc3ae", "e0d6c5"][i], "6b5a43")}" alt=""><b>${n}</b><span>${l}</span></a>`).join("");
const haSvc = `<div class="h-svc">${[["Full home design", "Concept to keys — layouts, materials, furniture and site supervision."], ["Single-room makeovers", "A fresh living room, bedroom or kitchen in 4–6 weeks."], ["Workspaces", "Offices and studios that people love coming to."]].map(([t, d], i) => `<div><i>0${i + 1}</i><b>${t}</b><p>${d}</p></div>`).join("")}</div>`;
const haven = () => [
  { name: "Home", file: "index.html", html: doc("Haven — interior design studio", haF, haCss, `${haHead}<section class="h-hero" data-lb-name="Hero"><div class="h-w"><div><h1>Homes that feel like <i>you.</i></h1><p>Warm, timeless interiors for homes and workspaces across Delhi NCR — designed around how you actually live.</p><a href="contact.html" class="h-btn">Book a consultation</a></div><img src="${ph(1000, 800, "Living room", "d8cdbb", "6b5a43")}" alt=""></div></section>
<section class="h-sec" style="padding-top:0" data-lb-name="Projects"><div class="h-w"><h2 class="h-h2">Recent projects</h2><div class="h-proj">${haProj}</div></div></section><section class="h-sec" style="padding-top:0" data-lb-name="Services"><div class="h-w"><h2 class="h-h2">What we do</h2>${haSvc}</div></section>${haFoot}`) },
  { name: "Projects", file: "projects.html", html: doc("Projects — Haven", haF, haCss, `${haHead}<section class="h-sec" data-lb-name="Projects"><div class="h-w"><h2 class="h-h2">Projects</h2><div class="h-proj">${haProj}${haProj}</div></div></section>${haFoot}`) },
  { name: "Services", file: "services.html", html: doc("Services — Haven", haF, haCss, `${haHead}<section class="h-sec" data-lb-name="Services"><div class="h-w"><h2 class="h-h2">Services</h2><p style="color:#5f574c;font-size:17px;max-width:560px;line-height:1.8">Every project starts with a free 30-minute consultation at your space.</p>${haSvc}</div></section>${haFoot}`) },
  { name: "Contact", file: "contact.html", html: doc("Contact — Haven", haF, haCss, `${haHead}<section class="h-sec" data-lb-name="Contact"><div class="h-w"><h2 class="h-h2">Tell us about your space</h2>
<form class="h-form" data-lb-form="Interior consultation" data-lb-success="Thank you — we'll call you to schedule your consultation."><input name="name" required placeholder="Name"><input type="tel" name="phone" required placeholder="Phone"><input type="email" name="email" placeholder="Email"><select name="type"><option>Full home</option><option>Single room</option><option>Workspace</option></select><textarea class="f" name="message" rows="3" placeholder="Size, location and timeline"></textarea><button type="submit">Request consultation</button></form></div></section>${haFoot}`) },
];

/* =====================================================================
   16. SPICE — restaurant website (deep green + cream, 4 pages)
   ===================================================================== */
const spCss = `body{background:#10221b;color:#f3ead7;font-family:"DM Sans",system-ui,sans-serif}
.r-w{max-width:1160px;margin:0 auto;padding:0 24px}.r-g{color:#e8b04b}
.r-head .r-w{display:flex;justify-content:space-between;align-items:center;height:84px}.r-logo{font:italic 600 30px "Playfair Display",serif}.r-nav{display:flex;gap:30px;font-size:15px;color:#cfc3a8}
.r-btn{display:inline-block;padding:14px 26px;border-radius:999px;background:#e8b04b;color:#10221b;font-weight:700}
.r-hero{text-align:center;padding:70px 0 90px}.r-hero h1{font:600 clamp(48px,7.6vw,104px)/1 "Playfair Display",serif;margin:0 0 20px}.r-hero h1 i{color:#e8b04b}
.r-hero p{font-size:19px;color:#cfc3a8;max-width:560px;margin:0 auto 32px;line-height:1.6}.r-hero img{margin:56px auto 0;width:100%;max-width:1000px;aspect-ratio:21/9;object-fit:cover;border-radius:999px 999px 24px 24px}
.r-sec{padding:90px 0}.r-h2{font:600 clamp(36px,4.8vw,58px)/1.05 "Playfair Display",serif;margin:0 0 30px;text-align:center}
.r-menu{display:grid;grid-template-columns:1fr 1fr;gap:10px 60px;max-width:900px;margin:0 auto}.r-menu div{display:flex;gap:12px;align-items:baseline;padding:16px 0;border-bottom:1px dashed #35503f}
.r-menu b{font:600 20px "Playfair Display",serif}.r-menu span{flex:1;border-bottom:1px dotted #35503f;transform:translateY(-4px)}.r-menu em{font-style:normal;color:#e8b04b;font-weight:700}.r-menu p{margin:4px 0 0;color:#a99d84;font-size:14px;flex-basis:100%}
.r-menu div{flex-wrap:wrap}
.r-story{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}.r-story img{width:100%;border-radius:24px}.r-story p{color:#cfc3a8;font-size:17px;line-height:1.8}
.r-book{max-width:720px;margin:0 auto;background:#f3ead7;color:#10221b;border-radius:28px;padding:44px}.r-book form{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.r-book input,.r-book select{padding:14px;border-radius:12px;border:1px solid #d9cdb1;font:inherit;background:#fff}.r-book button{grid-column:1/-1;padding:16px;border:0;border-radius:999px;background:#10221b;color:#e8b04b;font:700 16px "DM Sans",sans-serif;cursor:pointer}
.r-foot{padding:40px 0;border-top:1px solid #21392e;color:#a99d84;font-size:14px}.r-foot .r-w{display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px}.r-foot nav{display:flex;gap:18px}
@media(max-width:860px){.r-nav{display:none}.r-menu,.r-story,.r-book form{grid-template-columns:1fr}.r-book{padding:26px}}`;
const spHead = `<header class="r-head lbw-header" data-lb-name="Header"><div class="r-w"><a href="index.html" class="r-logo">Masala<span class="r-g">.</span></a><nav class="r-nav lbw-nav" data-lb-autonav><a href="index.html">Home</a><a href="menu.html">Menu</a><a href="about.html">Our story</a><a href="reserve.html">Reserve</a></nav><div style="display:flex;gap:10px;align-items:center"><a href="reserve.html" class="r-btn">Book a table</a>${burger("#f3ead7")}</div></div></header>`;
const spFoot = `<footer class="r-foot" data-lb-name="Footer"><div class="r-w"><span>© 2026 Masala · Connaught Place, New Delhi · 12pm–11pm</span><nav data-lb-autonav><a href="index.html">Home</a><a href="menu.html">Menu</a><a href="about.html">Our story</a><a href="reserve.html">Reserve</a></nav></div></footer>`;
const spF = "Playfair+Display:ital,wght@0,600;1,600&family=DM+Sans:wght@400;500;700";
const spMenu = `<div class="r-menu">${[["Butter Chicken", "₹520", "Smoky tandoori chicken, velvety tomato gravy"], ["Dal Makhani", "₹380", "Slow-cooked overnight, finished with cream"], ["Paneer Tikka", "₹420", "Charred cottage cheese, mint chutney"], ["Lamb Rogan Josh", "₹640", "Kashmiri chillies, fennel, saffron"], ["Garlic Naan", "₹90", "From our clay oven"], ["Gulab Jamun", "₹180", "With saffron rabri"]].map(([n, p, d]) => `<div><b>${n}</b><span></span><em>${p}</em><p>${d}</p></div>`).join("")}</div>`;
const spBook = `<div class="r-book" data-lb-name="Reservation"><h2 class="r-h2" style="color:#10221b">Reserve a table</h2><form data-lb-form="Restaurant reservation" data-lb-success="Your table is reserved! We'll confirm by WhatsApp."><input name="name" required placeholder="Name"><input type="tel" name="phone" required placeholder="Phone"><input type="date" name="date" required><input type="time" name="time" required><select name="guests"><option>2 guests</option><option>4 guests</option><option>6 guests</option><option>8+ guests</option></select><input name="note" placeholder="Occasion (optional)"><button type="submit">Confirm reservation</button></form></div>`;
const spice = () => [
  { name: "Home", file: "index.html", html: doc("Masala — modern Indian kitchen", spF, spCss, `${spHead}<section class="r-hero" data-lb-name="Hero"><div class="r-w"><span class="r-g" style="letter-spacing:.24em;font-size:13px">MODERN INDIAN KITCHEN · SINCE 2009</span><h1>Old recipes,<br><i>new stories.</i></h1><p>Family recipes from across India, cooked in a clay tandoor and served with warmth in the heart of Delhi.</p><a href="reserve.html" class="r-btn">Reserve a table</a> <a href="menu.html" class="r-btn" style="background:transparent;color:#f3ead7;border:1px solid #35503f;margin-left:8px">View menu</a>
<img src="${ph(1600, 690, "Signature dishes", "1d3a2e", "e8b04b")}" alt=""></div></section><section class="r-sec" style="padding-top:0" data-lb-name="Menu highlights"><div class="r-w"><h2 class="r-h2">Chef's favourites</h2>${spMenu}</div></section>${spFoot}`) },
  { name: "Menu", file: "menu.html", html: doc("Menu — Masala", spF, spCss, `${spHead}<section class="r-sec" data-lb-name="Menu"><div class="r-w"><h2 class="r-h2">Our menu</h2>${spMenu}<p style="text-align:center;color:#a99d84;margin-top:30px">All prices inclusive of taxes · Vegetarian &amp; vegan options available</p></div></section>${spFoot}`) },
  { name: "Our story", file: "about.html", html: doc("Our story — Masala", spF, spCss, `${spHead}<section class="r-sec" data-lb-name="Story"><div class="r-w r-story"><img src="${ph(800, 900, "Our kitchen", "1d3a2e", "e8b04b")}" alt=""><div><h2 class="r-h2" style="text-align:left">Three generations of cooking</h2><p>It started in my grandmother's kitchen in Amritsar. Today, our chefs still grind spices every morning and slow-cook our dal overnight — just like she did.</p><p class="r-g" style="font:italic 600 22px 'Playfair Display',serif">— Chef Harpreet Singh</p></div></div></section>${spFoot}`) },
  { name: "Reserve", file: "reserve.html", html: doc("Reserve — Masala", spF, spCss, `${spHead}<section class="r-sec">${spBook}</section>${spFoot}`) },
];

export const DESIGNS = [
  { key: "launch", type: "landing", cat: "SaaS & startups", name: "Orbit — SaaS launch", note: "Dark aurora hero, bento features, pricing, FAQ and signup", accent: "#7c5cff", pages: launch },
  { key: "masterclass", type: "landing", cat: "Events & courses", name: "Masterclass — paid workshop", note: "Editorial style, countdown, ₹ registration, agenda and host bio", accent: "#ff6a2b", pages: masterclass },
  { key: "waitlist", type: "landing", cat: "Apps & products", name: "Habitly — app waitlist", note: "Minimal coming-soon page with phone mockup and email capture", accent: "#ff7043", pages: waitlist },
  { key: "coach", type: "landing", cat: "Personal brand", name: "Coach — book a call", note: "Warm serif design with programs, testimonial and booking form", accent: "#264d3b", pages: coach },
  { key: "agency", type: "website", cat: "Agencies & studios", name: "North — agency website", note: "4 pages · bold type, work grid, services and enquiry form", accent: "#d4ff3f", pages: agency },
  { key: "clinic", type: "website", cat: "Local business", name: "CareWell — clinic website", note: "4 pages · services, doctors, map and appointment booking", accent: "#0f766e", pages: clinic },
  { key: "estate", type: "landing", cat: "Real estate", name: "Aurelia — luxury real estate", note: "Black & gold, gallery, price table, amenities and site-visit form", accent: "#c9a45c", pages: estate },
  { key: "brew", type: "landing", cat: "Food & cafés", name: "Brew & Bloom — café", note: "Warm terracotta, menu cards and table reservation", accent: "#c2410c", pages: brew },
  { key: "pulse", type: "landing", cat: "Health & fitness", name: "Pulse — gym & fitness", note: "Bold black + red, programs, memberships and free-trial form", accent: "#ff2e4d", pages: pulse },
  { key: "ebook", type: "landing", cat: "Lead magnets", name: "Playbook — free ebook", note: "3D book cover, chapters, author and email download form", accent: "#2347c8", pages: ebook },
  { key: "summit", type: "landing", cat: "Events & courses", name: "Summit — conference", note: "Huge type, countdown, speakers, schedule and tickets", accent: "#0626ff", pages: summit },
  { key: "appify", type: "landing", cat: "Apps & products", name: "Spendly — app download", note: "Phone mockups, store buttons, features and ratings", accent: "#12b76a", pages: appify },
  { key: "folio", type: "website", cat: "Personal brand", name: "Folio — designer portfolio", note: "4 pages · editorial serif, project grid, about and contact", accent: "#111111", pages: folio },
  { key: "academy", type: "website", cat: "Education", name: "VidyaPoint — coaching institute", note: "4 pages · courses, toppers, demo-class enquiry", accent: "#f5b301", pages: academy },
  { key: "haven", type: "website", cat: "Agencies & studios", name: "Haven — interior studio", note: "4 pages · beige minimal, projects, services, consultation", accent: "#9a7b56", pages: haven },
  { key: "spice", type: "website", cat: "Food & cafés", name: "Masala — restaurant website", note: "4 pages · menu with prices, story and reservations", accent: "#e8b04b", pages: spice },
];
