const SiteImage = require("../models/SiteImage");
const { invalidateSiteImagesCache } = require("../middleware/siteImages");

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
