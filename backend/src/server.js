const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Import auth routes and authentication middleware
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// MIDDLEWARE
// ========================
app.use(cors());          // Enable cross-origin requests (frontend on localhost:3000)
app.use(express.json());  // Parse JSON request bodies

// ========================
// ROUTES
// ========================

// Mount auth routes at /api/auth
// This will handle:
// POST /api/auth/register
// POST /api/auth/login
app.use("/api/auth", authRoutes);

// Example protected route that requires a valid JWT
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "This route is protected!",
    userId: req.userId, // userId is set by authMiddleware
  });
});

// Import card search route
const cardSearchRoute = require("./routes/cardsearch");
app.use("/api/cards", cardSearchRoute);

// ========================
// MONGODB CONNECTION
// ========================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ========================
// START SERVER
// ========================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
