// LaunchBuilder v87 — Rail.jsx: full-screen preview with a slim action bar on the right.
// Used by: project preview (click a project), template preview, the preview link in a new tab, and a template opened in a new tab.
import { useEffect, useState } from "react";
import { Icon } from "./icons.jsx";
import { FILE_TEMPLATES, tplUrl } from "../lib.js";

const P = {
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />,
  pub: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 15v4a2 2 0 002 2h10a2 2 0 002-2v-4" /></>,
  tab: <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h5" />,
  save: <><path d="M5 3h11l3 3v13a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /><path d="M7 3v5h8V3M7 21v-7h10v7" /></>,
  del: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  use: <><path d="M12 5v14M5 12h14" /></>,
  link: <><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></>,
  reload: <><path d="M20 11a8 8 0 10-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>,
};
export const RI = P;
const Svg = ({ d }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;

/* actions: [{ ic: RI.edit | "iconName", l: "Edit", cls: "k-pri" | "k-ok" | "k-del", fn }] · pages: [{ v, l }] */
export function Rail({ dev, setDev, pages, page, setPage, actions = [], onClose, note }) {
  const [fold, setFold] = useState(false);   /* always opens; fold it away with ‹ / › */
  const B = ({ ic, l, on, cls = "", fn }) => <button className={"pk2-b " + cls + (on ? " on" : "")} onClick={fn} title={l}><span className="pk2-i">{typeof ic === "string" ? <Icon n={ic} s={17} /> : <Svg d={ic} />}</span><small>{l}</small></button>;
  return (
    <aside className={"pk2-rail" + (fold ? " fold" : "")}>
      <button className="pk2-fold" onClick={() => setFold(!fold)} title={fold ? "Show actions" : "Hide actions"}>{fold ? "‹" : "›"}</button>
      {!fold && <>
        <div className="pk2-g first">{[["desktop", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobile"]].map(([d, l]) => <B key={d} ic={d} l={l} on={dev === d} fn={() => setDev(d)} />)}</div>
        {pages && pages.length > 1 && <select className="pk2-pg" value={page} onChange={(e) => setPage(e.target.value)} title="Page">{pages.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}</select>}
        {actions.length > 0 && <div className="pk2-g">{actions.filter(Boolean).map((a) => <B key={a.l} {...a} />)}</div>}
        {note && <small className="pk2-note">{note}</small>}
      </>}
      {onClose && <button className="pk2-x" onClick={onClose} title="Close (Esc)"><Svg d={P.x} /></button>}
    </aside>
  );
}

/* the whole screen: page on the left, rail on the right. children = the <iframe> */
export function RailView({ dev, children, ...rail }) {
  useEffect(() => { if (!rail.onClose) return; const k = (e) => e.key === "Escape" && rail.onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [rail.onClose]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="pk2" role="dialog">
      <div className={"pk2-stage " + dev}>{children}</div>
      <Rail dev={dev} {...rail} />
    </div>
  );
}

/* a template opened in its own tab: #/tpl/<key> */
export const tplTabUrl = (t) => location.origin + location.pathname + "#/tpl/" + encodeURIComponent(t.key);
export function TplView({ k }) {
  const t = FILE_TEMPLATES.find((x) => x.key === k), [dev, setDev] = useState("desktop");
  useEffect(() => { document.title = t ? t.name + " · template" : "Template"; }, [t]);
  if (!t) return <div className="pv-dead"><div><h2>This template doesn't exist</h2><a href={location.pathname}>Go to dashboard</a></div></div>;
  const use = () => { try { localStorage.setItem("lb_tpl_go", t.key); } catch { /* ignore */ } location.href = location.pathname; };
  return (
    <RailView dev={dev} setDev={setDev} actions={[{ ic: RI.edit, l: "Use", cls: "k-pri", fn: use }, { ic: RI.home, l: "Dashboard", fn: () => { location.href = location.pathname; } }]}>
      <iframe title={t.name} src={tplUrl(t)} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
    </RailView>
  );
}
