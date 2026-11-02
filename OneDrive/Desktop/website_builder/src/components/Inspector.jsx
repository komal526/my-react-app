import { useState } from "react";
import { INL, SH, FONTS } from "./tools.js";

/* ================= right-hand style controls (live on the selected element) ================= */
function HtmlBox({ el, A }) {
  const [v, setV] = useState(() => A.current.outer(el));
  return <div className="f"><textarea className="code" rows={14} value={v} onChange={(e) => setV(e.target.value)} spellCheck={false} /><button className="pub sm" onClick={() => A.current.applyOuter(el, v)}>Apply code</button></div>;
}

export default function Inspector({ el, A, pages = [] }) {
  const w = el.ownerDocument.defaultView, cs = w.getComputedStyle(el), s = el.style, tag = el.tagName, isBody = tag === "BODY";
  const set = (o) => { Object.entries(o).forEach(([k, v]) => { s[k] = v; }); A.current.changed(); };
  const F = (l, c) => <div className="f" key={l}><label>{l}</label>{c}</div>;
  const num = (l, k, u = "px", cmp = true) => F(l, <input type="number" step={u ? 1 : 0.1} value={parseFloat(s[k] || (cmp ? cs[k] : "")) || ""} onChange={(e) => set({ [k]: e.target.value === "" ? "" : e.target.value + u })} />);
  const txt = (l, k) => F(l, <input value={s[k] || ""} placeholder={cs[k]} onChange={(e) => set({ [k]: e.target.value })} />);
  const hex = (c) => { const m = (c || "").match(/\d+(\.\d+)?/g); return !m || (m[3] !== undefined && +m[3] === 0) ? null : "#" + m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, "0")).join(""); };
  const col = (l, k) => F(l, <div className="row"><input type="color" value={hex(s[k] || cs[k]) || "#ffffff"} onChange={(e) => set({ [k]: e.target.value })} /><button className="sm" onClick={() => set({ [k]: "" })}>Clear</button></div>);
  const sel = (l, k, o) => F(l, <select value={s[k] || ""} onChange={(e) => set({ [k]: e.target.value })}><option value="">default</option>{o.map((x) => <option key={x}>{x}</option>)}</select>);
  const attr = (l, k) => F(l, <input value={el.getAttribute(k) || ""} onChange={(e) => { e.target.value ? el.setAttribute(k, e.target.value) : el.removeAttribute(k); A.current.changed(); }} />);
  const G = (t, kids, open = false) => <details open={open}><summary>{t}</summary>{kids}</details>;
  const isA = tag === "A", url = (isA ? el.getAttribute("href") : el.getAttribute("data-href")) || "", tgt = (isA ? el.getAttribute("target") : el.getAttribute("data-target")) || "";
  const setLink = (u, t) => {
    if (isA) { u ? el.setAttribute("href", u) : el.removeAttribute("href"); t ? el.setAttribute("target", t) : el.removeAttribute("target"); t ? el.setAttribute("rel", "noopener") : el.removeAttribute("rel"); }
    else if (u) { el.setAttribute("data-href", u); t ? el.setAttribute("data-target", t) : el.removeAttribute("data-target"); el.setAttribute("onclick", "var d=this.dataset;d.target==='_blank'?window.open(d.href,'_blank'):location.href=d.href"); el.style.cursor = "pointer"; }
    else { ["data-href", "data-target", "onclick"].forEach((a) => el.removeAttribute(a)); el.style.cursor = ""; }
    A.current.changed();
  };
  const leaf = !/^(IMG|IFRAME|INPUT|TEXTAREA|SELECT|HR|BODY|SVG|VIDEO|AUDIO|CANVAS)$/.test(tag) && [...el.childNodes].every((c) => c.nodeType === 3 || c.nodeType === 8 || (c.nodeType === 1 && INL.has(c.tagName)));
  const bg = (s.backgroundImage || "").replace(/^url\(["']?|["']?\)$/g, "");
  const cls = [...el.classList].filter((c) => !c.startsWith("lb-")).join(" ");
  const up = (cb) => <label className="sm up">Upload from computer<input hidden type="file" accept="image/*" onChange={(e) => A.current.upload(e.target.files[0], cb)} /></label>;
  return (
    <>
      <div className="sbar">
        <b>{isBody ? "Whole page" : `<${tag.toLowerCase()}>${el.id ? "#" + el.id : ""}`}</b>
        {!isBody && <><button onClick={() => A.current.move(-1)}>↑</button><button onClick={() => A.current.move(1)}>↓</button><button onClick={A.current.dup}>⧉</button></>}
        <button onClick={A.current.parent}>⇱ Parent</button>
        {!isBody && <button className="danger" onClick={A.current.del}>🗑</button>}
      </div>
      {!isBody && <p className="mut">Double-click text on the page to type directly. Drag the selected element to move it.</p>}
      {G("Content", <>
        {leaf && F("Text (HTML allowed)", <textarea rows={4} value={el.innerHTML} onChange={(e) => { el.innerHTML = e.target.value; A.current.changed(); }} />)}
        
        {tag === "IMG" && <>{attr("Image URL", "src")}{up((d) => { el.setAttribute("src", d); A.current.changed(); })}{attr("Alt text", "alt")}</>}
        {tag === "IFRAME" && attr("Video / embed URL", "src")}
        {/^(INPUT|TEXTAREA)$/.test(tag) && <>{attr("Placeholder", "placeholder")}{attr("Name", "name")}</>}
        {!leaf && !/^(IMG|IFRAME|INPUT|TEXTAREA|HR)$/.test(tag) && <p className="mut">This is a container. Drag elements into it, or use the Style groups below.</p>}
      </>, true)}
      {!isBody && G("Link / navigation", <>
        <p className="mut">Make this element clickable. Works on any element: text, image, button, section…</p>
        {pages.length > 1 && F("Link to a page of this website", <select value="" onChange={(e) => e.target.value && setLink(e.target.value, tgt)}><option value="">Choose a page…</option>{pages.map((p) => <option key={p.id} value={p.file}>{p.name} ({p.file})</option>)}</select>)}
        {F("Link URL (https://…, page.html, #section, tel:, mailto:)", <input value={url} placeholder="https://…" onChange={(e) => setLink(e.target.value, tgt)} />)}
        {F("Open in", <select value={tgt} onChange={(e) => setLink(url, e.target.value)}><option value="">Same tab</option><option value="_blank">New tab</option></select>)}
        {url && <button className="sm" onClick={() => setLink("", "")}>Remove link</button>}
      </>, true)}
      {G("Text", <>
        {sel("Font", "fontFamily", FONTS)}
        <div className="g2">{num("Size", "fontSize")}{sel("Weight", "fontWeight", ["300", "400", "500", "600", "700", "800", "900"])}</div>
        <div className="g2">{col("Text color", "color")}{sel("Align", "textAlign", ["left", "center", "right", "justify"])}</div>
        <div className="g2">{num("Line height", "lineHeight", "", false)}{num("Letter spacing", "letterSpacing")}</div>
        <div className="g2">{sel("Style", "fontStyle", ["normal", "italic"])}{sel("Case", "textTransform", ["none", "uppercase", "lowercase", "capitalize"])}</div>
        {sel("Decoration", "textDecoration", ["none", "underline", "line-through"])}
      </>)}
      {G("Spacing", <>
        <div className="g2">{num("Padding top", "paddingTop")}{num("Padding bottom", "paddingBottom")}{num("Padding left", "paddingLeft")}{num("Padding right", "paddingRight")}</div>
        <div className="g2">{num("Margin top", "marginTop")}{num("Margin bottom", "marginBottom")}{num("Margin left", "marginLeft")}{num("Margin right", "marginRight")}</div>
      </>)}
      {G("Size", <div className="g2">{txt("Width", "width")}{txt("Max width", "maxWidth")}{txt("Height", "height")}{txt("Min height", "minHeight")}</div>)}
      {G("Background", <>
        {col("Color", "backgroundColor")}
        {F("Image URL", <input value={bg} placeholder="https://..." onChange={(e) => set(e.target.value ? { backgroundImage: `url("${e.target.value}")`, backgroundSize: s.backgroundSize || "cover", backgroundPosition: "center" } : { backgroundImage: "" })} />)}
        {up((d) => set({ backgroundImage: `url("${d}")`, backgroundSize: "cover", backgroundPosition: "center" }))}
        {sel("Image size", "backgroundSize", ["cover", "contain", "auto"])}
      </>)}
      {G("Border", <>
        <div className="g2">{F("Width", <input type="number" value={parseFloat(s.borderWidth) || ""} onChange={(e) => set({ borderWidth: e.target.value === "" ? "" : e.target.value + "px", borderStyle: s.borderStyle || "solid" })} />)}{sel("Style", "borderStyle", ["solid", "dashed", "dotted", "double"])}</div>
        <div className="g2">{col("Color", "borderColor")}{num("Radius", "borderRadius")}</div>
      </>)}
      {G("Effects", <>
        {F("Shadow", <select value={Object.keys(SH).find((k) => SH[k] === (s.boxShadow || "")) || ""} onChange={(e) => set({ boxShadow: SH[e.target.value] })}>{Object.keys(SH).map((k) => <option key={k}>{k}</option>)}</select>)}
        {F(`Opacity ${Math.round((s.opacity || 1) * 100)}%`, <input type="range" min="0" max="1" step="0.05" value={s.opacity || 1} onChange={(e) => set({ opacity: e.target.value })} />)}
      </>)}
      {G("Layout", <>
        {sel("Display", "display", ["block", "inline-block", "flex", "grid", "none"])}
        <div className="g2">{sel("Direction", "flexDirection", ["row", "column"])}{sel("Wrap", "flexWrap", ["nowrap", "wrap"])}</div>
        {sel("Justify", "justifyContent", ["flex-start", "center", "flex-end", "space-between", "space-around"])}
        {sel("Align items", "alignItems", ["stretch", "flex-start", "center", "flex-end"])}
        <div className="g2">{num("Gap", "gap")}{txt("Grid columns", "gridTemplateColumns")}</div>
        <div className="g2">{sel("Position", "position", ["static", "relative", "absolute", "fixed", "sticky"])}{num("Z-index", "zIndex", "", false)}</div>
        {sel("Overflow", "overflow", ["visible", "hidden", "auto"])}
      </>)}
      {G("Advanced", <>
        {F("CSS class", <input value={cls} onChange={(e) => { const keep = [...el.classList].filter((c) => c.startsWith("lb-")); el.className = (e.target.value + " " + keep.join(" ")).trim(); A.current.changed(); }} />)}
        {attr("Element ID", "id")}
      </>)}
      {!isBody && G("HTML code (this element)", <HtmlBox el={el} A={A} />)}
    </>
  );
}
