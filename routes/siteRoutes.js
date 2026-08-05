const express = require("express");
const siteController = require("../controllers/siteController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Public: consumed by the site's pages.
router.get("/images", siteController.getImages);
router.get("/theme", siteController.getTheme);

// Admin only: change the global site theme.
router.put("/theme", authMiddleware, siteController.updateTheme);

// Admin only: edit landing-page content.
router.get("/content/detailed", authMiddleware, siteController.getContentDetailed);
router.put("/content", authMiddleware, siteController.updateContent);

// Admin. "/images/detailed" must precede "/images/:key" or it would be read as a key.
router.get("/images/detailed", authMiddleware, siteController.getImagesDetailed);
router.put("/images/:key", authMiddleware, siteController.updateImage);
router.delete("/images/:key", authMiddleware, siteController.resetImage);

module.exports = router;
