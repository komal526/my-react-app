// LaunchBuilder v46 — Scratch.jsx · the "Start from scratch" card used by Forms and Calendar
import { Icon } from "./icons.jsx";

export default function ScratchCard({ icon = "form", text, onClick, compact = false }) {
  return (
    <button className={"scr-card" + (compact ? " compact" : "")} onClick={onClick}>
      <span className="scr-art" aria-hidden="true"><i className="scr-orbit" /><Icon n={icon} s={150} w={1.2} /></span>
      <span className="scr-ic"><Icon n={icon} s={30} w={2} /></span>
      <b className="scr-t">Start from <em>scratch</em></b>
      <span className="scr-sub">{text}</span>
      <span className="scr-foot"><span className="scr-dots"><i /><i /><i /></span><span className="scr-go"><i className="scr-line" />→</span></span>
    </button>
  );
}
