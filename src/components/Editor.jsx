// LaunchBuilder v15 — Editor.jsx
// The builder: canvas, top bar, left panel (Add / Layers / Pages / Site / Edit)
import { useState, useRef, useEffect } from "react";
import { uid, slug, uniqFile, addr, previewToken, previewUrl, aiSection, AI_PROVIDERS } from "../lib.js";
import { makeZip, EDITOR_CSS, CONT, WIDTH, cleanNode, nameOf, WIDGET_CSS, finalize, readCfg, LIB, PAGE_TPLS, hydrate, STRUCTURES, structureHtml, formHtml, bookingWidget } from "./tools.js";
import Inspector, { Icon, QuickBar } from "./Inspector.jsx";
import PagesPanel, { Layers, SiteSettings, writeCfg } from "./PagesPanel.jsx";

const MQ = { tablet: "(max-width:1024px)", mobile: "(max-width:767px)" };
const kebab = (k) => k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const serialize = (d) => "<!DOCTYPE html>\n" + d.documentElement.outerHTML;
const parse = (h) => new DOMParser().parseFromString(h, "text/html");
/* which filter pill an element belongs to */
const pillOf = (g, nm) => g === "Layout" ? "layout" : g === "Media" ? "media" : g === "Interactive" || g === "Forms & calendars" ? "apps"
  : g === "Basic" ? (/Button|Hyperlink/.test(nm) ? "cta" : nm === "Icon" ? "media" : "text") : /Call to action|Banner|Payment button/.test(nm) ? "cta" : "prebuilt";
const TABS = [["add", "plus", "Add"], ["layers", "layers", "Layers"], ["pages", "pages", "Pages"], ["site", "globe", "Site"], ["edit", "pen", "Edit"]];

