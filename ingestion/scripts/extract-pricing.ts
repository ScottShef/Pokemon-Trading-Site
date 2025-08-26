import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface PriceData {
  api_id: string;
  tcgplayer_data: string | null;
  cardmarket_data: string | null;
  ebay_data: string | null;
}

async function extractPricingData() {
  console.log('Starting pricing data extraction...');

  try {
    // Get all products with JSON pricing data
    const result = await client.execute(`
      SELECT api_id, name, tcgplayer_data, cardmarket_data, ebay_data 
      FROM pokemon_products 
      WHERE (tcgplayer_data IS NOT NULL OR cardmarket_data IS NOT NULL OR ebay_data IS NOT NULL)
      AND highest_market_price IS NULL
    `);

    console.log(`Found ${result.rows.length} products to process...`);

    let updated = 0;
    let processed = 0;

    for (const row of result.rows) {
      processed++;
      const api_id = row.api_id as string;
      const name = row.name as string;
      
      let highestPrice = 0;
      const prices: number[] = [];

      // Extract TCGPlayer prices
      if (row.tcgplayer_data) {
        try {
          const tcgData = JSON.parse(row.tcgplayer_data as string);
          if (tcgData.prices) {
            // Check different price types - filter out zero and null values
            if (tcgData.prices.normal?.market && tcgData.prices.normal.market > 0) 
              prices.push(tcgData.prices.normal.market);
            if (tcgData.prices.holofoil?.market && tcgData.prices.holofoil.market > 0) 
              prices.push(tcgData.prices.holofoil.market);
            if (tcgData.prices.reverseHolofoil?.market && tcgData.prices.reverseHolofoil.market > 0) 
              prices.push(tcgData.prices.reverseHolofoil.market);
            if (tcgData.prices['1stEdition']?.market && tcgData.prices['1stEdition'].market > 0) 
              prices.push(tcgData.prices['1stEdition'].market);
            if (tcgData.prices.unlimited?.market && tcgData.prices.unlimited.market > 0) 
              prices.push(tcgData.prices.unlimited.market);
              
            // Also check high prices for potential maximum value
            if (tcgData.prices.normal?.high && tcgData.prices.normal.high > 0) 
              prices.push(tcgData.prices.normal.high);
            if (tcgData.prices.holofoil?.high && tcgData.prices.holofoil.high > 0) 
              prices.push(tcgData.prices.holofoil.high);
          }
        } catch (e) {
          console.warn(`Failed to parse TCGPlayer data for ${api_id}`);
        }
      }

      // Extract CardMarket prices
      if (row.cardmarket_data) {
        try {
          const cmData = JSON.parse(row.cardmarket_data as string);
          if (cmData.prices) {
            if (cmData.prices.averageSellPrice && cmData.prices.averageSellPrice > 0) 
              prices.push(cmData.prices.averageSellPrice);
            if (cmData.prices.trendPrice && cmData.prices.trendPrice > 0) 
              prices.push(cmData.prices.trendPrice);
            if (cmData.prices.reverseHoloSell && cmData.prices.reverseHoloSell > 0) 
              prices.push(cmData.prices.reverseHoloSell);
            if (cmData.prices.reverseHoloTrend && cmData.prices.reverseHoloTrend > 0) 
              prices.push(cmData.prices.reverseHoloTrend);
          }
        } catch (e) {
          console.warn(`Failed to parse CardMarket data for ${api_id}`);
        }
      }

      // Extract eBay PSA 10 prices (most valuable graded cards)
      if (row.ebay_data) {
        try {
          const ebayData = JSON.parse(row.ebay_data as string);
          if (ebayData.prices) {
            // PSA 10 is typically the highest value
            if (ebayData.prices['10']?.stats?.average && ebayData.prices['10'].stats.average > 0) {
              prices.push(ebayData.prices['10'].stats.average);
            }
            // Also check other high grades
            if (ebayData.prices['9']?.stats?.average && ebayData.prices['9'].stats.average > 0) {
              prices.push(ebayData.prices['9'].stats.average);
            }
          }
        } catch (e) {
          console.warn(`Failed to parse eBay data for ${api_id}`);
        }
      }

      // Find the highest price
      if (prices.length > 0) {
        highestPrice = Math.max(...prices);
        
        // Update the database
        await client.execute({
          sql: `UPDATE pokemon_products SET highest_market_price = ? WHERE api_id = ?`,
          args: [highestPrice, api_id]
        });
        
        updated++;
        
        if (updated % 100 === 0) {
          console.log(`Progress: ${updated}/${result.rows.length} products updated`);
        }
      }
    }

    console.log(`\n✅ Pricing extraction completed!`);
    console.log(`📊 Processed: ${processed} products`);
    console.log(`💰 Updated: ${updated} products with pricing data`);
    console.log(`📈 Success rate: ${((updated / processed) * 100).toFixed(1)}%`);

    // Show some sample results
    const sampleResult = await client.execute(`
      SELECT api_id, name, set_name, highest_market_price
      FROM pokemon_products 
      WHERE highest_market_price IS NOT NULL 
      ORDER BY highest_market_price DESC 
      LIMIT 10
    `);

    console.log(`\n=== TOP 10 MOST EXPENSIVE CARDS ===`);
    for (const row of sampleResult.rows) {
      console.log(`$${(row.highest_market_price as number).toFixed(2).padStart(8)} - ${row.name} (${row.set_name})`);
    }

  } catch (error) {
    console.error('❌ Error during pricing extraction:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Run the extraction
extractPricingData();
