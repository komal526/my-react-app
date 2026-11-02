import { useState } from "react";
import Auth from "./components/Auth.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("lb_session")); } catch { return null; } });
  const login = (u) => { localStorage.setItem("lb_session", JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.removeItem("lb_session"); setUser(null); };
  return user ? <Dashboard key={user.email} user={user} onLogout={logout} /> : <Auth onLogin={login} />;
}
