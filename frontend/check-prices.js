const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkPrices() {
  try {
    // Check a sample of cards with their highest_market_price
    const result = await client.execute('SELECT name, highest_market_price, tcgplayer_data FROM pokemon_products ORDER BY highest_market_price DESC LIMIT 10');
    console.log('Top 10 cards by highest_market_price:');
    result.rows.forEach(row => {
      console.log(`${row.name}: ${row.highest_market_price}`);
    });
    
    // Check how many have null prices
    const nullCount = await client.execute('SELECT COUNT(*) as count FROM pokemon_products WHERE highest_market_price IS NULL');
    const totalCount = await client.execute('SELECT COUNT(*) as count FROM pokemon_products');
    
    console.log(`\nCards with null highest_market_price: ${nullCount.rows[0].count}`);
    console.log(`Total cards: ${totalCount.rows[0].count}`);
    
    // Check if TCGPlayer data exists
    const tcgDataCount = await client.execute('SELECT COUNT(*) as count FROM pokemon_products WHERE tcgplayer_data IS NOT NULL');
    console.log(`Cards with TCGPlayer data: ${tcgDataCount.rows[0].count}`);
    
    // Sample a card with TCGPlayer data to see the structure
    const sampleCard = await client.execute('SELECT name, tcgplayer_data FROM pokemon_products WHERE tcgplayer_data IS NOT NULL LIMIT 1');
    if (sampleCard.rows.length > 0) {
      console.log(`\nSample TCGPlayer data for "${sampleCard.rows[0].name}":`);
      console.log(JSON.stringify(JSON.parse(sampleCard.rows[0].tcgplayer_data), null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
  }
}

checkPrices();
