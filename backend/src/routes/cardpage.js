
import express from 'express';
import PokemonCard from '../models/PokemonProduct.js'; // Note the import change

const router = express.Router();

router.get("/cards/:id", async (req, res) => {
  try {
    const card = await PokemonCard.findById(req.params.id);
    if (!card) return res.status(404).send("Card not found");
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;

