import { LIMIT } from "../lib.js";

export default function Settings({ user, count, onDeleteAll }) {
  return (
    <>
      <div className="top"><div><h1>Settings</h1></div></div>
      <div className="panel"><b>Account</b><p className="mut">{user.name} · {user.email}</p></div>
      <div className="panel"><b>Plan</b><p className="mut">Free plan: {count} of {LIMIT} projects used.</p></div>
      <div className="panel"><b>Your data</b><p className="mut">Projects are stored in this browser only until the backend is added.</p>
        <button className="red" onClick={() => window.confirm("Delete ALL projects from this browser?") && onDeleteAll()}>Delete all projects</button></div>
    </>
  );
}
