
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import PokemonCard from '../models/PokemonCard.js';

dotenv.config();

const API_KEY = process.env.POKEPRICE_API_KEY;
const API_BASE = "https://www.pokemonpricetracker.com/api/prices";

async function importCard(cardId) {
  try {
    const res = await axios.get(`${API_BASE}?id=${cardId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    const cardData = res.data?.data?.[0];
    if (!cardData) throw new Error("No card data returned from API");

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
    console.log("Imported/Updated card:", savedCard.name);
  } catch (err) {
    console.error("Error importing card:", err.message);
  }
}

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const testCardId = "swsh3-20";
    await importCard(testCardId);

  } catch (err) {
    console.error("Error in run:", err.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log("Done. MongoDB disconnected.");
    }
  }
}

run();

