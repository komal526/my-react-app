// LaunchBuilder v103 — LeadFinder.jsx
// Find local businesses on Google (city + business type), filter them, save them in groups, add them to Leads,
// and broadcast on WhatsApp. Each account connects its own Google Places key (saved encrypted on the server).
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { phpCall, defaultServerUrl, addLead, uid } from "../lib.js";
import { PlacesConnect, SheetBtn } from "./EasyConnect.jsx";

const CITIES = ["Agra", "Ahmedabad", "Ajmer", "Amritsar", "Bengaluru", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore", "Dehradun", "Delhi", "Dharamshala", "Faridabad", "Ghaziabad", "Goa",
  "Gurugram", "Guwahati", "Hamirpur", "Hyderabad", "Indore", "Jaipur", "Jalandhar", "Jammu", "Jodhpur", "Kanpur", "Kochi", "Kolkata", "Kota", "Lucknow", "Ludhiana", "Madurai", "Mandi", "Mohali", "Mumbai",
  "Mysuru", "Nagpur", "Nashik", "Navi Mumbai", "Noida", "Panchkula", "Patna", "Pune", "Raipur", "Rajkot", "Ranchi", "Shimla", "Solan", "Surat", "Thane", "Thiruvananthapuram", "Udaipur", "Vadodara", "Varanasi", "Visakhapatnam"];
