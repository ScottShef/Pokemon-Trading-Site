import express from 'express';
import PokemonProducts from '../models/PokemonProduct.js';

const router = express.Router();

const STOP_WORDS = ["the", "a", "an", "of", "and", "in", "on", "&"];
const PRODUCT_KEYWORDS = ["box", "pack", "bundle", "case", "blister", "collection"];

router.get("/search", async (req, res) => {
  try {
    const { q, sort, type } = req.query;

    // --- Keyword search ---
    let andConditions = [];
    if (q) {
      const keywords = q
        .split(/\s+/)
        .map(kw => kw.trim().toLowerCase())
        .filter(kw => kw && !STOP_WORDS.includes(kw));

      andConditions = keywords.map(keyword => ({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { number: { $regex: keyword, $options: "i" } },
          { "set.name": { $regex: keyword, $options: "i" } },
          { "set.series": { $regex: keyword, $options: "i" } },
          { rarity: { $regex: keyword, $options: "i" } },
        ],
      }));
    }

    const finalQuery = andConditions.length > 0 ? { $and: andConditions } : {};

    // --- Type filter ---
    if (type === "card") {
      finalQuery.type = "card";
    } else if (type === "product") {
      finalQuery.type = "product";
    } // if type==="both" or undefined → no filter

    // --- Sorting ---
    let sortOptions = {};
    const sortKey = "highestMarketPrice";
    switch (sort) {
      case "price-asc":
        sortOptions = { [sortKey]: 1 };
        break;
      case "price-desc":
      default:
        sortOptions = { [sortKey]: -1 };
        break;
    }

    const results = await PokemonProducts.find(finalQuery)
      .sort(sortOptions)
      .limit(100);

    res.json(results);
  } catch (err) {
    console.error("Error in card search:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
