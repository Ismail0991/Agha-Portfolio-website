const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// Shared so clearCookie matches how the cookie was set -- a Secure cookie is not
// reliably overwritten by a non-Secure one, which would leave the user still logged in.
const cookieOptions = () => ({
  httpOnly: true,
  // Deployed over HTTPS this must not travel in clear; locally there is no TLS,
  // so requiring it would stop the cookie being set at all.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

exports.cookieOptions = cookieOptions;

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findByUsername(username);

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("authToken", token, {
      ...cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("authToken", cookieOptions());
  res.json({ message: "Logout successful" });
};

// The admin sidebar links to this with a plain <a href>, which issues a GET. Only POST
// was registered, so the link matched no route and logging out silently did nothing.
exports.logoutAndRedirect = (req, res) => {
  res.clearCookie("authToken", cookieOptions());
  res.redirect("/admin");
};

exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    let admin = await Admin.findByUsername(username);
    if (admin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    admin = new Admin({
      username,
      email,
      password,
      role: role || "editor",
    });

    await admin.save();

    res.status(201).json({
      message: "Admin registered successfully",
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
