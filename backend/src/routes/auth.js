
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// --- This is the key change ---
import { User } from '../models/User.js'; // Changed to a named import
import authMiddleware from '../middleware/auth.js';
import { sendConfirmationEmail } from '../utils/mailer.js';

const router = express.Router();

// -------------------
// REGISTER ROUTE
// -------------------
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = new User({ username, email, password });
    await user.save();

    try {
      await sendConfirmationEmail(email, username);
    } catch (emailErr) {
      console.error("Error sending confirmation email:", emailErr);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(201).json({
      message: "User registered successfully! Please check your email for confirmation.",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message || "Server error during registration" });
  }
});

// ... (The rest of your routes - login, change-password, etc. - remain exactly the same)
// -------------------
// LOGIN ROUTE
// -------------------
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: "Username/email and password are required" });
  }
  try {
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { username: { $regex: new RegExp(`^${identifier}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

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
    res.status(500).json({ error: "Server error during login" });
  }
});

// -------------------
// CHANGE PASSWORD ROUTE
// -------------------
router.put("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "All password fields are required" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "The current password you entered is incorrect" });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error while changing password" });
  }
});

// -------------------
// GET CURRENT USER INFO
// -------------------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password"); // Exclude password hash
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;

