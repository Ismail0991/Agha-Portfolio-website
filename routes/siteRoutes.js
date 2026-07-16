const express = require("express");
const siteController = require("../controllers/siteController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Public: consumed by the site's pages.
router.get("/images", siteController.getImages);

// Admin. "/images/detailed" must precede "/images/:key" or it would be read as a key.
router.get("/images/detailed", authMiddleware, siteController.getImagesDetailed);
router.put("/images/:key", authMiddleware, siteController.updateImage);
router.delete("/images/:key", authMiddleware, siteController.resetImage);

module.exports = router;
