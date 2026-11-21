// LaunchBuilder v103 — Auth.jsx
// Log in · Create account (ready instantly, no confirmation email) · Forgot password · Set a new password · Continue with Google
import { useEffect, useState } from "react";
import { BRAND } from "../brand.js";
import { cloudOn, cloudSignup, cloudLogin, cloudUser, startCloud, sha256, cloudSettings, cloudGoogleUrl, cloudRecover, cloudAdopt, cloudSetPassword } from "../cloud.js";
import { serverSignup } from "../lib.js";

// With Supabase configured (.env), accounts live on Supabase and work on every device.
// Without it, accounts are kept in this browser only (demo mode).
const sha = sha256;
const users = () => { try { return JSON.parse(localStorage.getItem("lb_users")) || {}; } catch { return {}; } };

const Eye = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" /></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>
);
const GoogleG = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
);
const nameOf = (u, email) => (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name)) || email.split("@")[0];

/* incoming = login handed back in the address bar (Google sign-in, reset link, email link) */
export default function Auth({ onLogin, incoming }) {
  const [mode, setMode] = useState(incoming && incoming.type === "recovery" ? "reset" : "login");
  const [f, setF] = useState({ name: "", email: "", password: "", password2: "" }), [err, setErr] = useState(incoming && incoming.error ? incoming.error : ""), [busy, setBusy] = useState(!!(incoming && incoming.access_token)), [show, setShow] = useState(false), [note, setNote] = useState("");
  const [google, setGoogle] = useState(null);   /* null = not checked yet, true / false = switched on in Supabase */
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (m) => { setMode(m); setErr(""); setNote(""); };
  const hostKey = async (email, pw) => { localStorage.setItem("lb_hostkey_" + email, "lbk_" + (await sha(email + "|" + pw + "|launchbuilder-hosting")).slice(0, 32)); localStorage.setItem("lb_hostkey_active", email); };
  const finish = async (user, pw) => {
    const email = (user.email || "").toLowerCase();
    await startCloud(user); if (pw) await hostKey(email, pw);
    onLogin({ email, id: user.id, name: nameOf(user, email) });
  };

  useEffect(() => { if (cloudOn()) cloudSettings().then((s) => setGoogle(!!(s.external && s.external.google))); }, []);
  /* came back from Google / an email link → log in (or ask for the new password) */
  useEffect(() => {
    if (!incoming || !incoming.access_token || !cloudOn()) return;
    cloudAdopt(incoming).then((u) => { if (incoming.type === "recovery") { setBusy(false); setF((x) => ({ ...x, email: u.email || "" })); } else return finish(u); })
      .catch((e) => { setBusy(false); setMode("login"); setErr(e.message); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setNote(""); setBusy(true);
    const email = f.email.trim().toLowerCase();
    if (cloudOn()) {   /* real accounts on Supabase */
      try {
        if (mode === "forgot") {
          await cloudRecover(email);
          setBusy(false); setNote(`✓ If an account exists for ${email}, we've sent a reset link. Open it on this device to set a new password (check spam too).`); return;
        }
        if (mode === "reset") {
          if (f.password.length < 6) throw new Error("Password must be at least 6 characters.");
          if (f.password !== f.password2) throw new Error("The two passwords don't match.");
          const u = await cloudSetPassword(f.password); await finish(u.id ? u : cloudUser(), f.password); return;
        }
        if (mode === "signup") {
          if (f.password.length < 6) throw new Error("Password must be at least 6 characters.");
          const name = f.name.trim() || email.split("@")[0];
          const s = await serverSignup(email, f.password, name);       /* ready account, no confirmation email */
          if (s.ok) { await finish(await cloudLogin(email, f.password), f.password); return; }
          if (!s.fallback) throw new Error(s.error || "Could not create the account.");
          const r = await cloudSignup(email, f.password, name);
          if (!r.session) { setBusy(false); setMode("login"); setNote(`✓ Account created! We sent a confirmation link to ${email}. Open it, then log in here.`); return; }
          await finish(cloudUser(), f.password); return;
        }
        await finish(await cloudLogin(email, f.password), f.password);
      } catch (x) { setBusy(false); setErr(/already registered|already exists/i.test(x.message) ? "An account with this email already exists — log in instead (or use “Forgot password?”)." : x.message); }
      return;
    }
    const u = users(), hash = await sha(f.password);
    setBusy(false);
    if (mode === "forgot" || mode === "reset") return setErr("Password reset needs online accounts (Supabase) to be switched on.");
    if (mode === "signup") {
      if (u[email]) return setErr("An account with this email already exists.");
      if (f.password.length < 6) return setErr("Password must be at least 6 characters.");
      u[email] = { name: f.name.trim() || email.split("@")[0], hash };
      localStorage.setItem("lb_users", JSON.stringify(u));
    } else if (!u[email] || u[email].hash !== hash) return setErr("Wrong email or password.");
    /* hosting key comes from your login: same email + password on any computer = publishing just works */
    await hostKey(email, f.password);
    onLogin({ email, name: u[email].name });
  };
  const withGoogle = () => {
    if (google === false) { setErr("Google sign-in isn't switched on yet. (Admin: Supabase → Authentication → Sign In / Providers → Google.)"); return; }
    setBusy(true); location.href = cloudGoogleUrl();
  };
  const login = mode === "login", signup = mode === "signup", forgot = mode === "forgot", reset = mode === "reset";
  const T = { login: ["Welcome back", "Log in to your dashboard."], signup: ["Create your account", "Ready in seconds — no email confirmation needed."], forgot: ["Forgot your password?", "Type your email and we'll send you a link to set a new one."], reset: ["Set a new password", f.email ? "For " + f.email : "Choose a new password for your account."] }[mode];
  return (
    <div className="au">
      <div className="au-side">
        <div className="au-brand">{BRAND.logo ? <img className="au-logo" src={BRAND.logo} alt="" /> : <span>✎</span>}{BRAND.product}</div>
        <h2>Build landing pages and websites that look professional — in minutes.</h2>
        <ul><li>Drag and drop editor</li><li>Import your own HTML and keep editing</li><li>Multi-page websites with one menu</li><li>Publish in one click</li></ul>
      </div>
      <div className="au-main">
        <form className="au-box" onSubmit={submit}>
          <h3>{T[0]}</h3>
          <p className="au-sub">{T[1]}</p>
          {(login || signup) && cloudOn() && <>
            <button type="button" className="au-google" onClick={withGoogle} disabled={busy}><GoogleG />Continue with Google</button>
            <div className="au-or"><span>or with email</span></div>
          </>}
          {signup && <label>Name<input required value={f.name} onChange={set("name")} placeholder="Your name" autoComplete="name" /></label>}
          {!reset && <label>Email<input required type="email" value={f.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" /></label>}
          {!forgot && <label><span className="au-lrow">{reset ? "New password" : "Password"}{login && cloudOn() && <a className="au-forgot" onClick={() => go("forgot")}>Forgot password?</a>}</span>
            <div className="au-pw"><input required type={show ? "text" : "password"} value={f.password} onChange={set("password")} placeholder="At least 6 characters" autoComplete={login ? "current-password" : "new-password"} />
              <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}><Eye off={show} /></button></div>
          </label>}
          {reset && <label>Type it again<input required type={show ? "text" : "password"} value={f.password2} onChange={set("password2")} placeholder="Same password" autoComplete="new-password" /></label>}
          {note && <div className="au-ok">{note}</div>}
          {err && <div className="au-err">{err}</div>}
          <button className="au-btn" disabled={busy}>{busy ? "Please wait…" : login ? "Log in" : signup ? "Create account" : forgot ? "Send reset link" : "Save new password"}</button>
          {(login || signup) && <p className="au-sub au-sw">{login ? "New here? " : "Already have an account? "}<a onClick={() => go(login ? "signup" : "login")}>{login ? "Create an account" : "Log in"}</a></p>}
          {(forgot || reset) && <p className="au-sub au-sw"><a onClick={() => go("login")}>← Back to log in</a></p>}
        </form>
      </div>
    </div>
  );
}
