import { useState } from "react";

export default function ImportPage({ onBack, onFile }) {
  const [err, setErr] = useState("");
  const go = async (f) => setErr((await onFile(f)) || "");
  return (
    <div className="narrow">
      <button className="link" onClick={onBack}>← Back to dashboard</button>
      <h1>Import an existing HTML page</h1>
      <p className="mut">Upload one .html file. It opens exactly as designed, and you can then edit it visually, in code, or both.</p>
      <div className="panel"><b>1. Upload</b>
        <div className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); go(e.dataTransfer.files[0]); }}>
          <div className="up">⤒</div><b>Drop your .html here</b><span className="mut">Up to 20 MB. Static pages only (no build step needed).</span>
          <label className="btn">Choose file<input hidden type="file" accept=".html,.htm" onChange={(e) => { go(e.target.files[0]); e.target.value = ""; }} /></label>
          {err && <span className="red">{err}</span>}
        </div>
      </div>
    </div>
  );
}
