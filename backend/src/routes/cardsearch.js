// routes/cardsearch.js
const express = require("express");
const router = express.Router();
const PokemonCard = require("../models/PokemonCard"); // adjust path to your model

// Define stop words you want to ignore
const STOP_WORDS = ["the", "a", "an", "of", "and", "in", "on", "&"];

// GET /api/cards/search?q=...
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json(await PokemonCard.find().limit(100));

    // Split query into keywords, remove stop words, trim spaces
    const keywords = q
      .split(/\s+/)
      .map((kw) => kw.trim().toLowerCase())
      .filter((kw) => kw && !STOP_WORDS.includes(kw));

    // Build $and array: each keyword must match at least one field
    const andConditions = keywords.map((keyword) => ({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { number: { $regex: keyword, $options: "i" } },
        { "set.name": { $regex: keyword, $options: "i" } },
        { "set.series": { $regex: keyword, $options: "i" } },
        { rarity: { $regex: keyword, $options: "i" } },
      ],
    }));

    const cards = await PokemonCard.find({ $and: andConditions }).limit(100);
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
