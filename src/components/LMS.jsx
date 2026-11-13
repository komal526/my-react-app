// LaunchBuilder v41 — LMS.jsx (Beta) · courses built from YouTube videos & playlists
import { useEffect, useMemo, useState } from "react";
import { Icon } from "./Inspector.jsx";
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
export default function LMS({ user }) {
  const E = user.email;
  const [list, setList] = useState(() => loadCourses(E)), [edit, setEdit] = useState(null), [play, setPlay] = useState(null), [q, setQ] = useState(""), [f, setF] = useState("all");
  useEffect(() => { const h = (e) => { const k = e.detail || []; if (!edit && (k.includes("all") || k.includes("lb_lms_"))) setList(loadCourses(E)); }; window.addEventListener("lb-cloud-pull", h); return () => window.removeEventListener("lb-cloud-pull", h); }, [E, edit]);
  const put = (l) => { setList(l); saveCourses(E, l); };
  const save = (c) => put(list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [c, ...list]);
  const shown = useMemo(() => list.filter((c) => (f === "all" || c.status === f) && (!q || (c.title + c.category).toLowerCase().includes(q.toLowerCase()))), [list, q, f]);
  if (play) return <Player c={play} email={E} onClose={() => setPlay(null)} />;
  if (edit) return <Editor course={edit} onSave={(c) => { save(c); }} onClose={() => setEdit(null)} onPreview={(c) => { save(c); setPlay(c); }} />;
  const lessons = list.reduce((n, c) => n + lessonsOf(c).length, 0), mins = list.reduce((n, c) => n + minsOf(c), 0);
  return (
    <div className="lms">
      <div className="top"><div><h1>Courses <span className="beta">Beta</span></h1><p className="mut">Build online courses from your YouTube videos and playlists.</p></div>
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
      <p className="mut sm lms-foot">LMS is in <b>Beta</b> — selling courses and student logins on your published site are coming next.</p>
    </div>
  );
}
