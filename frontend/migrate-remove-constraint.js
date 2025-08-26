// Migration script to remove listing_type constraint to allow combined formats
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
    console.log('Removing listing_type constraint from listings table...');
    
    // Start transaction
    await executeQuery('BEGIN TRANSACTION');
    
    // Create a new table without the constraint
    await executeQuery(`
      CREATE TABLE listings_new (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        card_id TEXT,
        card_name TEXT NOT NULL,
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
    console.log('✓ Created new listings table without constraint');
    
    // Copy all data from old table to new table
    await executeQuery(`
      INSERT INTO listings_new (
        id, card_id, card_name, description, price, image_urls, 
        seller_id, listing_type, condition, graded_company, graded_grade, 
        created_at, updated_at
      )
      SELECT 
        id, card_id, card_name, description, price, image_urls, 
        seller_id, listing_type, condition, graded_company, graded_grade, 
        created_at, updated_at
      FROM listings
    `);
    console.log('✓ Copied all data to new table');
    
    // Drop the old table
    await executeQuery('DROP TABLE listings');
    console.log('✓ Dropped old listings table');
    
    // Rename new table to listings
    await executeQuery('ALTER TABLE listings_new RENAME TO listings');
    console.log('✓ Renamed new table to listings');
    
    // Recreate indexes
    await executeQuery('CREATE INDEX idx_listings_seller_id ON listings(seller_id)');
    await executeQuery('CREATE INDEX idx_listings_card_id ON listings(card_id)');
    await executeQuery('CREATE INDEX idx_listings_card_name ON listings(card_name)');
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
