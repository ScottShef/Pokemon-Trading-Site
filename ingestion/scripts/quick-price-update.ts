import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function quickPriceUpdate() {
  console.log('Starting quick pricing update (first 50 products)...');

  try {
    // Get first 50 products with JSON pricing data
    const result = await client.execute(`
      SELECT api_id, name, tcgplayer_data, cardmarket_data, ebay_data 
      FROM pokemon_products 
      WHERE tcgplayer_data IS NOT NULL
      LIMIT 50
    `);

    console.log(`Processing ${result.rows.length} products...`);

    let updated = 0;

    for (const row of result.rows) {
      console.log(`Processing: ${row.name} (${row.api_id})`);
      
      const prices: number[] = [];

      // Extract TCGPlayer prices
      if (row.tcgplayer_data) {
        try {
          const tcgData = JSON.parse(row.tcgplayer_data as string);
          if (tcgData.prices) {
            if (tcgData.prices.normal?.market) prices.push(tcgData.prices.normal.market);
            if (tcgData.prices.holofoil?.market) prices.push(tcgData.prices.holofoil.market);
            if (tcgData.prices.reverseHolofoil?.market) prices.push(tcgData.prices.reverseHolofoil.market);
          }
        } catch (e) {
          console.warn(`  ⚠️ Failed to parse TCGPlayer data`);
        }
      }

      // Extract CardMarket prices
      if (row.cardmarket_data) {
        try {
          const cmData = JSON.parse(row.cardmarket_data as string);
          if (cmData.prices) {
            if (cmData.prices.averageSellPrice) prices.push(cmData.prices.averageSellPrice);
            if (cmData.prices.trendPrice) prices.push(cmData.prices.trendPrice);
          }
        } catch (e) {
          console.warn(`  ⚠️ Failed to parse CardMarket data`);
        }
      }

      // Find the highest price
      if (prices.length > 0) {
        const highestPrice = Math.max(...prices);
        console.log(`  💰 Found prices: ${prices.join(', ')} -> highest: $${highestPrice}`);
        
        // Update the database
        await client.execute({
          sql: `UPDATE pokemon_products SET highest_market_price = ? WHERE api_id = ?`,
          args: [highestPrice, row.api_id]
        });
        
        updated++;
        console.log(`  ✅ Updated!`);
      } else {
        console.log(`  ❌ No valid prices found`);
      }
    }

    console.log(`\n✅ Quick update completed! Updated ${updated}/${result.rows.length} products`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.close();
  }
}

quickPriceUpdate();
