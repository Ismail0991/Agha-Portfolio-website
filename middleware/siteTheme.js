const admin = require("firebase-admin");

// The site theme is a single global setting the admin controls; visitors cannot change it.
// Stored in Firestore settings/site.theme, cached so it is not read on every request.
const COLLECTION = "settings";
const DOC = "site";
const TTL_MS = 30 * 1000;

let cache = null;
let cachedAt = 0;

const normalize = (t) => (t === "light" ? "light" : "dark");

const readTheme = async () => {
  const snap = await admin.firestore().collection(COLLECTION).doc(DOC).get();
  return normalize(snap.exists ? snap.data().theme : "dark");
};

const setTheme = async (theme) => {
  const t = normalize(theme);
  await admin.firestore().collection(COLLECTION).doc(DOC).set({ theme: t }, { merge: true });
  cache = t;
  cachedAt = Date.now();
  return t;
};

// Exposes res.locals.siteTheme to every view (public + admin) so the theme is applied
// server-side -- no flash, and no per-visitor toggle.
const siteTheme = async (req, res, next) => {
  try {
    if (!cache || Date.now() - cachedAt > TTL_MS) {
      cache = await readTheme();
      cachedAt = Date.now();
    }
    res.locals.siteTheme = cache;
  } catch (error) {
    // A Firestore hiccup must not break rendering -- fall back to dark.
    res.locals.siteTheme = cache || "dark";
  }
  next();
};

module.exports = { siteTheme, readTheme, setTheme };
