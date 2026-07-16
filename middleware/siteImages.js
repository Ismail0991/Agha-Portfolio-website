const SiteImage = require("../models/SiteImage");

// Resolved server-side rather than fetched by the browser, so pages render with the
// right image immediately instead of flashing the default first. Cached because
// otherwise every page view would cost a Firestore read of data that rarely changes.
const TTL_MS = 60 * 1000;

let cache = null;
let cachedAt = 0;

const invalidateSiteImagesCache = () => {
  cache = null;
  cachedAt = 0;
};

const siteImages = async (req, res, next) => {
  try {
    if (!cache || Date.now() - cachedAt > TTL_MS) {
      cache = await SiteImage.findAllAsMap();
      cachedAt = Date.now();
    }
    res.locals.siteImages = cache;
  } catch (error) {
    // A Firestore hiccup must not take the whole page down -- fall back to defaults.
    console.error("Could not load site images:", error.message);
    res.locals.siteImages = cache || {};
  }
  next();
};

module.exports = { siteImages, invalidateSiteImagesCache };
