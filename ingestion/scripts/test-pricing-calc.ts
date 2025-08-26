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

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1100;
let requestCount = 0;

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
  console.log(`API Request ${requestCount + 1}: ${endpoint}`);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  requestCount++;
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Rate limiting delay
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
  
  return data;
}

// Calculate highest market price from TCGPlayer pricing sources only
function calculateHighestMarketPrice(product: any): number | null {
  const prices: number[] = [];

  // Extract TCGPlayer prices only
  if (product.tcgplayer?.prices) {
    const tcgPrices = product.tcgplayer.prices;
    
    // Check market prices for different card types
    if (tcgPrices.normal?.market && tcgPrices.normal.market > 0) 
      prices.push(tcgPrices.normal.market);
    if (tcgPrices.holofoil?.market && tcgPrices.holofoil.market > 0) 
      prices.push(tcgPrices.holofoil.market);
    if (tcgPrices.reverseHolofoil?.market && tcgPrices.reverseHolofoil.market > 0) 
      prices.push(tcgPrices.reverseHolofoil.market);
  }

  // Return the highest price found, or null if no valid prices
  return prices.length > 0 ? Math.max(...prices) : null;
}

async function testPricingCalculation() {
  console.log('Testing pricing calculation with new ingestion...');

  try {
    // Get a few products from the first set
    const products = await apiRequest('/prices?setId=zsv10pt5&limit=5');
    const productList = products.data || products || [];

    console.log(`\n=== TESTING ${productList.length} PRODUCTS ===`);

    for (const product of productList) {
      const calculatedPrice = calculateHighestMarketPrice(product);
      
      console.log(`\n${product.name} (#${product.number})`);
      console.log(`  API highest price: ${product.highestMarketPrice}`);
      console.log(`  Calculated price: ${calculatedPrice}`);
      
      if (product.tcgplayer?.prices) {
        console.log(`  TCGPlayer: normal=${product.tcgplayer.prices.normal?.market}, holo=${product.tcgplayer.prices.holofoil?.market}`);
      }
      if (product.cardmarket?.prices) {
        console.log(`  CardMarket: avg=${product.cardmarket.prices.averageSellPrice}, trend=${product.cardmarket.prices.trendPrice}`);
      }

      // Update this product in the database with the calculated price
      const parseDate = (dateStr: any) => {
        if (!dateStr) return null;
        if (typeof dateStr === 'object' && dateStr.$date) {
          return new Date(dateStr.$date).toISOString();
        }
        return new Date(dateStr).toISOString();
      };

      await executeQuery(
        `UPDATE pokemon_products SET highest_market_price = ? WHERE api_id = ?`,
        [calculatedPrice, product.id]
      );

      console.log(`  ✅ Updated in database with price: $${calculatedPrice?.toFixed(2) || 'null'}`);
    }

    console.log('\n=== VERIFICATION ===');
    const result = await executeQuery(`
      SELECT api_id, name, highest_market_price 
      FROM pokemon_products 
      WHERE api_id IN (${productList.map(() => '?').join(',')})
      ORDER BY highest_market_price DESC
    `, productList.map((p: any) => p.id));

    for (const row of result.rows) {
      console.log(`${row.name}: $${row.highest_market_price || 'null'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.close();
  }
}

testPricingCalculation();
