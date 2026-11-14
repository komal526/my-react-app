// LaunchBuilder v52 — Consultant.jsx (AI Consultant: ask about your page · plan & create a page · your own API key)
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons.jsx";
import { askAI, browserAi, serverAiReady, aiStatus, aiSaveKey, aiRemoveKey, AI_PROVIDERS, AI_PAGE_SYS, parseAiPages, pg } from "../lib.js";
import { consult, contextFor, areaName } from "./insights.js";

const ASK_SYS = `You are LaunchBuilder's AI Landing Page Performance Consultant. You get ONE user's real page outline, live analytics and an automatic audit.
Rules: base every point on the data given — quote real numbers and real text from their page. Be direct and practical: give at most 5 numbered fixes, most important first, each with the exact new wording or the exact change to make in the builder. No generic marketing theory. If data is too small (under ~20 visitors) say so in one line and focus on the page content. Keep it under 220 words. Reply in the same language the user writes in (Hindi, Hinglish or English).`;
const PLAN_SYS = `You are LaunchBuilder's AI page planner. You help the user plan a landing page or a website before it is built.
Talk like a helpful consultant: ask at most 2 short questions at a time (business, audience, offer, price/date, main action, sections, style/colours). Suggest ideas and improvements to what they say.
When you have enough (usually after 2–4 answers), write the final plan with these headings: Page type, Name, Headline, Sub-headline, Main button text, Sections (in order, one line each), Form fields, Colours & style. Then end with a line exactly: PLAN READY
If the user asks for changes after that, write the full updated plan again and end with PLAN READY. Reply in the same language the user writes in.`;
const QUESTIONS = ["Why isn't my page performing well?", "What should I change in my CTA?", "How can I improve my form?", "How can I increase my conversion rate?", "Which section of my page is the weakest?", "Give me today's top 3 fixes"];
const RK = (e) => "lb_aireview_" + e;

/* tiny, safe markdown → React (bold, numbered/bullet lists, line breaks) */
const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((x, i) => (x.startsWith("**") ? <b key={i}>{x.slice(2, -2)}</b> : x));
function Md({ text }) {
  const lines = String(text || "").replace(/\nPLAN READY\s*$/i, "").split("\n");
  return <div className="cn-md">{lines.map((l, i) => {
    const t = l.trim(); if (!t) return <i key={i} className="cn-gap" />;
    if (/^#{1,4}\s/.test(t)) return <b key={i} className="cn-h">{inline(t.replace(/^#+\s*/, ""))}</b>;
    const m = t.match(/^(\d+[.)]|[-*•])\s+(.*)$/); if (m) return <div key={i} className="cn-li"><span>{/\d/.test(m[1]) ? m[1].replace(")", ".") : "•"}</span><p>{inline(m[2])}</p></div>;
    return <p key={i}>{inline(t)}</p>;
  })}</div>;
}

/* a useful answer even without any AI key — from the rules-based audit */
function ruleAnswer(r, q) {
  if (!r) return "Create or open a page first, then ask me about it.";
  const area = /cta|button/i.test(q) ? "cta" : /form/i.test(q) ? "form" : /mobile|phone/i.test(q) ? "mobile" : /speed|slow|load/i.test(q) ? "speed" : /headline|content|section|weak/i.test(q) ? "content" : null;
  const list = r.issues.filter((i) => i.sev > 0 && (!area || i.area === area || i.live)).slice(0, area ? 5 : 3);
  const m = r.m;
  return `**${r.p.name}** · score ${r.score}/100 · ${m.visitors} visitors, ${m.clicks} button clicks, ${m.subs} sign-ups (${m.conv.toFixed(1)}%).\n\n` +
    (list.length ? list.map((i, n) => `${n + 1}. **${i.title}** — ${i.fix}`).join("\n") : "Nothing important to fix here — this part of the page looks good.") +
    "\n\nThis answer comes from the automatic audit. Add an AI key in Settings for a full written review.";
}

