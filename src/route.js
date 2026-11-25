// LaunchBuilder v118 — every sidebar page has its own link: crecapo.tech/projects, /forms, /leads …
export const ROUTES = { pages: "dashboard", projects: "projects", templates: "templates", leads: "leads", finder: "lead-finder", followups: "follow-ups", forms: "forms", calendar: "calendar", lms: "courses", domains: "domains", integrations: "integrations", analytics: "analytics", pixels: "tracking-pixels", settings: "settings", admin: "admin" };
const SLUG2V = Object.fromEntries(Object.entries(ROUTES).map(([v, s]) => [s, v]));
const SECT = new RegExp("/(" + Object.values(ROUTES).join("|") + ")/?$");
/* the app's own folder, without the section name ("/forms" → "/") — use it to build preview / form / booking links */
export const appPath = () => location.pathname.replace(SECT, "/") || "/";
export const appUrl = () => location.origin + appPath();
/* which sidebar page the address points to (crecapo.tech/forms, or #/forms from the redirect file) */
export const viewFromUrl = () => {
  const m = location.pathname.match(SECT); if (m) return SLUG2V[m[1]];
  const h = location.hash.match(/^#\/([\w-]+)\/?$/); if (h && SLUG2V[h[1]]) return SLUG2V[h[1]];
  return "pages";
};
export const urlForView = (v) => (v === "pages" || !ROUTES[v] ? appPath() : appPath().replace(/\/$/, "") + "/" + ROUTES[v]);
