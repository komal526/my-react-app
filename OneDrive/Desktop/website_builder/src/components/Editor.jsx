import { useState, useRef, useEffect } from "react";
import { BLANK, uid, slug, uniqFile } from "../lib.js";
import { makeZip, PAL, EDITOR_CSS, CONT, WIDTH, cleanNode } from "./tools.js";
import Inspector from "./Inspector.jsx";
import PagesPanel from "./PagesPanel.jsx";

export default function Editor({ page, onSave, onBack, onPublish, onPages, onType }) {
  const [src, setSrc] = useState(page.pages[0].html);
  const [ver, setVer] = useState(0), [mode, setMode] = useState("visual"), [dev, setDev] = useState("desktop"), [tab, setTab] = useState("add");
  const [selEl, setSelEl] = useState(null), [selKey, setSelKey] = useState(0), [tick, setTick] = useState(0), [codeText, setCodeText] = useState("");
  const [box, setBox] = useState({ w: 900, h: 600 });
  const ifr = useRef(), wrap = useRef(), drag = useRef(null), H = useRef({ past: [], future: [], cur: "", t: 0, dirty: false }), A = useRef({}), selRef = useRef(null);
  const D = () => ifr.current && ifr.current.contentDocument;
  const curRef = useRef(page.pages[0].id);

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  /* history */
  const snap = () => { const b = D().body.cloneNode(true); cleanNode(b); return JSON.stringify([b.getAttribute("style") || "", b.innerHTML]); };
  const exportHtml = () => { const c = D().documentElement.cloneNode(true); c.querySelector("#lb-style") && c.querySelector("#lb-style").remove(); cleanNode(c, true); return "<!DOCTYPE html>\n" + c.outerHTML; };
  const flush = () => {
    const h = H.current; clearTimeout(h.t); if (!h.dirty || !D()) return; h.dirty = false;
    const s = snap(); if (s !== h.cur) { h.past = [...h.past.slice(-60), h.cur]; h.cur = s; h.future = []; onSave && onSave(curRef.current, exportHtml()); }
    setTick((x) => x + 1);
  };
  const commit = (now) => { const h = H.current; h.dirty = true; clearTimeout(h.t); now ? flush() : (h.t = setTimeout(flush, 400)); };
  const changed = () => { setTick((x) => x + 1); commit(false); };
  const restore = (s) => { const [st, html] = JSON.parse(s), b = D().body; st ? b.setAttribute("style", st) : b.removeAttribute("style"); b.innerHTML = html; select(null); };
  const undo = () => { flush(); const h = H.current; if (h.past.length) { h.future.unshift(h.cur); h.cur = h.past.pop(); restore(h.cur); setTick((x) => x + 1); } };
  const redo = () => { flush(); const h = H.current; if (h.future.length) { h.past.push(h.cur); h.cur = h.future.shift(); restore(h.cur); setTick((x) => x + 1); } };

  /* selection + actions */
  const select = (el) => {
    const o = selRef.current; if (o) { o.classList.remove("lb-sel"); o.removeAttribute("draggable"); }
    selRef.current = el;
    if (el) { el.classList.add("lb-sel"); if (el.tagName !== "BODY") el.setAttribute("draggable", "true"); setTab("edit"); }
    setSelEl(el); setSelKey((k) => k + 1);
  };
  const del = () => { const e = selRef.current; if (!e || e.tagName === "BODY") return; e.remove(); select(null); commit(true); };
  const move = (d) => { const e = selRef.current; if (!e) return; d < 0 ? e.previousElementSibling && e.previousElementSibling.before(e) : e.nextElementSibling && e.nextElementSibling.after(e); commit(true); };
  const dup = () => { const e = selRef.current; if (!e) return; const c = e.cloneNode(true); cleanNode(c); e.after(c); select(c); commit(true); };
  const parent = () => { const e = selRef.current, p = e && e.parentElement; select(p && p !== D().documentElement ? p : D().body); };
  const outer = (el) => { const c = el.cloneNode(true); cleanNode(c); return c.outerHTML; };
  const applyOuter = (el, v) => { el.outerHTML = v; select(null); commit(true); };
  const upload = (f, cb) => { if (!f) return; const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(f); };
  const mkEl = (html) => { const t = D().createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const addEl = (html) => { const n = mkEl(html), e = selRef.current; e && e.tagName !== "BODY" ? e.after(n) : D().body.appendChild(n); select(n); commit(true); };
  A.current = { changed, upload, move, dup, del, parent, outer, applyOuter };

  /* multi-page actions */
  const switchPage = (id, html) => {
    if (id === curRef.current) return; flush();
    const p = html === undefined ? page.pages.find((x) => x.id === id) : { html }; if (!p) return;
    curRef.current = id; setSrc(p.html); setVer((v) => v + 1); setSelEl(null); selRef.current = null; setMode("visual");
  };
  const pageAct = {
    switch: (id) => switchPage(id), convert: () => onType("website"),
    add: (copy) => { const n = window.prompt("Page name", "New page"); if (!n) return; flush(); const id = uid(), html = copy ? exportHtml() : BLANK; onPages((ps) => [...ps, { id, name: n, file: uniqFile(ps, n), html }]); switchPage(id, html); },
    dup: (id) => { flush(); const html = id === curRef.current ? exportHtml() : page.pages.find((x) => x.id === id).html; onPages((ps) => { const b = ps.find((x) => x.id === id); return [...ps, { id: uid(), name: b.name + " copy", file: uniqFile(ps, b.name + " copy"), html }]; }); },
    rename: (id) => { const b = page.pages.find((x) => x.id === id), n = window.prompt("Page name", b.name); n && onPages((ps) => ps.map((x) => (x.id === id ? { ...x, name: n } : x))); },
    del: (id) => {
      const b = page.pages.find((x) => x.id === id);
      if (b.file === "index.html") return alert("The home page (index.html) can't be deleted.");
      if (!window.confirm(`Delete "${b.name}"?`)) return;
      if (id === curRef.current) switchPage(page.pages.find((x) => x.id !== id).id);
      onPages((ps) => ps.filter((x) => x.id !== id));
    },
  };

  /* drag indicator */
  const ind = () => { const d = D(); let i = d.getElementById("lb-ind"); if (!i) { i = d.createElement("div"); i.id = "lb-ind"; d.body.appendChild(i); } return i; };
  const hideInd = () => { const i = D() && D().getElementById("lb-ind"); if (i) i.style.display = "none"; };
  const showInd = (w) => {
    const i = ind(), r = w.r, s = i.style; i.className = w.mode === "in" ? "in" : ""; s.display = "block";
    if (w.mode === "in") { s.left = r.left + "px"; s.top = r.top + "px"; s.width = r.width + "px"; s.height = r.height + "px"; }
    else if (w.row) { s.left = (w.mode === "before" ? r.left : r.right) - 2 + "px"; s.top = r.top + "px"; s.width = "4px"; s.height = r.height + "px"; }
    else { s.top = (w.mode === "before" ? r.top : r.bottom) - 2 + "px"; s.left = r.left + "px"; s.width = r.width + "px"; s.height = "4px"; }
  };
  const where = (e) => {
    const d = D(), win = d.defaultView, dr = drag.current;
    let t = e.target; if (t.nodeType !== 1) t = t.parentElement;
    if (!t || t.id === "lb-ind" || t === d.documentElement) t = d.body;
    if (dr && dr.el && (dr.el === t || dr.el.contains(t))) return null;
    const r = t.getBoundingClientRect();
    if (t === d.body) return { el: t, mode: "in", r };
    const pc = win.getComputedStyle(t.parentElement), row = /flex/.test(pc.display) && pc.flexDirection.startsWith("row");
    const f = row ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
    if (CONT.has(t.tagName) && f > 0.25 && f < 0.75) return { el: t, mode: "in", r };
    return { el: t, mode: f < 0.5 ? "before" : "after", r, row };
  };

  /* wire up the page iframe */
  const setup = () => {
    const d = D(); if (!d || !d.body) return;
    const st = d.createElement("style"); st.id = "lb-style"; st.textContent = EDITOR_CSS; d.head.appendChild(st);
    selRef.current = null; setSelEl(null);
    H.current = { past: [], future: [], cur: snap(), t: 0, dirty: false };
    
    const on = (ev, fn, cap) => d.addEventListener(ev, fn, cap);
    on("click", (e) => { let t = e.target; if (t.isContentEditable) return; e.preventDefault(); e.stopPropagation(); if (t.nodeType !== 1 || t.id === "lb-ind") return; select(t === d.documentElement ? d.body : t); }, true);
    on("submit", (e) => e.preventDefault(), true);
    on("dblclick", (e) => {
      const t = e.target; if (/^(IMG|IFRAME|INPUT|HR|BODY|HTML)$/.test(t.tagName)) return;
      select(t); t.removeAttribute("draggable"); t.contentEditable = "true"; t.focus();
      const done = () => { t.removeEventListener("blur", done); t.removeAttribute("contenteditable"); t.setAttribute("draggable", "true"); commit(true); };
      t.addEventListener("blur", done);
    });
    on("mouseover", (e) => { d.querySelectorAll(".lb-hover").forEach((x) => x.classList.remove("lb-hover")); const t = e.target; if (t.nodeType === 1 && t !== d.body && t.id !== "lb-ind") t.classList.add("lb-hover"); });
    on("dragstart", (e) => { const t = e.target; if (t === selRef.current && t.tagName !== "BODY") { drag.current = { el: t }; e.dataTransfer.setData("text/plain", "m"); e.dataTransfer.effectAllowed = "move"; } else e.preventDefault(); });
    on("dragover", (e) => { if (!drag.current) return; e.preventDefault(); const w = where(e); w ? showInd(w) : hideInd(); });
    on("drop", (e) => {
      const dr = drag.current; if (!dr) return; e.preventDefault(); const w = where(e); hideInd(); drag.current = null; if (!w) return;
      const n = dr.el || mkEl(dr.html);
      w.mode === "in" ? w.el.appendChild(n) : w.mode === "before" ? w.el.before(n) : w.el.after(n);
      select(n); commit(true);
    });
    on("dragend", () => { hideInd(); drag.current = null; });
    on("keydown", onKey);
  };
  const onKey = (e) => { if (e.key === "Delete" && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && !e.target.isContentEditable && selRef.current) del(); };
  useEffect(() => { window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); });

  /* top-bar actions */
  const loadSrc = (text) => { setSrc(text); onSave && onSave(curRef.current, text); setVer((v) => v + 1); setSelEl(null); selRef.current = null; setMode("visual"); };
  const uploadHtml = async (f) => { if (f && window.confirm("Replace the current page with this HTML file?")) loadSrc(await f.text()); };
  const exportFile = () => {
    flush(); const html = exportHtml(), a = document.createElement("a");
    if (page.type === "website" && page.pages.length > 1) { a.href = URL.createObjectURL(makeZip(page.pages.map((p) => ({ name: p.file, data: p.id === curRef.current ? html : p.html })))); a.download = slug(page.name) + ".zip"; }
    else { a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = "index.html"; }
    a.click();
  };
  const preview = () => window.open(URL.createObjectURL(new Blob([exportHtml()], { type: "text/html" })), "_blank");
  const toCode = () => { flush(); const h = exportHtml(); setSrc(h); setCodeText(h); setMode("code"); };

  const isM = dev === "mobile", W = WIDTH[dev], OW = isM ? 418 : W, stageH = Math.max(300, box.h - 24);
  const sc = isM ? Math.min(1, (box.w - 24) / 418, (box.h - 24) / 808) : Math.min(1, (box.w - 24) / W), OH = isM ? 808 : stageH / sc;
  const h = H.current, inDoc = selEl && D() && D().body.contains(selEl), curPage = page.pages.find((p) => p.id === curRef.current) || page.pages[0];

  return (
    <div className="app">
      <header>
        <button onClick={() => { flush(); onBack(); }}>← Dashboard</button><b className="logo">{page.name}{page.type === "website" && <small className="file"> / {curPage.file}</small>}</b>
        <div className="seg"><button className={mode === "visual" ? "on" : ""} onClick={() => mode !== "visual" && loadSrc(src)}>Visual</button><button className={mode === "code" ? "on" : ""} onClick={() => mode === "visual" && toCode()}>Code</button></div>
        <div className="seg">{Object.keys(WIDTH).map((k) => <button key={k} className={dev === k ? "on" : ""} onClick={() => setDev(k)}>{k} <i>{WIDTH[k]}</i></button>)}</div>
        <div className="grow" />
        <button onClick={undo} disabled={!h.past.length}>↶ Undo</button>
        <button onClick={redo} disabled={!h.future.length}>↷ Redo</button>
        <label className="btn">Upload HTML<input hidden type="file" accept=".html,.htm" onChange={(e) => { uploadHtml(e.target.files[0]); e.target.value = ""; }} /></label>
        <button onClick={exportFile} disabled={mode !== "visual"}>{page.type === "website" && page.pages.length > 1 ? "Export site (.zip)" : "Export"}</button>
        <button className="pub" onClick={preview} disabled={mode !== "visual"}>Preview ↗</button>
        <button className="go" onClick={() => { flush(); onPublish(exportHtml()); }} disabled={mode !== "visual"}>Publish</button>
      </header>

      <aside>
        <div className="tabs"><button className={tab === "add" ? "on" : ""} onClick={() => setTab("add")}>＋ Elements</button><button className={tab === "pages" ? "on" : ""} onClick={() => setTab("pages")}>▤ Pages</button><button className={tab === "edit" ? "on" : ""} onClick={() => setTab("edit")}>✎ Customize</button></div>
        <div className="aside-body">
          {tab === "add" && <>
            <p className="mut">Drag onto the page — a blue line shows where it lands. Or click to add below the selected element.</p>
            {PAL.map(([g, items]) => (
              <div key={g}><div className="grp">{g}</div>
                <div className="pal">{items.map(([ic, nm, html]) => (
                  <div key={nm} className="pi" draggable onClick={() => mode === "visual" && addEl(html)}
                    onDragStart={(e) => { drag.current = { html }; e.dataTransfer.setData("text/plain", "n"); }} onDragEnd={() => { drag.current = null; hideInd(); }}><b>{ic}</b>{nm}</div>))}</div></div>
            ))}
          </>}
          {tab === "pages" && <PagesPanel project={page} curId={curRef.current} act={pageAct} />}
          {tab === "edit" && (inDoc ? <Inspector key={selKey} el={selEl} A={A} pages={page.pages} /> : (
            <><p className="mut">Click any element on the page to customize it. Click an empty area to select the whole page.</p><button className="sm" onClick={() => D() && select(D().body)}>Select whole page</button></>))}
        </div>
      </aside>

      <main ref={wrap}>
        {mode === "code" ? (
          <div className="codeview">
            <div className="row"><b>Full page HTML</b><span className="mut">Edit anything, then apply.</span><div className="grow" /><button className="pub" onClick={() => loadSrc(codeText)}>Apply &amp; go to visual</button></div>
            <textarea className="code" value={codeText} onChange={(e) => setCodeText(e.target.value)} spellCheck={false} />
          </div>
        ) : (
          <div className={"dev " + dev} style={{ width: OW * sc, height: OH * sc }}>
            <div className="devin" style={{ width: OW, height: OH, transform: `scale(${sc})` }}>
              {isM && <div className="notch" />}
              {isM && <div className="pbar"><div className="st"><span>9:41</span><span>▂▄▆ ▮</span></div><div className="url">🔒 {page.slug || "yourpage"}.launchbuilder.com</div></div>}
              <iframe key={ver} ref={ifr} srcDoc={src} onLoad={setup} title="page" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                style={{ width: W, height: isM ? 658 : OH, border: 0, background: "#fff", display: "block" }} />
              {isM && <div className="pfoot"><span>‹</span><span>›</span><span>⇪</span><span>▯</span><span>⧉</span></div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
