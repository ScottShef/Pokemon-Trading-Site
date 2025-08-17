// This script imports a single Pokémon card using the PokePrice API and stores it in MongoDB.

require("dotenv").config(); // Load .env variables
const mongoose = require("mongoose");
const axios = require("axios");
const PokemonCard = require("../models/PokemonCard"); // Make sure this path is correct

const API_KEY = process.env.POKEPRICE_API_KEY;
const API_BASE = "https://www.pokemonpricetracker.com/api/prices";

// --- Import a single card ---
async function importCard(cardId) {
  try {
    const res = await axios.get(`${API_BASE}?id=${cardId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const cardData = res.data.data[0];
    if (!cardData) throw new Error("No card data returned");

    // Upsert card in MongoDB
    const savedCard = await PokemonCard.findOneAndUpdate(
      { apiId: cardData.id },
      {
        apiId: cardData.id,
        name: cardData.name,
        number: cardData.number,
        rarity: cardData.rarity,
        images: cardData.images,
        set: cardData.set,
        cardmarket: cardData.cardmarket,
        tcgplayer: cardData.tcgplayer,
        ebay: cardData.ebay,
        lastUpdated: new Date(cardData.lastUpdated)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("Imported card:", savedCard.name);
  } catch (err) {
    console.error("Error importing card:", err.message);
  }
}

// --- Main function ---
async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Example: import one card
    const testCardId = "swsh3-20"; // Replace with the card ID you want
    await importCard(testCardId);

    mongoose.connection.close();
    console.log("Done");
  } catch (err) {
    console.error("Error in run:", err.message);
  }
}

run();
