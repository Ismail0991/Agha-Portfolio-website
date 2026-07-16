const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const Admin = require("../models/Admin");

const router = express.Router();

// Registration was open to anyone, which let a stranger mint themselves an admin account.
// Once an admin exists, only a signed-in admin may create another. While none exists,
// registration is a bootstrap path that has to be opted into via .env.
const registerGuard = async (req, res, next) => {
  try {
    const admins = await Admin.findAll();

    if (admins.length > 0) {
      return authMiddleware(req, res, next);
    }

    if (process.env.ALLOW_ADMIN_REGISTRATION === "true") {
      return next();
    }

    return res.status(403).json({
      message:
        "No admin exists yet. Set ALLOW_ADMIN_REGISTRATION=true in .env to create the first one, then set it back to false.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/logout", authController.logoutAndRedirect);
router.post("/register", registerGuard, authController.register);

module.exports = router;
