const jwt = require("jsonwebtoken");
const { cookieOptions } = require("../controllers/authController");

const authMiddleware = (req, res, next) => {
  const token = req.cookies.authToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Same verification as authMiddleware, but for rendered admin pages: redirects to the
// login screen instead of returning JSON. The page routes previously only checked that
// an authToken cookie was present, so any forged value rendered the admin shell.
const pageAuth = (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.redirect("/admin");
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.clearCookie("authToken", cookieOptions());
    res.redirect("/admin");
  }
};

module.exports = authMiddleware;
module.exports.pageAuth = pageAuth;