const SK = (e) => "lb_lf_" + e;
const loadLF = (e) => { try { const v = JSON.parse(localStorage.getItem(SK(e)) || "{}"); return { groups: v.groups || [], history: v.history || [] }; } catch { return { groups: [], history: [] }; } };
const saveLF = (e, v) => { try { localStorage.setItem(SK(e), JSON.stringify(v)); } catch { alert("Browser storage is full — delete an old group or search."); } };
/* WhatsApp needs an Indian mobile number: 10 digits starting 6–9 */
export const mobileOf = (p) => { const s0 = String(p || "").trim(), g = s0.match(/^0(\d+)[\s-]/); if (g && g[1].length < 5) return "";   /* "0731 401 2345" = landline (STD code), "094250 88167" = mobile */
  let d = s0.replace(/\D/g, ""); if (d.length === 12 && d.startsWith("91")) d = d.slice(2); if (d.length === 11 && d.startsWith("0")) d = d.slice(1); return /^[6-9]\d{9}$/.test(d) ? d : ""; };
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const toCsv = (rows, name) => {
  const head = ["Business name", "Phone", "WhatsApp number", "Category", "Address", "City", "Website", "Rating", "Reviews", "Tags", "Google Maps"];
  const body = rows.map((r) => [r.name, r.phone, mobileOf(r.phone) ? "91" + mobileOf(r.phone) : "", r.category, r.address, r.city, r.website, r.rating, r.reviews, (r.tags || []).join(" "), r.maps].map(csvCell).join(","));
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv" })); a.download = (name || "leads").replace(/[^\w-]+/g, "-") + ".csv"; a.click();
};
/* the same columns as the CSV, for Google Sheets */
const sheetRows = (rows) => rows.map((r) => ({ "Business name": r.name || "", Phone: r.phone || "", "WhatsApp number": mobileOf(r.phone) ? "91" + mobileOf(r.phone) : "", Category: r.category || "", Address: r.address || "", City: r.city || "", Website: r.website || "", Rating: r.rating ? String(r.rating) : "", Reviews: r.reviews ? String(r.reviews) : "", Tags: (r.tags || []).join(" "), "Google Maps": r.maps || "" }));
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const fmtDate = (t) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function LeadFinder({ user, integ, me, onLeads }) {
  const E = user.email, srv = (integ && integ.server && integ.server.url) ? integ.server : { url: defaultServerUrl(), key: "" };
  const [tab, setTab] = useState("search"), [st, setSt] = useState(null), [data, setData0] = useState(() => loadLF(E));
  const setData = (f) => setData0((d) => { const v = typeof f === "function" ? f(d) : f; saveLF(E, v); return v; });
  const [city, setCity] = useState(() => localStorage.getItem("lb_lf_city") || ""), [q, setQ] = useState(""), [n, setN] = useState(20);
  const [keyOpen, setKeyOpen] = useState(false), [res, setRes] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [toast, setToast] = useState(""), [openG, setOpenG] = useState(null);
  useEffect(() => { phpCall(srv, { action: "lf_status" }).then(setSt).catch((e) => setSt({ ok: false, error: e.message })); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3500); return () => clearTimeout(t); }, [toast]);
  const savedIn = useMemo(() => { const m = {}; data.groups.forEach((g) => g.leads.forEach((l) => { (m[l.id] = m[l.id] || []).push(g.name); })); return m; }, [data]);

  const search = async (e) => {
    if (e) e.preventDefault(); if (!city.trim() || !q.trim()) return setErr("Type a city and a business type.");
    setBusy(true); setErr(""); try { localStorage.setItem("lb_lf_city", city.trim()); } catch { /* ignore */ }
    try {
      const r = await phpCall(srv, { action: "lf_search", city: city.trim(), q: q.trim(), n });
      const list = r.results || []; setRes({ city: city.trim(), q: q.trim(), list });
      /* every search is saved as a group automatically: "Dentist · Indore" */
      if (list.length) { const gn = q.trim().replace(/^./, (c) => c.toUpperCase()) + " · " + city.trim().replace(/^./, (c) => c.toUpperCase()); addToGroup(list, gn, true); }
      setSt((s) => (s ? { ...s, left: r.left, used: (s.used || 0) + 1 } : s));
      setData((d) => ({ ...d, history: [{ id: uid(), city: city.trim(), q: q.trim(), n, ts: Date.now(), count: list.length, list }, ...d.history].slice(0, 25) }));
    } catch (x) { if (x.message === "NO_PLACES_KEY") { setSt((s0) => ({ ...s0, ready: false })); setErr(""); } else setErr(x.message); }
    setBusy(false);
  };
  /* groups */
  const addToGroup = (rows, gname, auto) => {
    const name = (gname || "").trim(); if (!name || !rows.length) return;
    setData((d) => {
      const g = d.groups.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (g) return { ...d, groups: d.groups.map((x) => (x === g ? { ...x, updated: Date.now(), leads: [...x.leads, ...rows.filter((r) => !x.leads.some((l) => l.id === r.id))] } : x)) };
      return { ...d, groups: [{ id: uid(), name, desc: "", tags: [], updated: Date.now(), leads: rows }, ...d.groups] };
    });
    setToast(auto ? `✓ Saved in the group “${name}” — find it under Groups` : `✓ ${rows.length} saved to “${name}”`);
  };
  const toLeads = (rows, form) => {
    let k = 0; rows.forEach((r) => { if (!r.name) return; k++; addLead(E, { form: form || "Lead Finder", projectId: "", projectName: "Lead Finder", page: r.city || "", source: "lead-finder",
      data: { Name: r.name, Phone: r.phone || "", WhatsApp: mobileOf(r.phone) ? "+91 " + mobileOf(r.phone) : "", Category: r.category || "", City: r.city || "", Address: r.address || "", Website: r.website || "", Rating: r.rating ? `${r.rating} (${r.reviews})` : "", "Google Maps": r.maps || "" } }); });
    onLeads && onLeads(); setToast(`✓ ${k} added to Leads`);
  };
  const tagRows = (rows, tag, inGroup) => {
    const t = (tag || "").trim(); if (!t) return; const ids = new Set(rows.map((r) => r.id));
    const add = (l) => (ids.has(l.id) ? { ...l, tags: [...new Set([...(l.tags || []), t])] } : l);
    if (inGroup) setData((d) => ({ ...d, groups: d.groups.map((g) => (g.id === inGroup ? { ...g, leads: g.leads.map(add) } : g)) }));
    else { setRes((r) => r && { ...r, list: r.list.map(add) }); setData((d) => ({ ...d, groups: d.groups.map((g) => (g.leads.some((l) => ids.has(l.id)) ? { ...g, leads: g.leads.map(add) } : g)) })); }
    setToast(`🏷 Tagged ${rows.length} with “${t}”`);
  };

  if (!st) return <div className="lf"><Head tab={tab} setTab={setTab} /><div className="lazy-load"><span className="pub-spin" /></div></div>;
  const left = st.left === -1 || st.limit === 0 ? "Unlimited searches" : `Searches left this month: ${st.left} of ${st.limit}`;
  return (
    <div className="lf">
      <Head tab={tab} setTab={(t) => { setTab(t); setOpenG(null); }} groups={data.groups.length} hist={data.history.length} />
      {!st.ready && <div className="lf-card lf-connect"><div className="lf-fh"><b>🔑 Connect your Google key to start finding customers</b></div><p className="mut sm">One time, about 3 minutes. Your key works only for your account and is saved encrypted on the server.</p><PlacesConnect srv={srv} onDone={setSt} /></div>}
      {st.ready && <div className="lf-keybar"><span>{st.using === "own" ? "🔑 Your Google key ••••" + (st.own ? st.own.tail : "") : st.admin ? "🔑 Server key (admin)" : "🔑 Shared key — " + (st.left === -1 ? "unlimited" : st.left + " searches left this month")}</span><button className="lf-adm" onClick={() => setKeyOpen(!keyOpen)}>{keyOpen ? "Close" : st.using === "own" ? "Manage key" : "Connect my own key"}</button></div>}
      {st.ready && keyOpen && <div className="lf-card lf-connect"><PlacesConnect srv={srv} onDone={setSt} compact /></div>}

      {tab === "search" && st.ready && <>
        <form className="lf-card lf-find" onSubmit={search}>
          <div className="lf-fh"><b>Find businesses</b><small>{left}</small></div>
          <div className="lf-row">
            <label className="lf-city"><span>City <em>(required)</em></span><input list="lf-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Indore" /><datalist id="lf-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist></label>
            <label className="lf-kw"><span>Business type or keyword <em>(required)</em></span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Dentist, wedding photographer, gym" /></label>
            <label className="lf-n"><span>Results</span><select value={n} onChange={(e) => setN(+e.target.value)}>{[20, 40, 60].map((x) => <option key={x} value={x}>{x} results</option>)}</select></label>
            <button className="lf-go" disabled={busy}>{busy ? <><span className="pub-spin" /> Searching…</> : <>🔍 Search businesses</>}</button>
          </div>
          {err && <div className="lf-err">{err}</div>}
        </form>
        {!res && !busy && <p className="lf-hint">Type a city and a business type to search Google. Tag the results, save them to a group, add them to your Leads, or export them as CSV.</p>}
        {res && <Results key={res.city + res.q + res.list.length} rows={res.list} sheetTab={res.q + " · " + res.city} title={`${res.list.length} businesses found for “${res.q}” in ${res.city}`} savedIn={savedIn} groups={data.groups}
          onGroup={addToGroup} onLeads={toLeads} onTag={(rows, t) => tagRows(rows, t)} csvName={`${res.q}-${res.city}`} />}
      </>}

      {tab === "groups" && !openG && <Groups groups={data.groups} onOpen={setOpenG} onNew={() => { const nm = window.prompt("Group name"); if (nm) setData((d) => ({ ...d, groups: [{ id: uid(), name: nm.trim(), desc: "", tags: [], updated: Date.now(), leads: [] }, ...d.groups] })); }}
        onDel={(g) => window.confirm(`Delete the group “${g.name}” (${g.leads.length} leads)?`) && setData((d) => ({ ...d, groups: d.groups.filter((x) => x.id !== g.id) }))}
        onEdit={(g) => { const nm = window.prompt("Group name", g.name); if (nm === null) return; const ds = window.prompt("Description (optional)", g.desc || ""); setData((d) => ({ ...d, groups: d.groups.map((x) => (x.id === g.id ? { ...x, name: nm.trim() || x.name, desc: ds || "", updated: Date.now() } : x)) })); }} />}
      {tab === "groups" && openG && (() => { const g = data.groups.find((x) => x.id === openG); if (!g) return null; return (
        <GroupView g={g} integ={integ} onBack={() => setOpenG(null)} onLeads={(rows) => toLeads(rows, g.name)} onTag={(rows, t) => tagRows(rows, t, g.id)} savedIn={savedIn} groups={data.groups} onGroup={addToGroup}
          onRemove={(rows) => { const ids = new Set(rows.map((r) => r.id)); setData((d) => ({ ...d, groups: d.groups.map((x) => (x.id === g.id ? { ...x, updated: Date.now(), leads: x.leads.filter((l) => !ids.has(l.id)) } : x)) })); setToast(`Removed ${rows.length} from “${g.name}”`); }}
          onEdit={() => { const nm = window.prompt("Group name", g.name); if (nm === null) return; const ds = window.prompt("Description (optional)", g.desc || ""); setData((d) => ({ ...d, groups: d.groups.map((x) => (x.id === g.id ? { ...x, name: nm.trim() || x.name, desc: ds || "" } : x)) })); }}
          onAdd={() => { setTab("search"); setOpenG(null); }} toast={setToast} />); })()}

      {tab === "history" && <History list={data.history} onView={(h) => { setRes({ city: h.city, q: h.q, list: h.list || [] }); setCity(h.city); setQ(h.q); setTab("search"); }}
        onAgain={(h) => { setCity(h.city); setQ(h.q); setN(h.n || 20); setTab("search"); }} onClear={() => window.confirm("Clear the search history?") && setData((d) => ({ ...d, history: [] }))} />}
      {toast && <div className="dash-toast">{toast}</div>}
    </div>
  );
}

