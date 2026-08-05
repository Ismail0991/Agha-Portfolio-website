const admin = require("firebase-admin");

// Editable landing-page content. This registry is the single source of truth: home.ejs
// (and the navbar/footer) read values by key with the default as fallback, and the admin
// editor auto-generates its form from this same list. Add a field here + use its key in a
// template, and it becomes editable in the admin panel -- no bespoke form code needed.
//
// type: text | textarea | icon (Font Awesome class) | image (URL, upload via Cloudinary) | url
const FIELDS = [
  // ---- Brand ----
  { key: "brand.logo", group: "Brand", label: "Logo image", type: "image", default: "/images/aghaz-mark.png" },
  { key: "brand.namePrimary", group: "Brand", label: "Brand name (first word)", type: "text", default: "Aghaz" },
  { key: "brand.nameAccent", group: "Brand", label: "Brand name (accent word)", type: "text", default: "Tech" },
  { key: "brand.tagline", group: "Brand", label: "Tagline", type: "text", default: "Start. Grow. Succeed." },

  // ---- Hero ----
  { key: "hero.eyebrow", group: "Hero", label: "Eyebrow / badge", type: "text", default: "Your Venture Begins Here" },
  { key: "hero.titlePre", group: "Hero", label: "Title (before highlight)", type: "text", default: "Technology and marketing that" },
  { key: "hero.titleHighlight", group: "Hero", label: "Title (highlighted)", type: "text", default: "fit your business" },
  { key: "hero.titlePost", group: "Hero", label: "Title (after highlight)", type: "text", default: ", not the other way around." },
  { key: "hero.desc", group: "Hero", label: "Description", type: "textarea", default: "Aghaz Tech builds the marketing, brand, AI, and software a growing business actually needs — scoped around your goals, not a template." },
  { key: "hero.primaryLabel", group: "Hero", label: "Primary button label", type: "text", default: "Request a Consultation" },
  { key: "hero.primaryLink", group: "Hero", label: "Primary button link", type: "url", default: "/contact" },
  { key: "hero.secondaryLabel", group: "Hero", label: "Secondary button label", type: "text", default: "See Our Services" },
  { key: "hero.secondaryLink", group: "Hero", label: "Secondary button link", type: "url", default: "/services" },
  { key: "hero.stat1Value", group: "Hero", label: "Stat 1 value", type: "text", default: "7" },
  { key: "hero.stat1Label", group: "Hero", label: "Stat 1 label", type: "text", default: "Connected Services" },
  { key: "hero.stat2Value", group: "Hero", label: "Stat 2 value", type: "text", default: "1" },
  { key: "hero.stat2Label", group: "Hero", label: "Stat 2 label", type: "text", default: "Accountable Team" },
  { key: "hero.stat3Value", group: "Hero", label: "Stat 3 value", type: "text", default: "6" },
  { key: "hero.stat3Label", group: "Hero", label: "Stat 3 label", type: "text", default: "Industries Served" },

  // ---- About ----
  { key: "about.eyebrow", group: "About", label: "Eyebrow", type: "text", default: "About Aghaz Tech" },
  { key: "about.titlePre", group: "About", label: "Title (before highlight)", type: "text", default: "The team businesses" },
  { key: "about.titleHighlight", group: "About", label: "Title (highlighted)", type: "text", default: "wish they'd hired first" },
  { key: "about.desc", group: "About", label: "Description", type: "textarea", default: "Aghaz Tech exists because businesses were tired of hiring separate vendors for marketing, branding, and technology that never quite talked to each other. We bring all of it under one team — so every piece of your growth strategy works from the same plan." },
  { key: "about.badge", group: "About", label: "Floating badge text", type: "text", default: "One team. Every service." },
  { key: "about.feat1Icon", group: "About", label: "Feature 1 icon", type: "icon", default: "fa-magnifying-glass" },
  { key: "about.feat1Title", group: "About", label: "Feature 1 title", type: "text", default: "Audit before advice" },
  { key: "about.feat1Text", group: "About", label: "Feature 1 text", type: "text", default: "Every engagement starts with understanding your business — not a sales pitch." },
  { key: "about.feat2Icon", group: "About", label: "Feature 2 icon", type: "icon", default: "fa-users-gear" },
  { key: "about.feat2Title", group: "About", label: "Feature 2 title", type: "text", default: "Senior people, no handoffs" },
  { key: "about.feat2Text", group: "About", label: "Feature 2 text", type: "text", default: "The people who scope your project are the ones who build it." },
  { key: "about.feat3Icon", group: "About", label: "Feature 3 icon", type: "icon", default: "fa-seedling" },
  { key: "about.feat3Title", group: "About", label: "Feature 3 title", type: "text", default: "Built for the long term" },
  { key: "about.feat3Text", group: "About", label: "Feature 3 text", type: "text", default: "Most clients start with one service and expand as they see results." },
  { key: "about.primaryLabel", group: "About", label: "Primary button label", type: "text", default: "Learn Our Story" },
  { key: "about.primaryLink", group: "About", label: "Primary button link", type: "url", default: "/about" },
  { key: "about.secondaryLabel", group: "About", label: "Secondary button label", type: "text", default: "Meet the Team" },
  { key: "about.secondaryLink", group: "About", label: "Secondary button link", type: "url", default: "/team" },

  // ---- Section headings ----
  { key: "why.eyebrow", group: "Why Choose Us", label: "Eyebrow", type: "text", default: "Why Businesses Choose Aghaz Tech" },
  { key: "why.titlePre", group: "Why Choose Us", label: "Title (before highlight)", type: "text", default: "One team," },
  { key: "why.titleHighlight", group: "Why Choose Us", label: "Title (highlighted)", type: "text", default: "not five vendors" },

  { key: "services.eyebrow", group: "Services heading", label: "Eyebrow", type: "text", default: "What We Do" },
  { key: "services.titlePre", group: "Services heading", label: "Title (before highlight)", type: "text", default: "Seven connected services," },
  { key: "services.titleHighlight", group: "Services heading", label: "Title (highlighted)", type: "text", default: "one team" },
  { key: "services.desc", group: "Services heading", label: "Description", type: "textarea", default: "Get found. Get remembered. Run more efficiently. Use one service or all seven — every engagement is scoped to what your business actually needs." },

  { key: "process.eyebrow", group: "Process heading", label: "Eyebrow", type: "text", default: "Our Process" },
  { key: "process.titlePre", group: "Process heading", label: "Title (before highlight)", type: "text", default: "We understand your business" },
  { key: "process.titleHighlight", group: "Process heading", label: "Title (highlighted)", type: "text", default: "before we recommend anything" },

  { key: "industries.eyebrow", group: "Industries heading", label: "Eyebrow", type: "text", default: "Industries We Serve" },
  { key: "industries.titlePre", group: "Industries heading", label: "Title (before highlight)", type: "text", default: "Built for how" },
  { key: "industries.titleHighlight", group: "Industries heading", label: "Title (highlighted)", type: "text", default: "your industry" },
  { key: "industries.titlePost", group: "Industries heading", label: "Title (after highlight)", type: "text", default: "actually operates" },

  { key: "team.eyebrow", group: "Team heading", label: "Eyebrow", type: "text", default: "Meet the Team" },
  { key: "team.titlePre", group: "Team heading", label: "Title (before highlight)", type: "text", default: "The people" },
  { key: "team.titleHighlight", group: "Team heading", label: "Title (highlighted)", type: "text", default: "behind Aghaz Tech" },
  { key: "team.desc", group: "Team heading", label: "Description", type: "textarea", default: "Senior builders, designers, and strategists who own real outcomes — the people who scope your project are the ones who build it." },

  { key: "blog.eyebrow", group: "Blog heading", label: "Eyebrow", type: "text", default: "Insights" },
  { key: "blog.titlePre", group: "Blog heading", label: "Title (before highlight)", type: "text", default: "Practical insight," },
  { key: "blog.titleHighlight", group: "Blog heading", label: "Title (highlighted)", type: "text", default: "not filler content" },

  { key: "faq.eyebrow", group: "FAQ heading", label: "Eyebrow", type: "text", default: "FAQ" },
  { key: "faq.titlePre", group: "FAQ heading", label: "Title (before highlight)", type: "text", default: "Questions," },
  { key: "faq.titleHighlight", group: "FAQ heading", label: "Title (highlighted)", type: "text", default: "answered" },

  { key: "cta.titlePre", group: "Final CTA", label: "Title (before highlight)", type: "text", default: "Tell us what's holding your" },
  { key: "cta.titleHighlight", group: "Final CTA", label: "Title (highlighted)", type: "text", default: "business back" },
  { key: "cta.desc", group: "Final CTA", label: "Description", type: "textarea", default: "We'll tell you what fixes it first. Every engagement starts with a conversation, not a sales pitch — and the first call is free." },
  { key: "cta.primaryLabel", group: "Final CTA", label: "Primary button label", type: "text", default: "Request a Consultation" },
  { key: "cta.primaryLink", group: "Final CTA", label: "Primary button link", type: "url", default: "/contact" },
  { key: "cta.secondaryLabel", group: "Final CTA", label: "Secondary button label", type: "text", default: "See Our Services" },
  { key: "cta.secondaryLink", group: "Final CTA", label: "Secondary button link", type: "url", default: "/services" },
];

