require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const PokemonCard = require("../models/PokemonCard");

const API_KEY = process.env.POKEPRICE_API_KEY; // make sure this is in your .env
const MONGO_URI = process.env.MONGO_URI;

if (!API_KEY) throw new Error("POKEPRICE_API_KEY missing from .env");
if (!MONGO_URI) throw new Error("MONGO_URI missing from .env");

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Fetch all cards in a set
async function fetchCardsInSet(setId) {
  try {
    const response = await axios.get(`https://www.pokemonpricetracker.com/api/prices?setId=${setId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    return response.data.data; // array of card objects
  } catch (err) {
    console.error("Error fetching cards:", err.response?.data || err.message);
    return [];
  }
}

// Import a single card into MongoDB
async function importCard(card) {
  try {
    const update = {
      apiId: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      images: card.images,
      set: card.set,
      cardmarket: card.cardmarket,
      tcgplayer: card.tcgplayer,
      ebay: card.ebay,
      lastUpdated: card.lastUpdated ? new Date(card.lastUpdated) : new Date()
    };

    await PokemonCard.findOneAndUpdate(
      { apiId: card.id },
      update,
      { upsert: true, new: true, strict: false }
    );

    console.log(`Imported card: ${card.name} (${card.id})`);
  } catch (err) {
    console.error("Error importing card:", err.message);
  }
}

// Import all cards in a set concurrently
async function importSet(setId) {
  const cards = await fetchCardsInSet(setId);
  console.log(`Found ${cards.length} cards in set ${setId}`);

  const promises = cards.map(card => importCard(card));
  await Promise.all(promises);

  console.log(`Finished importing set ${setId}`);
  mongoose.disconnect();
}

// Replace with the set ID you want to import
const SET_ID = "swsh3";

importSet(SET_ID);