export default function Consultant({ open, onClose, initial = {}, projects, events, leads, integ, user, onCreate }) {
  const [tab, setTab] = useState(initial.tab || "ask");
  const [pid, setPid] = useState(initial.pid || (projects[0] && projects[0].id) || "");
  const [msgs, setMsgs] = useState([]), [planMsgs, setPlanMsgs] = useState([]);
  const [q, setQ] = useState(""), [busy, setBusy] = useState(""), [err, setErr] = useState(""), [noKey, setNoKey] = useState(false);
  const [st, setSt] = useState(null), [prov, setProv] = useState("claude"), [key, setKey] = useState(""), [model, setModel] = useState(""), [kmsg, setKmsg] = useState("");
  const [kind, setKind] = useState("landing"), [ready, setReady] = useState(null), [listen, setListen] = useState(false), [lang, setLang] = useState("en-IN"), [copied, setCopied] = useState(-1);
  const box = useRef(null), recog = useRef(null), base = useRef("");
  /* which AI will answer? (shown in the header) */
  useEffect(() => { if (!open) return; const b = browserAi(integ); serverAiReady().then((ok) => setReady(ok ? "LaunchBuilder AI" : b ? (AI_PROVIDERS.find((p) => p.id === b.provider) || {}).name : "")); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  /* 🎤 speak instead of typing (Chrome / Edge): English or Hindi */
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggleMic = () => {
    if (listen) { recog.current && recog.current.stop(); return; }
    if (!SR) { setErr("Voice typing works in Chrome and Edge. Please type your question here."); return; }
    const r = new SR(); r.lang = lang; r.interimResults = true; r.continuous = true; base.current = q ? q.trim() + " " : "";
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setQ(base.current + t); };
    r.onerror = (e) => { setErr(e.error === "not-allowed" ? "Microphone permission was blocked. Allow it from the 🔒 icon in the address bar." : e.error === "no-speech" ? "I didn't hear anything — try again." : "Voice typing stopped (" + e.error + ")."); };
    r.onend = () => setListen(false);
    recog.current = r; setErr(""); r.start(); setListen(true);
  };
  useEffect(() => () => { try { recog.current && recog.current.stop(); } catch { /* ignore */ } }, []);
  const copy = (t, i) => { try { navigator.clipboard.writeText(t.replace(/\*\*/g, "")); setCopied(i); setTimeout(() => setCopied(-1), 1500); } catch { /* ignore */ } };
  const data = useMemo(() => consult(projects, events, leads, { days: 30 }), [projects, events, leads]);
  const r = data.res.find((x) => x.p.id === pid) || data.res[0];
  const list = tab === "plan" ? planMsgs : msgs, setList = tab === "plan" ? setPlanMsgs : setMsgs;

  useEffect(() => { if (!open) return; setTab(initial.tab || "ask"); if (initial.pid) setPid(initial.pid); if (initial.ask) setTimeout(() => send(initial.ask, initial.tab || "ask"), 50); }, [open, initial.nonce]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setMsgs([]); setErr(""); }, [pid]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs, planMsgs, busy]);
  useEffect(() => { if (open && tab === "settings" && !st) aiStatus(integ).then(setSt).catch((e) => setSt({ error: e.message })); }, [open, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const k = (e) => e.key === "Escape" && open && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open, onClose]);

  const send = async (text, mode = tab) => {
    const t = (text || "").trim(); if (!t || busy) return;
    if (listen && recog.current) recog.current.stop();
    setQ(""); setErr("");
    const isPlan = mode === "plan", prev = isPlan ? planMsgs : msgs, setL = isPlan ? setPlanMsgs : setMsgs;
    const next = [...prev, { role: "user", content: t }]; setL(next);
    /* "today's top 3 fixes" is cached for the day so it doesn't cost an AI call every time */
    const daily = !isPlan && /top 3 fixes/i.test(t) && r;
    const today = new Date().toDateString();
    if (daily) { try { const c = JSON.parse(localStorage.getItem(RK(user.email)) || "{}")[r.p.id]; if (c && c.day === today) { setL([...next, { role: "assistant", content: c.text, cached: true }]); return; } } catch { /* ignore */ } }
    setBusy(isPlan ? "Thinking about your page…" : "Reading your page and numbers…");
    try {
      const sys = isPlan ? PLAN_SYS : ASK_SYS + "\n\n" + contextFor(r);
      const ans = await askAI(integ, sys, next.map(({ role, content }) => ({ role, content })), isPlan ? 1800 : 1200);
      setL([...next, { role: "assistant", content: ans, via: askAI.via }]); setNoKey(false);
      if (daily) { try { const all = JSON.parse(localStorage.getItem(RK(user.email)) || "{}"); all[r.p.id] = { day: today, text: ans }; localStorage.setItem(RK(user.email), JSON.stringify(all)); } catch { /* ignore */ } }
    } catch (e) {
      if (e.message === "NO_AI_KEY" || /set up publishing|wasn't found|didn't answer|couldn't reach|failed to fetch|network/i.test(e.message)) {
        setNoKey(e.message === "NO_AI_KEY" ? "No AI key yet." : "The AI couldn't be reached (" + e.message.slice(0, 90) + ").");
        setL([...next, { role: "assistant", content: isPlan ? "To plan and build pages with AI I need an AI key. Add your Gemini key in **Integrations → AI**, or in **Settings** here (stays encrypted on your server)." : ruleAnswer(r, t), rules: !isPlan }]);
      } else { setErr(e.message); setL(prev); setQ(t); }
    } finally { setBusy(""); }
  };

  const planReady = tab === "plan" && planMsgs.length && /PLAN READY\s*$/i.test(planMsgs[planMsgs.length - 1].content || "");
  const build = async () => {
    const plan = planMsgs[planMsgs.length - 1].content.replace(/PLAN READY\s*$/i, "");
    const talk = planMsgs.filter((m) => m.role === "user").map((m) => "- " + m.content).join("\n");
    const name = ((plan.match(/Name\s*[:\-–]\s*\**\s*([^\n*]+)/i) || [])[1] || "AI page").trim().slice(0, 60);
    setBusy("Building your page — this takes about a minute…"); setErr("");
    try {
      const out = await askAI(integ, AI_PAGE_SYS(kind === "website"), [{ role: "user", content: `Build this exactly as planned.\n\nPLAN:\n${plan}\n\nWhat the client told us:\n${talk}` }], 12000);
      onCreate(name, parseAiPages(out, kind === "website").map((x) => pg(x.name, x.file, x.html)), kind);
      onClose();
    } catch (e) { setErr(e.message === "NO_AI_KEY" ? "Add an AI key in Settings first." : e.message); }
    finally { setBusy(""); }
  };

  const saveKey = async () => {
    setKmsg(""); setBusy("Testing your key…");
    try { const j = await aiSaveKey(integ, prov, key.trim(), model.trim()); setSt((s) => ({ ...(s || {}), own: j.own })); setKey(""); setKmsg("✓ Saved and encrypted on your server."); setNoKey(false); }
    catch (e) { setKmsg("✗ " + e.message); }
    finally { setBusy(""); }
  };

  if (!open) return null;
  const tips = r ? r.issues.filter((i) => i.sev > 0).slice(0, 3) : [];
  return (
    <div className="cn-wrap" onClick={onClose}>
      <aside className="cn" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="AI Consultant">
        <header className="cn-top">
          <span className="cn-av"><svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><rect x="6" y="9" width="28" height="22" rx="9" fill="#0f1238" /><rect x="10" y="14" width="20" height="12" rx="6" fill="#060824" /><circle cx="16" cy="20" r="2.6" fill="#7ef0ff" className="cn-eye" /><circle cx="24" cy="20" r="2.6" fill="#7ef0ff" className="cn-eye" /><line x1="20" y1="9" x2="20" y2="4" stroke="#0f1238" strokeWidth="2" /><circle cx="20" cy="4" r="2.2" fill="#0f1238" /></svg></span>
          <div className="grow"><b>AI Consultant</b><small className={"cn-stat " + (ready === null ? "" : ready ? "ok" : "off")}><i />{ready === null ? "Checking AI…" : ready ? "Online · " + ready : "Audit mode · add an AI key for full answers"}</small></div>
          <button className="cn-x" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="cn-tabs" role="tablist">{[["ask", "Ask about a page"], ["plan", "Plan a new page"], ["settings", "Settings"]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => { setTab(k); setErr(""); }}>{l}</button>)}</div>

        {tab === "settings" ? <div className="cn-body cn-set">
          <h4>Your AI key (optional)</h4>
          <p className="mut">Without a key, LaunchBuilder's own AI answers (with a daily limit) when it's switched on. With your own key you get unlimited answers, billed by your AI company.</p>
          <div className="cn-lock"><Icon n="check" s={14} /> Your key is <b>encrypted on your server</b> and never sent back to the browser.</div>
          {browserAi(integ) && <div className="cn-saved"><div><b>✓ {(AI_PROVIDERS.find((p) => p.id === browserAi(integ).provider) || {}).name} key found in Integrations → AI</b><small>Used when the server has no key. For the safest setup, save it here instead (encrypted on your server).</small></div></div>}
          {st && st.own ? <div className="cn-saved"><div><b>{(AI_PROVIDERS.find((p) => p.id === st.own.provider) || {}).name}</b><small>{st.own.model} · key ending …{st.own.last4}</small></div>
            <button onClick={async () => { try { await aiRemoveKey(integ); setSt((s) => ({ ...s, own: null })); setKmsg("Key removed."); } catch (e) { setKmsg("✗ " + e.message); } }}>Remove</button></div> : null}
          <label>AI company<select value={prov} onChange={(e) => setProv(e.target.value)}>{AI_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label>API key<input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder={(AI_PROVIDERS.find((p) => p.id === prov) || {}).hint} /></label>
          <a className="link" href={(AI_PROVIDERS.find((p) => p.id === prov) || {}).keyUrl} target="_blank" rel="noreferrer">Get a key ↗</a>
          <label>Model (optional)<input value={model} onChange={(e) => setModel(e.target.value)} placeholder={(AI_PROVIDERS.find((p) => p.id === prov) || {}).model} /></label>
          <button className="pri" disabled={key.trim().length < 20 || !!busy} onClick={saveKey}>{busy || (st && st.own ? "Replace key" : "Test & save key")}</button>
          {kmsg && <p className={"cn-kmsg" + (kmsg[0] === "✗" ? " bad" : "")}>{kmsg}</p>}
          {st && st.platform && <p className="mut">LaunchBuilder AI is on: up to {st.platform.limit} questions a day without your own key.</p>}
          {st && st.error && <p className="cn-kmsg bad">Your server isn't reachable from here ({st.error}). AI answers need the LaunchBuilder server — on crecapo.tech it's already there.</p>}
        </div> : <>
          {tab === "ask" && <div className="cn-ctx">
            <select value={r ? r.p.id : ""} onChange={(e) => setPid(e.target.value)} aria-label="Page">{data.res.map((x) => <option key={x.p.id} value={x.p.id}>{x.p.name}</option>)}</select>
            {r && <div className="cn-score" style={{ "--s": r.score }}><b>{r.score}</b><small>score</small></div>}
          </div>}
          {tab === "ask" && r && <div className="cn-areas">{Object.entries(r.areas).map(([k, v]) => <span key={k} className={v >= 80 ? "ok" : v >= 55 ? "mid" : "bad"}><i style={{ width: v + "%" }} />{areaName(k)}<b>{v}</b></span>)}</div>}

          <div className="cn-body" ref={box}>
            {!list.length && tab === "ask" && <div className="cn-hello">
              {r ? <><p>I checked <b>{r.p.name}</b>: {r.m.visitors} visitors, {r.m.clicks} button clicks and {r.m.subs} sign-ups in the last 30 days.</p>
                {tips.length ? <><small>Fix these first</small>{tips.map((t, i) => <div key={i} className={"cn-tip s" + t.sev}><b>{t.title}</b><p>{t.fix}</p></div>)}</> : <p>No big problems found. Ask me anything about this page.</p>}</>
                : <p>Create a page first — then I can check its content, buttons, form, mobile view, speed and conversions.</p>}
            </div>}
            {!list.length && tab === "plan" && <div className="cn-hello"><p>Tell me what you want to build — your business, who it's for and what visitors should do. I'll ask a few questions, suggest ideas, write a plan, and then build the page for you.</p>
              <div className="cn-ex">{["A landing page for my ₹499 astrology workshop on Sunday", "A website for my dental clinic in Mohali", "A webinar sign-up page for an AI course"].map((x) => <button key={x} onClick={() => send(x, "plan")}>{x}</button>)}</div></div>}
            {list.map((m, i) => <div key={i} className={"cn-row " + m.role}>{m.role === "assistant" && <span className="cn-mav"><Icon n="sparkle" s={13} /></span>}<div className={"cn-msg " + m.role}>{m.role === "assistant" ? <><Md text={m.content} />
              <div className="cn-mf">{m.cached ? <small>Today's review · saved, free to reopen</small> : m.rules ? <small>From the automatic audit</small> : m.via ? <small>{m.via}</small> : <small />}<button className="cn-copy" onClick={() => copy(m.content, i)}>{copied === i ? "✓ Copied" : "Copy"}</button></div></> : <p>{m.content}</p>}</div></div>)}
            {busy && tab !== "settings" && <div className="cn-msg assistant cn-busy"><i /><i /><i /><span>{busy}</span></div>}
            {noKey && <div className="cn-nokey"><b>{noKey}</b> Add your Gemini key in <b>Integrations → AI</b> or <button className="link" onClick={() => setTab("settings")}>here in Settings</button> to get full AI answers.</div>}
          </div>

          {planReady && !busy && <div className="cn-build"><div className="cn-kind">{[["landing", "Landing page"], ["website", "Website"]].map(([k, l]) => <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{l}</button>)}</div>
            <button className="pri" onClick={build}><Icon n="sparkle" s={15} /> Create this page</button></div>}
          {err && <p className="cn-err">{err}</p>}
          {tab === "ask" && !busy && <div className="cn-chips">{(list.length ? QUESTIONS.slice(1, 4) : QUESTIONS).map((x) => <button key={x} onClick={() => send(x)}>{x}</button>)}</div>}
          <form className={"cn-in" + (listen ? " rec" : "")} onSubmit={(e) => { e.preventDefault(); send(q); }}>
            <button type="button" className={"cn-mic" + (listen ? " on" : "")} onClick={toggleMic} title={listen ? "Stop listening" : "Speak your question"} aria-label={listen ? "Stop listening" : "Speak your question"}><Icon n="mic" s={18} /></button>
            <div className="cn-field"><textarea rows={1} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(q); } }} placeholder={listen ? "Listening… speak now" : tab === "plan" ? "Describe your page, or answer the questions…" : "Ask about this page…"} />
              <select value={lang} onChange={(e) => setLang(e.target.value)} title="Voice language" aria-label="Voice language" disabled={listen}><option value="en-IN">EN</option><option value="hi-IN">हिं</option></select></div>
            <button className="pri cn-send" disabled={!q.trim() || !!busy} aria-label="Send"><Icon n="send" s={17} /></button>
          </form>
        </>}
      </aside>
    </div>
  );
}
