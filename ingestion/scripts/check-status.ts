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
  cards: number;
  prices: number;
  users: number;
  listings: number;
}

async function getDatabaseStats(): Promise<DatabaseStats> {
  const stats: DatabaseStats = {
    sets: 0,
    cards: 0,
    prices: 0,
    users: 0,
    listings: 0
  };

  try {
    // Count sets
    const setsResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM pokemon_sets',
      args: []
    });
    stats.sets = Number(setsResult.rows[0].count);

    // Count cards
    const cardsResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM pokemon_cards',
      args: []
    });
    stats.cards = Number(cardsResult.rows[0].count);

    // Count prices
    const pricesResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM pokemon_card_prices',
      args: []
    });
    stats.prices = Number(pricesResult.rows[0].count);

    // Count users
    const usersResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM users',
      args: []
    });
    stats.users = Number(usersResult.rows[0].count);

    // Count listings
    const listingsResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM listings',
      args: []
    });
    stats.listings = Number(listingsResult.rows[0].count);

  } catch (error) {
    console.error('Error fetching database stats:', error);
    throw error;
  }

  return stats;
}

async function checkDatabaseStatus() {
  console.log('Checking database status...\n');
  
  try {
    const stats = await getDatabaseStats();
    
    console.log('=== DATABASE STATISTICS ===');
    console.log(`Pokemon Sets:     ${stats.sets.toLocaleString()}`);
    console.log(`Pokemon Cards:    ${stats.cards.toLocaleString()}`);
    console.log(`Price Records:    ${stats.prices.toLocaleString()}`);
    console.log(`Users:            ${stats.users.toLocaleString()}`);
    console.log(`Listings:         ${stats.listings.toLocaleString()}`);
    console.log('============================\n');

    // Check for data freshness
    const latestPriceResult = await client.execute({
      sql: 'SELECT MAX(created_at) as latest FROM pokemon_card_prices',
      args: []
    });

    if (latestPriceResult.rows[0].latest) {
      const latestDate = new Date(String(latestPriceResult.rows[0].latest));
      const daysSinceUpdate = Math.floor((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`Latest price update: ${latestDate.toLocaleDateString()} (${daysSinceUpdate} days ago)`);
      
      if (daysSinceUpdate > 7) {
        console.log('⚠️  Warning: Price data is over a week old');
      } else if (daysSinceUpdate > 1) {
        console.log('ℹ️  Price data is recent');
      } else {
        console.log('✅ Price data is up to date');
      }
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
