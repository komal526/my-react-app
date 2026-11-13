// LaunchBuilder v41 — App.jsx
import { useEffect, useState } from "react";
import Auth from "./components/Auth.jsx";
import { cloudOn, cloudUser, cloudLogout, startCloud } from "./cloud.js";
import Dashboard from "./components/Dashboard.jsx";
import { Preview, FormPage, BookPage } from "./components/parts.jsx";

// Hash routes: "#/preview/<token>/<page.html>" = temporary preview link, "#/form/<id>" = form share link; everything else is the app.
const route = () => {
  const f = location.hash.match(/^#\/form\/([\w-]+)/); if (f) return { form: f[1] };
  const bk = location.hash.match(/^#\/book\/([\w-]+)/); if (bk) return { book: bk[1] };
  const m = location.hash.match(/^#\/preview\/([^/]+)\/?(.*)$/); return m ? { token: m[1], file: decodeURIComponent(m[2] || "") || "index.html" } : null;
};

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("lb_session")); } catch { return null; } });
  const [pv, setPv] = useState(route);
  useEffect(() => { const f = () => setPv(route()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const login = (u) => { localStorage.setItem("lb_session", JSON.stringify(u)); setUser(u); };
  const logout = async () => { if (cloudOn()) await cloudLogout(); localStorage.removeItem("lb_session"); setUser(null); };
  /* Supabase: if this browser already has the data, open instantly and sync in the background */
  const hasLocal = () => { try { return !!(user && localStorage.getItem("lb_pages_" + user.email)); } catch { return false; } };
  const [ready, setReady] = useState(() => !(cloudOn() && user) || hasLocal());

  useEffect(() => {
    if (!cloudOn() || !user) return;
    const u = cloudUser();
    if (!u) { localStorage.removeItem("lb_session"); setUser(null); setReady(true); return; }
    const waiting = !ready, t = setTimeout(() => setReady(true), 6000);
    startCloud(u).then((r) => { if (r && r.changed && !waiting) window.dispatchEvent(new CustomEvent("lb-cloud-pull", { detail: ["all"] })); }).catch((e) => console.warn("cloud:", e)).finally(() => { clearTimeout(t); setReady(true); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (pv && pv.form) return <FormPage key={pv.form} id={pv.form} />;
  if (pv && pv.book) return <BookPage key={pv.book} id={pv.book} />;
  if (pv) return <Preview key={pv.token} token={pv.token} file={pv.file} />;
  if (!ready) return <div className="boot"><span className="pub-spin" />Loading your workspace…</div>;
  return user ? <Dashboard key={user.email} user={user} onLogout={logout} /> : <Auth onLogin={login} />;
}
