import { ObjectId } from "mongodb";
import { UserProfile } from "./user";
import { IPokemonCard } from "./pokemon";

// Defines the structure of a single listing document in the database
export interface IListing {
  _id: ObjectId;
  card: IPokemonCard; // Embed the full card data
  seller: UserProfile; // Embed seller's public profile
  price: number;
  condition: "Mint" | "Near Mint" | "Excellent" | "Good" | "Played" | "Poor";
  description?: string;
  imageUrl?: string; // Optional image of the actual card
  createdAt: Date;
  updatedAt: Date;
  status: "Available" | "Sold" | "Delisted";
}
