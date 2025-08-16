const express = require("express");
const jwt = require("jsonwebtoken"); // JWT for authentication
const User = require("../models/User"); // Import the User model

const router = express.Router();

// ========================
// REGISTER ROUTE
// ========================
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body; // Get data from request

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create new user document
    const user = new User({ username, email, password });

    // Save user to database (password will be hashed automatically)
    await user.save();

    // Generate JWT token for the user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Send response with user info and token
    res.json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// ========================
// LOGIN ROUTE
// ========================
router.post("/login", async (req, res) => {
  const { email, password } = req.body; // Get login data

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    // Compare password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT token for the user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Send response with user info and token
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
