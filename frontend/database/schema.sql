-- Pokemon Trading Site Database Schema for Turso (SQLite)

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    reputation INTEGER DEFAULT 100,
    review_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Trigger to update updated_at for users
CREATE TRIGGER users_updated_at 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Pokemon Sets table
CREATE TABLE pokemon_sets (
    id TEXT PRIMARY KEY, -- e.g., 'sv4', 'base1'
    name TEXT NOT NULL,
    series TEXT,
    release_date DATE,
    card_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for pokemon_sets
CREATE INDEX idx_sets_name ON pokemon_sets(name);
CREATE INDEX idx_sets_release_date ON pokemon_sets(release_date);

-- Pokemon Cards table (populated from Pokemon Price Tracker API)
CREATE TABLE pokemon_cards (
    id TEXT PRIMARY KEY, -- e.g., 'base1-4', 'sv4-123'
    name TEXT NOT NULL,
    set_id TEXT NOT NULL,
    number TEXT,
    rarity TEXT,
    artist TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (set_id) REFERENCES pokemon_sets(id) ON DELETE CASCADE
);

-- Create indexes for pokemon_cards
CREATE INDEX idx_cards_name ON pokemon_cards(name);
CREATE INDEX idx_cards_set_id ON pokemon_cards(set_id);
CREATE INDEX idx_cards_number ON pokemon_cards(number);
CREATE INDEX idx_cards_rarity ON pokemon_cards(rarity);

-- Trigger to update updated_at for pokemon_cards
CREATE TRIGGER cards_updated_at 
AFTER UPDATE ON pokemon_cards
BEGIN
    UPDATE pokemon_cards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Pokemon Card Prices table (current market prices from API)
CREATE TABLE pokemon_card_prices (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    card_id TEXT NOT NULL,
    price_type TEXT NOT NULL, -- 'tcgplayer_normal', 'tcgplayer_holofoil', 'cardmarket', 'ebay_psa10', etc.
    condition_type TEXT, -- 'normal', 'holofoil', 'reverseholofoil' for raw cards
    grade TEXT, -- 'PSA10', 'BGS9.5', etc. for graded cards
    low_price REAL,
    mid_price REAL,
    high_price REAL,
    market_price REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (card_id) REFERENCES pokemon_cards(id) ON DELETE CASCADE
);

-- Create indexes for pokemon_card_prices
CREATE INDEX idx_prices_card_id ON pokemon_card_prices(card_id);
CREATE INDEX idx_prices_type ON pokemon_card_prices(price_type);
CREATE INDEX idx_prices_condition ON pokemon_card_prices(condition_type);
CREATE INDEX idx_prices_grade ON pokemon_card_prices(grade);

-- Unique constraint to prevent duplicate price entries
CREATE UNIQUE INDEX unique_card_price ON pokemon_card_prices(card_id, price_type, condition_type, grade);

-- Listings table
CREATE TABLE listings (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    card_id TEXT, -- Reference to pokemon_cards.id
    card_name TEXT NOT NULL, -- Fallback if card not in our database
    description TEXT,
    price REAL NOT NULL,
    image_urls TEXT, -- JSON string
    seller_id TEXT NOT NULL,
    listing_type TEXT NOT NULL DEFAULT 'raw' CHECK (listing_type IN ('raw', 'graded')),
    graded_company TEXT,
    graded_grade TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES pokemon_cards(id) ON DELETE SET NULL
);

-- Create indexes for listings
CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_card_id ON listings(card_id);
CREATE INDEX idx_listings_card_name ON listings(card_name);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_listing_type ON listings(listing_type);
CREATE INDEX idx_listings_created_at ON listings(created_at);

-- Trigger to update updated_at for listings
CREATE TRIGGER listings_updated_at 
AFTER UPDATE ON listings
BEGIN
    UPDATE listings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Reviews table (for future use)
CREATE TABLE reviews (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    reviewer_id TEXT NOT NULL,
    reviewed_user_id TEXT NOT NULL,
    listing_id TEXT,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
    
    -- Prevent self-reviews
    CHECK (reviewer_id != reviewed_user_id)
);

-- Create indexes for reviews
CREATE INDEX idx_reviews_reviewed_user ON reviews(reviewed_user_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_listing ON reviews(listing_id);

-- Card price history table (for tracking Pokemon card prices over time)
CREATE TABLE card_prices (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    card_name TEXT NOT NULL,
    set_name TEXT,
    card_number TEXT,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor')),
    market_price REAL,
    low_price REAL,
    high_price REAL,
    price_date DATE NOT NULL,
    source TEXT DEFAULT 'tcgplayer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for card_prices
CREATE INDEX idx_card_prices_card_name ON card_prices(card_name);
CREATE INDEX idx_card_prices_set_name ON card_prices(set_name);
CREATE INDEX idx_card_prices_price_date ON card_prices(price_date);
CREATE INDEX idx_card_prices_condition ON card_prices(condition_type);

-- Unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX unique_card_price ON card_prices(card_name, set_name, card_number, condition_type, price_date, source);