function Head({ tab, setTab, groups = 0, hist = 0 }) {
  return (<>
    <div className="lf-hero"><i className="lf-w1" /><i className="lf-w2" />
      <div className="lf-ht"><span className="lf-hb">🔍 Lead Finder</span><h1>Find customers on Google</h1><p>Search any business type in any city — get phone numbers, websites and ratings, then save, tag and message them on WhatsApp.</p></div>
    <div className="lf-tabs">{[["search", "Search"], ["groups", "Groups" + (groups ? ` (${groups})` : "")], ["history", "History" + (hist ? ` (${hist})` : "")]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
    </div>
  </>);
}

/* admin: switch Lead Finder on with a Google key (kept on the server, never in the browser) */
/* the results table: search, filters, sort, select, save / tag / leads / CSV */
function Results({ rows, title, sheetTab, savedIn, groups, onGroup, onLeads, onTag, csvName, extra, onRemove, inGroup }) {
  const [s, setS] = useState(""), [cat, setCat] = useState(""), [hp, setHp] = useState(""), [hw, setHw] = useState(""), [rt, setRt] = useState(""), [ct, setCt] = useState(""), [wa, setWa] = useState(""), [rv, setRv] = useState(""), [stt, setStt] = useState(""), [tg, setTg] = useState(""), [sort, setSort] = useState(["", 1]), [page, setPage] = useState(0), [sel, setSel] = useState(new Set());
  const [gname, setGname] = useState(""), [tag, setTag] = useState("");
  const cats = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(), [rows]);
  const citiesL = useMemo(() => [...new Set(rows.map((r) => r.city).filter(Boolean))].sort(), [rows]);
  const tagsL = useMemo(() => [...new Set(rows.flatMap((r) => r.tags || []))].sort(), [rows]);
  const stats = useMemo(() => { const rated = rows.filter((r) => r.rating); return { all: rows.length, phone: rows.filter((r) => r.phone).length, wa: rows.filter((r) => mobileOf(r.phone)).length, web: rows.filter((r) => r.website).length, noweb: rows.filter((r) => !r.website).length, avg: rated.length ? (rated.reduce((a, r) => a + r.rating, 0) / rated.length).toFixed(1) : "—" }; }, [rows]);
  const dupPhones = useMemo(() => { const c = {}; rows.forEach((r) => { const m = mobileOf(r.phone) || String(r.phone || "").replace(/\D/g, ""); if (m) c[m] = (c[m] || 0) + 1; }); return c; }, [rows]);
  const list = useMemo(() => {
    const t = s.trim().toLowerCase();
    let l = rows.filter((r) => (!t || (r.name + " " + r.address + " " + r.phone).toLowerCase().includes(t)) && (!cat || r.category === cat)
      && (!hp || (hp === "yes" ? !!r.phone : !r.phone)) && (!hw || (hw === "yes" ? !!r.website : !r.website)) && (!rt || (r.rating || 0) >= +rt)
      && (!ct || r.city === ct) && (!wa || (wa === "yes" ? !!mobileOf(r.phone) : !mobileOf(r.phone))) && (!rv || (r.reviews || 0) >= +rv)
      && (!stt || (() => { const k = mobileOf(r.phone) || String(r.phone || "").replace(/\D/g, ""), d = !!k && (dupPhones[k] || 0) > 1; return stt === "dup" ? d : stt === "uniq" ? !d : stt === "open" ? !!r.open : !r.open; })()) && (!tg || (r.tags || []).includes(tg)));
    if (sort[0]) l = [...l].sort((a, b) => { const x = a[sort[0]], y = b[sort[0]]; return (typeof x === "number" ? x - y : String(x || "").localeCompare(String(y || ""))) * sort[1]; });
    return l;
  }, [rows, s, cat, hp, hw, rt, ct, wa, rv, stt, tg, sort, dupPhones]);
  const PER = 25, pages = Math.max(1, Math.ceil(list.length / PER)), shown = list.slice(page * PER, page * PER + PER);
  useEffect(() => { setPage(0); }, [s, cat, hp, hw, rt, ct, wa, rv, stt, tg]);
  const nf = [cat, hp, hw, rt, ct, wa, rv, stt, tg, s.trim()].filter(Boolean).length;
  const reset = () => { [setS, setCat, setHp, setHw, setRt, setCt, setWa, setRv, setStt, setTg].forEach((f) => f("")); };
  const quick = (k) => { reset(); if (k === "wa") setWa("yes"); if (k === "phone") setHp("yes"); if (k === "web") setHw("yes"); if (k === "noweb") setHw("no"); if (k === "top") setRt("4.5"); };
  const chosen = rows.filter((r) => sel.has(r.id)), allOn = shown.length && shown.every((r) => sel.has(r.id));
  const tog = (id) => setSel((x) => { const y = new Set(x); if (y.has(id)) y.delete(id); else y.add(id); return y; });
  const S = (k, l) => <th className="lf-sort" onClick={() => setSort(([a, d]) => [k, a === k ? -d : k === "name" || k === "city" ? 1 : -1])}>{l} {sort[0] === k ? (sort[1] > 0 ? "↑" : "↓") : "⇅"}</th>;
  const F = (v, set, label, opts) => <select className="lf-f" value={v} onChange={(e) => set(e.target.value)}><option value="">{label}: Any</option>{opts.map(([a, b]) => <option key={a} value={a}>{label}: {b}</option>)}</select>;
  return (
    <div className="lf-res">
      <div className="lf-rt"><b>{title}</b>{extra}</div>
      {/* quick view chips — click one to filter */}
      <div className="lf-stats">{[["all", "All businesses", stats.all, "🏢"], ["wa", "WhatsApp ready", stats.wa, "💬"], ["phone", "With phone", stats.phone, "📞"], ["web", "With website", stats.web, "🌐"], ["noweb", "No website", stats.noweb, "🎯"], ["top", "Avg rating", "★ " + stats.avg, "⭐"]].map(([k, l, v, ic]) => (
        <button key={k} className={"lf-stat" + ((k === "wa" && wa === "yes" && nf === 1) || (k === "phone" && hp === "yes" && nf === 1) || (k === "web" && hw === "yes" && nf === 1) || (k === "noweb" && hw === "no" && nf === 1) || (k === "top" && rt === "4.5" && nf === 1) || (k === "all" && !nf) ? " on" : "")} onClick={() => quick(k)} title={k === "top" ? "Show 4.5★ and up" : k === "noweb" ? "Businesses without a website — great leads for a website offer" : ""}>
          <span>{ic}</span><div><b>{v}</b><small>{k === "top" ? "Avg rating · tap for 4.5+" : l}</small></div></button>))}</div>
      <div className="lf-card lf-tbl">
        <div className="lf-tools">
          <input className="lf-s" value={s} onChange={(e) => setS(e.target.value)} placeholder="🔍 Search name, address or phone" />
          {F(cat, setCat, "Category", cats.map((c) => [c, c]))}
          {citiesL.length > 1 && F(ct, setCt, "City", citiesL.map((c) => [c, c]))}
          {F(hp, setHp, "Phone", [["yes", "Has phone"], ["no", "No phone"]])}
          {F(wa, setWa, "WhatsApp", [["yes", "Mobile number"], ["no", "Landline / none"]])}
          {F(hw, setHw, "Website", [["yes", "Has website"], ["no", "No website"]])}
          {F(rt, setRt, "Rating", [["3", "3+ ★"], ["4", "4+ ★"], ["4.5", "4.5+ ★"]])}
          {F(rv, setRv, "Reviews", [["20", "20+"], ["50", "50+"], ["100", "100+"], ["500", "500+"]])}
          {F(stt, setStt, "Status", [["open", "Open now (in business)"], ["closed", "Closed"], ["uniq", "No duplicates"], ["dup", "Duplicates only"]])}
          {tagsL.length > 0 && F(tg, setTg, "Tag", tagsL.map((t) => [t, t]))}
          {nf > 0 && <button className="lf-b lf-reset" onClick={reset}>✕ Clear filters ({nf})</button>}
          <SheetBtn rows={sheetRows(chosen.length ? chosen : list)} tab={"Lead Finder · " + (sheetTab || csvName || "Results")} label={"▦ Save to Google Sheet" + (chosen.length ? ` (${chosen.length})` : "")} />
          <button className="lf-b" onClick={() => toCsv(chosen.length ? chosen : list, csvName)}>⬇ Export CSV{chosen.length ? ` (${chosen.length})` : ""}</button>
        </div>
        {chosen.length > 0 && <div className="lf-selbar"><b>{chosen.length} selected</b>
          <span className="lf-in"><input list="lf-groups" value={gname} onChange={(e) => setGname(e.target.value)} placeholder="Group name" /><datalist id="lf-groups">{groups.map((g) => <option key={g.id} value={g.name} />)}</datalist>
            <button onClick={() => { onGroup(chosen, gname); setGname(""); setSel(new Set()); }} disabled={!gname.trim()}>📁 Save to group</button></span>
          <span className="lf-in"><input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag" /><button onClick={() => { onTag(chosen, tag); setTag(""); }} disabled={!tag.trim()}>🏷 Tag</button></span>
          <button onClick={() => { onLeads(chosen); setSel(new Set()); }}>👥 Add to Leads</button>
          {onRemove && <button className="lf-del" onClick={() => { onRemove(chosen); setSel(new Set()); }}>Remove from group</button>}
          <button className="lf-clr" onClick={() => setSel(new Set())}>Clear</button></div>}
        <div className="lf-scroll"><table className="lf-rtable">
          <thead><tr><th><input type="checkbox" checked={!!allOn} onChange={() => setSel((x) => { const y = new Set(x); shown.forEach((r) => (allOn ? y.delete(r.id) : y.add(r.id))); return y; })} /></th>
            {S("name", "Business name")}<th>Phone</th><th>Category</th><th>Address</th>{S("city", "City")}<th>Website</th>{S("rating", "Rating")}{S("reviews", "Reviews")}<th>Tags</th><th>Status</th></tr></thead>
          <tbody>{shown.map((r) => { const m = mobileOf(r.phone), dup = (dupPhones[m || String(r.phone || "").replace(/\D/g, "")] || 0) > 1, sv = savedIn[r.id];
            return (<tr key={r.id} className={sel.has(r.id) ? "on" : ""}>
              <td><input type="checkbox" checked={sel.has(r.id)} onChange={() => tog(r.id)} /></td>
              <td className="lf-name"><b>{r.name}</b>{r.maps && <a href={r.maps} target="_blank" rel="noopener" title="Open on Google Maps">↗</a>}{!r.open && <em className="lf-closed">Closed</em>}</td>
              <td className="lf-ph" data-l="Phone">{r.phone ? <>{r.phone}{m && <a className="lf-wa" href={`https://wa.me/91${m}`} target="_blank" rel="noopener" title="Chat on WhatsApp">WA</a>}{dup && <em className="lf-dup">Possible duplicate</em>}</> : <span className="mut">—</span>}</td>
              <td data-l="Category">{r.category || <span className="mut">—</span>}</td>
              <td className="lf-addr" data-l="Address" title={r.address}>{r.address}</td>
              <td data-l="City">{r.city || <span className="mut">—</span>}</td>
              <td data-l="Website">{r.website ? <a className="lf-web" href={r.website} target="_blank" rel="noopener">{host(r.website)}</a> : <span className="lf-nows">Not available</span>}</td>
              <td data-l="Rating">{r.rating ? <b className="lf-rt-v">★ {r.rating}</b> : "—"}</td>
              <td data-l="Reviews">{r.reviews ? r.reviews.toLocaleString("en-IN") : "—"}</td>
              <td data-l="Tags">{(r.tags || []).map((t) => <span key={t} className="lf-tag">{t}</span>)}{!(r.tags || []).length && <span className="mut">—</span>}</td>
              <td data-l="Status">{sv ? <span className="lf-st on" title={sv.join(", ")}>● Saved: {sv[0]}{sv.length > 1 ? ` +${sv.length - 1}` : ""}</span> : <span className="lf-st">New</span>}</td>
            </tr>); })}
            {!shown.length && <tr><td colSpan="11" className="lf-empty">{rows.length ? "Nothing matches these filters." : inGroup ? "No leads in this group yet." : "No businesses found."}</td></tr>}
          </tbody></table></div>
        <div className="lf-pg"><button disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button><span>Page {page + 1} of {pages}</span><button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>›</button>
          <small>Showing {shown.length} of {list.length}{list.length !== rows.length ? ` (filtered from ${rows.length})` : ""} · Powered by Google</small></div>
      </div>
    </div>
  );
}

function Groups({ groups, onOpen, onNew, onDel, onEdit }) {
  return (
    <div className="lf-card lf-tbl">
      <div className="lf-tools"><button className="lf-b" onClick={onNew}>＋ Create group</button><small className="mut">Save search results into groups — then broadcast or add them to Leads.</small></div>
      <div className="lf-scroll"><table>
        <thead><tr><th>Group</th><th>Leads</th><th>WhatsApp ready</th><th>Tags</th><th>Description</th><th>Updated</th><th /></tr></thead>
        <tbody>{groups.map((g) => { const tags = [...new Set(g.leads.flatMap((l) => l.tags || []))];
          return (<tr key={g.id} className="lf-click" onClick={() => onOpen(g.id)}>
            <td><b>{g.name}</b></td><td>{g.leads.length}</td><td>{g.leads.filter((l) => mobileOf(l.phone)).length}</td>
            <td>{tags.length ? tags.slice(0, 4).map((t) => <span key={t} className="lf-tag">{t}</span>) : <span className="mut">—</span>}</td>
            <td className="mut">{g.desc || "—"}</td><td>{fmtDate(g.updated)}</td>
            <td onClick={(e) => e.stopPropagation()} className="lf-acts"><button onClick={() => onEdit(g)}>Edit</button><button className="lf-del" onClick={() => onDel(g)}>Delete</button></td></tr>); })}
          {!groups.length && <tr><td colSpan="7" className="lf-empty">No groups yet — search for businesses, select them and press “Save to group”.</td></tr>}
        </tbody></table></div>
    </div>
  );
}

function GroupView({ g, integ, onBack, onLeads, onTag, onRemove, onEdit, onAdd, savedIn, groups, onGroup, toast }) {
  const [bc, setBc] = useState(false);
  return (<>
    <div className="lf-gh"><button className="lf-back" onClick={onBack}>‹ Groups</button><h2>{g.name}</h2>{g.desc && <span className="mut">{g.desc}</span>}
      <div className="grow" /><button className="lf-b" onClick={onEdit}>✎ Edit</button><button className="lf-b" onClick={onAdd}>＋ Add leads</button><button className="lf-go sm" onClick={() => setBc(true)} disabled={!g.leads.length}>📣 Broadcast</button></div>
    <Results rows={g.leads} sheetTab={g.name} title={`${g.leads.length} leads in “${g.name}”`} savedIn={savedIn} groups={groups} onGroup={onGroup} onLeads={onLeads} onTag={onTag} onRemove={onRemove} csvName={g.name} inGroup />
    {bc && <Broadcast g={g} integ={integ} onClose={() => setBc(false)} toast={toast} />}
  </>);
}

/* check the numbers, then send through your WhatsApp automation, one by one in WhatsApp, or export */
function Broadcast({ g, integ, onClose, toast }) {
  const wa = (integ && integ.wa) || {};
  const sum = useMemo(() => {
    const seen = new Set(), ready = []; let none = 0, bad = 0, dup = 0, closed = 0;
    g.leads.forEach((l) => { if (l.open === false) { closed++; return; } if (!l.phone) { none++; return; } const m = mobileOf(l.phone); if (!m) { bad++; return; } if (seen.has(m)) { dup++; return; } seen.add(m); ready.push({ ...l, m }); });
    return { ready, none, bad, dup, closed };
  }, [g]);
  const [msg, setMsg] = useState(`Hi {{name}}, I came across your business on Google and loved your ratings! I help businesses in {{city}} get more customers with a professional website. Can I share a free demo?`);
  const [mode, setMode] = useState(""), [i, setI] = useState(0), [busy, setBusy] = useState(false), [done, setDone] = useState(0);
  const fill = (l) => msg.replace(/\{\{\s*name\s*\}\}/gi, l.name).replace(/\{\{\s*city\s*\}\}/gi, l.city || "your city").replace(/\{\{\s*category\s*\}\}/gi, l.category || "");
  const viaHook = async () => {
    if (!wa.webhook) return; setBusy(true); let k = 0;
    for (const l of sum.ready) { try { await fetch(wa.webhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ event: "broadcast", source: "lead-finder", group: g.name, name: l.name, phone: "91" + l.m, message: fill(l), city: l.city, category: l.category }) }); k++; setDone(k); } catch { /* keep going */ } await new Promise((r) => setTimeout(r, 250)); }
    setBusy(false); toast(`✓ Sent ${k} to your WhatsApp automation`);
  };
  const cur = sum.ready[i];
  return (
    createPortal(<div className="lf-ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="lf-modal">
      <div className="lf-mh"><div><b>Broadcast to this group</b><small>All leads in “{g.name}”.</small></div><button onClick={onClose}>✕</button></div>
      <div className="lf-sum">{[["Ready to send", sum.ready.length, "ok"], ["No phone", sum.none], ["Invalid number (landline or not Indian)", sum.bad], ["Duplicate", sum.dup], ["Closed on Google", sum.closed]].map(([l, v, c]) => <div key={l} className={c || ""}><span>{l}</span><b>{v}</b></div>)}</div>
      {!mode && <>
        <label className="lf-msg"><span>Message <small>use {"{{name}}"}, {"{{city}}"}, {"{{category}}"}</small></span><textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} /></label>
        <p className="lf-note">WhatsApp's rules expect people to agree before marketing messages. Keep it short and personal — sending too many unwanted messages can get a number blocked.</p>
        <div className="lf-mf">
          <button className="lf-b" onClick={() => toCsv(sum.ready, g.name + "-whatsapp")}>⬇ Export numbers</button>
          <button className="lf-b" onClick={() => setMode("one")} disabled={!sum.ready.length}>💬 Send one by one</button>
          <button className="lf-go sm" onClick={() => { setMode("hook"); viaHook(); }} disabled={!sum.ready.length || !wa.webhook} title={wa.webhook ? "" : "Connect WhatsApp automation in Integrations first"}>📣 Send via my WhatsApp automation ({sum.ready.length})</button>
        </div>
        {!wa.webhook && <p className="lf-note">To send automatically, connect your WhatsApp tool (AiSensy, WATI, Interakt, Pabbly…) in <b>Integrations → WhatsApp automation</b>.</p>}
      </>}
      {mode === "hook" && <div className="lf-prog"><b>{busy ? "Sending…" : "✓ Done"}</b><div className="lf-bar"><i style={{ width: (done / Math.max(1, sum.ready.length)) * 100 + "%" }} /></div><small>{done} of {sum.ready.length} sent to your WhatsApp automation</small></div>}
      {mode === "one" && (cur ? <div className="lf-one"><small>{i + 1} of {sum.ready.length}</small><b>{cur.name}</b><span className="mut">+91 {cur.m} · {cur.city}</span><p>{fill(cur)}</p>
        <div className="lf-mf"><button className="lf-b" onClick={() => setI(i + 1)}>Skip</button><a className="lf-go sm" href={`https://wa.me/91${cur.m}?text=${encodeURIComponent(fill(cur))}`} target="_blank" rel="noopener" onClick={() => setTimeout(() => setI(i + 1), 400)}>Open WhatsApp chat →</a></div></div>
        : <div className="lf-prog"><b>✓ All done</b><small>You went through all {sum.ready.length} numbers.</small></div>)}
    </div></div>, document.querySelector(".dash") || document.body)
  );
}

function History({ list, onView, onAgain, onClear }) {
  return (
    <div className="lf-card lf-tbl">
      <div className="lf-tools"><small className="mut">Your last searches — “View” shows the saved results for free; “Search again” gets fresh results (uses 1 search).</small><div className="grow" />{list.length > 0 && <button className="lf-b" onClick={onClear}>Clear history</button>}</div>
      <div className="lf-scroll"><table>
        <thead><tr><th>Business type</th><th>City</th><th>Results</th><th>Date</th><th /></tr></thead>
        <tbody>{list.map((h) => <tr key={h.id}><td><b>{h.q}</b></td><td>{h.city}</td><td>{h.count}</td><td>{new Date(h.ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
          <td className="lf-acts"><button onClick={() => onView(h)}>View</button><button onClick={() => onAgain(h)}>Search again</button></td></tr>)}
          {!list.length && <tr><td colSpan="5" className="lf-empty">No searches yet.</td></tr>}</tbody></table></div>
    </div>
  );
}
