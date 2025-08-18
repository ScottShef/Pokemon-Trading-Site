require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const PokemonCard = require("../models/PokemonCard");

const API_KEY = process.env.POKEPRICE_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

if (!API_KEY) throw new Error("POKEPRICE_API_KEY missing from .env");
if (!MONGO_URI) throw new Error("MONGO_URI missing from .env");

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Helper to wait X milliseconds
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch cards in a set with pagination
async function fetchCardsInSet(setId) {
  const allCards = [];
  let page = 1;
  let fetchedCards = [];

  do {
    try {
      const response = await axios.get(`https://www.pokemonpricetracker.com/api/prices?setId=${setId}&limit=100&page=${page}`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      fetchedCards = response.data.data;
      allCards.push(...fetchedCards);
      page++;
    } catch (err) {
      console.error("Error fetching cards:", err.response?.data || err.message);
      break;
    }
  } while (fetchedCards.length > 0);

  return allCards;
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

// Import all cards in a set with rate limiting
async function importSet(setId) {
  const cards = await fetchCardsInSet(setId);
  console.log(`Found ${cards.length} cards in set ${setId}`);

  const REQUEST_INTERVAL = 1000; // 1 request per second

  for (const card of cards) {
    await importCard(card);
    await wait(REQUEST_INTERVAL);
  }

  console.log(`Finished importing set ${setId}`);
  mongoose.disconnect();
}

// Replace with the set ID you want to import
const SET_ID = "base1";

importSet(SET_ID);
