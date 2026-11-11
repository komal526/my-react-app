// LaunchBuilder v27 — tools.js
// Editor toolbox: draggable elements, settings, site runtime, video storage, zip export


/* ==================== editor helpers: canvas CSS, fonts, names, zip export ==================== */
// Editor helpers: canvas CSS, fonts, element names, cleaning, image compression, zip export

/* ================= CSS injected into the page iframe (editor only, never exported) ================= */
export const EDITOR_CSS = `.lb-hover{outline:1px dashed #3b6cff!important;outline-offset:-1px}
.lb-sel{outline:2px solid #3b6cff!important;outline-offset:-2px}
[contenteditable=true]{outline:2px solid #10b981!important;cursor:text}
[data-lb-ph]:empty{min-height:90px;outline:1.5px dashed #c3cde0;outline-offset:-6px;background:repeating-linear-gradient(135deg,transparent 0 10px,rgba(59,108,255,.05) 10px 20px)}
[data-lb-ph]:empty::before{content:"+ Drop elements here";color:#7d8aa3;font:500 13px system-ui,sans-serif;display:block;padding:32px;text-align:center}
img:not(.lb-sel){-webkit-user-drag:none}
[data-lb-video] iframe,[data-lb-video] video,[data-lb-map] iframe,[data-lb-embed] iframe{pointer-events:none}
#lb-ind{position:fixed;z-index:2147483646;pointer-events:none;background:#3b6cff;border-radius:3px;display:none;box-shadow:0 0 0 3px rgba(59,108,255,.25)}
#lb-ind.in{background:rgba(59,108,255,.10);outline:2px dashed #3b6cff;box-shadow:none}
#lb-tools{position:fixed;z-index:2147483647;display:none;align-items:center;height:24px;background:#3b6cff;color:#fff;border-radius:6px 6px 6px 0;font:600 11px/1 system-ui,sans-serif;box-shadow:0 6px 16px rgba(30,70,200,.35);overflow:hidden;user-select:none}
#lb-tools b{padding:0 8px;font-weight:600;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis}
#lb-tools i{display:grid;place-items:center;width:24px;height:24px;cursor:pointer;font-style:normal;border-left:1px solid rgba(255,255,255,.18)}
#lb-tools i:hover{background:rgba(255,255,255,.25)}
#lb-tools svg{width:13px;height:13px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.lb-hide-all{opacity:.3!important;filter:grayscale(1)}
@media(min-width:1025px){.lb-hide-d{opacity:.3!important}}
@media(min-width:768px) and (max-width:1024px){.lb-hide-t{opacity:.3!important}}
@media(max-width:767px){.lb-hide-m{opacity:.3!important}}
[data-lb-track]{flex-wrap:wrap!important;transform:none!important;row-gap:12px}
[data-lb-cookie]{position:relative!important;inset:auto!important;transform:none!important}
[data-lb-lock].lb-sel{outline-style:dashed!important;outline-color:#f59e0b!important}
.lbw-dd:has(.lb-sel)>.lbw-ddm{display:block}.lbw-dd:has(.lb-sel)>.lbw-mega{display:grid}`;

const SV = (d) => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
export const TOOLS_HTML = `<b></b><i data-a="up" title="Move up">${SV("M12 19V5M6 11l6-6 6 6")}</i><i data-a="down" title="Move down">${SV("M12 5v14M6 13l6 6 6-6")}</i><i data-a="parent" title="Select parent">${SV("M9 14L4 9l5-5M4 9h11a5 5 0 0 1 5 5v6")}</i><i data-a="dup" title="Duplicate (Ctrl+D)">${SV("M8 8h12v12H8zM16 8V4H4v12h4")}</i><i data-a="del" title="Delete (Del)">${SV("M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13")}</i>`;

export const CONT = new Set(["DIV", "SECTION", "HEADER", "FOOTER", "MAIN", "ARTICLE", "ASIDE", "NAV", "UL", "OL", "LI", "FORM", "BODY", "FIGURE", "DETAILS", "BLOCKQUOTE", "LABEL", "TD", "TH"]);
export const INL = new Set(["A", "B", "I", "EM", "STRONG", "SPAN", "BR", "SMALL", "U", "MARK", "CODE", "SUP", "SUB", "LABEL", "ABBR", "S", "TIME", "DEL", "INS"]);
export const SH = {
  None: "", Soft: "0 2px 10px rgba(20,18,43,.08)", Medium: "0 10px 30px rgba(20,18,43,.14)", Large: "0 24px 60px rgba(20,18,43,.22)",
  Floating: "0 30px 80px -20px rgba(40,30,120,.45)", Glow: "0 0 0 6px rgba(99,91,255,.18)", Inset: "inset 0 2px 8px rgba(0,0,0,.12)",
};
export const WIDTH = { desktop: 1280, tablet: 768, mobile: 390 };