// The 7 service cards (icon + title + text + link), generated so the registry stays tidy.
const SERVICE_DEFAULTS = [
  ["fa-bullhorn", "Digital Marketing", "Lead generation, content, and performance campaigns built on clear positioning, not content volume.", "/services/digital-marketing"],
  ["fa-magnifying-glass-chart", "SEO Services", "Technical audits, on-page optimization, and content strategy that build visibility that compounds.", "/services/seo-services"],
  ["fa-fingerprint", "Branding", "Brand strategy, messaging, and visual identity that make you memorable instead of interchangeable.", "/services/branding"],
  ["fa-robot", "AI Solutions", "Practical automation and AI tools built around your real bottlenecks, inside the systems you already use.", "/services/ai-solutions"],
  ["fa-code", "Software Development", "Custom internal tools, customer platforms, and SaaS products built around your specific workflow.", "/services/software-development"],
  ["fa-display", "Web Development", "Websites and web applications built to convert, load fast, and scale with your business.", "/services/web-development"],
  ["fa-arrows-spin", "Digital Transformation", "Audits and roadmaps for businesses ready to replace manual processes with real systems.", "/services/digital-transformation"],
];
SERVICE_DEFAULTS.forEach(([icon, title, text, link], idx) => {
  const n = idx + 1;
  FIELDS.push(
    { key: `svc${n}.icon`, group: `Service ${n}`, label: `Service ${n} icon`, type: "icon", default: icon },
    { key: `svc${n}.title`, group: `Service ${n}`, label: `Service ${n} title`, type: "text", default: title },
    { key: `svc${n}.text`, group: `Service ${n}`, label: `Service ${n} text`, type: "textarea", default: text },
    { key: `svc${n}.link`, group: `Service ${n}`, label: `Service ${n} link`, type: "url", default: link }
  );
});

const BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f]));
const COLLECTION = "settings";
const DOC = "content";

class SiteContent {
  static isValidKey(key) {
    return Object.prototype.hasOwnProperty.call(BY_KEY, key);
  }

  static async getOverrides() {
    const snap = await admin.firestore().collection(COLLECTION).doc(DOC).get();
    return snap.exists ? snap.data() || {} : {};
  }

  // { key: value } with the stored override applied over each default -- what templates read.
  static async findAllAsMap() {
    const stored = await SiteContent.getOverrides();
    const map = {};
    FIELDS.forEach((f) => {
      const v = stored[f.key];
      map[f.key] = v === undefined || v === null || v === "" ? f.default : v;
    });
    return map;
  }

  // Grouped list with meta + current value + whether it is customised -- for the admin form.
  static async findGrouped() {
    const stored = await SiteContent.getOverrides();
    const groups = {};
    FIELDS.forEach((f) => {
      const custom = stored[f.key] !== undefined && stored[f.key] !== null && stored[f.key] !== "";
      (groups[f.group] ||= []).push({
        key: f.key,
        label: f.label,
        type: f.type,
        value: custom ? stored[f.key] : f.default,
        default: f.default,
        isCustom: custom,
      });
    });
    return Object.entries(groups).map(([group, fields]) => ({ group, fields }));
  }

  // Save many {key: value}. Unknown keys are ignored. Blank means "reset to default".
  static async saveMany(values) {
    const updates = {};
    Object.entries(values || {}).forEach(([key, value]) => {
      if (!SiteContent.isValidKey(key)) return;
      updates[key] = value == null ? "" : String(value);
    });
    if (Object.keys(updates).length) {
      await admin.firestore().collection(COLLECTION).doc(DOC).set(updates, { merge: true });
    }
    return Object.keys(updates).length;
  }
}

module.exports = SiteContent;
module.exports.FIELDS = FIELDS;
