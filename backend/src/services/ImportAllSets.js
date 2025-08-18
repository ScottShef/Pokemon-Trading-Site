
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import PokemonCard from '../models/PokemonCard.js';

dotenv.config();

// Ensure environment variables are set
const API_KEY = process.env.POKEPRICE_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

// --- Helper & Rate Limiter (no changes needed here) ---
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
      await wait(this.intervalMs);
    }
    this.running = false;
  }
}

const rateLimiter = new RateLimiter(1100);
const headers = { Authorization: `Bearer ${API_KEY}` };

// --- API & DB Functions (no changes needed here) ---
async function getSets() {
  const res = await axios.get("https://www.pokemonpricetracker.com/api/sets", { headers });
  return res.data.data;
}

async function getCardsInSet(setId) {
  let allCards = [];
  let page = 1;
  let fetchedCards;
  do {
    try {
      const res = await axios.get(`https://www.pokemonpricetracker.com/api/prices?setId=${setId}&limit=200&page=${page}`, { headers });
      fetchedCards = res.data.data;
      if (fetchedCards) allCards.push(...fetchedCards);
      page++;
    } catch (err) {
      console.error(`Error fetching cards for set ${setId}, page ${page}:`, err.response?.data || err.message);
      break;
    }
  } while (fetchedCards && fetchedCards.length > 0);
  return allCards;
}

async function getCardDetails(cardId) {
  const res = await axios.get(`https://www.pokemonpricetracker.com/api/prices?id=${cardId}`, { headers });
  return res.data.data[0];
}

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

function needsUpdate(card) {
  if (!card || !card.lastUpdated) return true;
  const now = new Date();
  const diffHours = (now - new Date(card.lastUpdated)) / (1000 * 60 * 60);
  return diffHours >= 24;
}

// --- Main Function (no changes needed in logic) ---
async function importAllSets() {
  try {
    console.log("Connecting to MongoDB for full import...");
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected.");

    const sets = await getSets();
    console.log(`Found ${sets.length} sets`);

    for (const set of sets) {
      console.log(`Importing set: ${set.name} (${set.id})`);
      const cards = await getCardsInSet(set.id);

      const cardPromises = cards.map(card => rateLimiter.enqueue(async () => {
        try {
          const existingCard = await PokemonCard.findOne({ apiId: card.id });
          if (!needsUpdate(existingCard)) {
            // console.log(`Skipping card (recently updated): ${card.name} (${card.id})`);
            return;
          }
          const detailedCard = await getCardDetails(card.id);
          if (detailedCard) {
            await upsertCard(detailedCard);
            console.log(`Imported/Updated card: ${card.name} (${card.id})`);
          }
        } catch (cardError) {
          console.error(`Failed to process card ${card.id}: ${cardError.message}`);
        }
      }));
      await Promise.all(cardPromises);
    }
  } catch (err) {
    console.error("A critical error occurred during the import process:", err);
    throw err; // Re-throw to be caught by scheduler if applicable
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("Finished importing all sets! MongoDB disconnected.");
    }
  }
}

// --- Key change is here ---
export default importAllSets;

