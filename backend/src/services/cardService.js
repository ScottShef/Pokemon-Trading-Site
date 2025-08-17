const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const PokemonCard = require("../models/PokemonCard"); // your model

const API_KEY = process.env.POKEPRICE_API_KEY; // or hardcode your key for testing
const API_BASE = "https://www.pokemonpricetracker.com/api/prices";

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

async function importCardById(cardId) {
  try {
    const res = await axios.get(`${API_BASE}?id=${cardId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    const cardData = res.data.data[0]; // single card

    if (!cardData) throw new Error("Card not found");

    // Map API data to your schema
    const cardDoc = {
      apiId: cardData.id,
      name: cardData.name,
      number: cardData.number,
      rarity: cardData.rarity,
      images: cardData.images,
      set: cardData.set,
      cardmarket: cardData.cardmarket ? {
        url: cardData.cardmarket.url,
        updatedAt: new Date(cardData.cardmarket.updatedAt),
        prices: cardData.cardmarket.prices
      } : undefined,
      tcgplayer: cardData.tcgplayer ? {
        url: cardData.tcgplayer.url,
        updatedAt: new Date(cardData.tcgplayer.updatedAt),
        prices: {
          normal: cardData.tcgplayer.prices.normal || {},
          holofoil: cardData.tcgplayer.prices.holofoil || {},
          reverseHolofoil: cardData.tcgplayer.prices.reverseHolofoil || {}
        }
      } : undefined,
      ebay: cardData.ebay ? cardData.ebay : undefined,
      lastUpdated: cardData.lastUpdated ? new Date(cardData.lastUpdated) : new Date()
    };

    // Upsert: create new if not exists, or update existing
    await PokemonCard.findOneAndUpdate(
      { apiId: cardDoc.apiId },
      cardDoc,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Imported card: ${cardDoc.name} (${cardDoc.apiId})`);
  } catch (err) {
    console.error("Error importing card:", err.message);
  }
}

// Example usage
(async () => {
  await importCardById("swsh3-20"); // replace with any card id
  mongoose.disconnect();
})();
