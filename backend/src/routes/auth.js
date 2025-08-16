const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendConfirmationEmail } = require("../utils/mailer");

const router = express.Router();

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
      // Do NOT block registration if email fails
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

module.exports = router;
