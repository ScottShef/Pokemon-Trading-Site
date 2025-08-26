// Pokemon Price Tracker API Data Ingestion Program
// This program fetches data from Pokemon Price Tracker API and stores it in Turso database

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// Turso client setup
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Pokemon Price Tracker API configuration
const API_KEY = process.env.POKEMON_PRICE_API_KEY!;
const API_BASE_URL = process.env.POKEMON_PRICE_API_URL!;

// Rate limiting configuration (60 requests per minute, 200 per day for free tier)
const RATE_LIMIT_DELAY = 1100; // 1.1 seconds between requests
let requestCount = 0;
const MAX_DAILY_REQUESTS = 180; // Conservative limit for free tier

// Helper function to execute database queries
async function executeQuery(query: string, params: any[] = []) {
  try {
    const result = await client.execute({
      sql: query,
      args: params
    });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Rate-limited fetch function
async function apiRequest(endpoint: string) {
  if (requestCount >= MAX_DAILY_REQUESTS) {
    throw new Error('Daily API request limit reached');
  }

  console.log(`API Request ${requestCount + 1}/${MAX_DAILY_REQUESTS}: ${endpoint}`);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  requestCount++;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  // Rate limiting delay
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
  
  return data;
}

// Initialize extended database schema
async function initializeExtendedSchema() {
  console.log('Initializing extended database schema...');
  
  const schemaQueries = [
    // Pokemon Products table
    `CREATE TABLE IF NOT EXISTS pokemon_products (
      api_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      number TEXT,
      rarity TEXT,
      
      set_id TEXT,
      set_name TEXT,
      set_series TEXT,
      set_printed_total INTEGER,
      set_total INTEGER,
      set_ptcgo_code TEXT,
      set_release_date DATE,
      set_legalities_unlimited TEXT,
      set_legalities_expanded TEXT,
      
      image_small TEXT,
      highest_market_price REAL,
      
      tcgplayer_data TEXT,
      tcgplayer_updated_at DATETIME,
      cardmarket_data TEXT,
      cardmarket_updated_at DATETIME,
      ebay_data TEXT,
      ebay_updated_at DATETIME,
      
      created_at DATETIME,
      updated_at DATETIME,
      last_updated DATETIME,
      
      ingested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_synced DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_products_name ON pokemon_products(name)`,
    `CREATE INDEX IF NOT EXISTS idx_products_set_id ON pokemon_products(set_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_set_name ON pokemon_products(set_name)`,
    `CREATE INDEX IF NOT EXISTS idx_products_number ON pokemon_products(number)`,
    `CREATE INDEX IF NOT EXISTS idx_products_rarity ON pokemon_products(rarity)`,
    `CREATE INDEX IF NOT EXISTS idx_products_highest_price ON pokemon_products(highest_market_price)`,
    `CREATE INDEX IF NOT EXISTS idx_products_last_synced ON pokemon_products(last_synced)`,
    
    // Sets detailed table
    `CREATE TABLE IF NOT EXISTS pokemon_sets_detailed (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      series TEXT,
      release_date DATE,
      printed_total INTEGER,
      total INTEGER,
      ptcgo_code TEXT,
      legalities_unlimited TEXT,
      legalities_expanded TEXT,
      api_updated_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_sets_detailed_name ON pokemon_sets_detailed(name)`,
    `CREATE INDEX IF NOT EXISTS idx_sets_detailed_series ON pokemon_sets_detailed(series)`,
    `CREATE INDEX IF NOT EXISTS idx_sets_detailed_release_date ON pokemon_sets_detailed(release_date)`
  ];

  for (const query of schemaQueries) {
    await executeQuery(query);
  }
  
  console.log('Extended schema initialized successfully!');
}

// Fetch Pokemon sets from API
async function fetchSets() {
  console.log('Fetching Pokemon sets...');
  
  try {
    const data = await apiRequest('/sets');
    return data.data || data || [];
  } catch (error) {
    console.error('Error fetching sets:', error);
    return [];
  }
}

// Store sets in database
async function storeSets(sets: any[]) {
  if (sets.length === 0) {
    console.log('No sets to store');
    return;
  }
  
  console.log(`Storing ${sets.length} sets...`);
  
  for (const set of sets) {
    await executeQuery(
      `INSERT OR REPLACE INTO pokemon_sets_detailed 
       (id, name, series, release_date, printed_total, total, ptcgo_code, 
        legalities_unlimited, legalities_expanded, api_updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        set.id,
        set.name,
        set.series || null,
        set.releaseDate || null,
        set.printedTotal || null,
        set.total || null,
        set.ptcgoCode || null,
        set.legalities?.unlimited || null,
        set.legalities?.expanded || null,
        set.updatedAt || null
      ]
    );
    
    // Also store in the original sets table for compatibility
    await executeQuery(
      `INSERT OR REPLACE INTO pokemon_sets (id, name, series, release_date, card_count)
       VALUES (?, ?, ?, ?, ?)`,
      [
        set.id,
        set.name,
        set.series || null,
        set.releaseDate || null,
        set.total || set.printedTotal || null
      ]
    );
  }
  
  console.log('Sets stored successfully!');
}

// Fetch cards from a specific set
async function fetchCardsFromSet(setId: string, limit: number = 50) {
  console.log(`Fetching cards from set: ${setId} (limit: ${limit})`);
  
  try {
    const data = await apiRequest(`/prices?setId=${setId}&limit=${limit}`);
    return data.data || data || [];
  } catch (error) {
    console.error(`Error fetching cards from set ${setId}:`, error);
    return [];
  }
}

// Store comprehensive product data
async function storeProducts(products: any[]) {
  if (products.length === 0) {
    console.log('No products to store');
    return;
  }
  
  console.log(`Storing ${products.length} products...`);
  
  for (const product of products) {
    try {
      // Parse date fields
      const parseDate = (dateStr: any) => {
        if (!dateStr) return null;
        if (typeof dateStr === 'object' && dateStr.$date) {
          return new Date(dateStr.$date).toISOString();
        }
        return new Date(dateStr).toISOString();
      };

      await executeQuery(
        `INSERT OR REPLACE INTO pokemon_products (
          api_id, name, number, rarity,
          set_id, set_name, set_series, set_printed_total, set_total, 
          set_ptcgo_code, set_release_date, set_legalities_unlimited, set_legalities_expanded,
          image_small, highest_market_price,
          tcgplayer_data, tcgplayer_updated_at,
          cardmarket_data, cardmarket_updated_at,
          ebay_data, ebay_updated_at,
          created_at, updated_at, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.apiId || product.id,
          product.name,
          product.number,
          product.rarity,
          
          product.set?.id || null,
          product.set?.name || null,
          product.set?.series || null,
          product.set?.printedTotal || null,
          product.set?.total || null,
          product.set?.ptcgoCode || null,
          parseDate(product.set?.releaseDate),
          product.set?.legalities?.unlimited || null,
          product.set?.legalities?.expanded || null,
          
          product.images?.small || null,
          product.highestMarketPrice || null,
          
          product.tcgplayer ? JSON.stringify(product.tcgplayer) : null,
          parseDate(product.tcgplayer?.updatedAt),
          product.cardmarket ? JSON.stringify(product.cardmarket) : null,
          parseDate(product.cardmarket?.updatedAt),
          product.ebay ? JSON.stringify(product.ebay) : null,
          parseDate(product.ebay?.updatedAt),
          
          parseDate(product.createdAt),
          parseDate(product.updatedAt),
          parseDate(product.lastUpdated)
        ]
      );

      // Also store in the original cards table for compatibility
      await executeQuery(
        `INSERT OR REPLACE INTO pokemon_cards (id, name, set_id, number, rarity, artist, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          product.apiId || product.id,
          product.name,
          product.set?.id || null,
          product.number,
          product.rarity,
          product.artist || null,
          product.images?.small || null
        ]
      );

    } catch (error) {
      console.error(`Error storing product ${product.apiId || product.id}:`, error);
      continue;
    }
  }
  
  console.log('Products stored successfully!');
}

// Get database stats
async function getDatabaseStats() {
  const stats = {
    products: 0,
    sets: 0,
    withPrices: 0
  };

  try {
    const productsResult = await executeQuery('SELECT COUNT(*) as count FROM pokemon_products');
    stats.products = Number(productsResult.rows[0].count);

    const setsResult = await executeQuery('SELECT COUNT(*) as count FROM pokemon_sets_detailed');
    stats.sets = Number(setsResult.rows[0].count);

    const pricesResult = await executeQuery('SELECT COUNT(*) as count FROM pokemon_products WHERE highest_market_price IS NOT NULL');
    stats.withPrices = Number(pricesResult.rows[0].count);

  } catch (error) {
    console.error('Error getting stats:', error);
  }

  return stats;
}

// Main execution function
async function main() {
  try {
    console.log('Starting Pokemon Price Tracker data ingestion...');
    console.log(`Using API: ${API_BASE_URL}`);
    console.log(`Daily request limit: ${MAX_DAILY_REQUESTS}`);
    
    // Initialize database schema
    await initializeExtendedSchema();
    
    // Get initial stats
    const initialStats = await getDatabaseStats();
    console.log('Initial database stats:', initialStats);
    
    // 1. Fetch and store sets
    const sets = await fetchSets();
    if (sets.length > 0) {
      await storeSets(sets);
    }
    
    // 2. Fetch and store products for each set (limited to conserve API calls)
    let totalProductsIngested = 0;
    const maxSetsToProcess = Math.floor((MAX_DAILY_REQUESTS - requestCount) / 2); // Conservative estimate
    
    console.log(`Processing up to ${maxSetsToProcess} sets to stay within API limits...`);
    
    for (let i = 0; i < Math.min(sets.length, maxSetsToProcess); i++) {
      const set = sets[i];
      
      if (requestCount >= MAX_DAILY_REQUESTS - 5) { // Leave some buffer
        console.log('Approaching daily API limit, stopping ingestion');
        break;
      }
      
      try {
        const products = await fetchCardsFromSet(set.id, 25); // Smaller batch size
        if (products.length > 0) {
          await storeProducts(products);
          totalProductsIngested += products.length;
        }
        
        console.log(`Processed set ${i + 1}/${Math.min(sets.length, maxSetsToProcess)}: ${set.name} (${products.length} products)`);
        
      } catch (error) {
        console.error(`Error processing set ${set.id}:`, error);
        continue;
      }
    }
    
    // Final stats
    const finalStats = await getDatabaseStats();
    console.log('\n=== INGESTION SUMMARY ===');
    console.log(`Sets processed: ${sets.length}`);
    console.log(`Products ingested this session: ${totalProductsIngested}`);
    console.log(`Total products in database: ${finalStats.products}`);
    console.log(`Products with pricing data: ${finalStats.withPrices}`);
    console.log(`API requests used: ${requestCount}/${MAX_DAILY_REQUESTS}`);
    console.log('========================');
    
    console.log('Data ingestion completed successfully!');
    
  } catch (error) {
    console.error('Data ingestion failed:', error);
  } finally {
    client.close();
  }
}

// Run the program
if (require.main === module) {
  main();
}

export { main, fetchSets, storeSets, fetchCardsFromSet, storeProducts, initializeExtendedSchema };
