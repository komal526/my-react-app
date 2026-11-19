import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";

/* if something on the screen crashes, show the reason and a way out — never an endless "Loading…" */
class Guard extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("LaunchBuilder crashed:", err, info && info.componentStack); }
  render() {
    const e = this.state.err; if (!e) return this.props.children;
    const reset = () => { try { ["lb_pk_fold", "lb_studio_go", "lb_tpl_go", "lb_tpl_ai", "lb_ai_go"].forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ } location.hash = ""; location.reload(); };
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f5fa", fontFamily: "system-ui, sans-serif", padding: 20 }}>
        <div style={{ maxWidth: 680, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 }}>
          <b style={{ color: "#b91c1c", fontSize: 18 }}>Something went wrong on this screen</b>
          <p style={{ color: "#475569" }}>Your projects are safe (they are saved in this browser and in the cloud). Press the button to reload. If it happens again, send a screenshot of this box.</p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f8fafc", border: "1px solid #e5e7eb", padding: 12, borderRadius: 10, maxHeight: 260, overflow: "auto" }}>{String((e && (e.stack || e.message)) || e).slice(0, 2500)}</pre>
          <button onClick={reset} style={{ padding: "10px 18px", borderRadius: 10, border: 0, background: "#0f1238", color: "#f5b301", fontWeight: 700, cursor: "pointer" }}>Reload {""}</button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById("root")).render(<StrictMode><Guard><App /></Guard></StrictMode>);
