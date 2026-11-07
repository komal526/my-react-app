// LaunchBuilder v24 — cloud.js
// Supabase login + automatic cloud sync of each user's data (pages, forms, leads, calendars, analytics, integrations).
// Works with Supabase's standard REST API — no extra npm package needed.
// Settings come from the .env file:  VITE_SUPABASE_URL  and  VITE_SUPABASE_ANON_KEY

const URL0 = import.meta.env.VITE_SUPABASE_URL || "";
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const BASE = URL0.replace(/\/+$/, "");
export const cloudOn = () => !!(BASE && KEY);

/* which saved data belongs to a user (stored in the browser as  prefix + email) */
const SYNC = ["lb_pages_", "lb_forms_", "lb_leads_sync_", "lb_leads_", "lb_cal_", "lb_events_", "lb_integrations_"];
const SK = "lb_supa_session";

/* ---------------- session ---------------- */
const getSession = () => { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } };
const setSession = (s) => { if (s) _set.call(localStorage, SK, JSON.stringify(s)); else _rem.call(localStorage, SK); };
/* new Supabase keys (sb_publishable_…) go only in the "apikey" header; the user's login token goes in Authorization */
const H = (token) => ({ apikey: KEY, ...(token ? { Authorization: "Bearer " + token } : {}), "Content-Type": "application/json" });
const errMsg = (j, fallback) => (j && (j.msg || j.error_description || j.message || j.error)) || fallback;
const toSession = (j) => ({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, user: j.user });

async function authFetch(path, body) {
  let r;
  try { r = await fetch(BASE + "/auth/v1/" + path, { method: "POST", headers: H(), body: JSON.stringify(body) }); }
  catch { throw new Error("Can't reach the login server. Check your internet connection."); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(errMsg(j, "Login failed"));
  return j;
}
/* a valid access token (refreshes automatically when it is about to expire) */
async function token() {
  const s = getSession(); if (!s) return null;
  if (s.expires_at - Date.now() > 60000) return s.access_token;
  try { const j = await authFetch("token?grant_type=refresh_token", { refresh_token: s.refresh_token }); const n = toSession(j); setSession(n); return n.access_token; }
  catch { return null; }
}

/* ---------------- login / signup / logout ---------------- */
export async function cloudSignup(email, password, name) {
  const j = await authFetch("signup", { email, password, data: { name } });
  if (j.access_token) { const s = toSession(j); setSession(s); return { user: s.user, session: true }; }
  return { user: j.user || j, session: false };          // email confirmation is switched on
}
export async function cloudLogin(email, password) {
  let j;
  try { j = await authFetch("token?grant_type=password", { email, password }); }
  catch (e) { throw new Error(/confirm/i.test(e.message) ? "Please confirm your email first — open the link we sent you, then log in." : /invalid/i.test(e.message) ? "Wrong email or password." : e.message); }
  const s = toSession(j); setSession(s); return s.user;
}
export async function cloudLogout() {
  await flush();
  const t = getSession() && getSession().access_token;
  if (t) { try { await fetch(BASE + "/auth/v1/logout", { method: "POST", headers: H(t) }); } catch { /* offline */ } }
  setSession(null); uid = null; email = null;
}
export const cloudUser = () => { const s = getSession(); return s && s.user ? s.user : null; };

/* ---------------- sync ---------------- */
const _set = Storage.prototype.setItem, _rem = Storage.prototype.removeItem;
let uid = null, email = null, patched = false;
const pending = new Map(); let timer = 0;
const status = (s) => window.dispatchEvent(new CustomEvent("lb-cloud", { detail: s }));
const cloudKey = (k) => { if (!email || !k.endsWith(email)) return null; const p = k.slice(0, -email.length); return SYNC.includes(p) ? p : null; };

function patch() {
  if (patched) return; patched = true;
  Storage.prototype.setItem = function (k, v) { _set.call(this, k, v); if (this === window.localStorage) queue(k, String(v)); };
  Storage.prototype.removeItem = function (k) { _rem.call(this, k); if (this === window.localStorage) queue(k, null); };
}
function queue(k, v) {
  const ck = cloudKey(k); if (!ck || !uid) return;
  pending.set(ck, v); status("saving");
  clearTimeout(timer); timer = setTimeout(flush, 1200);
}
export async function flush() {
  clearTimeout(timer); if (!pending.size || !uid) return;
  const items = [...pending.entries()]; pending.clear();
  const t = await token(); if (!t) { status("offline"); items.forEach(([k, v]) => pending.set(k, v)); return; }
  try {
    const up = items.filter(([, v]) => v !== null).map(([key, value]) => ({ user_id: uid, key, value, updated_at: new Date().toISOString() }));
    const del = items.filter(([, v]) => v === null).map(([k]) => k);
    if (up.length) {
      const r = await fetch(BASE + "/rest/v1/lb_user_data?on_conflict=user_id,key", { method: "POST", headers: { ...H(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(up) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "save failed");
    }
    for (const k of del) await fetch(BASE + `/rest/v1/lb_user_data?user_id=eq.${uid}&key=eq.${encodeURIComponent(k)}`, { method: "DELETE", headers: H(t) });
    status("saved");
  } catch (e) {
    items.forEach(([k, v]) => { if (!pending.has(k)) pending.set(k, v); });
    status("offline"); clearTimeout(timer); timer = setTimeout(flush, 10000);   // try again later
  }
}
/* call after login (or when the app opens): downloads everything, then keeps saving changes */
export async function startCloud(user) {
  uid = user.id; email = (user.email || "").toLowerCase(); patch(); status("loading");
  const t = await token(); if (!t) { status("offline"); return false; }
  let rows = [];
  try {
    const r = await fetch(BASE + "/rest/v1/lb_user_data?select=key,value", { headers: H(t) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "load failed");
    rows = await r.json();
  } catch (e) { status("offline"); console.warn("cloud load:", e.message); return false; }
  const have = new Set(rows.map((x) => x.key));
  rows.forEach((x) => { if (x.value !== null) _set.call(localStorage, x.key + email, x.value); });
  /* first time on the cloud: upload what this browser already has */
  SYNC.forEach((p) => { if (!have.has(p)) { const v = localStorage.getItem(p + email); if (v !== null) pending.set(p, v); } });
  if (pending.size) await flush(); else status("saved");
  return true;
}
window.addEventListener("beforeunload", () => { if (pending.size) flush(); });

/* SHA-256 that also works on plain http:// (browsers block crypto.subtle there) */
export async function sha256(s) {
  if (window.crypto && crypto.subtle) return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const b = new TextEncoder().encode(s), l = b.length, n = (((l + 9) >> 6) + 1) << 6, m = new Uint8Array(n); m.set(b); m[l] = 0x80;
  const dv = new DataView(m.buffer); dv.setUint32(n - 4, l * 8); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
  let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]; const w = new Array(64), r = (x, y) => (x >>> y) | (x << (32 - y));
  for (let i = 0; i < n; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) { const s0 = r(w[t - 15], 7) ^ r(w[t - 15], 18) ^ (w[t - 15] >>> 3), s1 = r(w[t - 2], 17) ^ r(w[t - 2], 19) ^ (w[t - 2] >>> 10); w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0; }
    let [a, b2, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) { const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25), ch = (e & f) ^ (~e & g), t1 = (hh + S1 + ch + K[t] + w[t]) | 0, S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22), mj = (a & b2) ^ (a & c) ^ (b2 & c), t2 = (S0 + mj) | 0; hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b2; b2 = a; a = (t1 + t2) | 0; }
    h = [h[0] + a, h[1] + b2, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map((x) => x | 0);
  }
  return h.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
