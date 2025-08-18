const express = require("express");
const User = require("../models/User"); // Mongoose User model
const authMiddleware = require("../middleware/auth"); // JWT verification

const router = express.Router();

router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    console.log("=== Change Password Request ===");
    console.log("Request body:", req.body);

    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      console.log("Validation failed: missing currentPassword or newPassword");
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", { id: user._id, username: user.username, email: user.email });

    const isMatch = await user.comparePassword(currentPassword);
    console.log("Current password match:", isMatch);

    if (!isMatch) {
      console.log("Current password is incorrect");
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    console.log("Setting new password...");
    user.password = newPassword; // Let pre-save hook hash it

    // Save user and log result
    const savedUser = await user.save();
    console.log("Password updated successfully in DB for user:", savedUser._id);
    console.log("Stored password hash:", savedUser.password);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error in change-password route:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
