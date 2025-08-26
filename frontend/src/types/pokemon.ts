/**
 * This file defines the TypeScript interfaces for all Pokémon card-related data structures.
 * By centralizing these types, we ensure that data conforms to the same shape
 * whether it's being handled in the database, processed in an API route, or displayed
 * in a frontend component.
 */

// Defines the structure for various price points from different vendors.
export interface IPriceData {
  low?: number | null;
  mid?: number | null;
  high?: number | null;
  market?: number | null;
  directLow?: number | null;
  averageSellPrice?: number;
  trendPrice?: number;
  reverseHoloTrend?: number;
}

export interface ITCGPlayer {
  url?: string | null;
  updatedAt?: string | null;
  prices?: {
    normal?: IPriceData;
    holofoil?: IPriceData;
    reverseHolofoil?: IPriceData;
  };
}

export interface ICardSet {
  id?: string | null;
  name?: string | null;
  series?: string | null;
  releaseDate?: string | null;
}

export interface ICardMarket {
  url?: string | null;
  updatedAt?: string | null;
  prices?: IPriceData;
}

export interface IEbayListing {
    grade?: number;
    updated?: string;
    url?: string;
    stats?: {
        min?: number;
        max?: number;
        average?: number;
        median?: number;
        count?: number;
    }
}

export interface IEbay {
  updatedAt?: string | null;
  prices?: Record<string, IEbayListing>;
}

export interface IPokemonCard {
  _id: string;
  apiId: string;
  name: string;
  number?: string | null;
  rarity?: string | null;
  images?: {
    small?: string | null;
    large?: string | null;
  };
  set?: ICardSet;
  cardmarket?: ICardMarket;
  tcgplayer?: ITCGPlayer;
  ebay?: IEbay;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
  highestMarketPrice?: number;
}

export interface ICardSearchResult {
  id: string;
  name: string;
  image?: string | null;
  set?: {
    name?: string | null;
  };
  number?: string;
  rarity?: string;
  artist?: string;
  prices?: {
    tcgplayer?: any;
    cardmarket?: any;
    ebay?: any;
  };
}

