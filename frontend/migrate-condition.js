// Migration script to add condition column to listings table
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
    console.log('Adding condition column to listings table...');
    
    // Add the condition column
    await executeQuery('ALTER TABLE listings ADD COLUMN condition TEXT');
    console.log('✓ Added condition column');
    
    // Add index for the condition column
    await executeQuery('CREATE INDEX idx_listings_condition ON listings(condition)');
    console.log('✓ Added index for condition column');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
      console.log('Column already exists, skipping...');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    // Close the database connection
    client.close();
  }
}

runMigration();
