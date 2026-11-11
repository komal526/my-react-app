export default function PagesPanel({ project, curId, act }) {
  const site = project.type === "website";
  return (
    <>
      {site ? <p className="mut">Each page is its own HTML file. Click a page to edit it. To connect pages, select a link on the page and use "Link to page" in Customize.</p>
        : <><p className="mut">This is a single landing page. Turn it into a website to add more pages.</p><button className="pub sm" onClick={act.convert}>Convert to website</button></>}
      <div style={{ marginTop: 12 }}>{project.pages.map((p) => (
        <div key={p.id} className={"prow" + (p.id === curId ? " on" : "")} onClick={() => act.switch(p.id)}>
          <div><b>{p.name}</b><span>{p.file}</span></div>
          {site && <div className="pact" onClick={(e) => e.stopPropagation()}><button title="Rename" onClick={() => act.rename(p.id)}>✎</button><button title="Duplicate" onClick={() => act.dup(p.id)}>⧉</button><button title="Delete" onClick={() => act.del(p.id)}>🗑</button></div>}
        </div>))}</div>
      {site && <div className="row"><button onClick={() => act.add(false)}>＋ Blank page</button><button onClick={() => act.add(true)}>＋ Copy of this page</button></div>}
    </>
  );
}
