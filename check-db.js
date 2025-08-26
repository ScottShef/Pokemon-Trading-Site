import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkDatabase() {
  try {
    const result = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`);
    console.log('Existing tables:');
    result.rows.forEach(row => console.log('  -', row.name));

    // Check if we have any data
    const userCount = await client.execute('SELECT COUNT(*) as count FROM users;');
    console.log('\nUsers table has', userCount.rows[0].count, 'records');

    const setsCount = await client.execute('SELECT COUNT(*) as count FROM pokemon_sets;');
    console.log('Pokemon sets table has', setsCount.rows[0].count, 'records');

    const cardsCount = await client.execute('SELECT COUNT(*) as count FROM pokemon_cards;');
    console.log('Pokemon cards table has', cardsCount.rows[0].count, 'records');

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    client.close();
  }
}

checkDatabase();
