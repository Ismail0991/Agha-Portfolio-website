const SiteContent = require("../models/SiteContent");

// Merged content map (defaults + admin overrides) is needed on every landing-page render,
// so it is cached rather than read from Firestore each request.
const TTL_MS = 30 * 1000;

let cache = null;
let cachedAt = 0;

const invalidateContentCache = () => {
  cache = null;
  cachedAt = 0;
};

const siteContent = async (req, res, next) => {
  try {
    if (!cache || Date.now() - cachedAt > TTL_MS) {
      cache = await SiteContent.findAllAsMap();
      cachedAt = Date.now();
    }
    res.locals.content = cache;
  } catch (error) {
    // Never block a render on a content read -- fall back to whatever we have (or {}).
    res.locals.content = cache || {};
  }
  next();
};

module.exports = { siteContent, invalidateContentCache };
