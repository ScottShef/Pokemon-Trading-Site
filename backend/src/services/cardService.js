
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PokemonCard from '../models/PokemonCard.js'; // Use default import

dotenv.config();

const API_KEY = process.env.POKEPRICE_API_KEY;
const API_BASE = "https://www.pokemonpricetracker.com/api/prices";

/**
 * Imports a single Pokémon card by its ID from the API and saves it to the database.
 * @param {string} cardId - The ID of the card to import (e.g., "swsh3-20").
 */
async function importCardById(cardId) {
  try {
    const res = await axios.get(`${API_BASE}?id=${cardId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    const cardData = res.data?.data?.[0];
    if (!cardData) {
      throw new Error(`Card with ID "${cardId}" not found in API response.`);
    }

    // Map API data to your Mongoose schema
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
      ebay: cardData.ebay || undefined,
      lastUpdated: cardData.lastUpdated ? new Date(cardData.lastUpdated) : new Date()
    };

    // Upsert: create a new document if it doesn't exist, or update the existing one
    await PokemonCard.findOneAndUpdate(
      { apiId: cardDoc.apiId },
      cardDoc,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Successfully imported/updated card: ${cardDoc.name} (${cardDoc.apiId})`);

  } catch (err) {
    console.error(`Error importing card "${cardId}":`, err.message);
  }
}

/**
 * Main execution function to connect to the database, run the import, and disconnect.
 */
async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    // Example usage: import a single card
    await importCardById("swsh3-20"); // Replace with any card ID

  } catch (err) {
    console.error("An error occurred during the run process:", err.message);
  } finally {
    // Ensure the database connection is always closed
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

// Execute the script
run();

