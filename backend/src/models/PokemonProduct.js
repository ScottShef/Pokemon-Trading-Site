import { productDb } from '../db/connections.js';
import mongoose from 'mongoose';

const PriceSchema = new mongoose.Schema({
  low: { type: Number, default: null },
  mid: { type: Number, default: null },
  high: { type: Number, default: null },
  market: { type: Number, default: null },
  directLow: { type: Number, default: null },
  averageSellPrice: { type: Number, default: null },
  trendPrice: { type: Number, default: null },
  reverseHoloTrend: { type: Number, default: null },
  lowPrice: { type: Number, default: null },
  reverseHoloLow: { type: Number, default: null }
}, { _id: false });

const TCGPlayerSchema = new mongoose.Schema({
  url: { type: String, default: null },
  updatedAt: { type: Date, default: null },
  prices: {
    normal: { type: PriceSchema, default: {} },
    holofoil: { type: PriceSchema, default: {} },
    reverseHolofoil: { type: PriceSchema, default: {} }
  }
}, { _id: false });

const CardSchema = new mongoose.Schema({
  apiId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  number: { type: String, default: null },
  rarity: { type: String, default: null },
  images: {
    small: { type: String, default: null },
    large: { type: String, default: null }
  },
  set: {
    id: { type: String, default: null },
    name: { type: String, default: null },
    series: { type: String, default: null },
    releaseDate: { type: Date, default: null }
  },
  cardmarket: {
    url: { type: String, default: null },
    updatedAt: { type: Date, default: null },
    prices: { type: PriceSchema, default: {} }
  },
  tcgplayer: { type: TCGPlayerSchema, default: {} },
  ebay: {
    updatedAt: { type: Date, default: null },
    prices: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  lastUpdated: { type: Date, default: Date.now },
  highestMarketPrice: { type: Number, default: 0, index: true }
}, { timestamps: true });

const PokemonProducts = productDb.model('Pokemon_Products', CardSchema, 'Pokemon_Products');

export default PokemonProducts;
