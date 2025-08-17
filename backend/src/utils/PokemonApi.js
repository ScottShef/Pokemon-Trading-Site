const axios = require("axios");

const API_BASE = "https://www.pokemonpricetracker.com/api";
const API_KEY = "pokeprice_free_88e09dbbadfcfe3b80cc4fa793c8a879cea3ab75d1faefce";

// 1. Get all sets
async function fetchSets() {
  const res = await axios.get(`${API_BASE}/sets`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return res.data;
}

// 2. Get all cards in a set
async function fetchCardsBySet(setId) {
  const res = await axios.get(`${API_BASE}/prices?setId=${setId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return res.data;
}

// 3. Get a specific card by ID
async function fetchCardById(cardId) {
  const res = await axios.get(`${API_BASE}/prices?id=${cardId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return res.data;
}

module.exports = { fetchSets, fetchCardsBySet, fetchCardById };