/* ---- fonts: Google fonts are loaded on demand with a <link data-lb-font> ---- */
export const GFONTS = ["Inter", "Poppins", "Manrope", "DM Sans", "Plus Jakarta Sans", "Outfit", "Sora", "Space Grotesk", "Montserrat", "Roboto", "Open Sans", "Lato", "Nunito", "Rubik", "Work Sans", "Archivo", "Playfair Display", "Merriweather", "Lora", "DM Serif Display", "Fraunces", "Bebas Neue", "Oswald", "Hind", "Mukta", "Noto Sans Devanagari", "Baloo 2", "JetBrains Mono"];
export const SYSFONTS = ["system-ui, sans-serif", "Arial, sans-serif", "Georgia, serif", "Times New Roman, serif", "Courier New, monospace"];
const WGHT = { Lato: "300;400;700;900", Merriweather: "300;400;700;900", "Bebas Neue": "", "DM Serif Display": "" };
export const fontName = (f) => (f || "").replace(/["']/g, "").split(",")[0].trim();
export const fontStack = (f) => (GFONTS.includes(fontName(f)) ? `"${fontName(f)}", system-ui, sans-serif` : f);
export const ensureFont = (doc, fam) => {
  const name = fontName(fam);
  if (!GFONTS.includes(name) || doc.head.querySelector(`link[data-lb-font="${name}"]`)) return;
  const w = WGHT[name] === undefined ? "400;500;600;700;800" : WGHT[name];
  const l = doc.createElement("link"); l.rel = "stylesheet"; l.setAttribute("data-lb-font", name);
  l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}${w ? ":wght@" + w : ""}&display=swap`;
  doc.head.appendChild(l);
};

/* ---- human names for elements (Layers panel, toolbar, breadcrumbs) ---- */
const TAGN = { SECTION: "Section", HEADER: "Header", FOOTER: "Footer", NAV: "Menu", MAIN: "Main", ARTICLE: "Article", ASIDE: "Sidebar", FORM: "Form", H1: "Heading", H2: "Heading", H3: "Heading", H4: "Heading", H5: "Heading", H6: "Heading", P: "Text", A: "Link", IMG: "Image", VIDEO: "Video", IFRAME: "Embed", BUTTON: "Button", UL: "List", OL: "List", LI: "List item", INPUT: "Field", TEXTAREA: "Text area", SELECT: "Dropdown", LABEL: "Field", SPAN: "Span", DETAILS: "Accordion", SUMMARY: "Title", HR: "Divider", TABLE: "Table", BLOCKQUOTE: "Quote", FIGURE: "Figure", BODY: "Page", B: "Bold", STRONG: "Bold", SVG: "Icon", svg: "Icon" };
export const nameOf = (el) => {
  if (!el || !el.getAttribute) return "";
  const n = el.getAttribute("data-lb-name"); if (n) return n;
  for (const [a, l] of [["data-lb-video", "Video"], ["data-lb-map", "Map"], ["data-lb-embed", "Embed"], ["data-lb-html", "HTML"], ["data-lb-form", "Form"], ["data-lb-popup", "Popup"], ["data-lb-slider", "Slider"], ["data-lb-tabs", "Tabs"], ["data-lb-gallery", "Gallery"]]) if (el.hasAttribute(a)) return l;
  if (el.tagName === "A" && /background/.test(el.getAttribute("style") || "")) return "Button";
  if (el.tagName === "DIV") return /flex|grid/.test(el.style.display) ? "Container" : "Box";
  return TAGN[el.tagName] || el.tagName.toLowerCase();
};
const ICONS = { Video: "video", Map: "pin", Embed: "code", HTML: "code", Form: "form", Popup: "popup", Slider: "slider", Tabs: "tabs", Gallery: "gallery", Button: "button", Container: "container", Box: "section", Header: "header", Footer: "footer", Menu: "menu", Heading: "heading", Text: "text", Link: "link", Image: "image", List: "menu", "List item": "text", Field: "field", "Text area": "field", Accordion: "accordion", Divider: "divider", Quote: "quote", Icon: "star", Section: "section", Sidebar: "sidebar" };
export const iconOf = (el) => ICONS[nameOf(el)] || ICONS[TAGN[el.tagName]] || "section";

/* ---- remove editor-only marks before saving / exporting ---- */
export const cleanNode = (r, exp) => {
  [r, ...r.querySelectorAll("*")].forEach((n) => {
    if (n.classList) n.classList.remove("lb-sel", "lb-hover");
    ["draggable", "contenteditable", ...(exp ? ["data-lb-ph"] : [])].forEach((a) => n.removeAttribute(a));
    if (n.hasAttribute("data-lb-asset")) n.removeAttribute("src");
    ["class", "style"].forEach((a) => n.getAttribute(a) === "" && n.removeAttribute(a));
  });
  r.querySelectorAll("#lb-ind,#lb-tools").forEach((n) => n.remove());
};

/* ---- images are resized (max 1600px) before they are stored, so pages stay light ---- */
export const readImage = (file, cb) => {
  if (!file) return;
  const raw = () => { const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(file); };
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return raw();
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    cb(c.toDataURL(file.type === "image/jpeg" ? "image/jpeg" : "image/webp", 0.86));
  };
  img.onerror = raw; img.src = url;
};

/* ---- minimal "stored" zip writer, no library needed (text or binary files) ---- */
const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = -1; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
export function makeZip(files) {
  const enc = new TextEncoder(), parts = [], cen = [], u16 = (n) => [n & 255, (n >> 8) & 255], u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  let off = 0, size = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), d = typeof f.data === "string" ? enc.encode(f.data) : f.data, c = crc(d);
    const lh = new Uint8Array([0x50, 0x4b, 3, 4, 20, 0, 0, 8, 0, 0, 0, 0, 0, 0, ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nm.length), 0, 0]);
    const ch = new Uint8Array([0x50, 0x4b, 1, 2, 20, 0, 20, 0, 0, 8, 0, 0, 0, 0, 0, 0, ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nm.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]);
    parts.push(lh, nm, d); cen.push(ch, nm); off += lh.length + nm.length + d.length; size += ch.length + nm.length;
  }
  const end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(size), ...u32(off), 0, 0]);
  return new Blob([...parts, ...cen, end], { type: "application/zip" });
}

/* ==================== uploaded videos (stored in IndexedDB) ==================== */
// Uploaded videos (and other big files) live in IndexedDB, not localStorage, so they don't fill up browser storage.
// The page HTML only keeps data-lb-asset="id"; the real file is attached when the editor / preview / export needs it.
const DB = "lb_assets", ST = "files";
let dbp;
const db = () => dbp || (dbp = new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(ST);
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
}));
const run = async (mode, fn) => {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(ST, mode), req = fn(t.objectStore(ST));
    t.oncomplete = () => res(req && req.result);
    t.onerror = () => rej(t.error);
  });
};

export const putAsset = async (file) => {
  const id = "a" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
  await run("readwrite", (s) => s.put({ blob: file, name: file.name, type: file.type }, id));
  return id;
};
export const getAsset = (id) => run("readonly", (s) => s.get(id));

const urls = {};
export const assetUrl = async (id) => {
  if (urls[id]) return urls[id];
  const v = await getAsset(id).catch(() => null);
  return v ? (urls[id] = URL.createObjectURL(v.blob)) : null;
};
export const extOf = (rec) => {
  const fromName = ((rec && rec.name) || "").split(".").pop();
  if (fromName && fromName.length <= 5 && fromName !== rec.name) return fromName.toLowerCase();
  return ((rec && rec.type) || "video/mp4").split("/")[1] || "bin";
};

// Point every [data-lb-asset] element in a document at its stored file
export const hydrate = async (doc) => {
  if (!doc) return;
  for (const n of doc.querySelectorAll("[data-lb-asset]")) {
    const u = await assetUrl(n.getAttribute("data-lb-asset"));
    if (u && n.getAttribute("src") !== u) n.setAttribute("src", u);
  }
};

/* ==================== site runtime: makes links, forms, sliders, popups work on the live site ==================== */
// The small "site runtime": CSS + JS that make widgets work on the live site and in Preview.
// finalize() turns a saved page into the HTML that is previewed or exported.

/* CSS needed by widgets (used in the editor canvas AND on the live site) */
export const WIDGET_CSS = `.lbw-nav{display:flex;gap:28px;align-items:center;list-style:none;margin:0;padding:0;flex-wrap:wrap}
.lbw-nav a{color:inherit;text-decoration:none;font-weight:500}
.lbw-nav a.lb-current{color:var(--lb-primary,#4f46e5);font-weight:700}
.lbw-dd{position:relative;list-style:none}
.lbw-ddm{display:none;position:absolute;top:100%;left:-12px;min-width:210px;background:#fff;border-radius:14px;box-shadow:0 22px 50px rgba(20,18,60,.18);padding:8px;z-index:60;margin:0}
.lbw-dd:hover>.lbw-ddm,.lbw-dd:focus-within>.lbw-ddm{display:block}
.lbw-ddm a{display:block;padding:10px 12px;border-radius:9px;color:#1f1d36}
.lbw-ddm a:hover{background:#f2f0ff}
.lbw-mega{left:50%;transform:translateX(-50%);min-width:min(720px,92vw);grid-template-columns:repeat(3,1fr);gap:6px 18px;padding:22px}
.lbw-dd:hover>.lbw-mega,.lbw-dd:focus-within>.lbw-mega{display:grid}
.lbw-burger{display:none;background:none;border:0;cursor:pointer;color:inherit;padding:6px;font-size:26px;line-height:1}
.lbw-header{position:relative}
@media(max-width:767px){.lbw-burger{display:block}.lbw-header .lbw-nav{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;align-items:stretch;gap:4px;background:#fff;padding:14px 20px 20px;box-shadow:0 18px 40px rgba(0,0,0,.12);z-index:70}.lbw-header.lb-open .lbw-nav{display:flex}.lbw-header .lbw-nav a{padding:10px 0;color:#1f1d36}.lbw-ddm,.lbw-mega{position:static;display:block;box-shadow:none;min-width:0;transform:none;padding:0 0 0 14px}}
.lbw-tabbar{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid #e7e5f2;margin-bottom:22px}
[data-lb-tab]{background:none;border:0;border-bottom:2px solid transparent;padding:12px 16px;font:inherit;font-weight:600;color:#6b6890;cursor:pointer;margin-bottom:-1px}
[data-lb-tab].lb-on{color:var(--lb-primary,#4f46e5);border-bottom-color:var(--lb-primary,#4f46e5)}
.lbw-slider{position:relative;overflow:hidden}
[data-lb-track]{display:flex;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
[data-lb-track]>*{flex:0 0 100%;min-width:0;box-sizing:border-box;overflow-wrap:break-word}
@media(max-width:767px){[data-lb-track]>*{padding:36px 24px!important;min-height:320px!important}[data-lb-track] h2{font-size:30px!important}}
[data-lb-dots]{position:absolute;left:0;right:0;bottom:18px;display:flex;justify-content:center;gap:8px}
[data-lb-dots] button{width:9px;height:9px;border-radius:9px;border:0;background:rgba(255,255,255,.55);padding:0;cursor:pointer;transition:width .3s}
[data-lb-dots] button.lb-on{width:26px;background:#fff}
details.lbw-acc>summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px}
details.lbw-acc>summary::-webkit-details-marker{display:none}
details.lbw-acc>summary::after{content:"+";font-size:22px;font-weight:400;transition:transform .25s;color:var(--lb-primary,#4f46e5)}
details.lbw-acc[open]>summary::after{transform:rotate(45deg)}
[data-lb-progress]{transition:width 1.4s cubic-bezier(.2,.7,.2,1)}
.lbw-book{display:grid;grid-template-columns:minmax(220px,280px) 1fr minmax(200px,250px);background:#fff;border:1px solid #e6e7ee;border-radius:18px;overflow:hidden;color:#1d1d2b;max-width:1100px;margin:0 auto;box-shadow:0 20px 50px -30px rgba(20,20,60,.35)}
.lbw-bk-info{padding:28px;border-right:1px solid #eeeff4}.lbw-bk-info h3{margin:6px 0 10px;font-size:24px}.lbw-bk-info p{color:#5b5f73;line-height:1.6;margin:0 0 18px;font-size:14.5px}
.lbw-bk-logo{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--lb-primary,#4f46e5);color:#fff;font-weight:800;margin-bottom:8px}
.lbw-bk-org{font-weight:700;color:#6b6f82;font-size:14px}.lbw-bk-meta{display:flex;gap:10px;align-items:center;color:#3d4154;font-weight:600;font-size:14px;margin:10px 0}
.lbw-bk-cal{padding:24px}.lbw-bk-mh{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.lbw-bk-mh b{font-size:18px}.lbw-bk-mh b span{color:#8a8ea3;font-weight:500}
.lbw-bk-mh button{border:0;background:none;font-size:22px;color:#6b6f82;cursor:pointer;padding:2px 10px;border-radius:8px}.lbw-bk-mh button:hover{background:#f2f3f7}
.lbw-bk-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.lbw-bk-grid i{font-style:normal;text-align:center;font-size:11.5px;font-weight:700;color:#5b5f73;padding:6px 0;letter-spacing:.04em}
.lbw-bk-grid button{aspect-ratio:1;border:0;border-radius:10px;background:none;color:#a7aabb;font:600 15px inherit;font-family:inherit;cursor:default}
.lbw-bk-grid button.on{background:#eceef4;color:#1d1d2b;cursor:pointer}.lbw-bk-grid button.on:hover{background:#dfe2ec}.lbw-bk-grid button.sel{background:#1d1d2b!important;color:#fff!important}
.lbw-bk-grid button.today{box-shadow:inset 0 -3px 0 var(--lb-primary,#4f46e5)}
.lbw-bk-slots{padding:24px 20px;border-left:1px solid #eeeff4;display:flex;flex-direction:column;gap:8px;max-height:480px;overflow:auto}
.lbw-bk-day{font-weight:600;color:#3d4154;margin-bottom:6px}.lbw-bk-slots button{padding:12px;border:1px solid #dfe1ea;border-radius:10px;background:#fff;font:600 14.5px inherit;font-family:inherit;cursor:pointer;color:#1d1d2b}
.lbw-bk-slots button:hover{border-color:var(--lb-primary,#4f46e5);color:var(--lb-primary,#4f46e5)}.lbw-bk-hint{color:#8a8ea3;font-size:14px}
.lbw-bk-form{grid-column:1/-1;padding:26px 28px;border-top:1px solid #eeeff4}
.lbw-bk-form label{display:block;font-weight:600;font-size:14px;margin-bottom:14px;color:#2b2e3f}.lbw-bk-form input,.lbw-bk-form textarea,.lbw-bk-form select{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px 13px;border:1px solid #dfe1ea;border-radius:10px;font:inherit;font-size:15px}
.lbw-bk-form button[type=submit]{padding:14px 22px;border:0;border-radius:10px;background:#1d1d2b;color:#fff;font:700 15px inherit;font-family:inherit;cursor:pointer}
.lbw-bk-back{border:0;background:none;color:#5b5f73;font:600 14px inherit;font-family:inherit;cursor:pointer;padding:0;margin-bottom:10px}
.lbw-bk-sum{background:#f4f5f9;border-radius:10px;padding:12px 14px;font-weight:600;margin-bottom:18px;color:#2b2e3f}
@media(max-width:860px){.lbw-book{grid-template-columns:1fr}.lbw-bk-info,.lbw-bk-slots{border:0;border-bottom:1px solid #eeeff4}.lbw-bk-slots{max-height:none;flex-direction:row;flex-wrap:wrap}.lbw-bk-slots button{flex:1 1 30%}}
.lbw-ok{padding:22px;border-radius:12px;background:#ecfdf5;color:#065f46;font-weight:600;text-align:center}
.lbw-pay{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:22px;border:1px solid #e7e5f2;border-radius:14px;background:#fff}
.lbw-pay p{margin:0;color:#5f5b7d;font-size:14px}.lbw-pay img{border-radius:10px;border:1px solid #eee}
.lbw-pay-t{font-size:18px;color:#16142b}
.lbw-paybtn{display:block;width:100%;box-sizing:border-box;padding:13px;border-radius:10px;background:#16a34a;color:#fff!important;text-decoration:none;font-weight:700}
.lbw-upi{font-size:13px;color:#5f5b7d}.lbw-utr{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d9d7e8;border-radius:10px;font:inherit}
.lbw-paid{width:100%;padding:13px;border:0;border-radius:10px;background:var(--lb-primary,#4f46e5);color:#fff;font:inherit;font-weight:700;cursor:pointer}
.lbw-back{border:0;background:none;color:#5f5b7d;cursor:pointer;font:inherit;font-size:13px}
.lb-h-lift{transition:transform .25s,box-shadow .25s}.lb-h-lift:hover{transform:translateY(-6px);box-shadow:0 22px 44px rgba(20,18,60,.16)}
.lb-h-grow{transition:transform .25s}.lb-h-grow:hover{transform:scale(1.04)}
.lb-h-glow{transition:box-shadow .25s}.lb-h-glow:hover{box-shadow:0 0 0 5px rgba(99,91,255,.25)}
.lb-h-dim{transition:opacity .25s}.lb-h-dim:hover{opacity:.75}
.lb-h-tilt{transition:transform .3s}.lb-h-tilt:hover{transform:rotate(-1.5deg) scale(1.02)}
html:has(.lbw-header[style*=sticky]) [id]{scroll-margin-top:90px}
@media(max-width:767px){.lbw-stack{flex-direction:column!important}.lbw-stack>*{flex-basis:auto!important;width:100%!important}}`;

/* CSS that only applies on the live site / preview (the editor shows everything) */
const SITE_CSS = `.lb-run [data-lb-anim]{opacity:0;transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1)}
.lb-run [data-lb-anim=fade-up]{transform:translateY(34px)}.lb-run [data-lb-anim=fade-down]{transform:translateY(-34px)}
.lb-run [data-lb-anim=fade-left]{transform:translateX(-44px)}.lb-run [data-lb-anim=fade-right]{transform:translateX(44px)}
.lb-run [data-lb-anim=zoom]{transform:scale(.9)}.lb-run [data-lb-anim=flip]{transform:perspective(800px) rotateX(18deg)}
.lb-run [data-lb-anim].lb-in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.lb-run [data-lb-anim]{opacity:1!important;transform:none!important;transition:none!important}}
.lb-hide-all{display:none!important}
@media(min-width:1025px){.lb-hide-d{display:none!important}}
@media(min-width:768px) and (max-width:1024px){.lb-hide-t{display:none!important}}
@media(max-width:767px){.lb-hide-m{display:none!important}}
.lb-run [data-lb-popup]{position:fixed!important;inset:0!important;z-index:9999;display:none!important;margin:0!important}
.lb-run [data-lb-popup].lb-show{display:flex!important}
.lb-run [data-lb-preloader]{position:fixed!important;inset:0!important;z-index:10000;min-height:0!important;transition:opacity .5s}
.lb-gone{opacity:0!important;pointer-events:none}
.lb-run [data-lb-totop]{opacity:0;pointer-events:none;transition:opacity .3s}.lb-run [data-lb-totop].lb-show{opacity:1;pointer-events:auto}
.lb-run [data-lb-cookie].lb-hidden{display:none!important}
.lb-run .lbw-bk-form{display:none}.lb-run .lbw-book.lb-step2 .lbw-bk-cal,.lb-run .lbw-book.lb-step2 .lbw-bk-slots{display:none}.lb-run .lbw-book.lb-step2 .lbw-bk-form{display:block;grid-column:2/-1;border-top:0}
@media(max-width:860px){.lb-run .lbw-book.lb-step2 .lbw-bk-form{grid-column:1}}`;

/* Plain JS (no ${} inside!) — runs on the live site and in Preview */
const RUNTIME = `(function(){
var d=document,W=window;d.documentElement.classList.add('lb-run');
function all(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))}
var cur=W.LB_PAGE||decodeURIComponent(location.pathname.split('/').pop()||'index.html');
function fileOf(h){return (h||'').split('#')[0].split('?')[0].split('/').pop()}
function scrollToId(id){if(!id){W.scrollTo({top:0,behavior:'smooth'});return}var el=d.getElementById(decodeURIComponent(id));if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
all('a[href]').forEach(function(a){var h=a.getAttribute('href');if(h&&h.indexOf('#')!==0&&!/^[a-z]+:/i.test(h)&&fileOf(h)===cur&&h.indexOf('#')<0)a.classList.add('lb-current')});
if(W.LB_PREVIEW){
 W.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href],[data-href]');if(!a||a.closest('[data-lb-open]'))return;
  var h=a.getAttribute('href')||a.getAttribute('data-href')||'',t=a.getAttribute('target')||a.getAttribute('data-target');
  if(!h||/^(mailto:|tel:|sms:|javascript:)/i.test(h))return;
  e.preventDefault();e.stopPropagation();
  if(h.charAt(0)==='#'){scrollToId(h.slice(1));return}
  if(/^(https?:)?\\/\\//i.test(h)){W.open(h,'_blank','noopener');return}
  parent.postMessage({lb:'nav',href:h,blank:t==='_blank'},'*');
 },true);
 if(W.LB_HASH)setTimeout(function(){scrollToId(W.LB_HASH)},120);
}
d.addEventListener('click',function(e){var b=e.target.closest('[data-lb-burger]');if(b){e.preventDefault();var h=b.closest('header,[data-lb-header]')||b.parentNode;h.classList.toggle('lb-open')}});
all('[data-lb-preloader]').forEach(function(p){var go=function(){p.classList.add('lb-gone');setTimeout(function(){p.style.display='none'},600)};if(d.readyState==='complete')setTimeout(go,300);else W.addEventListener('load',go);setTimeout(go,4000)});
all('[data-lb-tabs]').forEach(function(t){var b=all('[data-lb-tab]',t),p=all('[data-lb-pane]',t);function show(i){b.forEach(function(x,j){x.classList.toggle('lb-on',i===j)});p.forEach(function(x,j){x.style.display=i===j?'':'none'})}b.forEach(function(x,i){x.addEventListener('click',function(e){e.preventDefault();show(i)})});show(0)});
all('[data-lb-slider]').forEach(function(s){var tr=s.querySelector('[data-lb-track]');if(!tr)return;var n=tr.children.length,i=0,dots=s.querySelector('[data-lb-dots]');
 function go(k){i=(k+n)%n;tr.style.transform='translateX('+(-i*100)+'%)';if(dots)Array.prototype.forEach.call(dots.children,function(b,j){b.classList.toggle('lb-on',j===i)})}
 if(dots){dots.innerHTML='';for(var k=0;k<n;k++){var b=d.createElement('button');b.type='button';b.setAttribute('aria-label','Slide '+(k+1));(function(k){b.onclick=function(){go(k)}})(k);dots.appendChild(b)}}
 all('[data-lb-prev]',s).forEach(function(b){b.onclick=function(e){e.preventDefault();go(i-1)}});all('[data-lb-next]',s).forEach(function(b){b.onclick=function(e){e.preventDefault();go(i+1)}});
 var ms=+s.getAttribute('data-lb-slider');if(ms>0&&n>1)setInterval(function(){go(i+1)},ms);go(0)});
function count(t){var end=parseFloat(t.getAttribute('data-lb-count'))||0,dec=(String(end).split('.')[1]||'').length,pre=t.getAttribute('data-lb-prefix')||'',suf=t.getAttribute('data-lb-suffix')||'',st=0;
 function step(ts){if(!st)st=ts;var p=Math.min(1,(ts-st)/1600),v=end*(1-Math.pow(1-p,3));t.textContent=pre+v.toFixed(dec).replace(/\\B(?=(\\d{3})+(?!\\d))/g,',')+suf;if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)}
function reveal(t){if(t.hasAttribute('data-lb-anim'))setTimeout(function(){t.classList.add('lb-in')},+t.getAttribute('data-lb-delay')||0);if(t.hasAttribute('data-lb-count'))count(t);if(t.hasAttribute('data-lb-progress'))setTimeout(function(){t.style.width=t.getAttribute('data-lb-progress')+'%'},60)}
var io='IntersectionObserver' in W?new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){io.unobserve(en.target);reveal(en.target)}})},{threshold:.12}):null;
all('[data-lb-anim],[data-lb-count],[data-lb-progress]').forEach(function(t){if(t.hasAttribute('data-lb-progress'))t.style.width='0%';io?io.observe(t):reveal(t)});
function showP(p){p.classList.add('lb-show');try{sessionStorage.setItem('lbp_'+p.id,1)}catch(e){}}
all('[data-lb-popup]').forEach(function(p){var seen=false;try{seen=p.hasAttribute('data-lb-once')&&sessionStorage.getItem('lbp_'+p.id)}catch(e){}
 var dl=p.getAttribute('data-lb-delay');if(dl!==null&&dl!==''&&!seen)setTimeout(function(){showP(p)},(+dl)*1000);
 if(p.hasAttribute('data-lb-exit')&&!seen)d.addEventListener('mouseout',function x(e){if(!e.relatedTarget&&e.clientY<10){showP(p);d.removeEventListener('mouseout',x)}});
 p.addEventListener('click',function(e){if(e.target===p||e.target.closest('[data-lb-close]')){e.preventDefault();p.classList.remove('lb-show')}})});
d.addEventListener('click',function(e){var o=e.target.closest('[data-lb-open]');if(!o)return;e.preventDefault();var p=d.getElementById(o.getAttribute('data-lb-open'));if(p)showP(p)});
all('[data-lb-totop]').forEach(function(b){var f=function(){b.classList.toggle('lb-show',W.scrollY>400)};W.addEventListener('scroll',f,{passive:true});f();b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();W.scrollTo({top:0,behavior:'smooth'})})});
all('[data-lb-cookie]').forEach(function(c){try{if(localStorage.getItem('lb_cookie_ok'))c.classList.add('lb-hidden')}catch(e){}c.addEventListener('click',function(e){if(e.target.closest('[data-lb-accept]')){e.preventDefault();try{localStorage.setItem('lb_cookie_ok',1)}catch(x){}c.classList.add('lb-hidden')}})});
all('[data-lb-countdown]').forEach(function(c){var end=new Date(c.getAttribute('data-lb-countdown')).getTime();function tick(){var s=Math.max(0,Math.floor((end-Date.now())/1000)),v={d:Math.floor(s/86400),h:Math.floor(s%86400/3600),m:Math.floor(s%3600/60),s:s%60};all('[data-lb-cd]',c).forEach(function(x){var k=x.getAttribute('data-lb-cd');x.textContent=k==='d'?v.d:('0'+v[k]).slice(-2)})}tick();setInterval(tick,1000)});
function labelOf(el,i){var l=el.closest('label'),t='';if(l)Array.prototype.forEach.call(l.childNodes,function(n){if(n.nodeType===3)t+=n.textContent});t=(t||el.placeholder||el.getAttribute('aria-label')||('Field '+(i+1))).replace(/\\*/g,'').trim();return t}
all('[data-lb-booking]').forEach(function(bk){var c=jattr(bk,'data-lb-booking')||{};
 var cal=bk.querySelector('[data-lb-bkcal]'),sl=bk.querySelector('[data-lb-bkslots]'),f=bk.querySelector('form'),sum=bk.querySelector('[data-lb-bksum]');if(!cal||!sl||!f)return;
 var days=c.days||[1,2,3,4,5],st=c.start||'10:00',en=c.end||'17:00',step=+c.step||30,ahead=+c.ahead||30,dur=+c.duration||30,notice=(+c.notice||0)*3600000,busy={},fid=f.getAttribute('data-lb-form-id'),blocked=c.blocked||[],maxd=+c.maxPerDay||0,perDay={};
 var MN=['January','February','March','April','May','June','July','August','September','October','November','December'],WD=['SUN','MON','TUE','WED','THU','FRI','SAT'],WL=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 var today=new Date();today.setHours(0,0,0,0);var last=new Date(today.getTime()+ahead*86400000),view=new Date(today.getFullYear(),today.getMonth(),1),pick=null;
 function pad(n){return ('0'+n).slice(-2)}function iso(x){return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())}
 function ok(x){var k=iso(x);return x>=today&&x<=last&&days.indexOf(x.getDay())>=0&&blocked.indexOf(k)<0&&!(maxd&&(perDay[k]||0)>=maxd)}
 function times(x){var a=st.split(':'),b=en.split(':'),t=(+a[0])*60+(+a[1]),te=(+b[0])*60+(+b[1]),now=new Date(),r=[];for(;t+dur<=te;t+=step){var s2=new Date(x.getFullYear(),x.getMonth(),x.getDate(),Math.floor(t/60),t%60),lb=pad(Math.floor(t/60))+':'+pad(t%60);if(s2.getTime()>now.getTime()+notice&&!busy[iso(x)+' '+lb])r.push(lb)}return r}
 function draw(){var y=view.getFullYear(),m=view.getMonth(),fd=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate(),h='<div class="lbw-bk-mh"><b>'+MN[m]+' <span>'+y+'</span></b><div><button type="button" data-p="-1" aria-label="Previous month">‹</button><button type="button" data-p="1" aria-label="Next month">›</button></div></div><div class="lbw-bk-grid">';
  WD.forEach(function(w){h+='<i>'+w+'</i>'});for(var i=0;i<fd;i++)h+='<span></span>';
  for(var k=1;k<=n;k++){var x=new Date(y,m,k),on=ok(x)&&times(x).length>0;h+='<button type="button" data-d="'+iso(x)+'" class="'+(on?'on':'')+(pick&&iso(pick)===iso(x)?' sel':'')+(iso(x)===iso(today)?' today':'')+'"'+(on?'':' disabled')+'>'+k+'</button>'}
  cal.innerHTML=h+'</div>';
  Array.prototype.forEach.call(cal.querySelectorAll('[data-p]'),function(b){b.onclick=function(){view=new Date(y,m+(+b.getAttribute('data-p')),1);draw()}});
  Array.prototype.forEach.call(cal.querySelectorAll('[data-d]'),function(b){b.onclick=function(){var q=b.getAttribute('data-d').split('-');pick=new Date(+q[0],+q[1]-1,+q[2]);draw();slots()}})}
 function slots(){if(!pick){sl.innerHTML='<p class="lbw-bk-hint">Pick a date to see available times</p>';return}
  var r=times(pick),h='<div class="lbw-bk-day">'+WL[pick.getDay()]+' <b>'+pick.getDate()+'</b></div>';r.forEach(function(t){h+='<button type="button" data-t="'+t+'">'+t+'</button>'});
  if(!r.length)h+='<p class="lbw-bk-hint">No times left on this day</p>';sl.innerHTML=h;
  Array.prototype.forEach.call(sl.querySelectorAll('[data-t]'),function(b){b.onclick=function(){choose(b.getAttribute('data-t'))}})}
 function choose(t){var set=function(n,v){var x=f.querySelector('[name="'+n+'"]');if(!x){x=d.createElement('input');x.type='hidden';x.name=n;f.appendChild(x)}x.value=v};
  set('date',iso(pick));set('time',t);set('duration',dur+' min');
  if(sum)sum.textContent=WL[pick.getDay()]+', '+pick.getDate()+' '+MN[pick.getMonth()]+' '+pick.getFullYear()+' · '+t+' · '+dur+' min'+(c.tz?' · '+c.tz:'');bk.classList.add('lb-step2')}
 bk.addEventListener('click',function(e){if(e.target.closest('[data-lb-bkback]')){e.preventDefault();bk.classList.remove('lb-step2')}});
 var fs=null;for(var z=0;z<=ahead&&!fs;z++){var cand=new Date(today.getTime()+z*86400000);if(ok(cand)&&times(cand).length)fs=cand}
 if(fs){pick=fs;view=new Date(fs.getFullYear(),fs.getMonth(),1)}draw();slots();
 if(W.LB_LEAD_URL&&fid&&W.fetch)fetch(W.LB_LEAD_URL,{method:'POST',body:JSON.stringify({action:'busy',formId:fid})}).then(function(r){return r.json()}).then(function(j){(j.busy||[]).forEach(function(x){busy[x]=1;var dk=x.split(' ')[0];perDay[dk]=(perDay[dk]||0)+1});if(pick&&!times(pick).length)pick=null;draw();slots()}).catch(function(){});
 f.addEventListener('submit',function(){var dv=f.querySelector('[name=date]'),tv=f.querySelector('[name=time]');if(dv&&tv)busy[dv.value+' '+tv.value]=1},true)});
function post(u,o){try{if(u&&W.fetch)return fetch(u,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(o)}).catch(function(){})}catch(x){}return Promise.resolve()}
function fillT(t,data){return String(t||'').replace(/\\{\\{\\s*([\\w-]+)\\s*\\}\\}/g,function(m,k){return data[k]!=null?data[k]:''})}
function phoneOf(data){for(var k in data){if(/phone|tel|mobile|whats/i.test(k))return String(data[k])}return ''}
function jattr(f,a){try{return JSON.parse(f.getAttribute(a)||'null')}catch(x){return null}}
function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
d.addEventListener('submit',function(e){var f=e.target;if(!f.hasAttribute||!f.hasAttribute('data-lb-form'))return;e.preventDefault();
 var btn=f.querySelector('[type=submit]'),pay=jattr(f,'data-lb-pay'),wa=jattr(f,'data-lb-wa'),hook=f.getAttribute('data-lb-webhook');
 if(pay&&!(+pay.amount>0))pay=null;
 var lead=f.__lead;
 if(!lead){var data={};Array.prototype.forEach.call(f.elements,function(el,i){if(!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)||/^(submit|button|reset|file|password)$/.test(el.type))return;var k=el.name||labelOf(el,i);
  if(el.type==='checkbox'||el.type==='radio'){if(el.checked)data[k]=data[k]?data[k]+', '+(el.value==='on'?'Yes':el.value):(el.value==='on'?'Yes':el.value)}else if(el.value!=='')data[k]=el.value});
  lead={lid:'L'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),form:f.getAttribute('data-lb-form')||'Form',formId:f.getAttribute('data-lb-form-id')||'',page:cur,url:location.href,data:data,ts:Date.now()};
  if(pay)lead.payment={status:'pending',amount:+pay.amount,mode:pay.mode,currency:'INR'};
  if(wa&&wa.hook){var ph=phoneOf(data).replace(/\\D/g,'');if(ph.length===10)ph=String(wa.cc||'91')+ph;lead.whatsapp={to:ph,message:fillT(wa.msg,data)}}
  if(W.LB_PREVIEW)parent.postMessage({lb:'lead',lead:lead},'*');
  if(W.LB_LEAD_URL)post(W.LB_LEAD_URL,{action:'lead',lead:Object.assign({site:W.LB_SITE||''},lead)});
  try{if(W.fbq)fbq('track','Lead');if(W.gtag){gtag('event','generate_lead');if(W.LB_ADS)gtag('event','conversion',{send_to:W.LB_ADS})}if(W.dataLayer)W.dataLayer.push({event:'lb_lead'})}catch(_){}
  post(hook,{event:'lead.created',lead:lead});
  if(pay)f.__lead=lead}
 var mail=jattr(f,'data-lb-mail');
 var sendMail=function(){if(!mail)return;var dt=lead.data,to='',rows='';for(var k in dt){if(!to&&/mail/i.test(k))to=dt[k];rows+='<tr><td style="padding:6px 12px;border:1px solid #eee;font-weight:600">'+esc(k)+'</td><td style="padding:6px 12px;border:1px solid #eee">'+esc(dt[k])+'</td></tr>'}
  var vars={};for(var k2 in dt)vars[k2]=esc(dt[k2]);vars.form=esc(lead.form);vars.page=esc(lead.page);vars.all_fields='<table style="border-collapse:collapse">'+rows+'</table>';
  vars.amount=lead.payment?lead.payment.amount:'';vars.payment_id=lead.payment?(lead.payment.id||lead.payment.ref||''):'';
  var nl=String.fromCharCode(10),html=function(t){return fillT(t,vars).split(nl).join('<br>')};
  var send=function(toAddr,subj,body){if(!toAddr)return;var msg={to_email:toAddr,subject:fillT(subj,vars),message:html(body),from_name:mail.from||'',reply_to:mail.reply||''};
   if(mail.p==='emailjs'&&mail.s&&mail.t&&mail.k&&W.fetch)fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service_id:mail.s,template_id:mail.t,user_id:mail.k,template_params:msg})}).catch(function(){});
   else if(mail.hook)post(mail.hook,{event:'email.send',to:msg.to_email,subject:msg.subject,html:msg.message,from:msg.from_name,replyTo:msg.reply_to,lead:lead})};
  if(mail.auto)send(to,mail.subj,mail.body);
  if(mail.owner)send(mail.owner,mail.osubj||'New lead: {{name}}','New submission on <b>{{form}}</b>'+nl+nl+'{{all_fields}}')};
 var sendWA=function(){if(wa&&wa.hook&&lead.whatsapp)post(wa.hook,{event:'whatsapp.send',to:lead.whatsapp.to,message:lead.whatsapp.message,name:lead.data.name||'',lead:lead})};
 var done=function(){if(btn)btn.disabled=false;var r=f.getAttribute('data-lb-redirect');if(r){if(W.LB_PREVIEW&&!/^(https?:)?\\/\\//i.test(r))parent.postMessage({lb:'nav',href:r},'*');else location.href=r;return}
  var m=d.createElement('div');m.className='lbw-ok';m.textContent=f.getAttribute('data-lb-success')||'Thank you! We will be in touch soon.';f.reset();f.style.display='none';
  var pp=f.parentNode.querySelector('.lbw-pay');if(pp)pp.remove();f.parentNode.insertBefore(m,f.nextSibling)};
 if(!pay){sendWA();sendMail();done();return}
 var paid=function(pm){lead.payment=Object.assign({},lead.payment,pm,{ts:Date.now()});f.__lead=null;
  if(W.LB_PREVIEW)parent.postMessage({lb:'lead-pay',lid:lead.lid,payment:lead.payment},'*');
  if(W.LB_LEAD_URL)post(W.LB_LEAD_URL,{action:'leadpay',lid:lead.lid,payment:lead.payment});
  try{var amt=+(lead.payment&&lead.payment.amount)||0;if(W.fbq)fbq('track','Purchase',{value:amt,currency:'INR'});if(W.gtag)gtag('event','purchase',{value:amt,currency:'INR'});if(W.dataLayer)W.dataLayer.push({event:'lb_purchase',value:amt})}catch(_){}
  post(hook,{event:'payment.'+pm.status,lead:lead});sendWA();sendMail();done()};
 var amt=(+pay.amount).toLocaleString('en-IN');
 if(pay.mode==='razorpay'&&pay.key){if(btn)btn.disabled=true;
  var go=function(){if(btn)btn.disabled=false;try{var o=new W.Razorpay({key:pay.key,amount:Math.round(+pay.amount*100),currency:'INR',name:pay.payee||'Payment',description:pay.desc||lead.form,
   prefill:{name:lead.data.name||'',email:lead.data.email||'',contact:phoneOf(lead.data)},notes:{form:lead.form,lead_id:lead.lid},theme:{color:pay.color||'#4f46e5'},
   handler:function(r){paid({status:'paid',id:r.razorpay_payment_id,mode:'razorpay'})}});
   if(o.on)o.on('payment.failed',function(r){alert('Payment failed: '+((r.error&&r.error.description)||'please try again'))});o.open()}catch(x){alert('Razorpay could not start: '+x.message)}};
  if(W.Razorpay)go();else{var sc=d.createElement('script');sc.src='https://checkout.razorpay.com/v1/checkout.js';sc.onload=go;sc.onerror=function(){if(btn)btn.disabled=false;alert('Could not load Razorpay. Check your internet connection.')};d.head.appendChild(sc)}
  return}
 var old=f.parentNode.querySelector('.lbw-pay');if(old)old.remove();
 var box=d.createElement('div');box.className='lbw-pay';
 var upi=pay.mode==='upi'&&pay.upi?'upi://pay?pa='+encodeURIComponent(pay.upi)+'&pn='+encodeURIComponent(pay.payee||'Payee')+'&am='+(+pay.amount)+'&cu=INR&tn='+encodeURIComponent((pay.desc||lead.form).slice(0,40)):'';
 box.innerHTML='<b class="lbw-pay-t">Pay ₹'+amt+' to complete your registration</b>'+(upi?'<p>Scan with any UPI app, or tap the button on your phone.</p><img alt="UPI QR code" width="200" height="200" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data='+encodeURIComponent(upi)+'"><a class="lbw-paybtn" href="'+esc(upi)+'">Pay with GPay / PhonePe / Paytm</a><div class="lbw-upi">UPI ID: <b>'+esc(pay.upi)+'</b></div>'
  :'<p>The payment page opened in a new tab. Finish paying there, then come back here.</p><a class="lbw-paybtn" target="_blank" rel="noopener" href="'+esc(pay.link||'#')+'">Open payment page again</a>')
  +'<input class="lbw-utr" placeholder="Payment reference / UTR (optional)"><button type="button" class="lbw-paid">I have paid</button><button type="button" class="lbw-back">← Change my details</button>';
 f.style.display='none';f.parentNode.insertBefore(box,f.nextSibling);
 if(pay.mode==='link'&&pay.link)W.open(pay.link,'_blank','noopener');
 box.querySelector('.lbw-paid').onclick=function(){paid({status:'claimed',mode:pay.mode,ref:box.querySelector('.lbw-utr').value})};
 box.querySelector('.lbw-back').onclick=function(){box.remove();f.style.display=''};
},true);
})();`;

const ok = (v) => /^[A-Za-z0-9_-]{3,40}$/.test(v || "");
const tracking = (c) => [
  ok(c.gtm) && `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${c.gtm}');</script>`,
  ok(c.ga) && `<script async src="https://www.googletagmanager.com/gtag/js?id=${c.ga}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${c.ga}');</script>`,
  ok(c.ads) && `${ok(c.ga) ? "" : `<script async src="https://www.googletagmanager.com/gtag/js?id=${c.ads}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());</script>`}<script>gtag('config','${c.ads}');window.LB_ADS=${JSON.stringify(c.ads + (c.adsLabel && /^[A-Za-z0-9_-]{2,60}$/.test(c.adsLabel) ? "/" + c.adsLabel : ""))};</script>`,
  ok(c.pixel) && `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${c.pixel}');fbq('track','PageView');</script>`,
].filter(Boolean).join("");

export const readCfg = (doc) => { const s = doc.getElementById("lb-settings"); try { return s ? JSON.parse(s.textContent || "{}") : {}; } catch { return {}; } };

/**
 * Build the final HTML for a page.
 * mode "blob": uploaded videos point at in-browser blob URLs (Preview)
 * mode "zip":  uploaded videos become files in assets/ (Export)
 */
export async function finalize(html, { mode = "zip", preview = false, page = "index.html", hash = "", leadUrl = "", site = "", pixels = null } = {}) {
  const doc = new DOMParser().parseFromString(html, "text/html"), head = doc.head, files = [];
  const cfg = readCfg(doc);
  doc.getElementById("lb-settings") && doc.getElementById("lb-settings").remove();
  doc.querySelectorAll("#lb-style,#lb-tools,#lb-ind").forEach((n) => n.remove());

  head.insertAdjacentHTML("afterbegin", `<script>document.documentElement.classList.add('lb-run')</script>`);
  const css = doc.createElement("style"); css.id = "lb-widgets"; css.textContent = WIDGET_CSS + "\n" + SITE_CSS;
  head.insertBefore(css, head.querySelector("style,link[rel=stylesheet]"));
  if (!preview) { const px = pixels || {}; head.insertAdjacentHTML("beforeend", tracking({ ...cfg, ga: cfg.ga || px.ga4, pixel: cfg.pixel || px.meta, gtm: cfg.gtm || px.gtm, ads: cfg.ads || px.ads, adsLabel: cfg.adsLabel || px.adsLabel })); }
  if (cfg.schema && cfg.schema.trim()) head.insertAdjacentHTML("beforeend", `<script type="application/ld+json">${cfg.schema}</script>`);
  if (!preview && cfg.head) head.insertAdjacentHTML("beforeend", cfg.head);

  for (const n of doc.querySelectorAll("[data-lb-asset]")) {
    const id = n.getAttribute("data-lb-asset");
    if (mode === "blob") { const u = await assetUrl(id); u && n.setAttribute("src", u); continue; }
    const rec = await getAsset(id).catch(() => null); if (!rec) continue;
    const name = `assets/${id}.${extOf(rec)}`;
    if (!files.some((f) => f.name === name)) files.push({ name, data: new Uint8Array(await rec.blob.arrayBuffer()) });
    n.setAttribute("src", name); n.removeAttribute("data-lb-asset");
  }

  const body = doc.body;
  if (leadUrl) { const s = doc.createElement("script"); s.textContent = `window.LB_LEAD_URL=${JSON.stringify(leadUrl)};window.LB_SITE=${JSON.stringify(site)};`; body.appendChild(s); }
  if (preview) { const s = doc.createElement("script"); s.textContent = `window.LB_PREVIEW=1;window.LB_PAGE=${JSON.stringify(page)};window.LB_HASH=${JSON.stringify(hash)};`; body.appendChild(s); }
  const rt = doc.createElement("script"); rt.id = "lb-runtime"; rt.textContent = RUNTIME; body.appendChild(rt);
  if (cfg.js && cfg.js.trim()) { const s = doc.createElement("script"); s.textContent = cfg.js.replace(/<\/script/gi, "<\\/script"); body.appendChild(s); }
  return { html: "<!DOCTYPE html>\n" + doc.documentElement.outerHTML, files };
}

/* ==================== draggable elements library + page templates ==================== */
// The element library shown in the "Add" panel, plus ready-made page templates.
// Colors use var(--lb-primary) so "Site → Global colors" restyles every element at once.
const P = "var(--lb-primary,#4f46e5)";
const INK = "#16142b", MUTED = "#5f5b7d";
const img = (w, h, t, bg = "ebe8ff", fg = "4f46e5") => `https://placehold.co/${w}x${h}/${bg}/${fg}?text=${encodeURIComponent(t)}`;
const btn = (t, href = "#", ghost) => `<a href="${href}" style="display:inline-block;padding:14px 26px;border-radius:10px;font-weight:600;text-decoration:none;${ghost ? "border:1.5px solid currentColor;color:inherit" : `background:${P};color:#fff`}">${t}</a>`;
const wrap = (inner, st = "", name = "") => `<section${name ? ` data-lb-name="${name}"` : ""} style="padding:84px 24px;${st}"><div style="max-width:1140px;margin:0 auto">${inner}</div></section>`;
const h2 = (t, sub = "", center = true) => `<div style="${center ? "text-align:center;max-width:680px;margin:0 auto 48px" : "margin-bottom:36px"}"><h2 style="font-size:38px;line-height:1.15;margin:0 0 12px;color:${INK};letter-spacing:-.02em">${t}</h2>${sub ? `<p style="font-size:17px;line-height:1.65;color:${MUTED};margin:0">${sub}</p>` : ""}</div>`;
const grid = (n, items, gap = 24) => `<div class="lbw-stack" style="display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:${gap}px">${items}</div>`;
const card = (inner, st = "") => `<div class="lb-h-lift" style="background:#fff;border:1px solid #ecebf5;border-radius:18px;padding:28px;${st}">${inner}</div>`;
const INP = "display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:13px 14px;border:1px solid #d9d7e8;border-radius:10px;font:inherit;font-size:15px;background:#fff;color:#16142b";
const LBL = "display:block;font-size:14px;font-weight:600;margin-bottom:14px;color:#2b2846";
export const field = (l, n, t = "text", req = true, extra = "") =>
  t === "textarea" ? `<label style="${LBL}">${l}${req ? " *" : ""}<textarea name="${n}" rows="4"${req ? " required" : ""} style="${INP}"${extra}></textarea></label>`
    : t === "select" ? `<label style="${LBL}">${l}${req ? " *" : ""}<select name="${n}"${req ? " required" : ""} style="${INP}"><option value="">Choose…</option><option>Option 1</option><option>Option 2</option></select></label>`
      : t === "checkbox" ? `<label style="${LBL};display:flex;gap:10px;align-items:center;font-weight:500"><input type="checkbox" name="${n}"${req ? " required" : ""} style="width:18px;height:18px">${l}</label>`
        : `<label style="${LBL}">${l}${req ? " *" : ""}<input type="${t}" name="${n}"${req ? " required" : ""} style="${INP}"${extra}></label>`;
const submit = (t) => `<button type="submit" style="width:100%;padding:15px;border:0;border-radius:10px;background:${P};color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer">${t}</button>`;
const form = (name, fields, b, ok, st = "") => `<form data-lb-form="${name}" data-lb-success="${ok}" style="${st}">${fields}${submit(b)}</form>`;
const stars = (n = 5) => `<div style="color:#f5a524;font-size:18px;letter-spacing:2px">${"★".repeat(n)}${"☆".repeat(5 - n)}</div>`;
const svgIcon = (d, c = P, s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const ico = { bolt: "M13 2L4 14h7l-1 8 9-12h-7z", heart: "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.6A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z", shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", chart: "M5 20V10M12 20V4M19 20v-7", star: "M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z", globe: "M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18" };
const iconBubble = (d) => `<div style="width:52px;height:52px;border-radius:14px;background:#efedff;display:grid;place-items:center;margin-bottom:18px">${svgIcon(d)}</div>`;
const SOC = `<div style="display:flex;gap:10px">${[["f", "Facebook"], ["in", "LinkedIn"], ["ig", "Instagram"], ["yt", "YouTube"], ["x", "X"]].map(([t, n]) => `<a href="#" aria-label="${n}" style="width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(127,120,200,.15);color:inherit;text-decoration:none;font-weight:700;font-size:13px">${t}</a>`).join("")}</div>`;
const NAVLINKS = [["Home", "index.html"], ["About", "about.html"], ["Services", "services.html"], ["Contact", "contact.html"]];
const navA = (st = "") => NAVLINKS.map(([t, f]) => `<a href="${f}" style="${st}">${t}</a>`).join("");

/* [icon, name, html, extra search words] grouped by category */
/* placeholder for "pick a saved calendar / form" elements */
const SLOT = (attr, ic, name, msg) => `<div data-lb-${attr}="" data-lb-name="${name}" style="padding:44px 24px;border:2px dashed #c7d2fe;border-radius:18px;background:#f8faff;text-align:center;color:#4b5563;font-family:system-ui,sans-serif"><div style="font-size:34px">${ic}</div><b style="display:block;font-size:18px;color:#111827;margin:6px 0">${name}</b><span style="font-size:14px">${msg}</span></div>`;
/* Booking calendar element (Cal.com-style). Built from a Calendar event (or defaults).
   In the editor it shows a static preview; on the live site it's interactive. */
const LOC = { meet: "📹 Google Meet", zoom: "📹 Zoom", phone: "📞 Phone call", whatsapp: "💬 WhatsApp call", inperson: "📍 In person" };
export function bookingWidget(ev = {}, integ = null) {
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const e = { name: "Book a free demo", org: "Your brand", desc: "A 30-minute call to understand your goals and show you how we can help. Bring your questions!", duration: 30, location: "meet", locationNote: "",
    days: [1, 2, 3, 4, 5], start: "10:00", end: "17:00", step: 30, ahead: 30, notice: 0, tz: "Asia/Kolkata", fields: { phone: true, notes: true }, success: "✅ You're booked! A confirmation is on its way.", color: "", ...ev };
  const now = new Date(), y = now.getFullYear(), m = now.getMonth(), fd = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
  const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let grid = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((w) => `<i>${w}</i>`).join("") + "<span></span>".repeat(fd);
  for (let k = 1; k <= n; k++) { const wd = new Date(y, m, k).getDay(), on = k >= now.getDate() && (e.days || []).includes(wd); grid += `<button type="button" class="${on ? "on" : ""}${k === now.getDate() ? " today" : ""}"${on ? "" : " disabled"}>${k}</button>`; }
  const [sh, sm] = (e.start || "10:00").split(":").map(Number), [eh, em2] = (e.end || "17:00").split(":").map(Number), times = [];
  for (let t = sh * 60 + sm; t + (+e.duration || 30) <= eh * 60 + em2 && times.length < 8; t += +e.step || 30) times.push(String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"));
  const cfg = esc(JSON.stringify({ duration: +e.duration || 30, days: e.days, start: e.start, end: e.end, step: +e.step || 30, ahead: +e.ahead || 30, notice: +e.notice || 0, tz: e.tz, blocked: e.blocked || [], maxPerDay: +e.maxPerDay || 0 }));
  const F = (l, nm, t = "text", r = true) => `<label>${esc(l)}${r ? " *" : ""}<input type="${t}" name="${nm}"${r ? " required" : ""}></label>`;
  const f = e.fields || {};
  /* payment / WhatsApp / email automation — same settings as Forms */
  const ig = integ || {}, gp = ig.pay || {}, p = e.pay || {}, amt = +p.amount || 0, payOn = p.enabled && amt > 0;
  const payCfg = payOn ? { amount: amt, mode: p.mode || "razorpay", key: p.key || gp.razorpayKey || "", upi: p.upi || gp.upiId || "", payee: p.payee || gp.payee || e.org || e.name, link: p.link || "", desc: e.name, color: e.color || "#3d6bff" } : null;
  const gw = ig.wa || {}, waCfg = e.wa && e.wa.enabled && (e.wa.hook || gw.webhook) ? { hook: e.wa.hook || gw.webhook, msg: e.wa.msg || "Hi {{name}}, your booking for {{date}} at {{time}} is confirmed!", cc: gw.country || "91" } : null;
  const ge = ig.email || {}, mailOk = ge.provider === "emailjs" ? !!(ge.serviceId && ge.templateId && ge.publicKey) : !!ge.webhook;
  const mailCfg = e.email && e.email.enabled && mailOk ? { p: ge.provider, s: ge.serviceId, t: ge.templateId, k: ge.publicKey, hook: ge.webhook, from: ge.fromName || e.org || e.name, reply: ge.ownerEmail || "", auto: true,
    subj: e.email.subject || "Confirmed: " + e.name + " on {{date}} at {{time}}", body: e.email.body || "Hi {{name}},\n\nYour booking is confirmed for {{date}} at {{time}} (" + (e.duration || 30) + " min).\n\nSee you then!\n" + (ge.fromName || e.org || ""), owner: e.email.notify ? ge.ownerEmail || "" : "", osubj: "New booking: {{name}} — {{date}} {{time}}" } : null;
  const attrs = (e.redirect ? ` data-lb-redirect="${esc(e.redirect)}"` : "") + (payCfg ? ` data-lb-pay="${esc(JSON.stringify(payCfg))}"` : "") + (waCfg ? ` data-lb-wa="${esc(JSON.stringify(waCfg))}"` : "") + (mailCfg ? ` data-lb-mail="${esc(JSON.stringify(mailCfg))}"` : "");
  const C = e.color ? ` style="--lb-primary:${esc(e.color)}"` : "";
  return `<div class="lbw-book" data-lb-name="Booking: ${esc(e.name)}" data-lb-booking="${cfg}"${e.id ? ` data-lb-event="${esc(e.id)}"` : ""}${C}>
<div class="lbw-bk-info"><div class="lbw-bk-logo">${esc((e.org || e.name || "B").trim()[0] || "B").toUpperCase()}</div><span class="lbw-bk-org">${esc(e.org || "")}</span><h3>${esc(e.name)}</h3><p>${esc(e.desc || "")}</p>
<div class="lbw-bk-meta">🕒 ${+e.duration || 30} min</div><div class="lbw-bk-meta">${LOC[e.location] || LOC.meet}${e.locationNote ? " · " + esc(e.locationNote) : ""}</div><div class="lbw-bk-meta">🌐 ${esc(e.tz || "")}</div>${payOn ? `<div class="lbw-bk-meta">💳 ₹${amt.toLocaleString("en-IN")}</div>` : ""}</div>
<div class="lbw-bk-cal" data-lb-bkcal><div class="lbw-bk-mh"><b>${MN[m]} <span>${y}</span></b><div><button type="button">‹</button><button type="button">›</button></div></div><div class="lbw-bk-grid">${grid}</div></div>
<div class="lbw-bk-slots" data-lb-bkslots><div class="lbw-bk-day">Available times</div>${times.map((t) => `<button type="button">${t}</button>`).join("")}</div>
<form class="lbw-bk-form" data-lb-form="Booking: ${esc(e.name)}"${e.id ? ` data-lb-form-id="${esc(e.id)}"` : ""} data-lb-success="${esc(e.success || "")}"${attrs}><button type="button" class="lbw-bk-back" data-lb-bkback>← Back</button><div class="lbw-bk-sum" data-lb-bksum>Your selected date &amp; time appear here</div>
${F("Your name", "name")}${F("Email address", "email", "email")}${f.phone ? F("WhatsApp number", "phone", "tel") : ""}${f.company ? F("Company", "company", "text", false) : ""}${f.custom ? F(f.custom, "custom", "text", false) : ""}${(e.questions || []).filter((q) => q.label).map((q, i) => { const nm = "q" + (i + 1) + "_" + String(q.label).toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24), r = q.required ? " required" : "";
  return q.type === "textarea" ? `<label>${esc(q.label)}${q.required ? " *" : ""}<textarea name="${nm}" rows="3"${r}></textarea></label>` : q.type === "select" ? `<label>${esc(q.label)}${q.required ? " *" : ""}<select name="${nm}"${r}><option value="">Choose…</option>${String(q.options || "").split(",").map((o) => o.trim()).filter(Boolean).map((o) => `<option>${esc(o)}</option>`).join("")}</select></label>` : F(q.label, nm, q.type === "number" ? "number" : "text", !!q.required); }).join("")}${f.notes ? '<label>What would you like to discuss?<textarea name="notes" rows="3"></textarea></label>' : ""}
<button type="submit">${payOn ? `${esc(e.button || "Confirm")} &amp; pay ₹${amt.toLocaleString("en-IN")}` : esc(e.button || "Confirm booking")}</button></form></div>`;
}
/* a full page that shows only the booking calendar (public booking link) */
const escB = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const bookingPageHtml = (ev, integ) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escB(ev.name)}${ev.org ? " — " + escB(ev.org) : ""}</title><meta name="description" content="${escB(ev.desc || "")}"><style>body{margin:0;min-height:100vh;background:#f3f4f8;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:32px 16px;box-sizing:border-box}</style></head><body><div style="width:100%;max-width:1100px">${bookingWidget(ev, integ)}<p style="text-align:center;color:#8a8ea3;font-size:12px;margin-top:16px">Powered by LaunchBuilder</p></div></body></html>`;

export const LIB = [
  ["Layout", [
    ["section", "Section", '<section data-lb-ph style="padding:72px 24px"></section>', "wrapper block"],
    ["container", "Container", '<div data-lb-ph style="max-width:1140px;margin:0 auto;padding:24px"></div>', "boxed inner section"],
    ["columns", "2 Columns", '<div class="lbw-stack" style="display:flex;gap:28px;flex-wrap:wrap"><div data-lb-ph style="flex:1 1 300px"></div><div data-lb-ph style="flex:1 1 300px"></div></div>', "row inner section"],
    ["columns3", "3 Columns", '<div class="lbw-stack" style="display:flex;gap:24px;flex-wrap:wrap"><div data-lb-ph style="flex:1 1 220px"></div><div data-lb-ph style="flex:1 1 220px"></div><div data-lb-ph style="flex:1 1 220px"></div></div>', "row"],
    ["grid", "Grid 4", '<div class="lbw-stack" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px"><div data-lb-ph></div><div data-lb-ph></div><div data-lb-ph></div><div data-lb-ph></div></div>', "cards"],
    ["sidebar", "Content + sidebar", `<div class="lbw-stack" style="display:flex;gap:40px;max-width:1140px;margin:0 auto;padding:48px 24px;align-items:flex-start"><main data-lb-ph style="flex:1 1 0"></main><aside data-lb-name="Sidebar" style="flex:0 0 300px;position:sticky;top:90px;display:grid;gap:20px">${card(`<h4 style="margin:0 0 10px;color:${INK}">Search</h4><input placeholder="Search…" style="${INP}">`, "padding:20px")}${card(`<h4 style="margin:0 0 10px;color:${INK}">Categories</h4><a href="#" style="display:block;padding:6px 0;color:${MUTED};text-decoration:none">Design</a><a href="#" style="display:block;padding:6px 0;color:${MUTED};text-decoration:none">Marketing</a><a href="#" style="display:block;padding:6px 0;color:${MUTED};text-decoration:none">Growth</a>`, "padding:20px")}</aside></div>`, "sticky sidebar widgets"],
    ["spacer", "Spacer", '<div data-lb-name="Spacer" style="height:48px"></div>', "gap"],
    ["divider", "Divider", '<hr style="border:0;border-top:1px solid #e7e5f2;margin:24px 0">', "line separator"],
  ]],
  ["Basic", [
    ["heading", "Heading", `<h2 style="font-size:38px;font-weight:800;margin:0;padding:8px 0;color:${INK};line-height:1.15;letter-spacing:-.02em">Your headline</h2>`, "title h1 h2"],
    ["text", "Text", `<p style="font-size:17px;line-height:1.7;color:${MUTED};margin:0;padding:6px 0">Write something here. Double-click to edit text directly on the page.</p>`, "paragraph text block"],
    ["button", "Button", `<div style="padding:6px 0">${btn("Click me")}</div>`, "cta"],
    ["button", "Button group", `<div style="display:flex;gap:12px;flex-wrap:wrap;padding:6px 0">${btn("Get started")}<a href="#" style="display:inline-block;padding:14px 26px;border-radius:10px;font-weight:600;text-decoration:none;border:1.5px solid #d9d7e8;color:${INK}">Learn more</a></div>`, "two buttons"],
    ["link", "Hyperlink", `<p style="margin:0;padding:6px 0"><a href="#" style="color:${P};font-weight:600;text-decoration:underline;text-underline-offset:3px">Read more</a></p>`, "anchor"],
    ["star", "Icon", `<div style="padding:6px 0">${svgIcon(ico.star, P, 40)}</div>`, "svg"],
    ["card", "Icon box", card(`${iconBubble(ico.bolt)}<h3 style="font-size:20px;margin:0 0 8px;color:${INK}">Fast setup</h3><p style="margin:0;color:${MUTED};line-height:1.6">Explain this feature in one or two clear sentences.</p>`), "feature"],
    ["check", "Checklist", '<ul style="list-style:none;padding:0;margin:0"><li style="padding:7px 0">✅ Item one</li><li style="padding:7px 0">✅ Item two</li><li style="padding:7px 0">✅ Item three</li></ul>', "list bullets"],
    ["quote", "Quote", `<blockquote style="margin:0;padding:8px 0 8px 22px;border-left:4px solid ${P};font-size:22px;line-height:1.5;color:${INK};font-style:italic">“A short quote that supports your message.”<footer style="font-size:14px;font-style:normal;color:${MUTED};margin-top:10px">— Name, Company</footer></blockquote>`, "blockquote"],
    ["badge", "Badge", `<span style="display:inline-block;padding:6px 14px;border-radius:999px;background:#efedff;color:${P};font-weight:600;font-size:13px">New</span>`, "label pill"],
    ["code", "Table", `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:15px"><thead><tr style="background:#f6f5ff"><th style="text-align:left;padding:12px;border-bottom:1px solid #e7e5f2">Plan</th><th style="text-align:left;padding:12px;border-bottom:1px solid #e7e5f2">Price</th><th style="text-align:left;padding:12px;border-bottom:1px solid #e7e5f2">Users</th></tr></thead><tbody><tr><td style="padding:12px;border-bottom:1px solid #f0eff7">Starter</td><td style="padding:12px;border-bottom:1px solid #f0eff7">₹499</td><td style="padding:12px;border-bottom:1px solid #f0eff7">1</td></tr><tr><td style="padding:12px">Pro</td><td style="padding:12px">₹1,499</td><td style="padding:12px">5</td></tr></tbody></table></div>`, "data"],
  ]],
  ["Header & menus", [
    ["header", "Header + menu", `<header class="lbw-header" data-lb-name="Header" style="position:sticky;top:0;z-index:40;background:rgba(255,255,255,.96);border-bottom:1px solid #ecebf3;backdrop-filter:blur(8px)"><div style="max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px"><a href="index.html" data-lb-name="Logo" style="font-weight:800;font-size:22px;color:${INK};text-decoration:none;letter-spacing:-.02em">Brand<span style="color:${P}">.</span></a><nav class="lbw-nav" data-lb-autonav data-lb-name="Primary menu">${navA()}</nav><div style="display:flex;gap:10px;align-items:center"><a href="contact.html" class="lb-hide-m" style="display:inline-block;padding:10px 20px;border-radius:10px;background:${P};color:#fff;font-weight:600;text-decoration:none">Get started</a><button class="lbw-burger" data-lb-burger aria-label="Open menu">☰</button></div></div></header>`, "navbar sticky header mobile menu logo primary"],
    ["menu", "Nav menu", `<nav class="lbw-nav" data-lb-autonav data-lb-name="Menu" style="padding:8px 0">${navA()}</nav>`, "navigation links primary secondary"],
    ["dropdown", "Dropdown menu", `<nav class="lbw-nav" data-lb-name="Dropdown menu" style="padding:8px 0"><a href="index.html">Home</a><div class="lbw-dd"><a href="#">Services ▾</a><div class="lbw-ddm"><a href="#">Web design</a><a href="#">SEO</a><a href="#">Ads management</a></div></div><a href="contact.html">Contact</a></nav>`, "submenu"],
    ["mega", "Mega menu", `<nav class="lbw-nav" data-lb-name="Mega menu" style="padding:8px 0"><a href="index.html">Home</a><div class="lbw-dd"><a href="#">Products ▾</a><div class="lbw-ddm lbw-mega">${["Marketing", "Sales", "Support"].map((g) => `<div><b style="display:block;margin:0 0 8px;color:${INK}">${g}</b><a href="#">Automation</a><a href="#">Analytics</a><a href="#">Integrations</a></div>`).join("")}</div></div><a href="contact.html">Contact</a></nav>`, "large dropdown"],
    ["menu", "Secondary menu", `<nav class="lbw-nav" data-lb-name="Secondary menu" style="gap:18px;font-size:13px;padding:8px 24px;background:#f6f5ff;color:${MUTED};justify-content:flex-end"><a href="#">Help</a><a href="#">Careers</a><a href="tel:+910000000000">📞 +91 00000 00000</a></nav>`, "top bar"],
    ["crumbs", "Breadcrumbs", `<nav aria-label="Breadcrumb" style="font-size:14px;color:${MUTED};padding:10px 0"><a href="index.html" style="color:${P};text-decoration:none">Home</a> <span style="margin:0 6px">/</span> <a href="#" style="color:${P};text-decoration:none">Blog</a> <span style="margin:0 6px">/</span> <span>Current page</span></nav>`, "path"],
    ["announce", "Announcement bar", `<div data-lb-name="Announcement bar" style="background:${INK};color:#fff;text-align:center;padding:11px 16px;font-size:14px;font-weight:500">🎉 Early-bird offer ends Sunday — <a href="#" style="color:#ffd27a;font-weight:700">Register now</a></div>`, "top notice"],
    ["heading", "Page title", `<section data-lb-name="Page title" style="padding:72px 24px 56px;background:#f6f5ff;text-align:center"><nav style="font-size:14px;color:${MUTED};margin-bottom:12px"><a href="index.html" style="color:${P};text-decoration:none">Home</a> / About</nav><h1 style="font-size:46px;margin:0;color:${INK};letter-spacing:-.02em">About us</h1></section>`, "banner title breadcrumbs"],
    ["footer", "Footer", `<footer data-lb-name="Footer" style="background:${INK};color:#c9c6e6;padding:64px 24px 28px"><div class="lbw-stack" style="max-width:1140px;margin:0 auto;display:grid;grid-template-columns:1.4fr 1fr 1fr 1.2fr;gap:36px"><div><div style="font-weight:800;font-size:22px;color:#fff;margin-bottom:12px">Brand<span style="color:#a99fff">.</span></div><p style="margin:0 0 18px;line-height:1.7">One line about your business and who you help.</p>${SOC}</div><div><b style="color:#fff;display:block;margin-bottom:12px">Pages</b><nav data-lb-autonav data-lb-name="Footer menu" style="display:grid;gap:8px">${navA("color:#c9c6e6;text-decoration:none")}</nav></div><div><b style="color:#fff;display:block;margin-bottom:12px">Legal</b><div style="display:grid;gap:8px"><a href="privacy-policy.html" style="color:#c9c6e6;text-decoration:none">Privacy policy</a><a href="terms.html" style="color:#c9c6e6;text-decoration:none">Terms &amp; conditions</a></div></div><div><b style="color:#fff;display:block;margin-bottom:12px">Contact</b><div style="line-height:1.9">✉️ hello@yourbrand.com<br>📞 +91 00000 00000<br>📍 Your city, India</div></div></div><div style="max-width:1140px;margin:40px auto 0;padding-top:22px;border-top:1px solid rgba(255,255,255,.12);font-size:13px;text-align:center">© 2026 Brand. All rights reserved.</div></footer>`, "footer menu social contact information"],
    ["menu", "Footer menu", `<nav data-lb-autonav data-lb-name="Footer menu" style="display:flex;gap:22px;flex-wrap:wrap;justify-content:center;padding:16px 0">${navA(`color:${MUTED};text-decoration:none`)}</nav>`, "links"],
    ["share", "Social links", `<div style="padding:6px 0;color:${INK}">${SOC}</div>`, "social media icons"],
    ["logo", "Logo", `<a href="index.html" data-lb-name="Logo" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:${INK};font-weight:800;font-size:22px"><span style="width:34px;height:34px;border-radius:10px;background:${P};display:inline-block"></span>Brand</a>`, "brand"],
  ]],
  ["Media", [
    ["image", "Image", `<img src="${img(1200, 700, "Image")}" alt="" style="max-width:100%;border-radius:14px;display:block">`, "picture photo"],
    ["gallery", "Image gallery", `<div data-lb-gallery class="lbw-stack" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px">${[1, 2, 3, 4, 5, 6].map((i) => `<img src="${img(600, 600, "Photo " + i)}" alt="" class="lb-h-grow" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;display:block">`).join("")}</div>`, "photos grid portfolio"],
    ["slider", "Slider", `<div data-lb-slider="5000" class="lbw-slider" style="border-radius:20px"><div data-lb-track>${["Slide one", "Slide two", "Slide three"].map((t, i) => `<div style="min-height:420px;display:flex;align-items:center;padding:56px;background:linear-gradient(120deg,${["#3b2fd6,#7c6cff", "#0f766e,#22c1a1", "#b4235a,#f0628f"][i]});color:#fff"><div><h2 style="font-size:44px;margin:0 0 12px">${t}</h2><p style="font-size:18px;opacity:.9;margin:0">Describe this slide.</p></div></div>`).join("")}</div><button data-lb-prev aria-label="Previous" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.9);cursor:pointer;font-size:18px">‹</button><button data-lb-next aria-label="Next" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.9);cursor:pointer;font-size:18px">›</button><div data-lb-dots></div></div>`, "carousel hero slider"],
    ["video", "Video", `<div data-lb-video style="position:relative;padding-top:56.25%;border-radius:16px;overflow:hidden;background:#15132b"><div data-lb-vph style="position:absolute;inset:0;display:grid;place-items:center;color:#cfcaff;font:600 15px system-ui,sans-serif;text-align:center;padding:20px">▶<br>Select this block, then add a YouTube / Vimeo link<br>or upload a video from your computer</div></div>`, "youtube vimeo mp4 upload embed"],
    ["bg", "Background section", `<section data-lb-name="Background section" style="position:relative;padding:120px 24px;background-image:linear-gradient(rgba(16,14,40,.55),rgba(16,14,40,.55)),url('${img(1600, 800, "Background", "3a3370", "8e86d6")}');background-size:cover;background-position:center;color:#fff;text-align:center"><h2 style="font-size:48px;margin:0 0 14px">Big statement on a photo</h2><p style="font-size:18px;opacity:.9;margin:0 0 26px">Change the background in Style → Background.</p>${btn("Get started")}</section>`, "background image overlay parallax"],
    ["pin", "Google map", `<div data-lb-map="Connaught Place, New Delhi" style="border-radius:16px;overflow:hidden;height:380px"><iframe src="https://maps.google.com/maps?q=Connaught%20Place%2C%20New%20Delhi&z=14&output=embed" loading="lazy" style="width:100%;height:100%;border:0"></iframe></div>`, "location map address"],
    ["image", "Logo strip", `<div style="display:flex;flex-wrap:wrap;gap:40px;justify-content:center;align-items:center;padding:24px 0;opacity:.7">${[1, 2, 3, 4, 5].map((i) => `<img src="${img(160, 60, "Logo " + i, "ffffff", "8e8aa8")}" alt="" style="height:40px">`).join("")}</div>`, "clients brands partners"],
  ]],
  ["Marketing", [
    ["hero", "Hero", `<section data-lb-name="Hero" style="padding:110px 24px 96px;background:radial-gradient(1000px 500px at 80% -10%,#e4e0ff,transparent),#fbfaff"><div class="lbw-stack" style="max-width:1140px;margin:0 auto;display:flex;gap:48px;align-items:center"><div style="flex:1.1 1 0"><span style="display:inline-block;padding:6px 14px;border-radius:999px;background:#efedff;color:${P};font-weight:600;font-size:13px;margin-bottom:18px">New: live workshop</span><h1 style="font-size:56px;line-height:1.05;margin:0 0 18px;color:${INK};letter-spacing:-.03em">Grow your business with a page that converts</h1><p style="font-size:19px;line-height:1.6;color:${MUTED};margin:0 0 30px">Tell visitors what you offer and why it matters, in one sentence.</p><div style="display:flex;gap:12px;flex-wrap:wrap">${btn("Get started")}<a href="#" style="display:inline-block;padding:14px 26px;border-radius:10px;font-weight:600;text-decoration:none;color:${INK};border:1.5px solid #d9d7e8">Watch demo</a></div></div><div style="flex:1 1 0"><img src="${img(800, 640, "Product image")}" alt="" style="width:100%;border-radius:22px;display:block;box-shadow:0 30px 80px -20px rgba(40,30,120,.35)"></div></div></section>`, "hero section banner header"],
    ["hero", "Hero centered", `<section data-lb-name="Hero" style="padding:120px 24px;text-align:center;background:${INK};color:#fff"><h1 style="font-size:60px;line-height:1.05;margin:0 auto 18px;max-width:820px;letter-spacing:-.03em">5X your revenue with a better landing page</h1><p style="font-size:19px;opacity:.8;margin:0 auto 30px;max-width:620px">One clear line about what you do.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">${btn("Start free trial")}<a href="#" style="display:inline-block;padding:14px 26px;border-radius:10px;font-weight:600;text-decoration:none;color:#fff;border:1.5px solid rgba(255,255,255,.4)">Join live demo</a></div></section>`, "hero dark"],
    ["cta", "Call to action", wrap(`<div style="background:linear-gradient(120deg,#3b2fd6,#7c6cff);border-radius:24px;padding:56px;display:flex;gap:28px;align-items:center;justify-content:space-between;flex-wrap:wrap;color:#fff"><div><h2 style="font-size:34px;margin:0 0 8px">Ready to get started?</h2><p style="margin:0;opacity:.85;font-size:17px">Join 2,000+ businesses already growing with us.</p></div><a href="#" style="display:inline-block;padding:15px 28px;border-radius:10px;background:#fff;color:#3b2fd6;font-weight:700;text-decoration:none">Book a free call</a></div>`, "padding:48px 24px", "Call to action"), "cta banner"],
    ["announce", "Banner", `<div data-lb-name="Banner" style="display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:22px 28px;border-radius:16px;background:#fff7e6;border:1px solid #ffe2a8"><div><b style="color:#7a4b00">Limited seats left</b><div style="color:#8a6a2c;font-size:14px">Registration closes in 48 hours.</div></div>${btn("Reserve my seat")}</div>`, "notice promo"],
    ["card", "Cards", wrap(grid(3, [1, 2, 3].map((i) => `<div class="lb-h-lift" style="background:#fff;border:1px solid #ecebf5;border-radius:18px;overflow:hidden"><img src="${img(600, 360, "Card " + i)}" alt="" style="width:100%;display:block"><div style="padding:22px"><h3 style="margin:0 0 8px;font-size:19px;color:${INK}">Card title ${i}</h3><p style="margin:0 0 14px;color:${MUTED};line-height:1.6">A short description of this item.</p><a href="#" style="color:${P};font-weight:600;text-decoration:none">Learn more</a></div></div>`).join("")), "", "Cards"), "card grid"],
    ["briefcase", "Services", wrap(h2("What we do", "Pick the services that fit your goals.") + grid(3, [["bolt", "Web design"], ["chart", "Performance ads"], ["globe", "SEO"], ["heart", "Branding"], ["shield", "Maintenance"], ["star", "Consulting"]].map(([i, t]) => card(`${iconBubble(ico[i])}<h3 style="font-size:20px;margin:0 0 8px;color:${INK}">${t}</h3><p style="margin:0;color:${MUTED};line-height:1.6">One or two sentences about this service.</p>`)).join("")), "background:#fbfaff", "Services"), "features services section"],
    ["tag", "Pricing table", wrap(h2("Simple pricing", "No hidden fees. Cancel anytime.") + grid(3, [["Starter", "₹499", false], ["Pro", "₹1,499", true], ["Agency", "₹3,999", false]].map(([n, p, hot]) => `<div class="lb-h-lift" style="background:${hot ? INK : "#fff"};color:${hot ? "#fff" : INK};border:1px solid ${hot ? INK : "#ecebf5"};border-radius:20px;padding:32px;position:relative">${hot ? `<span style="position:absolute;top:18px;right:18px;background:${P};color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px">Popular</span>` : ""}<div style="font-weight:700;font-size:18px">${n}</div><div style="font-size:44px;font-weight:800;margin:14px 0 4px;letter-spacing:-.02em">${p}<span style="font-size:15px;font-weight:500;opacity:.6">/mo</span></div><ul style="list-style:none;padding:0;margin:20px 0 26px;line-height:2.1;opacity:.9"><li>✓ Unlimited pages</li><li>✓ Custom domain</li><li>✓ Lead forms</li></ul><a href="#" style="display:block;text-align:center;padding:14px;border-radius:10px;font-weight:700;text-decoration:none;background:${hot ? P : "#efedff"};color:${hot ? "#fff" : INK}">Choose ${n}</a></div>`).join("")), "", "Pricing"), "plans price"],
    ["chat", "Testimonials", wrap(h2("Loved by our customers") + grid(3, [1, 2, 3].map((i) => card(`${stars()}<p style="font-size:16px;line-height:1.7;color:${INK};margin:14px 0 20px">“This changed how we get leads. Setup took one afternoon.”</p><div style="display:flex;gap:12px;align-items:center"><img src="${img(96, 96, "C" + i, "dcd8ff")}" alt="" style="width:44px;height:44px;border-radius:50%"><div><b style="display:block;color:${INK}">Customer ${i}</b><span style="font-size:13px;color:${MUTED}">Founder, Company</span></div></div>`)).join("")), "background:#fbfaff", "Testimonials"), "reviews quotes clients"],
    ["star", "Reviews", `<div data-lb-name="Reviews" style="display:flex;gap:28px;align-items:center;flex-wrap:wrap;padding:24px;border-radius:18px;background:#fff;border:1px solid #ecebf5"><div style="text-align:center"><div style="font-size:48px;font-weight:800;color:${INK}">4.9</div>${stars()}<div style="font-size:13px;color:${MUTED}">from 1,240 reviews</div></div><div style="flex:1;min-width:220px;display:grid;gap:8px">${[92, 6, 1, 1, 0].map((v, i) => `<div style="display:flex;gap:10px;align-items:center;font-size:13px;color:${MUTED}"><span>${5 - i}★</span><div style="flex:1;height:8px;border-radius:8px;background:#f0eff7;overflow:hidden"><div style="width:${v}%;height:100%;background:#f5a524"></div></div><span>${v}%</span></div>`).join("")}</div></div>`, "ratings stars product reviews"],
    ["users", "Team members", wrap(h2("Meet the team") + grid(4, ["Aarav", "Diya", "Kabir", "Meera"].map((n) => `<div class="lb-h-lift" style="text-align:center"><img src="${img(400, 400, n, "dcd8ff")}" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:18px;display:block;margin-bottom:14px"><b style="display:block;color:${INK};font-size:17px">${n}</b><span style="color:${MUTED};font-size:14px">Role</span></div>`).join("")), "", "Team"), "people staff"],
    ["user", "Author box", `<div data-lb-name="Author box" style="display:flex;gap:18px;padding:22px;border-radius:18px;background:#fff;border:1px solid #ecebf5;align-items:flex-start"><img src="${img(160, 160, "You", "dcd8ff")}" alt="" style="width:76px;height:76px;border-radius:50%;object-fit:cover"><div><b style="font-size:18px;color:${INK}">Your name</b><div style="color:${MUTED};line-height:1.6;margin:4px 0 10px">Short bio goes here. Who you are and what you teach.</div>${SOC}</div></div>`, "profile card bio"],
    ["gallery", "Portfolio", wrap(h2("Selected work") + grid(3, [1, 2, 3, 4, 5, 6].map((i) => `<a href="#" class="lb-h-lift" style="display:block;text-decoration:none;color:${INK}"><img src="${img(700, 520, "Project " + i)}" alt="" style="width:100%;border-radius:16px;display:block"><b style="display:block;margin-top:12px">Project ${i}</b><span style="color:${MUTED};font-size:14px">Category</span></a>`).join("")), "", "Portfolio"), "projects showcase case studies"],
    ["chart", "Stats / counters", wrap(grid(4, [["12000", "+", "Happy customers"], ["98", "%", "Satisfaction"], ["350", "+", "Projects"], ["24", "/7", "Support"]].map(([n, s, l]) => `<div style="text-align:center"><div data-lb-count="${n}" data-lb-suffix="${s}" style="font-size:46px;font-weight:800;color:${INK};letter-spacing:-.02em">${Number(n).toLocaleString("en-IN")}${s}</div><div style="color:${MUTED}">${l}</div></div>`).join("")), "padding:56px 24px", "Statistics"), "counter numbers statistics"],
    ["progress", "Progress bars", `<div data-lb-name="Progress bars" style="display:grid;gap:18px">${[["Design", 92], ["Marketing", 80], ["Development", 70]].map(([t, v]) => `<div><div style="display:flex;justify-content:space-between;font-weight:600;color:${INK};margin-bottom:8px"><span>${t}</span><span>${v}%</span></div><div style="height:10px;border-radius:10px;background:#efedff;overflow:hidden"><div data-lb-progress="${v}" style="width:${v}%;height:100%;border-radius:10px;background:${P}"></div></div></div>`).join("")}</div>`, "skills bar"],
    ["timeline", "Timeline", `<div data-lb-name="Timeline" style="position:relative;padding-left:32px;border-left:2px solid #e4e0ff;display:grid;gap:30px">${[["2019", "Started"], ["2022", "10,000 customers"], ["2026", "Going global"]].map(([y, t]) => `<div style="position:relative"><span style="position:absolute;left:-42px;top:2px;width:18px;height:18px;border-radius:50%;background:${P};border:4px solid #fff;box-shadow:0 0 0 2px #e4e0ff"></span><b style="color:${P}">${y}</b><h4 style="margin:4px 0 6px;font-size:19px;color:${INK}">${t}</h4><p style="margin:0;color:${MUTED};line-height:1.6">What happened at this step.</p></div>`).join("")}</div>`, "history steps process"],
    ["clock", "Countdown", `<div data-lb-countdown="2026-12-31T18:00" data-lb-name="Countdown" style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">${[["d", "Days"], ["h", "Hours"], ["m", "Minutes"], ["s", "Seconds"]].map(([k, l]) => `<div style="min-width:92px;padding:18px 10px;border-radius:16px;background:${INK};color:#fff;text-align:center"><div data-lb-cd="${k}" style="font-size:38px;font-weight:800">00</div><div style="font-size:12px;opacity:.7">${l}</div></div>`).join("")}</div>`, "timer offer deadline"],
  ]],
  ["Interactive", [
    ["accordion", "FAQ / Accordion", `<div data-lb-name="FAQ" style="display:grid;gap:10px">${["How does it work?", "Can I cancel anytime?", "Do you offer support?"].map((q) => `<details class="lbw-acc" style="padding:18px 22px;border:1px solid #ecebf5;border-radius:14px;background:#fff"><summary style="font-weight:700;color:${INK};font-size:17px">${q}</summary><p style="color:${MUTED};line-height:1.7;margin:12px 0 0">Write a clear, helpful answer here.</p></details>`).join("")}</div>`, "faq questions toggle"],
    ["tabs", "Tabs", `<div data-lb-tabs data-lb-name="Tabs"><div class="lbw-tabbar"><button data-lb-tab type="button">Overview</button><button data-lb-tab type="button">Features</button><button data-lb-tab type="button">Pricing</button></div>${["Overview", "Features", "Pricing"].map((t) => `<div data-lb-pane style="color:${MUTED};line-height:1.7"><h3 style="margin:0 0 8px;color:${INK}">${t}</h3><p style="margin:0">Content for the ${t.toLowerCase()} tab.</p></div>`).join("")}</div>`, "tabbed content"],
    ["popup", "Popup", `<div data-lb-popup id="offer-popup" data-lb-delay="5" data-lb-once data-lb-name="Popup" style="display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(16,14,40,.6)"><div style="position:relative;background:#fff;border-radius:22px;padding:40px;max-width:440px;width:100%;text-align:center"><button data-lb-close aria-label="Close" style="position:absolute;top:12px;right:14px;border:0;background:none;font-size:26px;cursor:pointer;color:${MUTED}">×</button><h3 style="font-size:28px;margin:0 0 10px;color:${INK}">Wait! Get 20% off</h3><p style="color:${MUTED};margin:0 0 20px">Join the list and get your code instantly.</p>${form("Popup offer", field("Email", "email", "email"), "Send my code", "Check your inbox!")}</div></div>`, "modal lightbox exit intent"],
    ["up", "Back to top", `<a href="#" data-lb-totop aria-label="Back to top" style="position:fixed;right:22px;bottom:92px;z-index:90;width:46px;height:46px;border-radius:50%;background:${INK};color:#fff;display:grid;place-items:center;text-decoration:none;font-size:20px;box-shadow:0 10px 24px rgba(0,0,0,.2)">↑</a>`, "scroll top"],
    ["phone", "WhatsApp button", `<a data-lb-wa href="https://wa.me/919999999999?text=Hi%2C%20I%27m%20interested" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" style="position:fixed;right:22px;bottom:22px;z-index:90;width:58px;height:58px;border-radius:50%;background:#25d366;display:grid;place-items:center;box-shadow:0 12px 28px rgba(37,211,102,.45)"><svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a15 15 0 0 1-1.5-.6 12 12 0 0 1-4.7-4.1 5.3 5.3 0 0 1-1.1-2.8c0-1.4.7-2 1-2.3a1 1 0 0 1 .7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6a8.5 8.5 0 0 0 1.6 2 7.6 7.6 0 0 0 2.3 1.4c.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3a2.3 2.3 0 0 1-.1 1.3z"/></svg></a>`, "chat floating whatsapp"],
    ["cookie", "Cookie banner", `<div data-lb-cookie data-lb-name="Cookie banner" style="position:fixed;left:20px;right:20px;bottom:20px;z-index:95;max-width:640px;margin:0 auto;background:${INK};color:#e9e7ff;border-radius:16px;padding:18px 20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;box-shadow:0 20px 50px rgba(0,0,0,.3)"><span style="flex:1;min-width:220px;font-size:14px;line-height:1.5">We use cookies to improve your experience. <a href="privacy-policy.html" style="color:#a99fff">Privacy policy</a></span><button data-lb-accept type="button" style="border:0;border-radius:10px;padding:10px 18px;background:#fff;color:${INK};font-weight:700;cursor:pointer">Accept</button></div>`, "consent gdpr"],
    ["loader", "Preloader", `<div data-lb-preloader data-lb-name="Preloader" style="display:grid;place-items:center;min-height:140px;background:#fff"><div style="width:44px;height:44px;border-radius:50%;border:4px solid #efedff;border-top-color:${P};animation:lbspin .8s linear infinite"></div><style>@keyframes lbspin{to{transform:rotate(360deg)}}</style></div>`, "loading spinner"],
  ]],
  ["Forms & calendars", [
    ["form", "Lead form", form("Lead form", field("Name", "name") + field("Email", "email", "email") + field("WhatsApp number", "phone", "tel"), "Register now", "Thanks! We'll contact you on WhatsApp shortly.", "max-width:520px"), "register signup leads crm"],
    ["mail", "Contact form", `<div data-lb-name="Contact form" style="background:#fff;border:1px solid #ecebf5;border-radius:20px;padding:32px;max-width:620px">${h2("Get in touch", "We reply within one working day.", false)}${form("Contact form", `<div class="lbw-stack" style="display:flex;gap:14px"><div style="flex:1">${field("Name", "name")}</div><div style="flex:1">${field("Email", "email", "email")}</div></div>${field("Phone", "phone", "tel", false)}${field("Message", "message", "textarea")}`, "Send message", "Message sent. We'll get back to you soon.")}</div>`, "enquiry"],
    ["mail", "Newsletter", `<div data-lb-name="Newsletter" style="background:#f6f5ff;border-radius:20px;padding:36px;text-align:center"><h3 style="font-size:26px;margin:0 0 8px;color:${INK}">Get weekly tips</h3><p style="color:${MUTED};margin:0 0 18px">One email a week. Unsubscribe anytime.</p><form data-lb-form="Newsletter" data-lb-success="You're subscribed!" style="display:flex;gap:10px;max-width:460px;margin:0 auto;flex-wrap:wrap"><input type="email" name="email" required placeholder="you@example.com" style="${INP};flex:1;min-width:200px;margin:0"><button type="submit" style="padding:13px 22px;border:0;border-radius:10px;background:${P};color:#fff;font:inherit;font-weight:700;cursor:pointer">Subscribe</button></form></div>`, "subscription email signup"],
    ["lock", "Login form", `<div data-lb-name="Login form" style="max-width:400px;margin:0 auto;background:#fff;border:1px solid #ecebf5;border-radius:20px;padding:32px"><h3 style="margin:0 0 18px;font-size:24px;color:${INK}">Log in</h3><form data-lb-form="Login" data-lb-success="Login needs a member backend. This form is a design placeholder.">${field("Email", "email", "email")}<label style="${LBL}">Password *<input type="password" required style="${INP}"></label>${submit("Log in")}</form><p style="text-align:center;color:${MUTED};font-size:14px;margin:14px 0 0">No account? <a href="#" style="color:${P}">Register</a></p></div>`, "sign in member"],
    ["user", "Registration form", `<div data-lb-name="Registration form" style="max-width:460px;margin:0 auto;background:#fff;border:1px solid #ecebf5;border-radius:20px;padding:32px"><h3 style="margin:0 0 18px;font-size:24px;color:${INK}">Create your account</h3>${form("Registration", field("Full name", "name") + field("Email", "email", "email") + field("Phone", "phone", "tel") + field("I agree to the terms", "terms", "checkbox"), "Register", "Registration received!")}</div>`, "signup register"],
    ["search", "Search bar", `<form role="search" data-lb-name="Search bar" style="display:flex;gap:8px;max-width:520px"><input type="search" name="q" placeholder="Search…" style="${INP};margin:0;flex:1"><button type="submit" style="padding:0 20px;border:0;border-radius:10px;background:${P};color:#fff;font:inherit;font-weight:700;cursor:pointer">Search</button></form>`, "search box"],
    ["calendar", "Calendar", SLOT("calendar", "📅", "Calendar", "Select this block, then pick one of your calendars in the left panel."), "calendar booking appointment schedule meeting demo call slot calendly"],
    ["form", "Saved form", SLOT("formslot", "📝", "Form", "Select this block, then pick one of your saved forms in the left panel."), "form saved my forms linked lead crm"],
    ["code", "CRM form embed", `<div data-lb-embed data-lb-name="Form embed" style="border-radius:16px;overflow:hidden;background:#f6f5ff;min-height:200px"><div data-lb-eph style="padding:40px;text-align:center;color:#6b6890;font:500 14px system-ui,sans-serif">Select this block, then paste your CRM form link or embed code<br>(e.g. your Lead Generation form URL)</div></div>`, "iframe embed crm external form"],
    ["code", "HTML embed", `<div data-lb-html data-lb-name="HTML embed" style="padding:24px;background:#f6f5ff;border-radius:12px;text-align:center;color:#6b6890">Custom HTML — select it and paste your code in Content</div>`, "custom code script widget"],
  ]],
  ["Blog", [
    ["doc", "Blog posts", wrap(h2("Latest articles") + grid(3, [1, 2, 3].map((i) => `<article class="lb-h-lift" style="background:#fff;border:1px solid #ecebf5;border-radius:18px;overflow:hidden"><img src="${img(600, 360, "Post " + i)}" alt="" style="width:100%;display:block"><div style="padding:22px"><span style="font-size:12px;font-weight:700;color:${P}">Marketing</span><h3 style="margin:8px 0;font-size:19px;color:${INK};line-height:1.35">How to write a headline that converts</h3><p style="margin:0 0 14px;color:${MUTED};line-height:1.6;font-size:15px">A two-line summary of the article.</p><span style="font-size:13px;color:${MUTED}">Oct 2026 · 5 min read</span></div></article>`).join("")), "", "Blog posts"), "articles archive news"],
    ["doc", "Blog post", `<article data-lb-name="Blog post" style="max-width:740px;margin:0 auto;padding:64px 24px"><span style="font-size:13px;font-weight:700;color:${P}">Marketing</span><h1 style="font-size:44px;line-height:1.15;margin:10px 0 14px;color:${INK};letter-spacing:-.02em">Article title goes here</h1><p style="color:${MUTED};margin:0 0 28px">By Your Name · 12 Oct 2026 · 6 min read</p><img src="${img(1400, 700, "Cover image")}" alt="" style="width:100%;border-radius:18px;display:block;margin-bottom:28px"><p style="font-size:18px;line-height:1.8;color:#2b2846">Start your article here. Keep paragraphs short and easy to read.</p><h2 style="font-size:28px;margin:32px 0 12px;color:${INK}">A clear subheading</h2><p style="font-size:18px;line-height:1.8;color:#2b2846">More content.</p></article>`, "single post article"],
    ["tag", "Categories & tags", `<div data-lb-name="Tags" style="display:flex;gap:8px;flex-wrap:wrap">${["Design", "SEO", "Ads", "AI", "Growth", "Tips"].map((t) => `<a href="#" style="padding:7px 14px;border-radius:999px;background:#f2f0ff;color:${P};text-decoration:none;font-size:14px;font-weight:600">#${t}</a>`).join("")}</div>`, "tags categories"],
    ["pages", "Pagination", `<nav aria-label="Pagination" style="display:flex;gap:6px;justify-content:center;padding:20px 0">${["‹", "1", "2", "3", "›"].map((t, i) => `<a href="#" style="min-width:42px;height:42px;display:grid;place-items:center;border-radius:10px;text-decoration:none;font-weight:600;${i === 1 ? `background:${P};color:#fff` : `border:1px solid #e7e5f2;color:${INK}`}">${t}</a>`).join("")}</nav>`, "pages next previous"],
    ["doc", "Related posts", `<div data-lb-name="Related posts"><h3 style="font-size:22px;color:${INK};margin:0 0 16px">Related posts</h3>${grid(2, [1, 2].map((i) => `<a href="#" style="display:flex;gap:14px;align-items:center;text-decoration:none;color:${INK}"><img src="${img(200, 140, "Post")}" alt="" style="width:110px;border-radius:10px"><b style="line-height:1.4">Related article title number ${i}</b></a>`).join(""), 18)}</div>`, "more posts"],
    ["chat", "Comments section", `<div data-lb-name="Comments" style="max-width:740px"><h3 style="font-size:22px;color:${INK};margin:0 0 18px">2 comments</h3>${["Riya", "Arjun"].map((n) => `<div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid #f0eff7"><img src="${img(80, 80, n[0], "dcd8ff")}" alt="" style="width:42px;height:42px;border-radius:50%"><div><b style="color:${INK}">${n}</b> <span style="font-size:13px;color:${MUTED}">2 days ago</span><p style="margin:6px 0 0;color:#2b2846;line-height:1.6">Great article, thanks for sharing!</p></div></div>`).join("")}<h4 style="margin:24px 0 12px;color:${INK}">Leave a comment</h4>${form("Comment", field("Name", "name") + field("Comment", "comment", "textarea"), "Post comment", "Thanks! Your comment is awaiting review.")}</div>`, "discussion reply"],
  ]],
  ["Shop", [
    ["box", "Product card", `<div class="lb-h-lift" data-lb-name="Product card" style="max-width:320px;background:#fff;border:1px solid #ecebf5;border-radius:18px;overflow:hidden"><div style="position:relative"><img src="${img(640, 640, "Product")}" alt="" style="width:100%;display:block"><a href="#" aria-label="Add to wishlist" style="position:absolute;top:12px;right:12px;width:38px;height:38px;border-radius:50%;background:#fff;display:grid;place-items:center;text-decoration:none;color:#e0245e">♥</a></div><div style="padding:18px"><div style="font-size:13px;color:${MUTED}">Category</div><b style="display:block;font-size:17px;color:${INK};margin:4px 0">Product name</b>${stars(4)}<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px"><span style="font-size:20px;font-weight:800;color:${INK}">₹1,299 <s style="font-size:14px;color:${MUTED};font-weight:500">₹1,799</s></span><a href="#" style="padding:9px 14px;border-radius:9px;background:${P};color:#fff;text-decoration:none;font-weight:600;font-size:14px">Add to cart</a></div></div></div>`, "woocommerce product wishlist"],
    ["grid", "Product grid", wrap(`<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px"><h2 style="margin:0;font-size:30px;color:${INK}">Shop</h2><div data-lb-name="Product filters" style="display:flex;gap:8px;flex-wrap:wrap">${["All", "New", "Best sellers", "Sale"].map((t, i) => `<a href="#" style="padding:8px 16px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;${i ? `border:1px solid #e7e5f2;color:${INK}` : `background:${INK};color:#fff`}">${t}</a>`).join("")}<select style="padding:8px 12px;border-radius:10px;border:1px solid #e7e5f2;font:inherit"><option>Sort: Popular</option><option>Price: low to high</option></select></div></div>` + grid(4, [1, 2, 3, 4].map((i) => `<div class="lb-h-lift" style="background:#fff;border:1px solid #ecebf5;border-radius:16px;overflow:hidden"><img src="${img(500, 500, "Product " + i)}" alt="" style="width:100%;display:block"><div style="padding:14px"><b style="color:${INK}">Product ${i}</b><div style="color:${P};font-weight:800;margin-top:4px">₹${999 + i * 200}</div></div></div>`).join(""), 18), "", "Products"), "categories filters shop store"],
    ["box", "Product page", wrap(`<div class="lbw-stack" style="display:flex;gap:48px;align-items:flex-start"><div style="flex:1 1 0"><img src="${img(900, 900, "Product photo")}" alt="" style="width:100%;border-radius:20px;display:block"></div><div style="flex:1 1 0"><span style="font-size:13px;color:${MUTED}">Home / Shop / Category</span><h1 style="font-size:38px;margin:10px 0;color:${INK}">Product name</h1>${stars(5)}<div style="font-size:30px;font-weight:800;color:${INK};margin:16px 0">₹2,499</div><p style="color:${MUTED};line-height:1.7">Describe what makes this product great.</p><div style="display:flex;gap:10px;margin:22px 0;flex-wrap:wrap"><a href="#" style="flex:1;text-align:center;padding:15px;border-radius:10px;background:${P};color:#fff;text-decoration:none;font-weight:700">Buy now</a><a href="#" style="padding:15px 18px;border-radius:10px;border:1px solid #e7e5f2;color:${INK};text-decoration:none">♡ Wishlist</a></div><div style="font-size:14px;color:${MUTED};line-height:1.9">🚚 Free shipping over ₹999<br>↩ 7-day returns</div></div></div>`, "", "Product page"), "single product woocommerce"],
    ["cart", "Cart summary", `<div data-lb-name="Cart" style="max-width:420px;background:#fff;border:1px solid #ecebf5;border-radius:18px;padding:24px"><h3 style="margin:0 0 14px;color:${INK}">Your cart</h3><div style="display:flex;justify-content:space-between;padding:10px 0;color:#2b2846"><span>Product × 1</span><b>₹1,299</b></div><div style="display:flex;justify-content:space-between;padding:10px 0;color:${MUTED};border-bottom:1px solid #f0eff7"><span>Shipping</span><span>Free</span></div><div style="display:flex;justify-content:space-between;padding:14px 0;font-size:18px;color:${INK}"><b>Total</b><b>₹1,299</b></div><a href="#" data-lb-name="Checkout button" style="display:block;text-align:center;padding:15px;border-radius:10px;background:${P};color:#fff;text-decoration:none;font-weight:700">Checkout</a></div>`, "shopping cart checkout"],
    ["card2", "Payment button", `<div style="padding:6px 0"><a href="https://rzp.io/l/your-link" target="_blank" rel="noopener" data-lb-name="Payment button" style="display:inline-flex;gap:10px;align-items:center;padding:15px 28px;border-radius:12px;background:#0b72e7;color:#fff;font-weight:700;text-decoration:none">Pay ₹21 securely</a><div style="font-size:12px;color:${MUTED};margin-top:8px">Paste your Razorpay / Stripe / UPI payment link in Content → Link</div></div>`, "payment gateway razorpay stripe upi checkout"],
  ]],
];
/* short, clear tile names (old names stay searchable) */
const SHORT = { "Breadcrumbs": "Page path", "Announcement bar": "Notice bar", "Background section": "Photo section", "Testimonials": "Reviews", "Newsletter": "Email signup",
  "Registration form": "Signup form", "Categories & tags": "Tags", "Pagination": "Page numbers", "Secondary menu": "Sub menu" };
LIB.forEach(([, items]) => items.forEach((it) => { const n = SHORT[it[1]]; if (n) { it[3] = ((it[3] || "") + " " + it[1]).toLowerCase(); it[1] = n; } }));


/* ---------- page templates (Pages → Add page) ---------- */
const shell = (title, body) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;font-family:Inter,system-ui,sans-serif;color:#16142b}</style></head><body>${body}</body></html>`;
const legal = (t) => `<section style="max-width:780px;margin:0 auto;padding:72px 24px;line-height:1.8;color:#2b2846"><h1 style="font-size:42px;margin:0 0 8px;color:${INK}">${t}</h1><p style="color:${MUTED};margin:0 0 32px">Last updated: November 2026</p><h2 style="font-size:22px;color:${INK}">1. Introduction</h2><p>Replace this text with your own ${t.toLowerCase()}. Have it reviewed by a legal professional for your business and country.</p><h2 style="font-size:22px;color:${INK}">2. Information we collect</h2><p>Describe what you collect and why.</p><h2 style="font-size:22px;color:${INK}">3. Contact</h2><p>Questions? Email hello@yourbrand.com.</p></section>`;
export const PAGE_TPLS = [
  ["blank", "Blank page", (n) => shell(n, `<section data-lb-ph style="padding:90px 24px"></section>`)],
  ["about", "About", (n) => shell(n, `<section style="padding:80px 24px;background:#f6f5ff;text-align:center"><h1 style="font-size:46px;margin:0 0 12px;color:${INK}">About us</h1><p style="color:${MUTED};font-size:18px;margin:0">Our story, our mission and the people behind it.</p></section>` + wrap(`<div class="lbw-stack" style="display:flex;gap:48px;align-items:center"><img src="${img(800, 600, "Our team")}" alt="" style="flex:1 1 0;min-width:0;width:100%;border-radius:20px"><div style="flex:1 1 0"><h2 style="font-size:34px;margin:0 0 14px;color:${INK}">Why we started</h2><p style="color:${MUTED};line-height:1.8">Tell your story here.</p></div></div>`))],
  ["services", "Services", (n) => shell(n, LIB[4][1][5][2])],
  ["contact", "Contact", (n) => shell(n, wrap(`<div class="lbw-stack" style="display:flex;gap:48px"><div style="flex:1 1 0">${h2("Contact us", "Call, email or send a message — we reply within a day.", false)}<p style="line-height:2;color:#2b2846">✉️ hello@yourbrand.com<br>📞 +91 00000 00000<br>📍 Your city, India</p></div><div style="flex:1 1 0">${form("Contact form", field("Name", "name") + field("Email", "email", "email") + field("Message", "message", "textarea"), "Send message", "Message sent!")}</div></div>`))],
  ["blog", "Blog", (n) => shell(n, LIB[7][1][0][2] + LIB[7][1][3][2])],
  ["thanks", "Thank you", (n) => shell(n, `<section style="min-height:70vh;display:grid;place-items:center;padding:60px 24px;text-align:center"><div><div style="font-size:64px">🎉</div><h1 style="font-size:44px;margin:10px 0;color:${INK}">You're registered!</h1><p style="color:${MUTED};font-size:18px;margin:0 0 26px">Check WhatsApp for your joining link.</p>${btn("Back to home", "index.html")}</div></section>`)],
  ["404", "404 error page", (n) => shell(n, `<section style="min-height:80vh;display:grid;place-items:center;padding:60px 24px;text-align:center"><div><div style="font-size:120px;font-weight:800;line-height:1;color:${P}">404</div><h1 style="font-size:32px;margin:12px 0;color:${INK}">This page doesn't exist</h1><p style="color:${MUTED};margin:0 0 26px">The link may be broken or the page was moved.</p>${btn("Go to home page", "index.html")}</div></section>`)],
  ["privacy", "Privacy policy", (n) => shell(n, legal("Privacy policy"))],
  ["terms", "Terms & conditions", (n) => shell(n, legal("Terms & conditions"))],
  ["sitemap", "Sitemap", (n) => shell(n, `<section style="max-width:780px;margin:0 auto;padding:72px 24px"><h1 style="font-size:42px;margin:0 0 20px;color:${INK}">Sitemap</h1><nav data-lb-autonav data-lb-name="Sitemap links" style="display:grid;gap:10px;font-size:18px">${navA(`color:${P}`)}</nav></section>`)],
];


/* ==================== Forms → HTML (used by Forms builder, editor "My forms", share link) ==================== */
const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const formHtml = (form, integ) => {
  const ig = integ || {}, gpay = ig.pay || {}, gwa = ig.wa || {};
  const s = { title: "", subtitle: "", submit: "Submit", success: "", redirect: "", webhook: "", color: "#4f46e5", radius: 10, style: "card", width: 560, ...(form.settings || {}) };
  const R = +s.radius || 0, C = s.color || "#4f46e5";
  const inp = `display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px 14px;border:1px solid #d9d7e8;border-radius:${R}px;font:inherit;font-size:15px;background:#fff;color:#16142b`;
  const lab = "display:block;font-size:14px;font-weight:600;color:#2b2846";
  const opt = "display:flex;gap:9px;align-items:center;font-size:15px;font-weight:500;color:#2b2846;margin-top:8px;cursor:pointer";
  const box = (f, inner) => `<div style="flex:1 1 ${f.width === "half" ? "calc(50% - 8px)" : "100%"};min-width:${f.width === "half" ? "200px" : "0"}">${inner}${f.help ? `<div style="font-size:12.5px;color:#77739a;margin-top:5px">${esc(f.help)}</div>` : ""}</div>`;
  const star = (f) => (f.required ? " *" : "");
  const one = (f) => {
    const n = esc(f.name || f.id), ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : "", rq = f.required ? " required" : "";
    switch (f.type) {
      case "heading": return box(f, `<div style="font-weight:700;font-size:17px;color:#16142b;padding-top:6px">${esc(f.label)}</div>`);
      case "textarea": return box(f, `<label style="${lab}">${esc(f.label)}${star(f)}<textarea name="${n}" rows="4"${ph}${rq} style="${inp}"></textarea></label>`);
      case "select": return box(f, `<label style="${lab}">${esc(f.label)}${star(f)}<select name="${n}"${rq} style="${inp}"><option value="">${esc(f.placeholder || "Choose…")}</option>${(f.options || []).map((o) => `<option>${esc(o)}</option>`).join("")}</select></label>`);
      case "radio": return box(f, `<div role="radiogroup"><span style="${lab}">${esc(f.label)}${star(f)}</span>${(f.options || []).map((o, i) => `<label style="${opt}"><input type="radio" name="${n}" value="${esc(o)}"${f.required && i === 0 ? " required" : ""} style="width:18px;height:18px;accent-color:${C}">${esc(o)}</label>`).join("")}</div>`);
      case "checkboxes": return box(f, `<div><span style="${lab}">${esc(f.label)}</span>${(f.options || []).map((o) => `<label style="${opt}"><input type="checkbox" name="${n}" value="${esc(o)}" style="width:18px;height:18px;accent-color:${C}">${esc(o)}</label>`).join("")}</div>`);
      case "consent": return box(f, `<label style="${opt};margin-top:0"><input type="checkbox" name="${n}"${rq} style="width:18px;height:18px;accent-color:${C}">${esc(f.label)}</label>`);
      default: return box(f, `<label style="${lab}">${esc(f.label)}${star(f)}<input type="${f.type}" name="${n}"${ph}${rq} style="${inp}"></label>`);
    }
  };
  /* payment step + WhatsApp automation (form setting first, then global Integrations) */
  const p = s.pay || {}, amt = +p.amount || 0, payOn = p.enabled && amt > 0;
  const payCfg = payOn ? { amount: amt, mode: p.mode || "razorpay", key: p.key || gpay.razorpayKey || "", upi: p.upi || gpay.upiId || "", payee: p.payee || gpay.payee || form.name, link: p.link || "", desc: p.desc || form.name, color: C } : null;
  const w = s.wa || {}, waHook = w.enabled ? w.hook || gwa.webhook || "" : "";
  const waCfg = waHook ? { hook: waHook, msg: w.msg || gwa.template || "", cc: gwa.country || "91" } : null;
  const ge = ig.email || {}, em = s.email || {};
  const mailOk = ge.provider === "emailjs" ? !!(ge.serviceId && ge.templateId && ge.publicKey) : !!ge.webhook;
  const mailCfg = em.enabled && mailOk && (em.auto !== false || em.notify) ? { p: ge.provider, s: ge.serviceId, t: ge.templateId, k: ge.publicKey, hook: ge.webhook, from: ge.fromName || form.name, reply: ge.ownerEmail || "",
    auto: em.auto !== false, subj: em.subject || "Thanks for registering, {{name}}!", body: em.body || "Hi {{name}},\n\nThank you! We received your details and will contact you soon.\n\nTeam " + (ge.fromName || form.name),
    owner: em.notify ? em.ownerEmail || ge.ownerEmail || "" : "", osubj: em.ownerSubject || "" } : null;
  const bt = { full: true, align: "center", size: "md", bg: "", fg: "#ffffff", note: true, extra: false, extraText: "Chat on WhatsApp", extraUrl: "", ...(s.btn || {}) };
  const pad = { sm: "10px 18px", md: "15px 22px", lg: "19px 28px" }[bt.size] || "15px 22px", fs = { sm: 14, md: 16, lg: 18 }[bt.size] || 16;
  const price = `₹${amt.toLocaleString("en-IN")}`, btnText = !payOn ? s.submit || "Submit" : !s.submit || s.submit === "Submit" ? `Register for ${price}` : s.submit.includes("₹") ? s.submit : `${s.submit} · ${price}`;
  const card = s.style === "card" ? `background:#fff;border:1px solid #ecebf5;border-radius:${R + 8}px;padding:32px;box-shadow:0 18px 50px -24px rgba(30,20,90,.25);` : "";
  return `<div data-lb-formbox="${esc(form.id)}" data-lb-name="Form: ${esc(form.name)}" style="max-width:${+s.width || 560}px;margin:0 auto;box-sizing:border-box;${card}">`
    + (s.title ? `<h3 style="margin:0 0 6px;font-size:26px;color:#16142b;letter-spacing:-.01em">${esc(s.title)}</h3>` : "")
    + (s.subtitle ? `<p style="margin:0 0 20px;color:#5f5b7d;line-height:1.6">${esc(s.subtitle)}</p>` : s.title ? `<div style="height:14px"></div>` : "")
    + `<form data-lb-form="${esc(form.name)}" data-lb-form-id="${esc(form.id)}" data-lb-success="${esc(s.success)}"${s.redirect ? ` data-lb-redirect="${esc(s.redirect)}"` : ""}${s.webhook ? ` data-lb-webhook="${esc(s.webhook)}"` : ""}${mailCfg ? ` data-lb-mail="${esc(JSON.stringify(mailCfg))}"` : ""}${payCfg ? ` data-lb-pay="${esc(JSON.stringify(payCfg))}"` : ""}${waCfg ? ` data-lb-wa="${esc(JSON.stringify(waCfg))}"` : ""} style="display:flex;flex-wrap:wrap;gap:16px">`
    + (form.fields || []).map(one).join("")
    + `<div style="flex:1 1 100%;display:flex;flex-wrap:wrap;gap:10px;justify-content:${bt.align === "left" ? "flex-start" : bt.align === "right" ? "flex-end" : "center"}"><button type="submit" style="${bt.full ? "flex:1 1 100%;" : ""}padding:${pad};border:0;border-radius:${R}px;background:${bt.bg || C};color:${bt.fg || "#fff"};font:inherit;font-size:${fs}px;font-weight:700;cursor:pointer">${esc(btnText)}</button>${bt.extra && bt.extraUrl ? `<a href="${esc(bt.extraUrl)}" target="_blank" rel="noopener" style="${bt.full ? "flex:1 1 100%;box-sizing:border-box;" : ""}display:inline-block;text-align:center;padding:${pad};border-radius:${R}px;border:1.5px solid ${bt.bg || C};color:${bt.bg || C};text-decoration:none;font-size:${fs}px;font-weight:700">${esc(bt.extraText || "Learn more")}</a>` : ""}${payOn && bt.note ? `<div style="flex:1 1 100%;text-align:center;font-size:12.5px;color:#77739a;margin-top:-2px">🔒 Secure payment via ${payCfg.mode === "razorpay" ? "Razorpay" : payCfg.mode === "upi" ? "UPI (GPay, PhonePe, Paytm)" : "payment link"}</div>` : ""}</div></form></div>`;
};
/* a full page that shows just the form (share link) */
export const formPageHtml = (form, integ) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(form.name)}</title><style>body{margin:0;min-height:100vh;background:#f4f3fb;font-family:Inter,system-ui,sans-serif;color:#16142b;display:flex;align-items:center;justify-content:center;padding:40px 16px;box-sizing:border-box}</style></head><body><div style="width:100%">${formHtml(form, integ)}</div></body></html>`;

/* ==================== Elementor-style structures (section with columns) ==================== */
export const STRUCTURES = [
  ["100", [1]], ["50/50", [1, 1]], ["33/66", [1, 2]], ["66/33", [2, 1]], ["33×3", [1, 1, 1]],
  ["25/50/25", [1, 2, 1]], ["25×4", [1, 1, 1, 1]], ["25/75", [1, 3]], ["75/25", [3, 1]], ["20×5", [1, 1, 1, 1, 1]],
];
export const structureHtml = (cols) => `<section data-lb-name="Section" style="padding:64px 24px"><div class="lbw-stack" data-lb-name="Row" style="max-width:1140px;margin:0 auto;display:flex;gap:28px;align-items:stretch">${cols.map((c, i) => `<div data-lb-ph data-lb-name="Column ${i + 1}" style="flex:${c} 1 0;min-width:0"></div>`).join("")}</div></section>`;

/* ==================== build a whole site for publishing (all pages + uploaded videos + sitemap + 404) ==================== */
export async function buildSite(pages, base = "", live = {}) {
  const out = [];
  for (const p of pages) { const r = await finalize(p.html, { mode: "zip", page: p.file, leadUrl: live.leadUrl || "", site: live.site || "", pixels: live.pixels || null }); out.push({ name: p.file, data: r.html }); r.files.forEach((f) => !out.some((o) => o.name === f.name) && out.push(f)); }
  if (!pages.some((p) => p.file === "index.html") && pages[0]) out.push({ name: "index.html", data: out[0].data });
  if (!pages.some((p) => p.file === "404.html")) out.push({ name: "404.html", data: (await finalize(PAGE_TPLS.find((t) => t[0] === "404")[2]("Page not found"))).html });
  if (base) {
    out.push({ name: "sitemap.xml", data: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${base}/${p.file === "index.html" ? "" : p.file}</loc></url>`).join("\n")}\n</urlset>` });
    out.push({ name: "robots.txt", data: `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n` });
  }
  return out;
}
