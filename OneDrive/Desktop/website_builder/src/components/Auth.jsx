import { useState } from "react";

// DEMO AUTH: accounts live in this browser only. Replace with a real backend (hashed passwords + sessions/JWT) before launch.
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
const users = () => { try { return JSON.parse(localStorage.getItem("lb_users")) || {}; } catch { return {}; } };

const Eye = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" /></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>
);

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login"), [f, setF] = useState({ name: "", email: "", password: "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [show, setShow] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const email = f.email.trim().toLowerCase(), u = users(), hash = await sha(f.password);
    setBusy(false);
    if (mode === "signup") {
      if (u[email]) return setErr("An account with this email already exists.");
      if (f.password.length < 6) return setErr("Password must be at least 6 characters.");
      u[email] = { name: f.name.trim() || email.split("@")[0], hash };
      localStorage.setItem("lb_users", JSON.stringify(u));
    } else if (!u[email] || u[email].hash !== hash) return setErr("Wrong email or password.");
    onLogin({ email, name: u[email].name });
  };
  const login = mode === "login";
  return (
    <div className="au">
      <div className="au-side">
        <div className="au-brand"><span>✎</span>LaunchBuilder</div>
        <h2>Build landing pages and websites that look professional — in minutes.</h2>
        <ul><li>Drag and drop editor</li><li>Import your own HTML and keep editing</li><li>Multi-page websites with one menu</li><li>Publish in one click</li></ul>
      </div>
      <div className="au-main">
        <form className="au-box" onSubmit={submit}>
          <h3>{login ? "Welcome back" : "Create your account"}</h3>
          <p className="au-sub">{login ? "Log in to your dashboard." : "Free plan includes 5 projects."}</p>
          {!login && <label>Name<input required value={f.name} onChange={set("name")} placeholder="Your name" /></label>}
          <label>Email<input required type="email" value={f.email} onChange={set("email")} placeholder="you@example.com" /></label>
          <label>Password
            <div className="au-pw"><input required type={show ? "text" : "password"} value={f.password} onChange={set("password")} placeholder="At least 6 characters" />
              <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}><Eye off={show} /></button></div>
          </label>
          {err && <div className="au-err">{err}</div>}
          <button className="au-btn" disabled={busy}>{login ? "Log in" : "Sign up"}</button>
          <p className="au-sub au-sw">{login ? "New here? " : "Already have an account? "}<a onClick={() => { setMode(login ? "signup" : "login"); setErr(""); }}>{login ? "Create an account" : "Log in"}</a></p>
        </form>
      </div>
    </div>
  );
}
