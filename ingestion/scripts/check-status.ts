#!/usr/bin/env node
// Database status check script for Pokemon Trading Site

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

interface DatabaseStats {
  sets: number;
  setsDetailed: number;
  cards: number;
  products: number;
  productsWithPrices: number;
  prices: number;
  users: number;
  listings: number;
}

async function getDatabaseStats(): Promise<DatabaseStats> {
  const stats: DatabaseStats = {
    sets: 0,
    setsDetailed: 0,
    cards: 0,
    products: 0,
    productsWithPrices: 0,
    prices: 0,
    users: 0,
    listings: 0
  };

  try {
    // Count original sets
    try {
      const setsResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM pokemon_sets',
        args: []
      });
      stats.sets = Number(setsResult.rows[0].count);
    } catch (error) {
      // Table might not exist
      stats.sets = 0;
    }

    // Count detailed sets
    try {
      const setsDetailedResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM pokemon_sets_detailed',
        args: []
      });
      stats.setsDetailed = Number(setsDetailedResult.rows[0].count);
    } catch (error) {
      stats.setsDetailed = 0;
    }

    // Count original cards
    try {
      const cardsResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM pokemon_cards',
        args: []
      });
      stats.cards = Number(cardsResult.rows[0].count);
    } catch (error) {
      stats.cards = 0;
    }

    // Count products
    try {
      const productsResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM pokemon_products',
        args: []
      });
      stats.products = Number(productsResult.rows[0].count);
    } catch (error) {
      stats.products = 0;
    }

    // Count products with pricing data
    try {
      const productsWithPricesResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM pokemon_products WHERE highest_market_price IS NOT NULL',
        args: []
      });
      stats.productsWithPrices = Number(productsWithPricesResult.rows[0].count);
    } catch (error) {
      stats.productsWithPrices = 0;
    }

    // Count price records
    try {
      const pricesResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM pokemon_card_prices',
        args: []
      });
      stats.prices = Number(pricesResult.rows[0].count);
    } catch (error) {
      stats.prices = 0;
    }

    // Count users
    try {
      const usersResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM users',
        args: []
      });
      stats.users = Number(usersResult.rows[0].count);
    } catch (error) {
      stats.users = 0;
    }

    // Count listings
    try {
      const listingsResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM listings',
        args: []
      });
      stats.listings = Number(listingsResult.rows[0].count);
    } catch (error) {
      stats.listings = 0;
    }

  } catch (error) {
    console.error('Error fetching database stats:', error);
    throw error;
  }

  return stats;
}

async function getProductSampleData() {
  try {
    // Get sample of products with highest market prices
    const sampleResult = await client.execute({
      sql: `SELECT api_id, name, set_name, number, rarity, highest_market_price, last_synced
            FROM pokemon_products 
            WHERE highest_market_price IS NOT NULL 
            ORDER BY highest_market_price DESC 
            LIMIT 5`,
      args: []
    });

    return sampleResult.rows;
  } catch (error) {
    return [];
  }
}

async function getRecentSyncInfo() {
  try {
    // Get most recent sync info
    const syncResult = await client.execute({
      sql: `SELECT MAX(last_synced) as latest_sync, COUNT(*) as synced_count
            FROM pokemon_products 
            WHERE last_synced IS NOT NULL`,
      args: []
    });

    return syncResult.rows[0];
  } catch (error) {
    return { latest_sync: null, synced_count: 0 };
  }
}

async function checkDatabaseStatus() {
  console.log('Checking database status...\n');
  
  try {
    const stats = await getDatabaseStats();
    
    console.log('=== DATABASE STATISTICS ===');
    console.log(`Pokemon Sets (Original):     ${stats.sets.toLocaleString()}`);
    console.log(`Pokemon Sets (Detailed):     ${stats.setsDetailed.toLocaleString()}`);
    console.log(`Pokemon Cards (Original):    ${stats.cards.toLocaleString()}`);
    console.log(`Pokemon Products:            ${stats.products.toLocaleString()}`);
    console.log(`Products with Pricing:       ${stats.productsWithPrices.toLocaleString()}`);
    console.log(`Price Records:               ${stats.prices.toLocaleString()}`);
    console.log(`Users:                       ${stats.users.toLocaleString()}`);
    console.log(`Listings:                    ${stats.listings.toLocaleString()}`);
    console.log('============================\n');

    // Check data freshness
    const syncInfo = await getRecentSyncInfo();
    
    if (syncInfo.latest_sync) {
      const latestDate = new Date(String(syncInfo.latest_sync));
      const daysSinceUpdate = Math.floor((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`Latest product sync: ${latestDate.toLocaleDateString()} (${daysSinceUpdate} days ago)`);
      console.log(`Products synced: ${Number(syncInfo.synced_count).toLocaleString()}`);
      
      if (daysSinceUpdate > 7) {
        console.log('⚠️  Warning: Product data is over a week old');
      } else if (daysSinceUpdate > 1) {
        console.log('ℹ️  Product data is recent');
      } else {
        console.log('✅ Product data is up to date');
      }
    } else {
      console.log('❌ No product sync data found');
    }

    // Show sample of high-value products
    console.log('\n=== TOP 5 HIGHEST VALUE PRODUCTS ===');
    const sampleData = await getProductSampleData();
    
    if (sampleData.length > 0) {
      for (const product of sampleData) {
        const price = Number(product.highest_market_price);
        const formattedPrice = price ? `$${(price / 100).toFixed(2)}` : 'N/A';
        console.log(`${String(product.name)} (${product.set_name} #${product.number}) - ${formattedPrice}`);
      }
    } else {
      console.log('No product data available');
    }
    console.log('====================================\n');

    // Data quality indicators
    const qualityScore = stats.products > 0 ? 
      Math.round((stats.productsWithPrices / stats.products) * 100) : 0;
    
    console.log(`Data Quality Score: ${qualityScore}% (products with pricing data)`);
    
    if (qualityScore >= 80) {
      console.log('✅ Excellent data quality');
    } else if (qualityScore >= 60) {
      console.log('⚠️  Good data quality, some products missing prices');
    } else if (qualityScore >= 30) {
      console.log('⚠️  Fair data quality, many products missing prices');
    } else if (stats.products > 0) {
      console.log('❌ Poor data quality, most products missing prices');
    } else {
      console.log('❌ No product data - run ingestion first');
    }

    console.log('\nDatabase status check completed!');
    
  } catch (error) {
    console.error('Database status check failed:', error);
    throw error;
  } finally {
    client.close();
  }
}

if (require.main === module) {
  checkDatabaseStatus();
}

export { checkDatabaseStatus, getDatabaseStats };
