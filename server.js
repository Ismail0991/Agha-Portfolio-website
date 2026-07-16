require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");
const { initializeFirebase, verifyFirebaseCredential } = require("./config/database");
const { initializeCloudinary, verifyCloudinaryCredential } = require("./config/cloudinary");
const { pageAuth } = require("./middleware/auth");
const { siteImages } = require("./middleware/siteImages");
const { startKeepAlive } = require("./config/keepAlive");

const app = express();

// Initialize Firebase
initializeFirebase();

// Initialize Cloudinary (image hosting)
initializeCloudinary();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Declared before the view engine and the siteImages middleware so a health ping is as
// cheap as possible: no template render, no Firestore read, no layout wrapping.
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Wraps rendered views in views/layout.ejs, which supplies <head> and the
// Tailwind CDN. Admin views ship their own full HTML, so they pass layout: false.
app.use(expressLayouts);
app.set("layout", "layout");

// Exposes res.locals.siteImages to every view so admin-managed images render server-side.
app.use(siteImages);

// Responses carried an ETag but no Cache-Control, which leaves caching to the browser's
// heuristics -- so a back/forward or repeat navigation could reuse a stale response
// without revalidating, and freshly added blogs or team members would not appear until a
// manual reload. Say explicitly that this data is never reusable without checking.
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.set("Cache-Control", "no-store, must-revalidate");
  } else if (req.method === "GET" && !req.path.startsWith("/health")) {
    // Pages may still be cached, but must revalidate first: the ETag turns the check
    // into a cheap 304 when nothing changed.
    res.set("Cache-Control", "no-cache");
  }
  next();
});

// Routes
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const teamRoutes = require("./routes/teamRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const siteRoutes = require("./routes/siteRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/site", siteRoutes);

// Static pages routes
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/services", (req, res) => {
  res.render("services");
});

app.get("/team", (req, res) => {
  res.render("team");
});

app.get("/blog", (req, res) => {
  res.render("blog");
});

app.get("/blog/:slug", (req, res) => {
  res.render("blog-single", { slug: req.params.slug });
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/careers", (req, res) => {
  res.render("careers");
});

// Admin Panel Routes
app.get("/admin", (req, res) => {
  res.render("admin/login", { layout: false });
});

app.get("/admin/dashboard", pageAuth, (req, res) => {
  res.render("admin/dashboard", { layout: false });
});

app.get("/admin/blogs", pageAuth, (req, res) => {
  res.render("admin/blogs", { layout: false });
});

app.get("/admin/blogs/new", pageAuth, (req, res) => {
  res.render("admin/blog-editor", { layout: false });
});

app.get("/admin/blogs/:id/edit", pageAuth, (req, res) => {
  res.render("admin/blog-editor", { blogId: req.params.id, layout: false });
});

app.get("/admin/team", pageAuth, (req, res) => {
  res.render("admin/team", { layout: false });
});

app.get("/admin/site-images", pageAuth, (req, res) => {
  res.render("admin/site-images", { layout: false });
});

app.get("/admin/team/new", pageAuth, (req, res) => {
  res.render("admin/team-editor", { layout: false });
});

app.get("/admin/team/:id/edit", pageAuth, (req, res) => {
  res.render("admin/team-editor", { memberId: req.params.id, layout: false });
});

const PORT = process.env.PORT || 3000;
let startupFailed = false;

// On Windows the listen callback fires even when the bind ultimately fails, so the
// success line is deferred a tick and suppressed if an error lands first. Otherwise a
// port clash prints "Server running" and then quietly exits -- which reads like the
// server started fine and then stopped for no reason.
const server = app.listen(PORT, () => {
  setTimeout(() => {
    if (startupFailed) return;
    console.log(`Server running on http://localhost:${PORT}`);
    // Warns rather than exits: static pages still render without a working credential.
    verifyFirebaseCredential();
    verifyCloudinaryCredential();
    startKeepAlive();
  }, 0);
});

server.on("error", (error) => {
  startupFailed = true;
  if (error.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error("  Another copy of this server is probably still running.");
    console.error(`  Find it:  netstat -ano | findstr :${PORT}`);
    console.error("  Stop it:  taskkill /F /PID <pid>");
    console.error(`  Or run on another port:  set PORT=3001 && npm start\n`);
  } else {
    console.error("\nServer failed to start:", error.message, "\n");
  }
  process.exit(1);
});
