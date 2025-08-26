// Migration script to rename set_name column to set_series in listings table
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
    console.log('Renaming set_name column to set_series in listings table...');
    
    // Start transaction
    await executeQuery('BEGIN TRANSACTION');
    
    // Create a new table with the correct column name
    await executeQuery(`
      CREATE TABLE listings_temp (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        card_id TEXT,
        card_name TEXT NOT NULL,
        card_number TEXT,
        set_series TEXT,
        description TEXT,
        price REAL NOT NULL,
        image_urls TEXT,
        seller_id TEXT NOT NULL,
        listing_type TEXT NOT NULL DEFAULT 'raw',
        condition TEXT,
        graded_company TEXT,
        graded_grade TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES pokemon_cards(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Created temporary table with set_series column');
    
    // Copy all data from old table to new table, renaming set_name to set_series
    await executeQuery(`
      INSERT INTO listings_temp (
        id, card_id, card_name, card_number, set_series, description, price, image_urls, 
        seller_id, listing_type, condition, graded_company, graded_grade, 
        created_at, updated_at
      )
      SELECT 
        id, card_id, card_name, card_number, set_name, description, price, image_urls, 
        seller_id, listing_type, condition, graded_company, graded_grade, 
        created_at, updated_at
      FROM listings
    `);
    console.log('✓ Copied all data to temporary table');
    
    // Drop the old table
    await executeQuery('DROP TABLE listings');
    console.log('✓ Dropped old listings table');
    
    // Rename temp table to listings
    await executeQuery('ALTER TABLE listings_temp RENAME TO listings');
    console.log('✓ Renamed temporary table to listings');
    
    // Recreate indexes
    await executeQuery('CREATE INDEX idx_listings_seller_id ON listings(seller_id)');
    await executeQuery('CREATE INDEX idx_listings_card_id ON listings(card_id)');
    await executeQuery('CREATE INDEX idx_listings_card_name ON listings(card_name)');
    await executeQuery('CREATE INDEX idx_listings_card_number ON listings(card_number)');
    await executeQuery('CREATE INDEX idx_listings_set_series ON listings(set_series)');
    await executeQuery('CREATE INDEX idx_listings_price ON listings(price)');
    await executeQuery('CREATE INDEX idx_listings_listing_type ON listings(listing_type)');
    await executeQuery('CREATE INDEX idx_listings_created_at ON listings(created_at)');
    console.log('✓ Recreated indexes');
    
    // Recreate trigger
    await executeQuery(`
      CREATE TRIGGER listings_updated_at 
      AFTER UPDATE ON listings
      BEGIN
          UPDATE listings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
    console.log('✓ Recreated trigger');
    
    // Commit transaction
    await executeQuery('COMMIT');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    try {
      await executeQuery('ROLLBACK');
      console.log('Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('Failed to rollback transaction:', rollbackError);
    }
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    client.close();
  }
}

runMigration();
