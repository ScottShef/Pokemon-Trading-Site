// Migration script to add card_number and set_name columns to listings table
import { createClient } from '@libsql/client';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Create the connection configuration
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function executeQuery(query, params = []) {
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

async function runMigration() {
  try {
    console.log('Adding card_number and set_name columns to listings table...');
    
    // Add the card_number column
    await executeQuery('ALTER TABLE listings ADD COLUMN card_number TEXT');
    console.log('✓ Added card_number column');
    
    // Add the set_name column
    await executeQuery('ALTER TABLE listings ADD COLUMN set_name TEXT');
    console.log('✓ Added set_name column');
    
    // Add indexes for the new columns
    await executeQuery('CREATE INDEX idx_listings_card_number ON listings(card_number)');
    console.log('✓ Added index for card_number column');
    
    await executeQuery('CREATE INDEX idx_listings_set_name ON listings(set_name)');
    console.log('✓ Added index for set_name column');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
      console.log('Columns already exist, skipping...');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    // Close the database connection
    client.close();
  }
}

runMigration();
