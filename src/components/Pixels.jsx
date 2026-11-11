// LaunchBuilder v27 — Pixels.jsx (Meta Pixel + Google tracking for all published sites)
import { useState } from "react";
import { PIXEL_OK } from "../lib.js";

const FIELDS = {
  meta: { label: "Meta Pixel ID", ph: "e.g. 123456789012345", re: /^\d{8,20}$/, help: "Meta Events Manager → Data sources → your Pixel → copy the Pixel ID (numbers only)." },
  ga4: { label: "Google Analytics 4 — Measurement ID", ph: "G-XXXXXXXXXX", re: /^G-[A-Z0-9]{4,}$/i, help: "Google Analytics → Admin → Data streams → your web stream → Measurement ID." },
  ads: { label: "Google Ads — Conversion ID", ph: "AW-123456789", re: /^AW-\d{5,}$/i, help: "Google Ads → Goals → Conversions → your conversion → Tag setup → Install the tag yourself → the AW-… ID." },
  adsLabel: { label: "Google Ads — Conversion label (optional)", ph: "e.g. AbC-D_efG-h12_34", re: /^[A-Za-z0-9_-]{2,60}$/, help: "Same screen as the Conversion ID — the part after the slash in send_to: 'AW-…/label'." },
  gtm: { label: "Google Tag Manager — Container ID (optional)", ph: "GTM-XXXXXXX", re: /^GTM-[A-Z0-9]{4,}$/i, help: "Tag Manager → your container → the GTM-… ID at the top." },
};

function Field({ k, v, set }) {
  const f = FIELDS[k], bad = v && !f.re.test(v.trim());
  return (
    <label className="px-f"><span>{f.label}</span>
      <input value={v || ""} placeholder={f.ph} onChange={(e) => set(e.target.value.trim())} className={bad ? "bad" : v ? "good" : ""} />
      <small className={bad ? "red" : "mut"}>{bad ? "This doesn't look right — check the format: " + f.ph : f.help}</small>
    </label>
  );
}

export default function Pixels({ integ, onChange, projects }) {
  const cur = integ.pixels || {};
  const [px, setPx] = useState({ scope: "all", ids: [], ...cur }), [saved, setSaved] = useState("");
  const up = (o) => { setPx({ ...px, ...o }); setSaved(""); };
  const valid = Object.keys(FIELDS).every((k) => !px[k] || FIELDS[k].re.test(px[k]));
  const save = () => { const clean = { ...px }; Object.keys(FIELDS).forEach((k) => { if (!clean[k]) delete clean[k]; }); onChange({ ...integ, pixels: clean }); setSaved("✓ Saved — republish your sites to apply"); };
  const has = (k) => !!(cur[k] && (k === "adsLabel" || PIXEL_OK(cur[k])));
  const live = projects.filter((p) => p.status === "published" && (px.scope !== "some" || (px.ids || []).includes(p.id)));
  return (
    <div>
      <div className="top"><div><h1>Tracking Pixels</h1><p className="mut">Add your Meta and Google tracking once — it's included in every published website and landing page.</p></div>
        <div className="row">{saved && <span className="fb-note">{saved}</span>}<button className="pri big" disabled={!valid} onClick={save}>Save pixels</button></div></div>

      <div className="px-status">
        {[["Meta Pixel", has("meta")], ["Google Analytics 4", has("ga4")], ["Google Ads", has("ads")], ["Tag Manager", has("gtm")]].map(([l, on]) => <span key={l} className={on ? "on" : ""}><i />{l}{on ? " · active" : " · not set"}</span>)}
      </div>

      <div className="px-grid">
        <div className="panel px-card"><div className="px-h"><span className="px-logo meta">∞</span><div><b>Meta (Facebook &amp; Instagram)</b><small>Measure ad results and build audiences</small></div></div>
          <Field k="meta" v={px.meta} set={(v) => up({ meta: v })} /></div>
        <div className="panel px-card"><div className="px-h"><span className="px-logo goog">G</span><div><b>Google</b><small>Analytics, Ads conversions and Tag Manager</small></div></div>
          <Field k="ga4" v={px.ga4} set={(v) => up({ ga4: v })} /><Field k="ads" v={px.ads} set={(v) => up({ ads: v })} /><Field k="adsLabel" v={px.adsLabel} set={(v) => up({ adsLabel: v })} /><Field k="gtm" v={px.gtm} set={(v) => up({ gtm: v })} /></div>
      </div>

      <div className="px-grid">
        <div className="panel px-card"><b className="px-t">Use on</b>
          <label className="chk"><input type="radio" checked={px.scope !== "some"} onChange={() => up({ scope: "all" })} />All my websites and landing pages</label>
          <label className="chk"><input type="radio" checked={px.scope === "some"} onChange={() => up({ scope: "some" })} />Only the ones I choose</label>
          {px.scope === "some" && <div className="px-list">{projects.length ? projects.map((p) => <label key={p.id} className="chk"><input type="checkbox" checked={(px.ids || []).includes(p.id)} onChange={(e) => up({ ids: e.target.checked ? [...(px.ids || []), p.id] : (px.ids || []).filter((x) => x !== p.id) })} />{p.name} <span className="mut sm">· {p.type === "website" ? "Website" : "Landing page"}</span></label>) : <p className="mut sm">No projects yet.</p>}</div>}
          <p className="mut sm">A page's own tracking (Editor → Site → Analytics &amp; tracking) always takes priority over these defaults.</p></div>
        <div className="panel px-card"><b className="px-t">Tracked automatically</b>
          <table className="px-ev"><tbody>
            <tr><td>Page view</td><td>Every visit</td><td><code>PageView</code> · <code>page_view</code></td></tr>
            <tr><td>Lead</td><td>Form submitted, booking made</td><td><code>Lead</code> · <code>generate_lead</code>{px.ads ? <> · Ads conversion</> : ""}</td></tr>
            <tr><td>Purchase</td><td>Payment completed</td><td><code>Purchase</code> · <code>purchase</code> (with ₹ value)</td></tr>
          </tbody></table>
          <p className="mut sm">Pixels load only on your live sites — not in the editor or preview, so your own testing doesn't count.</p></div>
      </div>

      {live.length > 0 && <div className="px-note">ℹ After saving, open each site and click <b>Publish → Update live site</b> so the pixels are added: {live.map((p) => p.name).join(", ")}.</div>}
    </div>
  );
}
