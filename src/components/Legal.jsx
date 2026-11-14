// LaunchBuilder v48 — Legal.jsx (Privacy · Terms · Refund · Cookies — opened from the dashboard footer)
import { BRAND } from "../brand.js";

const B = BRAND, P = B.product, C = B.company;
const contact = [B.email && `email ${B.email}`, B.whatsapp && `WhatsApp +${B.whatsapp}`, B.phone && `phone ${B.phone}`].filter(Boolean).join(", ") || "the contact details in the footer";
export const LEGAL = {
  privacy: ["Privacy Policy", [
    ["Who we are", `${P} is run by ${C}${B.address ? `, ${B.address}` : ""}. This policy explains what we collect when you use ${P}, why, and the choices you have. It follows India's Digital Personal Data Protection Act, 2023.`],
    ["What we collect", `• Your account: name, email address and a securely stored password.\n• Your work: pages, websites, forms, calendars, templates and settings you create.\n• Your visitors' submissions: when someone fills a form on a page you publish, we store it for you in your Leads. For that data, you decide what is collected and why — you are responsible for telling your visitors, and we process it only on your instructions.\n• Usage and analytics: page views, button clicks and form starts on your published pages (with a random visit ID, device type and approximate city — no names), so you can see Smart Insights.\n• Payments: handled by the payment company you connect (e.g. Razorpay). We do not store card or UPI details.`],
    ["Why we use it", "To run your account, save and publish your pages, collect leads for you, show analytics and AI suggestions, keep the service secure and contact you about your account. We do not sell personal data."],
    ["AI Consultant", "When you ask the AI Consultant a question, an outline of the page you ask about and its numbers are sent to the AI company in use (for example Anthropic, OpenAI, Google or DeepSeek) to write the answer. If you add your own API key, it is stored encrypted on our server and is never shown in your browser again."],
    ["Where it is stored", "Your account data is stored with our database provider (Supabase) and your published sites and leads on our servers in India. We use reasonable security measures — encrypted connections, access controls and encrypted storage of secret keys."],
    ["How long we keep it", "As long as your account is active. Analytics events are kept for up to 120 days. When you delete a project, lead or your account, we delete the data, except where the law requires us to keep it."],
    ["Your rights", `You can see, correct, download or delete your data, and withdraw consent, at any time. Write to us at ${contact} and we will reply within 30 days. You may also complain to the Data Protection Board of India.`],
    ["Changes", "If we change this policy we will update the date above and tell you in the app for important changes."],
  ]],
  terms: ["Terms of Service", [
    ["Agreement", `By creating an account or using ${P} you agree to these terms. If you use it for a business, you agree for that business.`],
    ["Your account", "Keep your password safe and your details correct. You are responsible for what happens in your account. You must be at least 18 years old."],
    ["Your content", `You own the pages, text, images and data you put into ${P}. You give us permission to store, process and publish it only to run the service for you. Make sure you have the rights to everything you upload.`],
    ["Acceptable use", "Don't use the service for anything illegal, misleading or harmful — including fake or look-alike sites of other businesses, phishing, collecting passwords or card details under false pretences, spam, malware, or content that infringes others' rights. We may remove such content and suspend accounts that break these rules."],
    ["Your visitors and leads", "If you collect personal data with your forms, you are responsible for having a lawful reason, showing your own privacy notice to your visitors and responding to their requests."],
    ["Plans and limits", "Free and paid plans have the limits shown in the app. We may change plans and prices with notice; changes don't affect a period you have already paid for."],
    ["AI features", "AI suggestions and AI-built pages can be wrong or incomplete. Review them before you publish. You are responsible for what you publish."],
    ["Availability", "We work to keep the service running and your data safe, but it is provided “as is” and may sometimes be unavailable for maintenance or reasons beyond our control. Keep your own copies of important content (you can export pages and leads)."],
    ["Liability", `To the extent the law allows, ${C} is not liable for indirect losses such as lost profits or lost data, and our total liability is limited to the amount you paid us in the 3 months before the claim.`],
    ["Ending", "You can stop using the service and delete your account at any time. We may suspend or close accounts that break these terms."],
    ["Law", `These terms are governed by the laws of India, and the courts of ${B.jurisdiction} have jurisdiction.`],
  ]],
  refund: ["Refund & Cancellation", [
    ["Free plan", "The free plan costs nothing and can be stopped at any time."],
    ["Paid plans", `If you're not happy with a paid plan, contact us within ${B.refundDays} days of the payment for a full refund. After that, you can cancel any time and your plan stays active until the end of the period you paid for; we don't refund part-used periods.`],
    ["How to cancel or ask for a refund", `Write to us at ${contact} from your account email. Approved refunds go back to the original payment method within 5–7 working days.`],
    ["Payments your customers make to you", `Payments your visitors make through your pages (for example a workshop fee via Razorpay or UPI) go to you, not to ${C}. Refunds for those are your responsibility and follow your own policy.`],
  ]],
  cookies: ["Cookie Policy", [
    ["What we use", `${P} uses your browser's storage to keep you signed in, remember your settings and keep a copy of your work for speed. These are needed for the app to work.`],
    ["On pages you publish", "Your published pages use a random visit ID (stored for the browser session) to count visitors, clicks and form starts for Smart Insights. If you add tracking pixels (Meta, Google Analytics, Google Ads, Tag Manager), those companies set their own cookies — add a cookie notice to your page if your visitors are in regions that require consent."],
    ["Your choice", "You can clear site data in your browser at any time; you will then need to sign in again."],
  ]],
};

export default function Legal({ k, onClose, onGo }) {
  const [title, secs] = LEGAL[k] || LEGAL.privacy;
  return (
    <div className="lg-ov" onClick={onClose}>
      <article className="lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <header><div><small>{P} · Legal</small><h2>{title}</h2><p className="mut">Last updated {B.legalUpdated}</p></div><button className="cn-x" onClick={onClose} aria-label="Close">✕</button></header>
        <div className="lg-tabs">{Object.entries(LEGAL).map(([kk, [t]]) => <button key={kk} className={kk === k ? "on" : ""} onClick={() => onGo(kk)}>{t}</button>)}</div>
        <div className="lg-body">{secs.map(([h, t]) => <section key={h}><h3>{h}</h3>{t.split("\n").map((l, i) => <p key={i}>{l}</p>)}</section>)}</div>
      </article>
    </div>
  );
}
