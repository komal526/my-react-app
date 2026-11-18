// LaunchBuilder v79 — Robot.jsx: the AI robot (layered picture, shared by the dashboard and AI Studio)
import { useEffect } from "react";

export default function Robot({ mood = "ok" }) {
  /* pictures load a moment after the dashboard appears */
  useEffect(() => { const go = () => import("./robotArt.js").then((m) => m.default()); if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1200 }); else setTimeout(go, 300); }, []);
  return (
    <div className={"rb4 rb4-" + mood} aria-hidden="true">
      <i className="rb4-pad" />
      <i className="rb4-l rb4-b1 rb4-badge1" />
      <i className="rb4-l rb4-b2 rb4-badge2" />
      <i className="rb4-l rb4-sp rb4-spark" />
      <div className="rb4-me">
        <i className="rb4-l rb4-body" />
        <i className="rb4-l rb4-arm" />
        <i className="rb4-chest" /><i className="rb4-blink" />
      </div>
      <i className="rb4-l rb4-hi rb4-bubble" />
    </div>
  );
}
