
import express from 'express';
import PokemonCard from '../models/PokemonCard.js'; // Note the import change
import { fetchSets, fetchCardsBySet, fetchCardById } from '../utils/PokemonApi.js'; // Assuming this file will also be converted

const router = express.Router();

router.get("/sets", async (req, res) => {
  try {
    const sets = await fetchSets();
    res.json(sets);
  } catch (err) {
    console.error("Error fetching sets:", err.message);
    res.status(500).json({ error: "Failed to fetch sets" });
  }
});

router.post("/import/set/:setId", async (req, res) => {
  const { setId } = req.params;
  try {
    const cards = await fetchCardsBySet(setId);
    const results = [];
    for (const card of cards) {
      const savedCard = await PokemonCard.findOneAndUpdate(
        { apiId: card.id }, // Changed from cardId to apiId to match schema
        {
          apiId: card.id,
          name: card.name,
          set: card.set,
          rarity: card.rarity,
          images: card.images,
          // Assuming prices come in a compatible format
          tcgplayer: card.tcgplayer,
          cardmarket: card.cardmarket,
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

router.post("/import/card/:cardId", async (req, res) => {
  const { cardId } = req.params;
  try {
    const card = await fetchCardById(cardId);
    if (!card || !card.id) {
      return res.status(404).json({ error: "Card not found" });
    }
    const savedCard = await PokemonCard.findOneAndUpdate(
      { apiId: card.id }, // Changed from cardId to apiId
      {
        apiId: card.id,
        name: card.name,
        set: card.set,
        rarity: card.rarity,
        images: card.images,
        tcgplayer: card.tcgplayer,
        cardmarket: card.cardmarket,
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

export default router;