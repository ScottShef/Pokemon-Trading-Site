
import axios from 'axios';

const API_BASE = "https://www.pokemonpricetracker.com/api";
const API_KEY = "pokeprice_free_88e09dbbadfcfe3b80cc4fa793c8a879cea3ab75"; // This should be in your .env file

async function fetchSets() {
  const res = await axios.get(`${API_BASE}/sets`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return res.data;
}

async function fetchCardsBySet(setId) {
  const res = await axios.get(`${API_BASE}/prices?setId=${setId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return res.data;
}

async function fetchCardById(cardId) {
  const res = await axios.get(`${API_BASE}/prices?id=${cardId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return res.data;
}

// --- Key change is here ---
export { fetchSets, fetchCardsBySet, fetchCardById };

