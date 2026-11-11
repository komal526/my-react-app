import { addr } from "../lib.js";

export default function Domains({ projects }) {
  const live = projects.filter((p) => p.status === "published");
  return (
    <>
      <div className="top"><div><h1>Domains</h1><p className="mut">Where your published pages live.</p></div></div>
      <div className="panel">{live.length ? live.map((p) => <div key={p.id} className="drow"><b>{p.name}</b><code>{addr(p)}</code><span className="badge published">Live</span></div>) : <p className="mut">Nothing published yet. Publish a project to see its address here.</p>}</div>
    </>
  );
}
