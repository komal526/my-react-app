// Editor helpers: draggable elements, settings, zip export
const FI = "display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:14px;border:1px solid #d1d5db;border-radius:8px;font-size:15px";
const fl = (n, t) => `<label style="display:block;font-size:14px;font-weight:500;margin-bottom:14px">${n} *<input type="${t}" required style="${FI}"></label>`;
export const PAL = [
  ["Layout", [
    ["▢", "Section", '<section data-lb-ph style="padding:48px 24px"></section>'],
    ["▥", "Columns", '<div style="display:flex;flex-wrap:wrap;gap:24px"><div data-lb-ph style="flex:1 1 280px"></div><div data-lb-ph style="flex:1 1 280px"></div></div>'],
    ["↕", "Spacer", '<div style="height:40px"></div>'],
    ["—", "Divider", '<hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0">'],
    ["▁", "Footer", '<footer style="padding:32px 24px;background:#111827;color:#9ca3af;text-align:center">© Your company. All rights reserved.</footer>'],
  ]],
  ["Basic", [
    ["H1", "Heading", '<h2 style="font-size:32px;font-weight:800;margin:0;padding:8px 0;color:#111827;line-height:1.2">Your headline</h2>'],
    ["T", "Text", '<p style="font-size:16px;line-height:1.6;color:#4b5563;margin:0;padding:6px 0">Write something here.</p>'],
    ["▭", "Button", '<div style="text-align:left"><a href="#" style="display:inline-block;background:#2f4bff;color:#fff;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none">Click me</a></div>'],
    ["✔", "Checklist", '<ul style="list-style:none;padding:0;margin:0"><li style="padding:6px 0">✅ Item one</li><li style="padding:6px 0">✅ Item two</li><li style="padding:6px 0">✅ Item three</li></ul>'],
  ]],
  ["Media", [
    ["🖼", "Image", '<img src="https://placehold.co/600x400/e5e7eb/6b7280?text=Image" alt="" style="max-width:100%;border-radius:8px;display:block">'],
    ["▶", "Video", '<div style="position:relative;padding-top:56.25%"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:8px"></iframe></div>'],
    ["</>", "HTML embed", '<div style="padding:20px;background:#f3f4f6;border-radius:8px;text-align:center;color:#6b7280">Custom HTML block — select it, open "HTML code" and paste your embed</div>'],
  ]],
  ["Blocks", [
    ["☰", "Form", `<form>${fl("Name", "text")}${fl("Email", "email")}${fl("Whatsapp Number", "tel")}<button type="submit" style="width:100%;padding:16px;border:0;border-radius:8px;background:#1d4ed8;color:#fff;font-size:18px;font-weight:600;cursor:pointer">Register Now</button></form>`],
    ["👤", "Profile card", '<div style="display:flex;gap:16px;padding:20px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);background:#fff"><img src="https://placehold.co/120x120/cbd5e1/475569?text=You" alt="" style="width:80px;height:80px;border-radius:50%;object-fit:cover"><div><div style="font-weight:700;font-size:18px">Your name</div><div style="color:#6b7280;line-height:1.6;margin-top:4px">Short bio goes here.</div></div></div>'],
    ["?", "FAQ", '<details style="padding:10px 0;border-bottom:1px solid #e5e7eb"><summary style="font-weight:600;cursor:pointer">Your question?</summary><p style="color:#4b5563">Your answer.</p></details>'],
  ]],
];

/* ================= editor CSS injected into the page iframe ================= */
export const EDITOR_CSS = `.lb-hover{outline:1px dashed #6b7cff!important;outline-offset:-1px}
.lb-sel{outline:2px solid #2f4bff!important;outline-offset:-2px}
[contenteditable=true]{outline:2px solid #16a34a!important;cursor:text}
[data-lb-ph]:empty{min-height:80px;outline:2px dashed #cbd5e1;outline-offset:-2px}
[data-lb-ph]:empty::before{content:"Drop elements here";color:#94a3b8;font:14px sans-serif;display:block;padding:28px;text-align:center}
img:not(.lb-sel){-webkit-user-drag:none}
#lb-ind{position:fixed;z-index:2147483647;pointer-events:none;background:#2f4bff;border-radius:2px;display:none}
#lb-ind.in{background:rgba(47,75,255,.12);outline:2px dashed #2f4bff}`;

export const CONT = new Set(["DIV", "SECTION", "HEADER", "FOOTER", "MAIN", "ARTICLE", "ASIDE", "NAV", "UL", "OL", "LI", "FORM", "BODY", "FIGURE", "DETAILS", "BLOCKQUOTE"]);
export const INL = new Set(["A", "B", "I", "EM", "STRONG", "SPAN", "BR", "SMALL", "U", "MARK", "CODE", "SUP", "SUB", "LABEL", "ABBR", "S", "TIME", "I"]);
export const SH = { None: "", Soft: "0 2px 8px rgba(0,0,0,.1)", Medium: "0 6px 20px rgba(0,0,0,.15)", Large: "0 16px 40px rgba(0,0,0,.25)" };
export const FONTS = ["Arial, sans-serif", "Verdana, sans-serif", "Trebuchet MS, sans-serif", "Georgia, serif", "Times New Roman, serif", "Courier New, monospace", "Impact, sans-serif", "system-ui, sans-serif"];
export const WIDTH = { desktop: 1280, tablet: 768, mobile: 390 };

export const cleanNode = (r, exp) => {
  [r, ...r.querySelectorAll("*")].forEach((n) => {
    n.classList.remove("lb-sel", "lb-hover");
    ["draggable", "contenteditable", ...(exp ? ["data-lb-ph"] : [])].forEach((a) => n.removeAttribute(a));
    ["class", "style"].forEach((a) => n.getAttribute(a) === "" && n.removeAttribute(a));
  });
  r.querySelectorAll("#lb-ind").forEach((n) => n.remove());
};

const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
export function makeZip(files) { // minimal "stored" zip writer, no library needed
  const enc = new TextEncoder(), parts = [], cen = [], u16 = (n) => [n & 255, (n >> 8) & 255], u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  let off = 0, size = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), d = enc.encode(f.data), c = crc(d);
    const lh = new Uint8Array([0x50, 0x4b, 3, 4, 20, 0, 0, 8, 0, 0, 0, 0, 0, 0, ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nm.length), 0, 0]);
    const ch = new Uint8Array([0x50, 0x4b, 1, 2, 20, 0, 20, 0, 0, 8, 0, 0, 0, 0, 0, 0, ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nm.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]);
    parts.push(lh, nm, d); cen.push(ch, nm); off += lh.length + nm.length + d.length; size += ch.length + nm.length;
  }
  const end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(size), ...u32(off), 0, 0]);
  return new Blob([...parts, ...cen, end], { type: "application/zip" });
}
