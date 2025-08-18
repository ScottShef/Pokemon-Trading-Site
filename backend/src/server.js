
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Import all routes and middleware using ES Module syntax
// Note the addition of the '.js' extension for local files, which is required in ESM
import authRoutes from './routes/auth.js';
import authMiddleware from './middleware/auth.js';
import cardSearchRoute from './routes/cardsearch.js';
import pokemonRoutes from './routes/cardpage.js';
import listingRoutes from './routes/listing.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// MIDDLEWARE
// ========================
app.use(cors());
app.use(express.json());

// ========================
// ROUTES
// ========================

// Mount auth routes at /api/auth
app.use("/api/auth", authRoutes);

// Example protected route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "This route is protected!",
    userId: req.userId,
  });
});

// Mount card search route
app.use("/api/cards", cardSearchRoute);

// Mount card page details route
app.use("/api", pokemonRoutes);

// Mount the listing routes at the /api/listings endpoint
app.use('/api/listings', listingRoutes);

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

