// route for fetching card details

const express = require("express");
const router = express.Router();
const Card = require("../models/PokemonCard"); // adjust path if needed

// Get a single card by ID
router.get("/cards/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).send("Card not found");
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;