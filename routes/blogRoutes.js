const express = require("express");
const blogController = require("../controllers/blogController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", blogController.getAllBlogs);

// Must precede /:slug, which would otherwise capture "all" as a slug.
router.get("/all", authMiddleware, blogController.getAllBlogsAdmin);

router.get("/:slug", blogController.getBlogBySlug);

// Admin routes
router.post("/", authMiddleware, blogController.createBlog);
router.put("/:id", authMiddleware, blogController.updateBlog);
router.delete("/:id", authMiddleware, blogController.deleteBlog);

module.exports = router;
