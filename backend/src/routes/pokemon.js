const express = require("express");
const PokemonCard = require("../models/PokemonCard");
const { fetchSets, fetchCardsBySet, fetchCardById } = require("../utils/PokemonApi");

const router = express.Router();

// 1. Get all sets
router.get("/sets", async (req, res) => {
  try {
    const sets = await fetchSets();
    res.json(sets);
  } catch (err) {
    console.error("Error fetching sets:", err.message);
    res.status(500).json({ error: "Failed to fetch sets" });
  }
});

// 2. Import all cards from a set
router.post("/import/set/:setId", async (req, res) => {
  const { setId } = req.params;

  try {
    const cards = await fetchCardsBySet(setId);
    const results = [];

    for (const card of cards) {
      const savedCard = await PokemonCard.findOneAndUpdate(
        { cardId: card.id },
        {
          cardId: card.id,
          name: card.name,
          set: card.set,
          rarity: card.rarity,
          images: card.images,
          prices: card.prices,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
      results.push(savedCard);
    }

    res.json({ message: `Imported ${results.length} cards from set ${setId}`, cards: results });
  } catch (err) {
    console.error("Error importing set:", err.message);
    res.status(500).json({ error: "Failed to import set" });
  }
});

// 3. Import single card by cardId
router.post("/import/card/:cardId", async (req, res) => {
  const { cardId } = req.params;

  try {
    const card = await fetchCardById(cardId);

    if (!card || !card.id) {
      return res.status(404).json({ error: "Card not found" });
    }

    const savedCard = await PokemonCard.findOneAndUpdate(
      { cardId: card.id },
      {
        cardId: card.id,
        name: card.name,
        set: card.set,
        rarity: card.rarity,
        images: card.images,
        prices: card.prices,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ message: `Card ${cardId} imported successfully`, card: savedCard });
  } catch (err) {
    console.error("Error importing card:", err.message);
    res.status(500).json({ error: "Failed to import card" });
  }
});

module.exports = router;
