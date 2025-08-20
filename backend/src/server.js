import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Routes
import authRoutes from './routes/auth.js';
import authMiddleware from './middleware/auth.js';
import cardSearchRoute from './routes/cardsearch.js';
import pokemonRoutes from './routes/cardpage.js';
import listingRoutes from './routes/listing.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected route!', userId: req.userId });
});
app.use('/api/cards', cardSearchRoute);
app.use('/api', pokemonRoutes);
app.use('/api/listings', listingRoutes);

// Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
