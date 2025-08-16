const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendConfirmationEmail } = require("../utils/mailer");

const router = express.Router();

// ========================
// REGISTER ROUTE
// ========================
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    // Send confirmation email
    try {
      await sendConfirmationEmail(email, username);
    } catch (emailErr) {
      console.error("Error sending email:", emailErr);
      // Registration continues even if email fails
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "User registered successfully! Please check your email for confirmation.",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// ========================
// LOGIN ROUTE
// Supports username OR email
// ========================
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
