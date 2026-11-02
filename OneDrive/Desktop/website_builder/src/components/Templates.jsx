import { Thumb } from "./parts.jsx";
import { TEMPLATES } from "../lib.js";

export default function Templates({ onUse }) {
  return (
    <>
      <div className="top"><div><h1>Templates</h1><p className="mut">Start a landing page or a full website from a ready-made layout.</p></div></div>
      <div className="grid">{TEMPLATES.map((t) => (
        <div key={t.name} className="card">
          <Thumb html={t.make(t.name)[0].html} />
          <div className="cb"><div className="ct"><b>{t.name}</b><span className="tag">{t.type === "website" ? "Website" : "Landing page"}</span></div><div className="mut">{t.note}</div></div>
          <div className="cb"><button className="pri" onClick={() => onUse(t)}>Use template</button></div>
        </div>))}</div>
    </>
  );
}
