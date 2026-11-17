// LaunchBuilder v66 — brand.js
// Your company details for the dashboard footer and legal pages.
// Fill these in once, then push and deploy. Anything left empty is simply hidden.
const DEFAULT = {
  product: "LaunchBuilder",
  company: "LaunchBuilder",            // legal company name shown in © and legal pages
  tagline: "Build high-converting landing pages and websites in minutes — no code.",
  whatsapp: "",                        // e.g. "919876543210" (country code + number, no +)
  phone: "",                           // e.g. "+91 98765 43210"
  email: "",                           // e.g. "support@crecapo.tech"
  address: "",                         // e.g. "Mohali, Punjab, India"
  hours: "Mon–Sat · 10 AM – 7 PM IST",
  social: {
    instagram: "",                     // full links, e.g. "https://instagram.com/yourpage"
    facebook: "",
    youtube: "",
    linkedin: "",
    x: "",
  },
  legalUpdated: "14 November 2026",
  refundDays: 7,                       // money-back window shown in the Refund policy — change to your real policy
  jurisdiction: "India",               // e.g. "Mohali, Punjab, India" — courts named in the Terms
};

/* White-label: on a client's own address (app.abc.com) the server puts that workspace's brand in window.LB_TENANT,
   so the whole builder shows their name, logo and colours instead of yours. */
export const TENANT = (typeof window !== "undefined" && window.LB_TENANT) || null;
export const BRAND = TENANT ? {
  ...DEFAULT,
  product: TENANT.product || TENANT.name || DEFAULT.product,
  company: TENANT.name || TENANT.product || DEFAULT.company,
  tagline: "Build landing pages and websites in minutes — no code.",
  whatsapp: TENANT.whatsapp || "", phone: "", email: TENANT.support_email || "", address: "",
  social: { instagram: "", facebook: "", youtube: "", linkedin: "", x: "" },
  logo: TENANT.logo || "",
} : { ...DEFAULT, logo: "" };
