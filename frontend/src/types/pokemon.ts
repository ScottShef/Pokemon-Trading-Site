/**
 * This file defines the TypeScript interfaces for all Pokémon card-related data structures.
 * By centralizing these types, we ensure that data conforms to the same shape
 * whether it's being handled in the database, processed in an API route, or displayed
 * in a frontend component.
 */

// Defines the structure for various price points from different vendors.
export interface IPrice {
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
  directLow: number | null;
  // Cardmarket specific
  averageSellPrice?: number;
  trendPrice?: number;
  reverseHoloTrend?: number;
  // TCGPlayer specific
  lowPrice?: number;
  reverseHoloLow?: number;
}

// Defines the structure for pricing data from TCGPlayer.
export interface ITCGPlayer {
  url: string | null;
  updatedAt: string | null; // ISO Date string
  prices: {
    normal?: IPrice;
    holofoil?: IPrice;
    reverseHolofoil?: IPrice;
    // Add other potential finishes if they exist in your data
  };
}

// Defines the structure for the card's set information.
export interface ICardSet {
  id: string | null;
  name: string | null;
  series: string | null;
  releaseDate: string | null; // ISO Date string
}

// Defines the structure for pricing data from Cardmarket.
export interface ICardMarket {
  url: string | null;
  updatedAt: string | null; // ISO Date string
  prices: IPrice;
}

// Defines the structure for pricing data from eBay.
// The keys for `prices` can be dynamic (e.g., "Grade 7", "Ungraded").
export interface IEbay {
  updatedAt: string | null; // ISO Date string
  prices: Record<string, {
    grade?: string;
    average?: number;
    count?: number;
    url?: string;
  }>;
}

// This is the main interface for a Pokémon card document as stored in MongoDB.
// It combines all the sub-interfaces into a single, comprehensive structure.
export interface IPokemonCard {
  _id: { $oid: string }; // MongoDB Object ID
  apiId: string; // The ID from the external Pokémon TCG API
  name: string;
  number: string | null;
  rarity: string | null;
  images: {
    small: string | null;
    large: string | null;
  };
  set: ICardSet;
  cardmarket: ICardMarket;
  tcgplayer: ITCGPlayer;
  ebay: IEbay;
  lastUpdated: { $date: string }; // MongoDB Date format
  createdAt: { $date: string };
  updatedAt: { $date: string };
}

// Defines a leaner version of the card data specifically for search results.
// This helps reduce the payload size and ensures components only receive the data they need.
export interface ICardSearchResult {
  _id: { $oid: string };
  apiId: string;
  name: string;
  rarity: string | null;
  images: {
    small: string | null;
  };
  set: {
    name: string | null;
  };
}

