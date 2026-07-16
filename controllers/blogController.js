const Blog = require("../models/Blog");

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll({ published: true });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// The admin panel needs drafts too, which getAllBlogs deliberately withholds from the
// public site. Auth-gated so unpublished work stays private.
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.findAll();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findBySlug(req.params.slug);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    await blog.incrementViews();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBlog = async (req, res) => {
  const { title, content, excerpt, category, author, image, tags, published } =
    req.body;
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    const blog = new Blog({
      title,
      slug,
      content,
      excerpt,
      category,
      author,
      image,
      // The form posts a comma-separated string, but API clients may send an array.
      tags: Array.isArray(tags) ? tags : tags ? tags.split(",") : [],
      published,
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assigning req.body wholesale let a client overwrite id (which would make save() write
// to a different document), createdAt, and views. It also skipped the comma-string ->
// array conversion that createBlog does, so an edit stored tags as a raw string and the
// editor's (blog.tags || []).join(",") then threw. Only these fields may be updated.
const BLOG_UPDATABLE = [
  "title",
  "slug",
  "content",
  "excerpt",
  "category",
  "author",
  "image",
  "published",
];

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    for (const field of BLOG_UPDATABLE) {
      if (req.body[field] !== undefined) blog[field] = req.body[field];
    }

    if (req.body.tags !== undefined) {
      const { tags } = req.body;
      blog.tags = Array.isArray(tags) ? tags : tags ? tags.split(",") : [];
    }

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    await blog.delete();
    res.json({ message: "Blog deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
