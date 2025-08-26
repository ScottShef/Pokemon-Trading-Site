const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Calculate highest market price from TCGPlayer pricing sources only
function calculateHighestMarketPrice(tcgplayerData) {
  if (!tcgplayerData || !tcgplayerData.prices) {
    return null;
  }
  
  const prices = [];
  const tcgPrices = tcgplayerData.prices;
  
  // Check market prices for different card types
  if (tcgPrices.normal?.market && tcgPrices.normal.market > 0) 
    prices.push(tcgPrices.normal.market);
  if (tcgPrices.holofoil?.market && tcgPrices.holofoil.market > 0) 
    prices.push(tcgPrices.holofoil.market);
  if (tcgPrices.reverseHolofoil?.market && tcgPrices.reverseHolofoil.market > 0) 
    prices.push(tcgPrices.reverseHolofoil.market);
  
  // Return the highest price found, or null if no valid prices
  return prices.length > 0 ? Math.max(...prices) : null;
}

async function recalculateAllPrices() {
  try {
    console.log('Starting to recalculate highest_market_price for all cards...');
    
    // Get all cards with TCGPlayer data
    const result = await client.execute('SELECT api_id, name, tcgplayer_data FROM pokemon_products WHERE tcgplayer_data IS NOT NULL');
    console.log(`Found ${result.rows.length} cards with TCGPlayer data`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const row of result.rows) {
      try {
        const tcgplayerData = JSON.parse(row.tcgplayer_data);
        const newPrice = calculateHighestMarketPrice(tcgplayerData);
        
        if (newPrice !== null) {
          await client.execute(
            'UPDATE pokemon_products SET highest_market_price = ? WHERE api_id = ?',
            [newPrice, row.api_id]
          );
          updated++;
          
          if (updated % 100 === 0) {
            console.log(`Updated ${updated} cards so far...`);
          }
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.error(`Error processing card ${row.api_id} (${row.name}):`, error);
        errors++;
      }
    }
    
    console.log(`\n=== RECALCULATION COMPLETE ===`);
    console.log(`Cards updated: ${updated}`);
    console.log(`Cards skipped (no valid prices): ${skipped}`);
    console.log(`Errors: ${errors}`);
    
    // Show new stats
    const nullCount = await client.execute('SELECT COUNT(*) as count FROM pokemon_products WHERE highest_market_price IS NULL');
    const totalCount = await client.execute('SELECT COUNT(*) as count FROM pokemon_products');
    const withPrices = await client.execute('SELECT COUNT(*) as count FROM pokemon_products WHERE highest_market_price IS NOT NULL');
    
    console.log(`\nNew database stats:`);
    console.log(`Total cards: ${totalCount.rows[0].count}`);
    console.log(`Cards with prices: ${withPrices.rows[0].count}`);
    console.log(`Cards with null prices: ${nullCount.rows[0].count}`);
    
    // Show top 10 most expensive cards
    const topCards = await client.execute('SELECT name, highest_market_price FROM pokemon_products ORDER BY highest_market_price DESC LIMIT 10');
    console.log(`\nTop 10 most expensive cards:`);
    topCards.rows.forEach(row => {
      console.log(`${row.name}: $${row.highest_market_price}`);
    });
    
  } catch (error) {
    console.error('Error during recalculation:', error);
  } finally {
    client.close();
  }
}

recalculateAllPrices();
