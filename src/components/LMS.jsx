// LaunchBuilder v42 — LMS.jsx (Beta) · Academy: courses, store, bundles, events, tiers, certificates, leaderboard
import { useEffect, useMemo, useState } from "react";
import { Icon } from "./icons.jsx";
import { uid } from "../lib.js";

const KEY = (e) => "lb_lms_" + e;
export const loadCourses = (e) => { try { return JSON.parse(localStorage.getItem(KEY(e)) || "[]"); } catch { return []; } };
const saveCourses = (e, l) => { try { localStorage.setItem(KEY(e), JSON.stringify(l)); } catch { alert("Browser storage is full."); } };

/* ---------- YouTube helpers ---------- */
export const ytParse = (url) => {
  const u = String(url || "").trim(); if (!u) return null;
  const list = (u.match(/[?&]list=([\w-]+)/) || [])[1];
  const vid = (u.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/) || [])[1] || (/^[\w-]{11}$/.test(u) ? u : "");
  if (list && !/[?&]v=/.test(u) && !/youtu\.be\//.test(u)) return { type: "playlist", list, vid: "" };
  if (vid) return { type: list ? "playlist" : "video", vid, list: list || "" };
  if (list) return { type: "playlist", list, vid: "" };
  return null;
};
const thumbOf = (l) => (l && l.vid ? `https://i.ytimg.com/vi/${l.vid}/hqdefault.jpg` : "");
const embedOf = (l) => (!l ? "" : l.type === "playlist" ? `https://www.youtube-nocookie.com/embed/${l.vid ? l.vid + "?list=" + l.list + "&" : "videoseries?list=" + l.list + "&"}rel=0&modestbranding=1` : `https://www.youtube-nocookie.com/embed/${l.vid}?rel=0&modestbranding=1`);
async function ytTitle(url) {
  for (const api of [`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, `https://noembed.com/embed?url=${encodeURIComponent(url)}`]) {
    try { const r = await fetch(api); if (r.ok) { const j = await r.json(); if (j.title) return j.title; } } catch { /* try next */ }
  }
  return "";
}

const CATS = ["Business", "Marketing", "Technology", "Design", "Personal growth", "Health & fitness", "Languages", "Finance", "Education", "Other"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All levels"];
const newCourse = () => ({ id: "c" + uid(), title: "", desc: "", category: "Business", level: "Beginner", language: "English", instructor: "", thumb: "", status: "draft", paid: false, price: "",
  sections: [{ id: "s" + uid(), title: "Getting started", lessons: [] }], resources: [], cert: { on: false, title: "Certificate of Completion", signer: "", rule: 100 }, created: Date.now(), updated: Date.now() });
const lessonsOf = (c) => c.sections.flatMap((s) => s.lessons);
const coverOf = (c) => c.thumb || thumbOf(lessonsOf(c).find((l) => l.vid)) || "";
const minsOf = (c) => lessonsOf(c).reduce((n, l) => n + (+l.mins || 0), 0);
const hrs = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + "m" : ""}` : `${m}m`);

/* ---------------------------------------------------------------- course player */
function Player({ c, onClose, email }) {
  const PK = "lb_lms_prog_" + email + "_" + c.id;
  const all = lessonsOf(c);
  const [cur, setCur] = useState(all[0] ? all[0].id : ""), [done, setDone] = useState(() => { try { return JSON.parse(localStorage.getItem(PK) || "[]"); } catch { return []; } });
  const l = all.find((x) => x.id === cur), i = all.findIndex((x) => x.id === cur);
  const mark = () => { const d = done.includes(cur) ? done : [...done, cur]; setDone(d); localStorage.setItem(PK, JSON.stringify(d)); if (all[i + 1]) setCur(all[i + 1].id); };
  const pct = all.length ? Math.round((done.length / all.length) * 100) : 0;
  return (
    <div className="lms-player">
      <div className="lms-ph"><button className="lms-back" onClick={onClose}><Icon n="back" s={16} /> Back</button><div className="grow"><b>{c.title || "Untitled course"}</b><span>{all.length} lessons · {hrs(minsOf(c))} · {pct}% complete</span></div>
        <div className="lms-prog"><i style={{ width: pct + "%" }} /></div></div>
      <div className="lms-pbody">
        <div className="lms-stage">
          {l ? <><div className="lms-video"><iframe title={l.title} src={embedOf(l)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
            <div className="lms-lt"><div><small>Lesson {i + 1} of {all.length}{l.type === "playlist" ? " · Playlist" : ""}</small><h2>{l.title}</h2></div>
              <button className="pri" onClick={mark}>{done.includes(cur) ? (all[i + 1] ? "Next lesson →" : "✓ Completed") : all[i + 1] ? "Mark complete & next →" : "Mark complete ✓"}</button></div>
            {l.notes && <p className="lms-notes">{l.notes}</p>}
            {pct === 100 && c.cert.on && <div className="lms-done">🎓 Course complete! Certificate: <b>{c.cert.title}</b></div>}
            {c.resources.length > 0 && <div className="lms-res"><b>Resources</b>{c.resources.map((r) => <a key={r.id} href={r.url} target="_blank" rel="noopener">📎 {r.title || r.url}</a>)}</div>}</>
            : <div className="empty"><b>No lessons yet</b><p className="mut">Add YouTube videos in Course content.</p></div>}
        </div>
        <aside className="lms-side">{c.sections.map((s, si) => <div key={s.id} className="lms-sec"><b>{si + 1}. {s.title}</b>
          {s.lessons.map((x) => <button key={x.id} className={"lms-li" + (x.id === cur ? " on" : "") + (done.includes(x.id) ? " done" : "")} onClick={() => setCur(x.id)}>
            <span className="lms-ck">{done.includes(x.id) ? "✓" : x.type === "playlist" ? "☰" : "▶"}</span><span className="grow">{x.title}</span>{x.mins ? <em>{x.mins}m</em> : null}</button>)}</div>)}</aside>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- course editor */
function Editor({ course, onSave, onClose, onPreview }) {
  const [c, setC] = useState(course), [tab, setTab] = useState("info"), [add, setAdd] = useState({}), [busy, setBusy] = useState("");
  useEffect(() => { const t = setTimeout(() => onSave({ ...c, updated: Date.now() }), 500); return () => clearTimeout(t); }, [c]); // eslint-disable-line react-hooks/exhaustive-deps
  const up = (o) => setC({ ...c, ...o });
  const secUp = (sid, fn) => up({ sections: c.sections.map((s) => (s.id === sid ? fn(s) : s)) });
  const addLesson = async (sid) => {
    const url = (add[sid] || "").trim(), y = ytParse(url);
    if (!y) return alert("Paste a YouTube video or playlist link, e.g. https://youtu.be/… or https://www.youtube.com/playlist?list=…");
    setBusy(sid); const title = (await ytTitle(url)) || (y.type === "playlist" ? "Playlist" : "New lesson"); setBusy("");
    secUp(sid, (s) => ({ ...s, lessons: [...s.lessons, { id: "l" + uid(), title, url, ...y, mins: "", preview: !lessonsOf(c).length, notes: "" }] }));
    setAdd({ ...add, [sid]: "" });
  };
  const moveL = (sid, idx, d) => secUp(sid, (s) => { const l = [...s.lessons], j = idx + d; if (j < 0 || j >= l.length) return s; [l[idx], l[j]] = [l[j], l[idx]]; return { ...s, lessons: l }; });
  const lUp = (sid, lid, o) => secUp(sid, (s) => ({ ...s, lessons: s.lessons.map((l) => (l.id === lid ? { ...l, ...o } : l)) }));
  const cover = coverOf(c);
  const T = [["info", "Course information", "card"], ["content", "Course content", "pages"], ["res", "Resources", "share"], ["cert", "Certificate", "star"]];
  return (
    <div className="lms-ed">
      <div className="lms-edh"><button className="lms-back" onClick={onClose}><Icon n="back" s={16} /></button><h1>{c.title || "Create course"}</h1>
        <span className={"lms-st " + c.status}>{c.status === "published" ? "● Published" : "● Draft"}</span><div className="grow" />
        <span className="mut sm">Saved automatically</span><button onClick={() => onPreview(c)}><Icon n="eye" s={15} /> Preview course</button></div>
      <div className="lms-tabs">{T.map(([k, l, ic]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><Icon n={ic} s={15} />{l}{k === "content" && <em>{lessonsOf(c).length}</em>}{k === "res" && c.resources.length ? <em>{c.resources.length}</em> : null}</button>)}</div>

      {tab === "info" && <div className="lms-grid">
        <div className="panel lms-card">
          <label className="lms-f">Course name *<input maxLength={120} value={c.title} onChange={(e) => up({ title: e.target.value })} placeholder="e.g. Meta Ads Masterclass" /><small>{c.title.length}/120 characters</small></label>
          <label className="lms-f">Course description *<textarea rows={7} value={c.desc} onChange={(e) => up({ desc: e.target.value })} placeholder="What will students learn? Who is it for? What do they need?" /></label>
          <div className="lms-two">
            <label className="lms-f">Category<select value={c.category} onChange={(e) => up({ category: e.target.value })}>{CATS.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="lms-f">Level<select value={c.level} onChange={(e) => up({ level: e.target.value })}>{LEVELS.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="lms-f">Language<input value={c.language} onChange={(e) => up({ language: e.target.value })} /></label>
            <label className="lms-f">Instructor<input value={c.instructor} onChange={(e) => up({ instructor: e.target.value })} placeholder="Your name" /></label>
          </div>
        </div>
        <div className="panel lms-card">
          <span className="lms-lbl">Course status</span>
          <div className="lms-radio">{[["published", "Published"], ["draft", "Draft"]].map(([k, l]) => <label key={k}><input type="radio" checked={c.status === k} onChange={() => up({ status: k })} />{l}</label>)}</div>
          <span className="lms-lbl">Pricing</span>
          <div className="lms-radio">{[[false, "Free"], [true, "Paid"]].map(([k, l]) => <label key={l}><input type="radio" checked={c.paid === k} onChange={() => up({ paid: k })} />{l}</label>)}</div>
          {c.paid && <label className="lms-f">Price (₹)<input type="number" min="0" value={c.price} onChange={(e) => up({ price: e.target.value })} placeholder="e.g. 999" /></label>}
          <span className="lms-lbl">Course thumbnail</span>
          <div className="lms-thumb">{cover ? <img src={cover} alt="" /> : <div><Icon n="card" s={28} /><small>Recommended 1280 × 720</small></div>}</div>
          <label className="lms-f"><input value={c.thumb} onChange={(e) => up({ thumb: e.target.value })} placeholder="Image link — or leave empty to use the first video's thumbnail" /></label>
        </div>
      </div>}

      {tab === "content" && <div className="lms-content">
        {c.sections.map((s, si) => (
          <div key={s.id} className="panel lms-sec-ed">
            <div className="lms-sh"><span className="lms-sn">{si + 1}</span><input value={s.title} onChange={(e) => secUp(s.id, (x) => ({ ...x, title: e.target.value }))} placeholder="Section title" />
              <span className="mut sm">{s.lessons.length} lessons</span>
              {c.sections.length > 1 && <button className="lms-ib red" title="Delete section" onClick={() => window.confirm(`Delete section "${s.title}" and its lessons?`) && up({ sections: c.sections.filter((x) => x.id !== s.id) })}><Icon n="trash" s={14} /></button>}</div>
            {s.lessons.map((l, li) => (
              <div key={l.id} className="lms-lesson">
                <div className="lms-lthumb">{thumbOf(l) ? <img src={thumbOf(l)} alt="" /> : <span>☰</span>}{l.type === "playlist" && <em>Playlist</em>}</div>
                <div className="grow"><input value={l.title} onChange={(e) => lUp(s.id, l.id, { title: e.target.value })} /><input className="lms-notes-in" value={l.notes} onChange={(e) => lUp(s.id, l.id, { notes: e.target.value })} placeholder="Lesson notes (optional)" /></div>
                <label className="lms-mins"><input type="number" min="0" value={l.mins} onChange={(e) => lUp(s.id, l.id, { mins: e.target.value })} placeholder="0" />min</label>
                <label className="lms-pv" title="Visitors can watch this lesson before buying"><input type="checkbox" checked={!!l.preview} onChange={(e) => lUp(s.id, l.id, { preview: e.target.checked })} />Free preview</label>
                <div className="lms-mv"><button className="lms-ib" onClick={() => moveL(s.id, li, -1)} title="Move up">↑</button><button className="lms-ib" onClick={() => moveL(s.id, li, 1)} title="Move down">↓</button>
                  <button className="lms-ib red" onClick={() => secUp(s.id, (x) => ({ ...x, lessons: x.lessons.filter((y) => y.id !== l.id) }))} title="Delete lesson"><Icon n="trash" s={13} /></button></div>
              </div>))}
            <div className="lms-add"><span className="lms-yt">▶</span><input value={add[s.id] || ""} onChange={(e) => setAdd({ ...add, [s.id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addLesson(s.id)} placeholder="Paste a YouTube video or playlist link…" />
              <button className="pri" disabled={busy === s.id} onClick={() => addLesson(s.id)}>{busy === s.id ? "Adding…" : "＋ Add lesson"}</button></div>
          </div>))}
        <button className="lms-addsec" onClick={() => up({ sections: [...c.sections, { id: "s" + uid(), title: "New section", lessons: [] }] })}>＋ Add section</button>
        <p className="mut sm">Tip: upload your videos to YouTube as <b>Unlisted</b> — only people with the course can find them. A playlist link adds the whole playlist as one lesson.</p>
      </div>}

      {tab === "res" && <div className="panel lms-card">
        <p className="mut">Links students can open — PDFs, Google Drive files, worksheets, notes.</p>
        {c.resources.map((r) => <div key={r.id} className="lms-resrow"><input value={r.title} onChange={(e) => up({ resources: c.resources.map((x) => (x.id === r.id ? { ...x, title: e.target.value } : x)) })} placeholder="Title" />
          <input value={r.url} onChange={(e) => up({ resources: c.resources.map((x) => (x.id === r.id ? { ...x, url: e.target.value } : x)) })} placeholder="https://…" />
          <button className="lms-ib red" onClick={() => up({ resources: c.resources.filter((x) => x.id !== r.id) })}><Icon n="trash" s={13} /></button></div>)}
        <button onClick={() => up({ resources: [...c.resources, { id: "r" + uid(), title: "", url: "" }] })}>＋ Add resource</button>
      </div>}

      {tab === "cert" && <div className="lms-grid">
        <div className="panel lms-card">
          <label className="chk"><input type="checkbox" checked={c.cert.on} onChange={(e) => up({ cert: { ...c.cert, on: e.target.checked } })} />Give a certificate when the course is completed</label>
          <label className="lms-f">Certificate title<input value={c.cert.title} onChange={(e) => up({ cert: { ...c.cert, title: e.target.value } })} /></label>
          <label className="lms-f">Signed by<input value={c.cert.signer} onChange={(e) => up({ cert: { ...c.cert, signer: e.target.value } })} placeholder="e.g. Komal Pathania, Founder" /></label>
          <label className="lms-f">Completion needed<select value={c.cert.rule} onChange={(e) => up({ cert: { ...c.cert, rule: +e.target.value } })}>{[100, 90, 80, 75].map((x) => <option key={x} value={x}>{x}% of lessons</option>)}</select></label>
        </div>
        <div className={"lms-certprev" + (c.cert.on ? "" : " off")}><small>CERTIFICATE</small><h3>{c.cert.title}</h3><p>This certifies that</p><b className="lms-cn">Student Name</b><p>has successfully completed</p><b>{c.title || "Course name"}</b>
          <div className="lms-sig"><span>{c.cert.signer || "Signature"}</span><span>{new Date().toLocaleDateString("en-IN")}</span></div></div>
      </div>}
    </div>
  );
}

/* ---------------------------------------------------------------- course list */
function CoursesTab({ user, list, put, setEditing }) {
  const E = user.email;
  const [edit, setEdit0] = useState(null), [play, setPlay0] = useState(null), [q, setQ] = useState(""), [f, setF] = useState("all");
  const setEdit = (c) => { setEdit0(c); setEditing(!!c); }, setPlay = (c) => { setPlay0(c); setEditing(!!c); };
  const save = (c) => put(list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [c, ...list]);
  const shown = useMemo(() => list.filter((c) => (f === "all" || c.status === f) && (!q || (c.title + c.category).toLowerCase().includes(q.toLowerCase()))), [list, q, f]);
  if (play) return <Player c={play} email={E} onClose={() => setPlay(null)} />;
  if (edit) return <Editor course={edit} onSave={(c) => { save(c); }} onClose={() => setEdit(null)} onPreview={(c) => { save(c); setPlay(c); }} />;
  const lessons = list.reduce((n, c) => n + lessonsOf(c).length, 0), mins = list.reduce((n, c) => n + minsOf(c), 0);
  return (
    <div className="lms">
      <div className="ac-sub"><div><h2>Courses</h2><p className="mut">Build online courses from your YouTube videos and playlists.</p></div>
        <button className="pri big" onClick={() => setEdit(newCourse())}>＋ New course</button></div>
      <div className="db-stats fx lms-stats">
        {[["Courses", list.length, "card", "blue"], ["Published", list.filter((c) => c.status === "published").length, "globe", "green"], ["Lessons", lessons, "pages", "purple"], ["Watch time", hrs(mins), "chart", "orange"]].map(([l, v, ic, c]) => (
          <div key={l} className={"fx-stat fx-" + c}><span className="fx-orb"><Icon n={ic} s={22} /></span><div className="fx-txt"><span className="fx-lbl">{l}</span><b className="fx-num">{v}</b></div></div>))}
      </div>
      <div className="lms-bar"><label className="pl-search"><Icon n="search" s={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" /></label>
        <div className="chips" style={{ margin: 0 }}>{[["all", "All"], ["published", "Published"], ["draft", "Draft"]].map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}</div></div>
      {!shown.length ? <div className="empty lms-empty"><span>🎓</span><b>{list.length ? "No courses match" : "Create your first course"}</b><p className="mut">Upload videos to YouTube (Unlisted is fine), paste the links here, and your course is ready.</p><button className="pri" onClick={() => setEdit(newCourse())}>＋ New course</button></div>
        : <div className="lms-cards">{shown.map((c) => (
          <div key={c.id} className="lms-cc">
            <div className="lms-cover" onClick={() => setPlay(c)}>{coverOf(c) ? <img src={coverOf(c)} alt="" loading="lazy" /> : <span>🎓</span>}<span className={"lms-st " + c.status}>{c.status === "published" ? "Published" : "Draft"}</span><i className="lms-play">▶</i></div>
            <div className="lms-cb"><small>{c.category} · {c.level}</small><b>{c.title || "Untitled course"}</b>
              <div className="lms-meta"><span>{c.sections.length} sections</span><span>{lessonsOf(c).length} lessons</span>{minsOf(c) > 0 && <span>{hrs(minsOf(c))}</span>}<span className="lms-price">{c.paid ? "₹" + (c.price || 0) : "Free"}</span></div>
              <div className="db-cardbtns"><button onClick={() => setEdit(c)}><Icon n="pen" s={14} /> Edit</button><button onClick={() => setPlay(c)}><Icon n="eye" s={14} /> Preview</button>
                <button onClick={() => window.confirm(`Delete "${c.title || "this course"}"?`) && put(list.filter((x) => x.id !== c.id))} title="Delete"><Icon n="trash" s={14} /></button></div></div>
          </div>))}</div>}
    </div>
  );
}

/* ================================================================ Academy hub ================================================================ */
const XK = (e) => "lb_lmsx_" + e;
const loadX = (e) => { try { return { store: [], bundles: [], events: [], tiers: [], certs: {}, settings: {}, ...JSON.parse(localStorage.getItem(XK(e)) || "{}") }; } catch { return { store: [], bundles: [], events: [], tiers: [], certs: {}, settings: {} }; } };
const saveX = (e, x) => { try { localStorage.setItem(XK(e), JSON.stringify(x)); } catch { alert("Browser storage is full."); } };
const inr = (n) => (+n ? "₹" + Number(n).toLocaleString("en-IN") : "Free");

/* a simple list of cards with an edit window — used by Store, Bundles, Events and Access tiers */
function Crud({ items, onChange, fields, blank, title, add, empty, card }) {
  const [ed, setEd] = useState(null);
  const save = () => { const has = items.some((x) => x.id === ed.id); onChange(has ? items.map((x) => (x.id === ed.id ? ed : x)) : [...items, ed]); setEd(null); };
  return (
    <div>
      <div className="ac-sub"><div><h2>{title}</h2><p className="mut">{empty}</p></div><button className="pri big" onClick={() => setEd({ id: uid(), ...blank })}>＋ {add}</button></div>
      {!items.length ? <div className="empty"><b>Nothing here yet</b><p className="mut">{empty}</p><button className="pri" onClick={() => setEd({ id: uid(), ...blank })}>＋ {add}</button></div>
        : <div className="ac-cards">{items.map((x) => <div key={x.id} className="ac-card">{card(x)}
          <div className="db-cardbtns"><button onClick={() => setEd({ ...x })}><Icon n="pen" s={14} /> Edit</button><button onClick={() => window.confirm("Delete this?") && onChange(items.filter((y) => y.id !== x.id))}><Icon n="trash" s={14} /> Delete</button></div></div>)}</div>}
      {ed && <div className="pl-ov" onClick={() => setEd(null)}><div className="pl-md ac-md" onClick={(e) => e.stopPropagation()}>
        <div className="pl-mh"><b>{items.some((x) => x.id === ed.id) ? "Edit" : add}</b><button className="pl-x" onClick={() => setEd(null)}>✕</button></div>
        <div className="pl-mb">{fields.map(([k, label, type = "text", opts]) => (
          <label key={k} className="pl-l">{label}
            {type === "textarea" ? <textarea rows={3} value={ed[k] || ""} onChange={(e) => setEd({ ...ed, [k]: e.target.value })} />
              : type === "select" ? <select value={ed[k] || ""} onChange={(e) => setEd({ ...ed, [k]: e.target.value })}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
              : type === "multi" ? <div className="pl-forms">{opts.length ? opts.map(([v, l]) => <label key={v} className="chk"><input type="checkbox" checked={(ed[k] || []).includes(v)} onChange={(e) => setEd({ ...ed, [k]: e.target.checked ? [...(ed[k] || []), v] : (ed[k] || []).filter((y) => y !== v) })} />{l}</label>) : <span className="mut sm">Create a course first.</span>}</div>
              : <input type={type} value={ed[k] || ""} onChange={(e) => setEd({ ...ed, [k]: e.target.value })} />}
          </label>))}</div>
        <div className="pl-mf"><button onClick={() => setEd(null)}>Cancel</button><button className="pri" onClick={save}>Save</button></div>
      </div></div>}
    </div>
  );
}

const TABS = [["home", "grid", "Dashboard"], ["store", "card", "Digital Store"], ["courses", "pages", "Courses"], ["certs", "star", "Certificates"], ["bundles", "layers", "Bundles"], ["events", "calendar", "Events"], ["tiers", "users", "Access Tiers"], ["board", "chart", "Leaderboard"], ["settings", "gear", "Settings"], ["preview", "eye", "Preview"]];

export default function LMS({ user }) {
  const E = user.email;
  const [list, setList] = useState(() => loadCourses(E)), [x, setX] = useState(() => loadX(E)), [tab, setTab] = useState("home"), [editing, setEditing] = useState(false);
  useEffect(() => { const h = (e) => { const k = e.detail || []; if (editing) return; if (k.includes("all") || k.includes("lb_lms_")) setList(loadCourses(E)); if (k.includes("all") || k.includes("lb_lmsx_")) setX(loadX(E)); }; window.addEventListener("lb-cloud-pull", h); return () => window.removeEventListener("lb-cloud-pull", h); }, [E, editing]);
  const put = (l) => { setList(l); saveCourses(E, l); };
  const upX = (o) => { const n = { ...x, ...o }; setX(n); saveX(E, n); };
  const st = x.settings || {}, pub = list.filter((c) => c.status === "published");
  const courseOpts = list.map((c) => [c.id, c.title || "Untitled course"]);
  const steps = [["Name your academy", !!st.name, "settings"], ["Create your first course", list.length > 0, "courses"], ["Add at least 3 lessons", list.some((c) => lessonsOf(c).length >= 3), "courses"], ["Publish a course", pub.length > 0, "courses"],
    ["Turn on a certificate", list.some((c) => c.cert && c.cert.on), "certs"], ["Add a digital product", x.store.length > 0, "store"], ["Create a bundle", x.bundles.length > 0, "bundles"], ["Schedule an event", x.events.length > 0, "events"], ["Set up an access tier", x.tiers.length > 0, "tiers"], ["Add your logo & brand colour", !!(st.logo || st.color), "settings"]];
  const doneN = steps.filter((s) => s[1]).length;
  const prog = (c) => { try { return JSON.parse(localStorage.getItem("lb_lms_prog_" + E + "_" + c.id) || "[]").length; } catch { return 0; } };

  return (
    <div className="ac">
      {!editing && <>
        <div className="top"><div><h1>{st.name || "Academy"} <span className="beta">Beta</span></h1><p className="mut">{st.tagline || "Courses, digital products and events — all in one place."}</p></div></div>
        {doneN < steps.length && <div className="ac-setup"><Icon n="sparkle" s={16} /><b>Finish your setup</b><span>{doneN} of {steps.length} tasks complete</span><div className="ac-sbar"><i style={{ width: (doneN / steps.length) * 100 + "%" }} /></div><button onClick={() => setTab("home")}>Finish setup</button></div>}
        <div className="ac-tabs">{TABS.map(([k, ic, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><Icon n={ic} s={15} />{l}</button>)}</div>
      </>}

      {tab === "home" && <div className="ac-home">
        <div className="db-stats fx lms-stats">{[["Courses", list.length, "pages", "blue"], ["Published", pub.length, "globe", "green"], ["Products", x.store.length, "card", "purple"], ["Upcoming events", x.events.filter((ev) => !ev.date || new Date(ev.date) >= new Date(new Date().toDateString())).length, "calendar", "orange"]].map(([l, v, ic, c]) => (
          <div key={l} className={"fx-stat fx-" + c}><span className="fx-orb"><Icon n={ic} s={22} /></span><div className="fx-txt"><span className="fx-lbl">{l}</span><b className="fx-num">{v}</b></div></div>))}</div>
        <div className="panel ac-steps"><b>Setup checklist</b>{steps.map(([l, ok, go]) => <button key={l} className={"ac-step" + (ok ? " ok" : "")} onClick={() => setTab(go)}><span>{ok ? "✓" : ""}</span>{l}{!ok && <em>Start →</em>}</button>)}</div>
      </div>}
      {tab === "courses" && <CoursesTab user={user} list={list} put={put} setEditing={setEditing} />}
      {tab === "store" && <Crud title="Digital Store" add="Add product" empty="Sell e-books, templates, worksheets and other downloads." items={x.store} onChange={(v) => upX({ store: v })}
        blank={{ name: "", kind: "E-book / PDF", price: "", link: "", cover: "", desc: "" }}
        fields={[["name", "Product name"], ["kind", "Type", "select", ["E-book / PDF", "Template", "Worksheet", "Audio", "Video", "Other"]], ["price", "Price (₹, empty = free)", "number"], ["link", "Download link (Google Drive, Dropbox…)"], ["cover", "Cover image link"], ["desc", "Description", "textarea"]]}
        card={(p) => <><div className="ac-cover">{p.cover ? <img src={p.cover} alt="" /> : <span>📦</span>}</div><small>{p.kind}</small><b>{p.name || "Untitled"}</b><span className="ac-price">{inr(p.price)}</span></>} />}
      {tab === "certs" && <div>
        <div className="ac-sub"><div><h2>Certificates</h2><p className="mut">Courses that give a certificate when completed. Turn it on inside each course.</p></div></div>
        <div className="panel lms-card ac-brand"><b>Certificate branding</b><label className="lms-f">Organisation name<input value={(x.certs || {}).org || ""} onChange={(e) => upX({ certs: { ...x.certs, org: e.target.value } })} placeholder={st.name || "Your academy"} /></label>
          <label className="lms-f">Signature name<input value={(x.certs || {}).signer || ""} onChange={(e) => upX({ certs: { ...x.certs, signer: e.target.value } })} placeholder="e.g. Komal Pathania, Founder" /></label></div>
        <div className="ac-cards">{list.map((c) => <div key={c.id} className="ac-card"><b>{c.title || "Untitled course"}</b><span className={"ac-pill" + (c.cert && c.cert.on ? " on" : "")}>{c.cert && c.cert.on ? "🎓 Certificate on" : "No certificate"}</span><small>{c.cert && c.cert.on ? c.cert.title + " · " + c.cert.rule + "% completion" : "Open the course → Certificate tab"}</small></div>)}
          {!list.length && <div className="empty"><b>No courses yet</b><p className="mut">Create a course first.</p></div>}</div>
      </div>}
      {tab === "bundles" && <Crud title="Bundles" add="Create bundle" empty="Sell several courses together at a special price." items={x.bundles} onChange={(v) => upX({ bundles: v })}
        blank={{ name: "", courses: [], price: "", desc: "" }} fields={[["name", "Bundle name"], ["courses", "Courses in this bundle", "multi", courseOpts], ["price", "Bundle price (₹)", "number"], ["desc", "Description", "textarea"]]}
        card={(b) => { const sum = (b.courses || []).reduce((n, id) => { const c = list.find((y) => y.id === id); return n + (c && c.paid ? +c.price || 0 : 0); }, 0); return <><b>{b.name || "Untitled bundle"}</b><small>{(b.courses || []).length} courses</small><span className="ac-price">{inr(b.price)}{sum > +b.price && +b.price ? <s> ₹{sum.toLocaleString("en-IN")}</s> : null}</span></>; }} />}
      {tab === "events" && <Crud title="Events" add="Schedule event" empty="Live classes, webinars and workshops — online or in person." items={[...x.events].sort((a, b) => String(a.date).localeCompare(String(b.date)))} onChange={(v) => upX({ events: v })}
        blank={{ name: "", date: "", time: "", mins: "60", mode: "Online", link: "", price: "", seats: "" }}
        fields={[["name", "Event name"], ["date", "Date", "date"], ["time", "Start time", "time"], ["mins", "Duration (minutes)", "number"], ["mode", "Where", "select", ["Online", "In person"]], ["link", "Meeting link or venue address"], ["price", "Ticket price (₹, empty = free)", "number"], ["seats", "Seats (empty = unlimited)", "number"]]}
        card={(ev) => <><div className="ac-date"><b>{ev.date ? new Date(ev.date).getDate() : "—"}</b><span>{ev.date ? new Date(ev.date).toLocaleDateString("en-IN", { month: "short" }) : ""}</span></div><b>{ev.name || "Untitled event"}</b><small>{ev.time || "Time TBA"} · {ev.mins || 60} min · {ev.mode}{ev.seats ? " · " + ev.seats + " seats" : ""}</small><span className="ac-price">{inr(ev.price)}</span></>} />}
      {tab === "tiers" && <Crud title="Access Tiers" add="Create tier" empty="Membership plans — e.g. Free, Pro, VIP — each with its own courses." items={x.tiers} onChange={(v) => upX({ tiers: v })}
        blank={{ name: "", price: "", period: "per month", courses: [], perks: "" }}
        fields={[["name", "Tier name"], ["price", "Price (₹, empty = free)", "number"], ["period", "Billing", "select", ["per month", "per year", "one-time"]], ["courses", "Courses included", "multi", courseOpts], ["perks", "Perks (one per line)", "textarea"]]}
        card={(t) => <><b className="ac-tier">{t.name || "Untitled tier"}</b><span className="ac-price">{inr(t.price)}{+t.price ? <small> {t.period}</small> : null}</span><small>{(t.courses || []).length} courses included</small><ul className="ac-perks">{String(t.perks || "").split("\n").filter(Boolean).slice(0, 4).map((p) => <li key={p}>✓ {p}</li>)}</ul></>} />}
      {tab === "board" && <div>
        <div className="ac-sub"><div><h2>Leaderboard</h2><p className="mut">Students earn 10 points per lesson completed and 100 per finished course.</p></div></div>
        <div className="panel"><table className="ac-lb"><thead><tr><th>#</th><th>Student</th><th>Lessons</th><th>Points</th></tr></thead><tbody>
          {(() => { const n = list.reduce((a, c) => a + prog(c), 0), fin = list.filter((c) => lessonsOf(c).length && prog(c) >= lessonsOf(c).length).length; return <tr><td>🥇</td><td><b>{user.name}</b> <span className="mut sm">(you — preview)</span></td><td>{n}</td><td><b>{n * 10 + fin * 100}</b></td></tr>; })()}
        </tbody></table><p className="mut sm">Student accounts arrive with the next Beta update — then every learner appears here automatically.</p></div>
      </div>}
      {tab === "settings" && <div className="panel lms-card">
        <b>Academy settings</b>
        <div className="lms-two">
          <label className="lms-f">Academy name<input value={st.name || ""} onChange={(e) => upX({ settings: { ...st, name: e.target.value } })} placeholder="e.g. Crecapo Academy" /></label>
          <label className="lms-f">Tagline<input value={st.tagline || ""} onChange={(e) => upX({ settings: { ...st, tagline: e.target.value } })} placeholder="Learn skills that pay" /></label>
          <label className="lms-f">Logo image link<input value={st.logo || ""} onChange={(e) => upX({ settings: { ...st, logo: e.target.value } })} placeholder="https://…" /></label>
          <label className="lms-f">Brand colour<input type="color" value={st.color || "#f5b301"} onChange={(e) => upX({ settings: { ...st, color: e.target.value } })} /></label>
          <label className="lms-f">Support email<input value={st.email || ""} onChange={(e) => upX({ settings: { ...st, email: e.target.value } })} placeholder="support@…" /></label>
          <label className="lms-f">Support WhatsApp<input value={st.wa || ""} onChange={(e) => upX({ settings: { ...st, wa: e.target.value } })} placeholder="98765 43210" /></label>
        </div>
      </div>}
      {tab === "preview" && <div className="ac-pv" style={{ "--b": st.color || "#f5b301" }}>
        <div className="ac-pvh">{st.logo ? <img src={st.logo} alt="" /> : <span className="ac-logo">{(st.name || "A")[0]}</span>}<b>{st.name || "Your Academy"}</b><div className="grow" /><span>Courses</span><span>Events</span><span>Store</span><button>Log in</button></div>
        <div className="ac-hero"><h2>{st.tagline || "Learn skills that pay"}</h2><p>{pub.length} courses · {x.events.length} live events · {x.store.length} products</p><button>Browse courses</button></div>
        <h3>Courses</h3><div className="lms-cards">{pub.map((c) => <div key={c.id} className="lms-cc"><div className="lms-cover">{coverOf(c) ? <img src={coverOf(c)} alt="" /> : <span>🎓</span>}</div><div className="lms-cb"><small>{c.category} · {lessonsOf(c).length} lessons</small><b>{c.title}</b><span className="lms-price">{c.paid ? "₹" + (c.price || 0) : "Free"}</span></div></div>)}
          {!pub.length && <p className="mut">Publish a course to show it here.</p>}</div>
        {x.bundles.length > 0 && <><h3>Bundles</h3><div className="ac-cards">{x.bundles.map((b) => <div key={b.id} className="ac-card"><b>{b.name}</b><small>{(b.courses || []).length} courses</small><span className="ac-price">{inr(b.price)}</span></div>)}</div></>}
        {x.events.length > 0 && <><h3>Upcoming events</h3><div className="ac-cards">{x.events.map((ev) => <div key={ev.id} className="ac-card"><b>{ev.name}</b><small>{ev.date} {ev.time} · {ev.mode}</small><span className="ac-price">{inr(ev.price)}</span></div>)}</div></>}
        <p className="mut sm">This is a preview of your academy page. Publishing it as a live site comes with the next Beta update.</p>
      </div>}
    </div>
  );
}
