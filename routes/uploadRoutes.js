const express = require("express");
const multer = require("multer");
const uploadController = require("../controllers/uploadController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

// Memory storage: the buffer is streamed straight to Cloudinary, so nothing is written
// to disk and there is no temp file to clean up or serve by accident.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WebP, GIF and AVIF images are allowed"));
    }
    cb(null, true);
  },
});

// Uploading burns storage and bandwidth on a real account, so it stays behind auth.
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
      if (!error) return next();
      const tooBig = error.code === "LIMIT_FILE_SIZE";
      res.status(400).json({
        message: tooBig
          ? `Image is too large. Maximum size is ${MAX_BYTES / 1024 / 1024}MB.`
          : error.message,
      });
    });
  },
  uploadController.uploadImage
);

router.delete("/", authMiddleware, uploadController.deleteImage);

module.exports = router;
