import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function samplePricingData() {
  console.log('Checking sample pricing data...');

  try {
    // Get a few sample products with their JSON data
    const result = await client.execute(`
      SELECT api_id, name, set_name, tcgplayer_data, cardmarket_data, ebay_data, highest_market_price
      FROM pokemon_products 
      WHERE tcgplayer_data IS NOT NULL
      LIMIT 3
    `);

    console.log(`Found ${result.rows.length} products with TCGPlayer data`);

    for (const row of result.rows) {
      console.log(`\n=== ${row.name} (${row.api_id}) ===`);
      console.log(`Set: ${row.set_name}`);
      console.log(`Current highest_market_price: ${row.highest_market_price}`);
      
      if (row.tcgplayer_data) {
        console.log('\nTCGPlayer Data:');
        try {
          const tcgData = JSON.parse(row.tcgplayer_data as string);
          console.log(JSON.stringify(tcgData, null, 2));
        } catch (e) {
          console.log('Failed to parse TCGPlayer data');
        }
      }
      
      if (row.cardmarket_data) {
        console.log('\nCardMarket Data:');
        try {
          const cmData = JSON.parse(row.cardmarket_data as string);
          console.log(JSON.stringify(cmData, null, 2));
        } catch (e) {
          console.log('Failed to parse CardMarket data');
        }
      }
      
      if (row.ebay_data) {
        console.log('\neBay Data:');
        try {
          const ebayData = JSON.parse(row.ebay_data as string);
          console.log(JSON.stringify(ebayData, null, 2));
        } catch (e) {
          console.log('Failed to parse eBay data');
        }
      }
    }

    // Check if any products have any pricing data at all
    const countResult = await client.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN tcgplayer_data IS NOT NULL THEN 1 END) as with_tcg,
        COUNT(CASE WHEN cardmarket_data IS NOT NULL THEN 1 END) as with_cm,
        COUNT(CASE WHEN ebay_data IS NOT NULL THEN 1 END) as with_ebay
      FROM pokemon_products
    `);

    console.log('\n=== PRICING DATA COUNTS ===');
    console.log(`Total products: ${countResult.rows[0].total}`);
    console.log(`With TCGPlayer data: ${countResult.rows[0].with_tcg}`);
    console.log(`With CardMarket data: ${countResult.rows[0].with_cm}`);
    console.log(`With eBay data: ${countResult.rows[0].with_ebay}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.close();
  }
}

samplePricingData();
