
import mongoose from 'mongoose';

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
    prices: mongoose.Schema.Types.Mixed
  },
  lastUpdated: Date,

  highestMarketPrice: {
    type: Number,
    default: 0,       // Sets a default value of 0 for new cards
    index: true         // Creates a database index for faster sorting
  }

}, { timestamps: true });

const PokemonCard = mongoose.model("PokemonCard", PokemonCardSchema);

export default PokemonCard;

