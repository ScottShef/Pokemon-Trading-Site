
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import PokemonCard from '../models/PokemonCard.js';

dotenv.config();

const API_KEY = process.env.POKEPRICE_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

if (!API_KEY) throw new Error("POKEPRICE_API_KEY missing from .env");
if (!MONGO_URI) throw new Error("MONGO_URI missing from .env");

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCardsInSet(setId) {
  const allCards = [];
  let page = 1;
  let fetchedCards;
  do {
    try {
      const response = await axios.get(`https://www.pokemonpricetracker.com/api/prices?setId=${setId}&limit=100&page=${page}`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });
      fetchedCards = response.data.data;
      if (fetchedCards) allCards.push(...fetchedCards);
      page++;
    } catch (err) {
      console.error("Error fetching cards:", err.response?.data || err.message);
      break;
    }
  } while (fetchedCards && fetchedCards.length > 0);
  return allCards;
}

async function importCard(card) {
  try {
    await PokemonCard.findOneAndUpdate(
      { apiId: card.id },
      {
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
      },
      { upsert: true, new: true, strict: false }
    );
    console.log(`Imported card: ${card.name} (${card.id})`);
  } catch (err) {
    console.error("Error importing card:", err.message);
  }
}

async function importSet(setId) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const cards = await fetchCardsInSet(setId);
    console.log(`Found ${cards.length} cards in set ${setId}`);
    const REQUEST_INTERVAL = 1000;

    for (const card of cards) {
      await importCard(card);
      await wait(REQUEST_INTERVAL);
    }
  } catch(err) {
    console.error(`An error occurred importing set ${setId}:`, err.message);
  } finally {
     if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log(`Finished importing set ${setId}. MongoDB disconnected.`);
     }
  }
}

const SET_ID = "base1";
importSet(SET_ID);

