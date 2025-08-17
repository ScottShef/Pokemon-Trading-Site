const mongoose = require("mongoose");

const PriceStatsSchema = new mongoose.Schema({
  low: Number,
  mid: Number,
  high: Number,
  market: Number,
  directLow: Number,
  averageSellPrice: Number,
  trendPrice: Number,
  reverseHoloTrend: Number,
  lowPrice: Number,
  reverseHoloLow: Number,
  // Add any other relevant fields
}, { _id: false });

const PokemonCardSchema = new mongoose.Schema({
  apiId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  number: String,
  rarity: String,
  images: {
    small: String,
    large: String
  },
  set: {
    id: String,
    name: String,
    series: String,
    releaseDate: Date
  },
  cardmarket: {
    url: String,
    updatedAt: Date,
    prices: PriceStatsSchema
  },
  tcgplayer: {
    url: String,
    updatedAt: Date,
    prices: {
      normal: PriceStatsSchema,
      holofoil: PriceStatsSchema,
      reverseHolofoil: PriceStatsSchema
    }
  },
  ebay: {
    updatedAt: Date,
    prices: mongoose.Schema.Types.Mixed // Can keep mixed here for graded keys (PSA10, PSA9, etc.)
  },
  lastUpdated: Date
}, { timestamps: true });

module.exports = mongoose.model("PokemonCard", PokemonCardSchema);
