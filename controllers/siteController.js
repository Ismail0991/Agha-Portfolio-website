const SiteImage = require("../models/SiteImage");
const SiteContent = require("../models/SiteContent");
const { invalidateSiteImagesCache } = require("../middleware/siteImages");
const { invalidateContentCache } = require("../middleware/siteContent");
const { readTheme, setTheme } = require("../middleware/siteTheme");

// Admin: grouped editable landing-page fields (label, type, current value, default).
exports.getContentDetailed = async (req, res) => {
  try {
    res.json(await SiteContent.findGrouped());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: save many { key: value }. Blank value resets that field to its default.
exports.updateContent = async (req, res) => {
  const values = req.body && req.body.values;
  if (!values || typeof values !== "object") {
    return res.status(400).json({ message: "Expected a 'values' object of { key: value }" });
  }
  try {
    const count = await SiteContent.saveMany(values);
    invalidateContentCache();
    res.json({ message: "Saved", updated: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public: current global theme (dark|light).
exports.getTheme = async (req, res) => {
  try {
    res.json({ theme: await readTheme() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin only: set the global theme for the whole site.
exports.updateTheme = async (req, res) => {
  const { theme } = req.body;
  if (theme !== "light" && theme !== "dark") {
    return res.status(400).json({ message: "theme must be 'light' or 'dark'" });
  }
  try {
    res.json({ theme: await setTheme(theme) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public: the pages fetch this to render their images.
exports.getImages = async (req, res) => {
  try {
    res.json(await SiteImage.findAllAsMap());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: the full slot list, including labels and whether each is customised.
exports.getImagesDetailed = async (req, res) => {
  try {
    res.json(await SiteImage.findAll());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateImage = async (req, res) => {
  const { key } = req.params;
  const { url, publicId } = req.body;

  if (!SiteImage.isValidKey(key)) {
    return res.status(400).json({ message: `Unknown image slot: ${key}` });
  }
  if (!url) {
    return res.status(400).json({ message: "url is required" });
  }

  try {
    const image = await SiteImage.save(key, { url, publicId });
    invalidateSiteImagesCache();
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Drops the override so the slot falls back to its built-in default.
exports.resetImage = async (req, res) => {
  const { key } = req.params;

  if (!SiteImage.isValidKey(key)) {
    return res.status(400).json({ message: `Unknown image slot: ${key}` });
  }

  try {
    await SiteImage.reset(key);
    invalidateSiteImagesCache();
    res.json({ message: "Image reset to default" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
