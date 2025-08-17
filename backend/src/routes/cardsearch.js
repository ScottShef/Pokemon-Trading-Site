const express = require("express");
const router = express.Router();
const PokemonCard = require("../models/PokemonCard");

// GET /api/cards/search?q=...
router.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!q) return res.status(400).json({ message: "Missing search query" });

  // Create a case-insensitive regex for partial matching
  const regex = new RegExp(q, "i");

  try {
    const cards = await PokemonCard.find({
      $or: [
        { name: regex },
        { number: regex },
        { rarity: regex },
        { "set.name": regex }
      ]
    }).limit(100); // optional limit for performance

    res.json(cards);
  } catch (err) {
    console.error("Card search error:", err);
    res.status(500).json({ message: "Server error during card search" });
  }
});

module.exports = router;