export default function Editor({ page, user, forms = [], events = [], integ, onSave, onBack, onPublish, onPages, onType }) {
  const [src, setSrc] = useState(page.pages[0].html);
  const [ver, setVer] = useState(0), [mode, setMode] = useState("visual"), [dev, setDev] = useState(() => (window.innerWidth < 600 ? "mobile" : window.innerWidth <= 1024 ? "tablet" : "desktop")), [tab, setTab] = useState("add"), [itab, setItab] = useState("content");
  const [selEl, setSelEl] = useState(null), [selKey, setSelKey] = useState(0), [, setTick] = useState(0), [codeText, setCodeText] = useState("");
  const [box, setBox] = useState({ w: 900, h: 600 }), [q, setQ] = useState(""), [shut, setShut] = useState(() => new Set()), [panel, setPanel] = useState(() => window.innerWidth > 900), [navFloat, setNavFloat] = useState(false);
  const [aiQ, setAiQ] = useState(""), [aiBusy, setAiBusy] = useState(false), [pill, setPill] = useState("all");
  const [theme, setTheme] = useState(() => { const t = localStorage.getItem("lb_theme"); return t === "aurora" ? "aurora" : "clean"; });
  const flipTheme = () => { const t = theme === "aurora" ? "clean" : "aurora"; setTheme(t); localStorage.setItem("lb_theme", t); };
  const [toast, setToast] = useState(""), [busy, setBusy] = useState(""), [editing, setEditing] = useState(false), [openLink, setOpenLink] = useState(false);
  const qbPos = useRef(null), devRef = useRef(dev); devRef.current = dev;
  const ifr = useRef(), wrap = useRef(), drag = useRef(null), H = useRef({ past: [], future: [], cur: "", t: 0, dirty: false }), A = useRef({}), selRef = useRef(null), clip = useRef(null), keyRef = useRef(() => {});
  const curRef = useRef(page.pages[0].id), pagesRef = useRef(page.pages), tabRef = useRef(tab);
  pagesRef.current = page.pages; tabRef.current = tab;
  const D = () => ifr.current && ifr.current.contentDocument;
  const say = (t) => { setToast(t); clearTimeout(say.t); say.t = setTimeout(() => setToast(""), 2600); };

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  /* ---------------- history (body + head, so SEO / CSS changes are undoable and saved) ---------------- */
  const headSnap = () => { const h = D().head.cloneNode(true); h.querySelectorAll("#lb-style").forEach((n) => n.remove()); return h.innerHTML; };
  const snap = () => { const d = D(), b = d.body.cloneNode(true); cleanNode(b); return JSON.stringify([b.getAttribute("style") || "", b.innerHTML, headSnap(), d.documentElement.getAttribute("lang") || ""]); };
  const exportHtml = () => { const c = D().documentElement.cloneNode(true); c.querySelectorAll("#lb-style").forEach((n) => n.remove()); cleanNode(c, true); return "<!DOCTYPE html>\n" + c.outerHTML; };
  const flush = () => {
    const h = H.current; clearTimeout(h.t); if (!h.dirty || !D()) return; h.dirty = false;
    const s = snap(); if (s !== h.cur) { h.past = [...h.past.slice(-80), h.cur]; h.cur = s; h.future = []; onSave && onSave(curRef.current, exportHtml()); }
    setTick((x) => x + 1);
  };
  const commit = (now) => { const h = H.current; h.dirty = true; clearTimeout(h.t); now ? flush() : (h.t = setTimeout(flush, 400)); };
  const changed = () => { setTick((x) => x + 1); commit(false); };
  const restore = (s) => {
    const [st, html, head, lang] = JSON.parse(s), d = D(), b = d.body;
    st ? b.setAttribute("style", st) : b.removeAttribute("style"); b.innerHTML = html;
    if (head !== undefined) { const keep = d.getElementById("lb-style"); d.head.innerHTML = head; keep && d.head.appendChild(keep); }
    lang ? d.documentElement.setAttribute("lang", lang) : d.documentElement.removeAttribute("lang");
    hydrate(d); select(null); onSave && onSave(curRef.current, exportHtml());
  };
  const undo = () => { flush(); const h = H.current; if (h.past.length) { h.future.unshift(h.cur); h.cur = h.past.pop(); restore(h.cur); setTick((x) => x + 1); } };
  const redo = () => { flush(); const h = H.current; if (h.future.length) { h.past.push(h.cur); h.cur = h.future.shift(); restore(h.cur); setTick((x) => x + 1); } };

  /* ---------------- floating toolbar on the canvas ---------------- */
  /* the Canva-style bar lives outside the iframe; keep it glued to the element */
  const placeTools = () => { qbPos.current && qbPos.current(); };

  /* ---------------- selection + element actions ---------------- */
  const select = (el) => {
    const o = selRef.current; if (o) { o.classList.remove("lb-sel"); o.removeAttribute("draggable"); }
    selRef.current = el;
    if (el) { el.classList.add("lb-sel"); if (el.tagName !== "BODY" && !el.hasAttribute("data-lb-lock")) el.setAttribute("draggable", "true"); if (!/^(layers|pages|site)$/.test(tabRef.current)) setTab("edit"); }
    setSelEl(el); setSelKey((k) => k + 1); setOpenLink(false); requestAnimationFrame(placeTools);
  };
  const ensureId = (el) => { let id = el.getAttribute("data-lb-id"); if (!id) { id = "e" + uid(); el.setAttribute("data-lb-id", id); } return id; };
  const uniqIds = (root) => [root, ...root.querySelectorAll("[id]")].forEach((n) => {
    if (!n.id) return; const d = D(), base = n.id.replace(/-\d+$/, ""); let id = n.id, i = 2;
    while ([...d.querySelectorAll(`[id="${CSS.escape(id)}"]`)].some((x) => x !== n)) id = base + "-" + i++;
    if (id !== n.id) n.id = id;
  });
  /* responsive styles (tablet / mobile) live in <style id="lb-resp"> as media queries */
  const resp = {
    node: () => { const d = D(); let s = d.getElementById("lb-resp"); if (!s) { s = d.createElement("style"); s.id = "lb-resp"; s.setAttribute("data-lb-json", "{}"); d.head.appendChild(s); } return s; },
    data: () => { const s = D().getElementById("lb-resp"); try { return JSON.parse((s && s.getAttribute("data-lb-json")) || "{}"); } catch { return {}; } },
    get: (el, dv, k) => { const id = el.getAttribute("data-lb-id"); return id ? ((resp.data()[dv] || {})[id] || {})[k] || "" : ""; },
    set: (el, dv, o) => { const id = ensureId(el), j = resp.data(); j[dv] = j[dv] || {}; j[dv][id] = { ...(j[dv][id] || {}), ...o }; Object.keys(j[dv][id]).forEach((k) => j[dv][id][k] === "" && delete j[dv][id][k]); resp.write(j); },
    write: (j) => {
      const s = resp.node(); s.setAttribute("data-lb-json", JSON.stringify(j));
      s.textContent = ["tablet", "mobile"].map((dv) => { const r = Object.entries(j[dv] || {}).map(([id, p]) => { const b = Object.entries(p).map(([k, v]) => `${kebab(k)}:${v} !important`).join(";"); return b ? `[data-lb-id="${id}"]{${b}}` : ""; }).join(""); return r ? `@media ${MQ[dv]}{${r}}` : ""; }).join("\n");
    },
  };
  /* per-element custom CSS lives in <style data-lb-css="id"> ("selector" = this element) */
  const css = {
    node: (el) => { const id = el.getAttribute("data-lb-id"); return id ? D().head.querySelector(`style[data-lb-css="${id}"]`) : null; },
    get: (el) => { const n = css.node(el); return n ? n.textContent.split(`[data-lb-id="${el.getAttribute("data-lb-id")}"]`).join("selector") : ""; },
    set: (el, v) => { let n = css.node(el); if (!v.trim()) { n && n.remove(); return; } const id = ensureId(el); if (!n) { n = D().createElement("style"); n.setAttribute("data-lb-css", id); D().head.appendChild(n); } n.textContent = v.split("selector").join(`[data-lb-id="${id}"]`); },
  };
  const reId = (root) => {
    const d = D(), j = resp.data(); let touched = false;
    [root, ...root.querySelectorAll("[data-lb-id]")].forEach((n) => {
      const old = n.getAttribute("data-lb-id"); if (!old) return; const nw = "e" + uid(); n.setAttribute("data-lb-id", nw);
      ["tablet", "mobile"].forEach((dv) => { if (j[dv] && j[dv][old]) { j[dv][nw] = { ...j[dv][old] }; touched = true; } });
      const c0 = d.head.querySelector(`style[data-lb-css="${old}"]`);
      if (c0) { const c = d.createElement("style"); c.setAttribute("data-lb-css", nw); c.textContent = c0.textContent.split(`[data-lb-id="${old}"]`).join(`[data-lb-id="${nw}"]`); d.head.appendChild(c); }
    });
    if (touched) resp.write(j);
  };
  const del = () => { const e = selRef.current; if (!e || e.tagName === "BODY") return; if (e.closest("[data-lb-lock]")) return say("This element is locked — unlock it first"); const p = e.parentElement; e.remove(); select(p && p !== D().documentElement && p !== D().body ? p : null); commit(true); };
  const move = (dir) => { const e = selRef.current; if (!e || e.tagName === "BODY") return; dir < 0 ? e.previousElementSibling && e.previousElementSibling.before(e) : e.nextElementSibling && e.nextElementSibling.after(e); commit(true); requestAnimationFrame(placeTools); };
  const dup = () => { const e = selRef.current; if (!e || e.tagName === "BODY") return; const c = e.cloneNode(true); cleanNode(c); e.after(c); uniqIds(c); reId(c); hydrate(D()); select(c); commit(true); };
  const parent = () => { const e = selRef.current, p = e && e.parentElement; if (!e) return; select(p && p !== D().documentElement ? p : D().body); };
  const outer = (el) => { const c = el.cloneNode(true); cleanNode(c); return c.outerHTML; };
  /* swap an element for new HTML (used by AI edit) and keep it selected */
  const replaceEl = (el, html) => {
    const t = D().createElement("template"); t.innerHTML = html.trim(); const n = t.content.firstElementChild;
    if (!n) throw new Error("The AI didn't return valid HTML. Try again.");
    el.replaceWith(n); uniqIds(n); hydrate(D()); select(n); commit(true); say("✨ Updated with AI — press Ctrl+Z to undo");
  };
  const applyOuter = (el, v) => { el.outerHTML = v; hydrate(D()); select(null); commit(true); };
  const mkEl = (html) => { const t = D().createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const place = (n) => {
    const e = selRef.current;
    if (e && e !== D().body && e.hasAttribute("data-lb-ph") && !e.children.length) e.appendChild(n);
    else if (e && e.tagName !== "BODY") e.after(n);
    else { const f = [...D().body.children].reverse().find((x) => x.tagName === "FOOTER"); f && !/fixed/.test(n.getAttribute("style") || "") ? f.before(n) : D().body.appendChild(n); }
  };
  /* loose elements dropped straight onto the page get a padded section around them (like Elementor) */
  const NOWRAP = /^(SECTION|HEADER|FOOTER|MAIN|ARTICLE|ASIDE|NAV|SCRIPT|STYLE)$/;
  const autoWrap = (n) => {
    if (n.parentElement !== D().body || NOWRAP.test(n.tagName) || /position:\s*fixed|max-width:\s*1140px/.test(n.getAttribute("style") || "") || n.matches("[data-lb-popup],[data-lb-preloader],[data-lb-cookie],[data-lb-name='Announcement bar'],[data-lb-name='Secondary menu'],[data-lb-name='Spacer']")) return n;
    const s = mkEl('<section data-lb-name="Section" style="padding:56px 24px"><div style="max-width:1140px;margin:0 auto"></div></section>');
    n.before(s); s.firstElementChild.appendChild(n); return n;
  };
  const afterInsert = (n) => { autoWrap(n); uniqIds(n); setItab("content"); if (page.type === "website") fillNav(n, links(pagesRef.current)); hydrate(D()); select(n); commit(true); n.scrollIntoView && n.scrollIntoView({ block: "nearest", behavior: "smooth" }); };
  const addSection = (cols) => {
    if (mode !== "visual" || !D()) return;
    const d = D(), n = mkEl(structureHtml(cols)); let top = selRef.current;
    while (top && top.parentElement && top.parentElement !== d.body) top = top.parentElement;
    if (top && top !== d.body && top.parentElement === d.body && top.tagName !== "FOOTER") top.after(n);
    else { const f = [...d.body.children].reverse().find((x) => x.tagName === "FOOTER"); f ? f.before(n) : d.body.appendChild(n); }
    uniqIds(n); hydrate(d); select(n.querySelector("[data-lb-ph]") || n); setTab("add"); commit(true); n.scrollIntoView({ block: "center", behavior: "smooth" });
    say("Section added — now drag or click elements into its columns");
  };
  const addEl = (html) => { if (mode !== "visual" || !D()) return; const n = mkEl(html); place(n); afterInsert(n); };

  /* links helpers for the Link panel */
  const sections = () => {
    const d = D(); if (!d) return [];
    return [...d.body.querySelectorAll("section,header,footer,main,article,[id],[data-lb-name]")].filter((el) => !(el.id || "").startsWith("lb-") && !el.closest("#lb-tools") && !/^(SCRIPT|STYLE|INPUT|OPTION|LABEL|A|BUTTON|SPAN)$/.test(el.tagName) && (el.id || /^(SECTION|HEADER|FOOTER|MAIN|ARTICLE)$/.test(el.tagName) || el.hasAttribute("data-lb-name")))
      .slice(0, 100).map((el) => { const h = el.querySelector("h1,h2,h3"), t = h ? h.textContent.trim().slice(0, 34) : ""; return { el, label: (el.getAttribute("data-lb-name") || nameOf(el)) + (t ? " — " + t : "") }; });
  };
  const ensureAnchor = (el) => {
    if (el.id) return el.id; const h = el.querySelector("h1,h2,h3"), base = slug((h && h.textContent) || el.getAttribute("data-lb-name") || nameOf(el)).slice(0, 30) || "section";
    let id = base, i = 2; while (D().getElementById(id)) id = base + "-" + i++; el.id = id; commit(true); return id;
  };
  const idsOf = (file) => {
    const p = pagesRef.current.find((x) => x.file === file); if (!p) return [];
    const d = p.id === curRef.current ? D() : parse(p.html);
    return [...d.body.querySelectorAll("[id]")].filter((n) => !n.id.startsWith("lb-")).map((n) => ({ id: n.id, label: n.getAttribute("data-lb-name") || ((n.querySelector("h1,h2,h3") || {}).textContent || nameOf(n)).trim().slice(0, 34) }));
  };
  /* style writes from the quick bar follow the device you're editing (desktop = inline, tablet/mobile = responsive rule) */
  const setStyle = (el, o) => { if (devRef.current === "desktop") Object.entries(o).forEach(([k, v]) => { el.style[k] = v; }); else resp.set(el, devRef.current, o); changed(); };
  const getStyle = (el, k) => (devRef.current === "desktop" ? el.style[k] : resp.get(el, devRef.current, k));
  const toggleLock = (el) => { if (el.hasAttribute("data-lb-lock")) { el.removeAttribute("data-lb-lock"); el.setAttribute("draggable", "true"); } else { el.setAttribute("data-lb-lock", ""); el.removeAttribute("draggable"); } commit(true); say(el.hasAttribute("data-lb-lock") ? "Locked" : "Unlocked"); };
  const editText = (t) => {
    if (!t || t.closest("[data-lb-lock]")) return;
    select(t); t.removeAttribute("draggable"); t.contentEditable = "true"; t.focus(); setEditing(true);
    try { const r = t.ownerDocument.createRange(); r.selectNodeContents(t); r.collapse(false); const sel = t.ownerDocument.getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch { /* ignore */ }
    const done = () => { t.removeEventListener("blur", done); try { t.ownerDocument.getSelection().removeAllRanges(); } catch { /* ignore */ } t.removeAttribute("contenteditable"); !t.hasAttribute("data-lb-lock") && t.setAttribute("draggable", "true"); setEditing(false); commit(true); };
    t.addEventListener("blur", done);
  };
  const copyStyle = (el) => { clip.current = el.getAttribute("style") || ""; say("Style copied"); setTick((x) => x + 1); };
  const pasteStyle = (el) => { if (clip.current === null) return; el.setAttribute("style", clip.current); commit(true); say("Style pasted"); };
  A.current = { changed, commit: () => commit(true), move, dup, del, parent, outer, applyOuter, select, resp, css, sections, ensureAnchor, idsOf, copyStyle, pasteStyle, hasStyle: () => clip.current !== null, clean: cleanNode, setStyle, getStyle, toggleLock, editText, replaceEl, integ, forms, events, bookingWidget, formHtml };

  /* ---------------- auto menus: [data-lb-autonav] always lists every page ---------------- */
  const links = (list) => list.map((p) => ({ name: p.name, file: p.file }));
  const fillNav = (root, ls) => {
    const navs = [...(root.matches && root.matches("[data-lb-autonav]") ? [root] : []), ...root.querySelectorAll("[data-lb-autonav]")];
    navs.forEach((nav) => {
      const doc = nav.ownerDocument, tpl = nav.querySelector(":scope > a"), base = tpl ? tpl.cloneNode(false) : doc.createElement("a");
      base.classList.remove("lb-sel", "lb-hover", "lb-current"); base.removeAttribute("draggable");
      nav.querySelectorAll(":scope > a").forEach((x) => x.remove());
      const first = nav.firstChild;
      ls.forEach((l) => { const a = base.cloneNode(false); a.setAttribute("href", l.file); a.textContent = l.name; nav.insertBefore(a, first); });
    });
    return navs.length;
  };
  const syncHtml = (html, ls) => { if (!/data-lb-autonav/.test(html)) return html; const d = parse(html); fillNav(d, ls); return serialize(d); };
  const syncAll = (ls) => { if (D() && fillNav(D(), ls)) commit(true); onPages((ps) => ps.map((p) => (p.id === curRef.current ? p : { ...p, html: syncHtml(p.html, ls) }))); };
  /* new pages inherit the header, footer, fonts and colors of the page you're on */
  const inherit = (html) => {
    const cur = D(); if (!cur) return html; const d = parse(html);
    ["lb-global", "lb-page-css", "lb-settings", "lb-resp"].forEach((id) => { const n = cur.getElementById(id); if (n && !d.getElementById(id)) d.head.appendChild(d.importNode(n, true)); });
    cur.head.querySelectorAll("link[data-lb-font],style[data-lb-css]").forEach((l) => d.head.appendChild(d.importNode(l, true)));
    const kids = [...cur.body.children], hdr = kids.find((x) => x.tagName === "HEADER" || x.classList.contains("lbw-header")), ftr = [...kids].reverse().find((x) => x.tagName === "FOOTER");
    if (hdr) { const c = hdr.cloneNode(true); cleanNode(c, true); d.body.insertBefore(d.importNode(c, true), d.body.firstChild); }
    if (ftr) { const c = ftr.cloneNode(true); cleanNode(c, true); d.body.appendChild(d.importNode(c, true)); }
    return serialize(d);
  };

  /* ---------------- multi-page actions ---------------- */
  const switchPage = (id, html) => {
    if (id === curRef.current) return; flush();
    const p = html === undefined ? pagesRef.current.find((x) => x.id === id) : { html }; if (!p) return;
    curRef.current = id; setSrc(p.html); setVer((v) => v + 1); setSelEl(null); selRef.current = null; setMode("visual");
  };
  const pageAct = {
    switch: (id) => switchPage(id), convert: () => onType("website"),
    add: (k, label) => {
      const n = window.prompt("Page name", k === "copy" || k === "blank" ? "New page" : label); if (!n) return; flush();
      const id = uid(), file = uniqFile(pagesRef.current, n), ls = links([...pagesRef.current, { name: n, file }]);
      let html = k === "copy" ? exportHtml() : inherit(PAGE_TPLS.find((t) => t[0] === k)[2](n));
      html = syncHtml(html, ls);
      onPages((ps) => [...ps.map((p) => (p.id === curRef.current ? p : { ...p, html: syncHtml(p.html, ls) })), { id, name: n, file, html }]);
      if (D() && fillNav(D(), ls)) commit(false);
      switchPage(id, html); say(`Page "${n}" added and linked in your menus`);
    },
    dup: (id) => {
      flush(); const b = pagesRef.current.find((x) => x.id === id), html = id === curRef.current ? exportHtml() : b.html, n = b.name + " copy", file = uniqFile(pagesRef.current, n);
      const ls = links([...pagesRef.current, { name: n, file }]);
      onPages((ps) => [...ps.map((p) => (p.id === curRef.current ? p : { ...p, html: syncHtml(p.html, ls) })), { id: uid(), name: n, file, html: syncHtml(html, ls) }]);
      if (D() && fillNav(D(), ls)) commit(true);
    },
    rename: (id) => {
      const b = pagesRef.current.find((x) => x.id === id), n = window.prompt("Page name (menu label)", b.name); if (!n || n === b.name) return;
      const ls = links(pagesRef.current.map((p) => (p.id === id ? { ...p, name: n } : p)));
      onPages((ps) => ps.map((p) => (p.id === id ? { ...p, name: n } : p))); syncAll(ls);
    },
    refile: (id) => {
      const b = pagesRef.current.find((x) => x.id === id), v = window.prompt("File name (letters, numbers, dashes)", b.file.replace(/\.html$/, "")); if (!v) return;
      const nf = slug(v) + ".html"; if (nf === b.file) return; if (pagesRef.current.some((p) => p.file === nf)) return alert("Another page already uses " + nf);
      flush();
      const re = new RegExp(`(["'])${b.file.replace(/[.]/g, "\\.")}(#[^"']*)?\\1`, "g"), fix = (h) => h.replace(re, (m, qt, hs) => qt + nf + (hs || "") + qt);
      D().querySelectorAll("[href],[data-href],[data-lb-redirect]").forEach((n) => ["href", "data-href", "data-lb-redirect"].forEach((at) => { const x = n.getAttribute(at); if (x && x.split("#")[0] === b.file) n.setAttribute(at, nf + (x.includes("#") ? "#" + x.split("#")[1] : "")); }));
      commit(true);
      onPages((ps) => ps.map((p) => ({ ...(p.id === curRef.current ? p : { ...p, html: fix(p.html) }), file: p.id === id ? nf : p.file })));
      say(`Renamed to ${nf} — links on every page were updated`);
    },
    del: (id) => {
      const b = pagesRef.current.find((x) => x.id === id);
      if (b.file === "index.html") return alert("The home page (index.html) can't be deleted.");
      if (!window.confirm(`Delete "${b.name}"? Links pointing to it will stop working.`)) return;
      if (id === curRef.current) switchPage(pagesRef.current.find((x) => x.id !== id).id);
      const ls = links(pagesRef.current.filter((x) => x.id !== id));
      onPages((ps) => ps.filter((x) => x.id !== id).map((p) => (p.id === curRef.current ? p : { ...p, html: syncHtml(p.html, ls) })));
      if (D() && fillNav(D(), ls)) commit(true);
    },
    insertNav: () => { if (D().querySelector(".lbw-header")) return say("This page already has a header menu"); const h = LIB.find((g) => g[0] === "Header & menus")[1][0][2]; const n = mkEl(h); D().body.insertBefore(n, D().body.firstChild); afterInsert(n); say("Header menu added — it lists all your pages"); },
    syncNav: () => { syncAll(links(pagesRef.current)); say("Menus refreshed on all pages"); },
  };
  const applyAll = () => {
    if (!window.confirm("Copy global fonts & colors, custom CSS, JavaScript and tracking codes from this page to all other pages?")) return;
    flush(); const cur = D(), sc = readCfg(cur);
    onPages((ps) => ps.map((p) => {
      if (p.id === curRef.current) return p; const d = parse(p.html);
      ["lb-global", "lb-page-css"].forEach((id) => { const s = cur.getElementById(id), o = d.getElementById(id); o && o.remove(); s && d.head.appendChild(d.importNode(s, true)); });
      d.head.querySelectorAll("link[data-lb-font]").forEach((l) => l.remove()); cur.head.querySelectorAll("link[data-lb-font]").forEach((l) => d.head.appendChild(d.importNode(l, true)));
      writeCfg(d, { ...readCfg(d), js: sc.js, ga: sc.ga, gtm: sc.gtm, pixel: sc.pixel, head: sc.head });
      return { ...p, html: serialize(d) };
    }));
    say("Applied to all pages");
  };

  /* ---------------- drag & drop on the canvas ---------------- */
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
    if (t && t.closest && t.closest("svg")) t = t.closest("svg");
    if (!t || t.id === "lb-ind" || (t.closest && t.closest("#lb-tools")) || t === d.documentElement) t = d.body;
    if (dr && dr.el && (dr.el === t || dr.el.contains(t))) return null;
    const r = t.getBoundingClientRect();
    if (t === d.body) return { el: t, mode: "in", r };
    const pc = win.getComputedStyle(t.parentElement), row = /flex/.test(pc.display) && pc.flexDirection.startsWith("row");
    const f = row ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
    if (CONT.has(t.tagName) && f > 0.25 && f < 0.75) return { el: t, mode: "in", r };
    return { el: t, mode: f < 0.5 ? "before" : "after", r, row };
  };

  /* ---------------- wire up the page iframe ---------------- */
  const setup = () => {
    const d = D(); if (!d || !d.body) return;
    const st = d.createElement("style"); st.id = "lb-style"; st.textContent = WIDGET_CSS + "\n" + EDITOR_CSS; d.head.appendChild(st);
    selRef.current = null; setSelEl(null); hydrate(d);
    H.current = { past: [], future: [], cur: snap(), t: 0, dirty: false };
    const on = (ev, fn, cap) => d.addEventListener(ev, fn, cap);
    on("click", (e) => {
      let t = e.target; const tb = t.closest && t.closest("#lb-tools [data-a]");
      if (tb) { e.preventDefault(); e.stopPropagation(); const k = tb.getAttribute("data-a"); A.current[k === "up" ? "move" : k === "down" ? "move" : k](k === "up" ? -1 : 1); return; }
      if (t.closest && t.closest("#lb-tools")) return e.preventDefault();
      if (t.isContentEditable) return; e.preventDefault(); e.stopPropagation();
      if (t.nodeType !== 1 || t.id === "lb-ind") return;
      if (t.closest && t.closest("svg")) t = t.closest("svg");
      select(t === d.documentElement ? d.body : t);
    }, true);
    on("submit", (e) => e.preventDefault(), true);
    on("dblclick", (e) => {
      const t = e.target; if (/^(IMG|IFRAME|INPUT|HR|BODY|HTML|VIDEO|SELECT|TEXTAREA)$/.test(t.tagName) || (t.closest && (t.closest("svg") || t.closest("#lb-tools")))) return;
      A.current.editText(t);
    });
    on("mouseover", (e) => { d.querySelectorAll(".lb-hover").forEach((x) => x.classList.remove("lb-hover")); const t = e.target; if (t.nodeType === 1 && t !== d.body && t.id !== "lb-ind" && !(t.closest && t.closest("#lb-tools"))) t.classList.add("lb-hover"); });
    on("mouseleave", () => d.querySelectorAll(".lb-hover").forEach((x) => x.classList.remove("lb-hover")));
    on("scroll", () => placeTools(), { passive: true });
    on("dragstart", (e) => { const t = e.target; if (t === selRef.current && t.tagName !== "BODY" && !t.closest("[data-lb-lock]")) { drag.current = { el: t }; e.dataTransfer.setData("text/plain", "m"); e.dataTransfer.effectAllowed = "move"; } else e.preventDefault(); });
    on("dragover", (e) => { if (!drag.current) return; e.preventDefault(); const w = where(e); w ? showInd(w) : hideInd(); });
    on("drop", (e) => {
      const dr = drag.current; if (!dr) return; e.preventDefault(); const w = where(e); hideInd(); drag.current = null; if (!w) return;
      const n = dr.el || mkEl(dr.html);
      w.mode === "in" ? w.el.appendChild(n) : w.mode === "before" ? w.el.before(n) : w.el.after(n);
      dr.el ? (select(n), commit(true)) : afterInsert(n);
    });
    on("dragend", () => { hideInd(); drag.current = null; });
    on("keydown", (e) => keyRef.current(e));
    setTick((x) => x + 1);
  };
  keyRef.current = (e) => {
    const t = e.target, typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable, mod = e.ctrlKey || e.metaKey, k = (e.key || "").toLowerCase();
    if (typing || mode !== "visual") return;
    if (mod && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (mod && k === "y") { e.preventDefault(); redo(); }
    else if (mod && k === "d" && selRef.current) { e.preventDefault(); dup(); }
    else if (e.key === "Delete" && selRef.current) del();
    else if (e.key === "Escape" && selRef.current) parent();
  };
  useEffect(() => { const f = (e) => keyRef.current(e); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, []);
  useEffect(() => { placeTools(); });

  /* ---------------- top-bar actions ---------------- */
  const loadSrc = (text) => { setSrc(text); onSave && onSave(curRef.current, text); setVer((v) => v + 1); setSelEl(null); selRef.current = null; setMode("visual"); };
  const uploadHtml = async (f) => { if (f && window.confirm("Replace the current page with this HTML file?")) loadSrc(await f.text()); };
  const exportFile = async () => {
    flush(); setBusy("Preparing export…");
    try {
      const multi = page.pages.length > 1, list = multi ? page.pages.map((p) => ({ file: p.file, html: p.id === curRef.current ? exportHtml() : p.html })) : [{ file: "index.html", html: exportHtml() }];
      const out = [];
      for (const p of list) { const r = await finalize(p.html, { mode: "zip", page: p.file }); out.push({ name: p.file, data: r.html }); r.files.forEach((f) => !out.some((o) => o.name === f.name) && out.push(f)); }
      if (multi) {
        const base = "https://" + addr(page);
        out.push({ name: "sitemap.xml", data: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.map((p) => `  <url><loc>${base}/${p.file === "index.html" ? "" : p.file}</loc></url>`).join("\n")}\n</urlset>` });
        out.push({ name: "robots.txt", data: `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n` });
        if (!list.some((p) => p.file === "404.html")) out.push({ name: "404.html", data: (await finalize(PAGE_TPLS.find((t) => t[0] === "404")[2]("Page not found"))).html });
      }
      const a = document.createElement("a");
      if (out.length === 1) { a.href = URL.createObjectURL(new Blob([out[0].data], { type: "text/html" })); a.download = "index.html"; }
      else { a.href = URL.createObjectURL(makeZip(out)); a.download = slug(page.name) + ".zip"; }
      a.click(); say(out.length === 1 ? "Exported index.html" : `Exported ${out.length} files (.zip)`);
    } catch (err) { alert("Export failed: " + err.message); }
    setBusy("");
  };
  const curPage = page.pages.find((p) => p.id === curRef.current) || page.pages[0];
  const prevLink = () => previewUrl(previewToken(user.email, page.id), curPage.file);
  const preview = () => { flush(); setTimeout(() => window.open(prevLink(), "_blank"), 60); };
  const copyLink = async () => { flush(); const u = prevLink(); try { await navigator.clipboard.writeText(u); say("Preview link copied — valid for 72 hours"); } catch { window.prompt("Copy this preview link:", u); } };
  const toCode = () => { flush(); const h = exportHtml(); setSrc(h); setCodeText(h); setMode("code"); };

  /* ---------------- layout maths ---------------- */
  const isM = dev === "mobile", W = WIDTH[dev], OW = isM ? 418 : W, stageH = Math.max(300, box.h - 24);
  const sc = isM ? Math.min(1, (box.w - 24) / 418, (box.h - 24) / 808) : Math.min(1, (box.w - 24) / W), OH = isM ? 808 : stageH / sc;
  const h = H.current, doc = D(), inDoc = selEl && doc && doc.body.contains(selEl);
  const crumbs = []; if (inDoc) for (let n = selEl; n && n !== doc.documentElement; n = n.parentElement) crumbs.unshift(n);
  const qq = q.trim().toLowerCase();

  return (
    <div className={"app theme-" + theme + (panel ? "" : " collapsed")}>
      <header className="tb">
        <button className="ib lg" title="Back to dashboard" onClick={() => { flush(); onBack(); }}><Icon n="back" s={18} /></button>
        <div className="tb-name"><b>{page.name}</b><button className="chip" onClick={() => { setPanel(true); setTab("pages"); }} title="Switch page">{curPage.file}<Icon n="chevd" s={12} /></button></div>
        <div className="grow" />
        <div className="seg dev">{Object.keys(WIDTH).map((k) => <button key={k} className={dev === k ? "on" : ""} title={`${k} ${WIDTH[k]}px`} onClick={() => setDev(k)}><Icon n={k} s={16} /></button>)}<span className="zoom">{WIDTH[dev]}px · {Math.round(sc * 100)}%</span></div>
        <div className="grow" />
        <button className="ib" title={theme === "aurora" ? "Switch to light theme" : "Switch to dark theme"} onClick={flipTheme}>{theme === "aurora" ? "☀" : "🌙"}</button>
        <button className="ib" title="Undo (Ctrl+Z)" onClick={undo} disabled={!h.past.length}><Icon n="undo" s={16} /></button>
        <button className="ib" title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!h.future.length}><Icon n="redo" s={16} /></button>
        <span className="sep" />
        <button className={"ib" + (navFloat ? " on" : "")} title="Structure (floating layers)" onClick={() => setNavFloat(!navFloat)} disabled={mode !== "visual"}><Icon n="layers" s={16} /></button>
        <button className={"ib" + (mode === "code" ? " on" : "")} title="Code view" onClick={() => (mode === "visual" ? toCode() : loadSrc(codeText))}><Icon n="code" s={16} /></button>
        <label className="ib" title="Upload HTML"><Icon n="upload" s={16} /><input hidden type="file" accept=".html,.htm" onChange={(e) => { uploadHtml(e.target.files[0]); e.target.value = ""; }} /></label>
        <button className="ib" title={page.pages.length > 1 ? "Export site (.zip)" : "Export HTML"} onClick={exportFile} disabled={mode !== "visual" || !!busy}><Icon n="download" s={16} /></button>
        <span className="sep" />
        <div className="split"><button className="btn ghost" onClick={preview} disabled={mode !== "visual"}><Icon n="eye" s={15} /> Preview</button><button className="btn ghost ic" title="Copy temporary preview link" onClick={copyLink} disabled={mode !== "visual"}><Icon n="link" s={15} /></button></div>
        <button className="btn publish" onClick={() => { flush(); onPublish(exportHtml()); }} disabled={mode !== "visual"}>Publish</button>
      </header>

      <aside className="lp">
        <div className="lp-tabs">
          {TABS.map(([k, ic, l]) => <button key={k} className={tab === k && panel ? "on" : ""} title={l} onClick={() => { setTab(k); setPanel(true); }}><Icon n={ic} s={17} /><span>{l}</span></button>)}
          <button className="lp-col" title={panel ? "Hide panel" : "Show panel"} onClick={() => setPanel(!panel)}><Icon n="panel" s={16} /></button>
        </div>
        {panel && <div className="lp-body">
          {tab === "add" && <>
            <div className="el-h"><Icon n="apps" s={18} /><b>Elements</b><span className="el-badge">{LIB.reduce((n, g) => n + g[1].length, 0)}</span></div>
            <div className="srch big"><Icon n="search" s={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all elements" />{q && <button className="ib" onClick={() => setQ("")}><Icon n="x" s={12} /></button>}</div>
            <div className="el-pills">{[["all", "All"], ["layout", "Layout"], ["text", "Text"], ["cta", "CTA"], ["media", "Media"], ["apps", "Apps"], ["prebuilt", "Pre-built"]].map(([k, l]) => <button key={k} className={pill === k ? "on" : ""} onClick={() => setPill(k)}>{l}</button>)}</div>
            {!qq && (pill === "all" || pill === "layout") && <div className="lg">
              <button className={"lg-h" + (shut.has("Structure") ? " shut" : "")} onClick={() => setShut((s) => { const n = new Set(s); n.has("Structure") ? n.delete("Structure") : n.add("Structure"); return n; })}><span>Structure</span><em>pick columns</em><Icon n="chevd" s={13} /></button>
              {!shut.has("Structure") && <div className="structs">{STRUCTURES.map(([l, cols]) => (
                <button key={l} title={`Section with ${l} columns`} draggable onClick={() => addSection(cols)} onDragStart={(e) => { drag.current = { html: structureHtml(cols) }; e.dataTransfer.setData("text/plain", "n"); }} onDragEnd={() => { drag.current = null; hideInd(); }}>
                  <span className="st-prev">{cols.map((c, i) => <i key={i} style={{ flex: c }} />)}</span><small>{l}</small></button>))}</div>}
            </div>}
            {!qq && pill === "all" && <div className="lg lg-ai">
              <button className={"lg-h" + (shut.has("AI") ? " shut" : "")} onClick={() => setShut((s) => { const n = new Set(s); n.has("AI") ? n.delete("AI") : n.add("AI"); return n; })}><span>✨ AI section</span><em>{(AI_PROVIDERS.find((p) => p.id === ((integ && integ.ai.provider) || "claude")) || {}).name}</em><Icon n="chevd" s={13} /></button>
              {!shut.has("AI") && (integ && integ.ai.keys && integ.ai.keys[integ.ai.provider] ? <div className="aibox">
                <textarea rows={3} value={aiQ} disabled={aiBusy} onChange={(e) => setAiQ(e.target.value)} placeholder="e.g. Pricing section with 3 plans for an AI workshop: ₹21 trial, ₹999 course, ₹4,999 mentorship" />
                <button className="btn pri sm" disabled={aiBusy || aiQ.trim().length < 8} onClick={async () => { setAiBusy(true); try { const h = await aiSection(integ.ai, aiQ.trim()); addEl(h); setAiQ(""); say("AI section added — edit it like any other section"); } catch (e) { alert(e.message); } setAiBusy(false); }}>{aiBusy ? "Generating…" : "✨ Generate & add"}</button>
                <p className="hint">Added below the selected element.</p></div>
                : <p className="hint pad">Connect Claude, ChatGPT, Gemini or DeepSeek in Dashboard → <b>Integrations</b> to generate sections from a prompt.</p>)}
            </div>}
            {!qq && (pill === "all" || pill === "apps") && events.length > 0 && <div className="lg">
              <button className={"lg-h" + (shut.has("My calendars") ? " shut" : "")} onClick={() => setShut((s) => { const n = new Set(s); n.has("My calendars") ? n.delete("My calendars") : n.add("My calendars"); return n; })}><span>My booking calendars</span><em>{events.length}</em><Icon n="chevd" s={13} /></button>
              {!shut.has("My calendars") && <div className="myforms">{events.map((ev) => (
                <div key={ev.id} className="mf" draggable title="Drag onto the page, or click to add" onClick={() => addEl(`<section data-lb-name="Calendar section" style="padding:64px 24px"><div data-lb-calendar="${ev.id}" data-lb-name="Calendar: ${ev.name.replace(/"/g, "")}">${bookingWidget(ev, integ)}</div></section>`)}
                  onDragStart={(e) => { drag.current = { html: `<div data-lb-calendar="${ev.id}" data-lb-name="Calendar: ${ev.name.replace(/"/g, "")}">${bookingWidget(ev, integ)}</div>` }; e.dataTransfer.setData("text/plain", "n"); }} onDragEnd={() => { drag.current = null; hideInd(); }}>
                  <Icon n="calendar" s={16} /><div><b>{ev.name}</b><span>{ev.duration} min · {ev.days.length} days{ev.pay && ev.pay.enabled ? ` · ₹${ev.pay.amount}` : ""}</span></div></div>))}</div>}
            </div>}
            {!qq && (pill === "all" || pill === "apps") && <div className="lg">
              <button className={"lg-h" + (shut.has("My forms") ? " shut" : "")} onClick={() => setShut((s) => { const n = new Set(s); n.has("My forms") ? n.delete("My forms") : n.add("My forms"); return n; })}><span>My forms</span><em>{forms.length}</em><Icon n="chevd" s={13} /></button>
              {!shut.has("My forms") && (forms.length ? <div className="myforms">{forms.map((f) => (
                <div key={f.id} className="mf" draggable title="Drag onto the page, or click to add" onClick={() => addEl(`<section data-lb-name="Form section" style="padding:64px 24px">${formHtml(f, integ)}</section>`)}
                  onDragStart={(e) => { drag.current = { html: formHtml(f, integ) }; e.dataTransfer.setData("text/plain", "n"); }} onDragEnd={() => { drag.current = null; hideInd(); }}>
                  <Icon n="form" s={16} /><div><b>{f.name}</b><span>{f.fields.length} fields · stays linked</span></div></div>))}</div>
                : <p className="hint pad">No saved forms yet. Create them in Dashboard → <b>Forms</b> (with templates), then add them here.</p>)}
            </div>}
            {LIB.map(([g, items], gi) => {
              const list = items.filter(([, nm, , kw]) => (!qq || (nm + " " + (kw || "") + " " + g).toLowerCase().includes(qq)) && (pill === "all" || qq || pillOf(g, nm) === pill)); if (!list.length) return null;
              const closed = !qq && shut.has(g);
              return <div key={g} className={"lg lgc" + gi}>
                <button className={"lg-h" + (closed ? " shut" : "")} onClick={() => setShut((s) => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n; })}><span>{g}</span><em>{list.length}</em><Icon n="chevd" s={13} /></button>
                {!closed && <div className="pal">{list.map(([ic, nm, html]) => (
                  <div key={nm} className="pi" draggable title={`Drag onto the page, or click to add`} onClick={() => addEl(html)}
                    onDragStart={(e) => { drag.current = { html }; e.dataTransfer.setData("text/plain", "n"); }} onDragEnd={() => { drag.current = null; hideInd(); }}>
                    <Icon n={ic} s={20} w={1.5} /><span>{nm}</span></div>))}</div>}
              </div>;
            })}
            <p className="hint pad">Drag onto the page — a blue line shows where it lands. Click to add below the selected element (or inside an empty box).</p>
          </>}
          {tab === "layers" && <Layers doc={doc} sel={inDoc ? selEl : null} onSelect={select} onChanged={(now) => (now ? commit(true) : changed())} tick={selKey} />}
          {tab === "pages" && <PagesPanel project={page} curId={curRef.current} act={pageAct} />}
          {tab === "site" && <SiteSettings key={curRef.current + ver} doc={doc} changed={changed} commit={() => commit(true)} pages={page.pages} curFile={curPage.file} onApplyAll={applyAll} />}
          {tab === "edit" && (inDoc ? <Inspector key={selKey + (openLink ? "l" : "")} el={selEl} A={A} pages={page.pages} dev={dev} itab={itab} setItab={setItab} openLink={openLink} /> : (
            <div className="empty-edit"><Icon n="pen" s={28} w={1.3} /><b>Nothing selected</b><p className="hint">Click any element on the page to edit its content, style and link.</p><button className="btn sm" onClick={() => D() && select(D().body)}>Edit whole page</button></div>))}
        </div>}
      </aside>

      <main ref={wrap} className="stage">
        {mode === "code" ? (
          <div className="codeview">
            <div className="row"><b>Full page HTML</b><span className="hint">Edit anything, then apply.</span><div className="grow" /><button className="btn pri" onClick={() => loadSrc(codeText)}>Apply &amp; back to visual</button></div>
            <textarea className="code" value={codeText} onChange={(e) => setCodeText(e.target.value)} spellCheck={false} />
          </div>
        ) : (
          <div className={"dev " + dev} style={{ width: OW * sc, height: OH * sc }}>
            <div className="devin" style={{ width: OW, height: OH, transform: `scale(${sc})` }}>
              {isM && <div className="notch" />}
              {isM && <div className="pbar"><div className="st"><span>9:41</span><span>▂▄▆ ▮</span></div><div className="url">🔒 {page.slug || "yourpage"}.launchbuilder.com</div></div>}
              <iframe key={ver} ref={ifr} srcDoc={src} onLoad={setup} title="page" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" allow="payment; autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write; accelerometer; gyroscope"
                style={{ width: W, height: isM ? 658 : OH, border: 0, background: "#fff", display: "block" }} />
              {isM && <div className="pfoot"><span>‹</span><span>›</span><span>⇪</span><span>▯</span><span>⧉</span></div>}
            </div>
          </div>
        )}
        {mode === "visual" && crumbs.length > 0 && <div className="crumbs">{crumbs.map((n, i) => <button key={i} className={n === selEl ? "on" : ""} onClick={() => select(n)}>{n === doc.body ? "Page" : nameOf(n)}</button>)}</div>}
        {navFloat && mode === "visual" && <div className="navfloat"><div className="nf-h"><Icon n="layers" s={14} /><b>Structure</b><span className="grow" /><button className="ib" onClick={() => setNavFloat(false)}><Icon n="x" s={13} /></button></div>
          <Layers doc={doc} sel={inDoc ? selEl : null} onSelect={select} onChanged={(now) => (now ? commit(true) : changed())} tick={selKey} /></div>}
        {mode === "visual" && inDoc && selEl !== doc.body && <QuickBar key={selKey} el={selEl} A={A} ifr={ifr.current} wrapEl={wrap.current} sc={sc} posRef={qbPos} editing={editing}
          onOpen={(t, extra) => { setPanel(true); if (t === "layers") return setTab("layers"); setTab("edit"); setItab(t); if (extra === "link") setOpenLink(true); }} />}
        {(toast || busy) && <div className="toast">{busy || toast}</div>}
      </main>
    </div>
  );
}
