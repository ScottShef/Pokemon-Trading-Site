// src/services/ImportAllSets.js
require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const PokemonCard = require("../models/PokemonCard");

// Delay helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limiter queue
class RateLimiter {
  constructor(intervalMs) {
    this.intervalMs = intervalMs;
    this.queue = [];
    this.running = false;
  }

  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.run();
    });
  }

  async run() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
      await wait(this.intervalMs); // wait between calls
    }

    this.running = false;
  }
}

const rateLimiter = new RateLimiter(1100); // ~60 calls/min

// Headers for API
const headers = {
  Authorization: `Bearer ${process.env.POKEPRICE_API_KEY}`,
};

// MongoDB connection
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));
}

// Fetch sets
async function getSets() {
  const res = await axios.get("https://www.pokemonpricetracker.com/api/sets", { headers });
  return res.data.data;
}

// Fetch cards in a set
async function getCardsInSet(setId) {
  const res = await axios.get(`https://www.pokemonpricetracker.com/api/prices?setId=${setId}`, { headers });
  return res.data.data;
}

// Fetch card details
async function getCardDetails(cardId) {
  const res = await axios.get(`https://www.pokemonpricetracker.com/api/prices?id=${cardId}`, { headers });
  return res.data.data[0];
}

// Upsert card
async function upsertCard(cardData) {
  await PokemonCard.findOneAndUpdate(
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
      lastUpdated: cardData.lastUpdated ? new Date(cardData.lastUpdated) : new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// Check if card needs update (24h)
function needsUpdate(card) {
  if (!card) return true;
  const now = new Date();
  const diffHours = (now - new Date(card.lastUpdated)) / (1000 * 60 * 60);
  return diffHours >= 24;
}

// Import all sets concurrently
async function importAllSets() {
  try {
    const sets = await getSets();
    console.log(`Found ${sets.length} sets`);

    const setPromises = sets.map(async (set) => {
      console.log(`Importing set: ${set.name} (${set.id})`);
      const cards = await getCardsInSet(set.id);

      // Process cards concurrently but rate-limited
      const cardPromises = cards.map(card => rateLimiter.enqueue(async () => {
        const existingCard = await PokemonCard.findOne({ apiId: card.id });
        if (!needsUpdate(existingCard)) {
          console.log(`Skipping card (recently updated): ${card.name} (${card.id})`);
          return;
        }
        const detailedCard = await getCardDetails(card.id);
        await upsertCard(detailedCard);
        console.log(`Imported/Updated card: ${card.name} (${card.id})`);
      }));

      await Promise.all(cardPromises);
    });

    await Promise.all(setPromises);
    console.log("Finished importing all sets!");
  } catch (err) {
    console.error("Error importing sets:", err);
    throw err;
  }
}

module.exports = importAllSets;
