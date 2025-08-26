import { UserProfile } from "./user";

// Defines the structure of a single listing document in PlanetScale MySQL
export interface IListing {
  id: string; // MySQL UUID
  card_name: string;
  card_number?: string; // Card number (e.g., "025", "SV001")
  set_series?: string; // Set series (e.g., "Base", "Sword & Shield", "Scarlet & Violet")
  description?: string;
  price: number;
  image_urls?: string[]; // JSON array in MySQL
  seller_id: string; // Foreign key to users.id
  seller_info?: UserProfile; // This will be populated by JOIN queries
  listing_type: "raw" | "graded";
  condition?: string; // For raw cards: 'Mint', 'Near Mint', 'Lightly Played', 'Heavily Played'
  graded_company?: string;
  graded_grade?: string;
  created_at: string; // MySQL TIMESTAMP
  updated_at: string; // MySQL TIMESTAMP
}

