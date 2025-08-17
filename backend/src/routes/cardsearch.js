// routes/cardsearch.js
const express = require("express");
const router = express.Router();
const PokemonCard = require("../models/PokemonCard"); // adjust path to your model

// Define stop words you want to ignore
const STOP_WORDS = ["the", "a", "an", "of", "and", "in", "on", "&"];

// GET /api/cards/search?q=...
// GET /api/cards/search?q=...&sort=asc|desc
router.get("/search", async (req, res) => {
  try {
    const { q, sort } = req.query;

    // Build keyword search (same as before)
    let andConditions = [];
    if (q) {
      const keywords = q
        .split(/\s+/)
        .map((kw) => kw.trim().toLowerCase())
        .filter((kw) => kw);

      andConditions = keywords.map((keyword) => ({
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

    // Determine sort order: ascending or descending
    const sortOrder = sort === "asc" ? 1 : -1; // default to descending

    const cards = await PokemonCard.find(finalQuery)
      .sort({ "cardmarket.prices.averageSellPrice": sortOrder })
      .limit(100);

    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
