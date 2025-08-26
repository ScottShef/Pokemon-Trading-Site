#!/usr/bin/env node
// Database cleanup script for Pokemon Trading Site

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function cleanupDatabase() {
  console.log('Starting database cleanup...');
  
  try {
    // Remove old price data (older than 30 days)
    console.log('Removing old price data...');
    await client.execute({
      sql: `DELETE FROM pokemon_card_prices 
            WHERE created_at < datetime('now', '-30 days')`,
      args: []
    });

    // Remove cards without any price data
    console.log('Removing cards without price data...');
    await client.execute({
      sql: `DELETE FROM pokemon_cards 
            WHERE id NOT IN (SELECT DISTINCT card_id FROM pokemon_card_prices)`,
      args: []
    });

    // Vacuum the database to reclaim space
    console.log('Optimizing database...');
    await client.execute({
      sql: 'VACUUM',
      args: []
    });

    console.log('Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('Database cleanup failed:', error);
    throw error;
  } finally {
    client.close();
  }
}

if (require.main === module) {
  cleanupDatabase();
}

export { cleanupDatabase };
