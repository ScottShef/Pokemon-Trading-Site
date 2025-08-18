
import express from 'express';
import PokemonCard from '../models/PokemonCard.js';

const router = express.Router();

const STOP_WORDS = ["the", "a", "an", "of", "and", "in", "on", "&"];

router.get("/search", async (req, res) => {
  try {
    const { q, sort } = req.query;

    // Keyword search logic (remains unchanged)
    let andConditions = [];
    if (q) {
      const keywords = q.split(/\s+/).map(kw => kw.trim().toLowerCase()).filter(kw => kw && !STOP_WORDS.includes(kw));
      andConditions = keywords.map(keyword => ({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { number: { $regex: keyword, $options: "i" } },
          { "set.name": { $regex: keyword, $options: "i" } },
          { "set.series": { $regex: keyword, $options: "i" } },
          { rarity: { $regex: keyword, $options: "i" } },
        ],
      }));
    }
    const finalQuery = andConditions.length > 0 ? { $and: andConditions } : {};

    // --- FIX: Define the sorting logic based on the new top-level field ---
    let sortOptions = {};
    
    // This is the only line that needs to change.
    const sortKey = 'highestMarketPrice'; 

    switch (sort) {
      case 'price-asc':
        sortOptions = { [sortKey]: 1 }; // Sort ascending by highestMarketPrice
        break;
      case 'price-desc':
      default:
        sortOptions = { [sortKey]: -1 }; // Sort descending by highestMarketPrice
        break;
    }

    const cards = await PokemonCard.find(finalQuery)
      .sort(sortOptions)
      .limit(100);

    res.json(cards);
  } catch (err) {
    console.error("Error in card search:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

