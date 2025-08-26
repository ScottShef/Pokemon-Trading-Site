// Pokemon Data Ingestion Program
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

// Fetch Pokemon sets from API
async function fetchSets() {
  console.log('Fetching Pokemon sets...');
  
  const response = await fetch(`${API_BASE_URL}/sets`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

// Store sets in database
async function storeSets(sets: any[]) {
  console.log(`Storing ${sets.length} sets...`);
  
  for (const set of sets) {
    await executeQuery(
      `INSERT OR REPLACE INTO pokemon_sets (id, name, series, release_date, card_count)
       VALUES (?, ?, ?, ?, ?)`,
      [
        set.id,
        set.name,
        set.series || null,
        set.releaseDate || null,
        set.cardCount || null
      ]
    );
  }
  
  console.log('Sets stored successfully!');
}

// Fetch cards from a specific set
async function fetchCardsFromSet(setId: string) {
  console.log(`Fetching cards from set: ${setId}`);
  
  const response = await fetch(`${API_BASE_URL}/prices?setId=${setId}&limit=1000`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

// Store cards in database
async function storeCards(cards: any[]) {
  console.log(`Storing ${cards.length} cards...`);
  
  for (const card of cards) {
    // Store card basic info
    await executeQuery(
      `INSERT OR REPLACE INTO pokemon_cards (id, name, set_id, number, rarity, artist, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.name,
        card.set?.id || null,
        card.number || null,
        card.rarity || null,
        card.artist || null,
        card.image || null
      ]
    );

    // Store price data
    if (card.tcgplayer?.prices) {
      for (const [condition, priceData] of Object.entries(card.tcgplayer.prices)) {
        if (priceData && typeof priceData === 'object') {
          const prices = priceData as any;
          await executeQuery(
            `INSERT OR REPLACE INTO pokemon_card_prices 
             (card_id, price_type, condition_type, low_price, mid_price, high_price, market_price)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              card.id,
              'tcgplayer',
              condition,
              prices.low || null,
              prices.mid || null,
              prices.high || null,
              prices.market || null
            ]
          );
        }
      }
    }

    // Store CardMarket prices
    if (card.cardmarket?.prices) {
      const prices = card.cardmarket.prices;
      await executeQuery(
        `INSERT OR REPLACE INTO pokemon_card_prices 
         (card_id, price_type, low_price, mid_price, high_price, market_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          card.id,
          'cardmarket',
          prices.low || null,
          prices.mid || null,
          prices.high || null,
          prices.market || null
        ]
      );
    }

    // Store eBay graded prices
    if (card.ebay?.prices) {
      for (const [grade, gradeData] of Object.entries(card.ebay.prices)) {
        if (gradeData && typeof gradeData === 'object') {
          const priceInfo = gradeData as any;
          await executeQuery(
            `INSERT OR REPLACE INTO pokemon_card_prices 
             (card_id, price_type, grade, market_price)
             VALUES (?, ?, ?, ?)`,
            [
              card.id,
              'ebay',
              grade,
              priceInfo.stats?.average || null
            ]
          );
        }
      }
    }
  }
  
  console.log('Cards stored successfully!');
}

// Main execution function
async function main() {
  try {
    console.log('Starting Pokemon data ingestion...');
    
    // 1. Fetch and store sets
    const sets = await fetchSets();
    await storeSets(sets);
    
    // 2. Fetch and store cards for each set
    for (const set of sets) {
      try {
        const cards = await fetchCardsFromSet(set.id);
        await storeCards(cards);
        
        // Add delay to respect API rate limits (60 requests per minute)
        await new Promise(resolve => setTimeout(resolve, 1100));
      } catch (error) {
        console.error(`Error processing set ${set.id}:`, error);
        continue; // Continue with next set
      }
    }
    
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

export { main, fetchSets, storeSets, fetchCardsFromSet, storeCards };
