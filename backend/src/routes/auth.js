const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth"); // JWT verification
const { sendConfirmationEmail } = require("../utils/mailer");

const router = express.Router();

// -------------------
// REGISTER ROUTE
// -------------------
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const user = new User({ username, email, password });
    await user.save();

    // Send confirmation email
    try {
      await sendConfirmationEmail(email, username);
    } catch (emailErr) {
      console.error("Error sending email:", emailErr);
    }

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

// -------------------
// LOGIN ROUTE
// -------------------
router.post("/login", async (req, res) => {
  console.log("Incoming request headers:", req.headers);
  console.log("Incoming request body:", req.body);

  const { identifier, password } = req.body;

  // Step 1: Check for missing fields
  if (!identifier || !password) {
    console.log("Missing identifier or password");
    return res.status(400).json({ error: "Missing credentials" });
  }

  console.log("Login attempt:", { identifier, password });

  try {
    // Step 2: Find user by email or username (both case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: { $regex: `^${identifier}$`, $options: "i" } },      // email case-insensitive
        { username: { $regex: `^${identifier}$`, $options: "i" } }   // username case-insensitive
      ]
    });

    console.log("Found user:", user);

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    // Step 3: Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Step 4: Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------
// CHANGE PASSWORD ROUTE
// -------------------
router.put("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId; // From JWT middleware

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------
// GET CURRENT USER INFO
// -------------------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("username email");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;