-- Extended Pokemon Trading Site Database Schema for Pokemon Price Tracker API Integration

-- Pokemon Products table (stores comprehensive data from Pokemon Price Tracker API)
CREATE TABLE pokemon_products (
    api_id TEXT PRIMARY KEY, -- e.g., 'sm9-170'
    name TEXT NOT NULL,
    number TEXT,
    rarity TEXT,
    
    -- Set information (nested object in API)
    set_id TEXT,
    set_name TEXT,
    set_series TEXT,
    set_printed_total INTEGER,
    set_total INTEGER,
    set_ptcgo_code TEXT,
    set_release_date DATE,
    set_legalities_unlimited TEXT,
    set_legalities_expanded TEXT,
    
    -- Image information
    image_small TEXT,
    
    -- Market prices and data
    highest_market_price REAL,
    
    -- TCGPlayer data (JSON stored as TEXT)
    tcgplayer_data TEXT, -- JSON object containing prices and metadata
    tcgplayer_updated_at DATETIME,
    
    -- CardMarket data (JSON stored as TEXT)
    cardmarket_data TEXT, -- JSON object containing prices and metadata
    cardmarket_updated_at DATETIME,
    
    -- eBay data (JSON stored as TEXT) - includes graded card pricing
    ebay_data TEXT, -- JSON object containing graded prices, sales velocity, etc.
    ebay_updated_at DATETIME,
    
    -- API metadata
    created_at DATETIME,
    updated_at DATETIME,
    last_updated DATETIME,
    
    -- Our database metadata
    ingested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_synced DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for pokemon_products
CREATE INDEX idx_products_name ON pokemon_products(name);
CREATE INDEX idx_products_set_id ON pokemon_products(set_id);
CREATE INDEX idx_products_set_name ON pokemon_products(set_name);
CREATE INDEX idx_products_number ON pokemon_products(number);
CREATE INDEX idx_products_rarity ON pokemon_products(rarity);
CREATE INDEX idx_products_highest_price ON pokemon_products(highest_market_price);
CREATE INDEX idx_products_last_synced ON pokemon_products(last_synced);

-- Trigger to update last_synced for pokemon_products
CREATE TRIGGER products_sync_updated 
AFTER UPDATE ON pokemon_products
BEGIN
    UPDATE pokemon_products SET last_synced = CURRENT_TIMESTAMP WHERE api_id = NEW.api_id;
END;

-- Enhanced Pokemon Sets table with more detailed information
CREATE TABLE IF NOT EXISTS pokemon_sets_detailed (
    id TEXT PRIMARY KEY, -- e.g., 'sv4', 'base1'
    name TEXT NOT NULL,
    series TEXT,
    release_date DATE,
    printed_total INTEGER,
    total INTEGER,
    ptcgo_code TEXT,
    legalities_unlimited TEXT,
    legalities_expanded TEXT,
    
    -- API metadata
    api_updated_at DATETIME,
    
    -- Our database metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for detailed sets
CREATE INDEX IF NOT EXISTS idx_sets_detailed_name ON pokemon_sets_detailed(name);
CREATE INDEX IF NOT EXISTS idx_sets_detailed_series ON pokemon_sets_detailed(series);
CREATE INDEX IF NOT EXISTS idx_sets_detailed_release_date ON pokemon_sets_detailed(release_date);

-- Pokemon Product Prices view (normalized view of pricing data)
CREATE VIEW pokemon_product_prices AS
SELECT 
    api_id,
    name,
    set_name,
    number,
    rarity,
    
    -- TCGPlayer prices (extracted from JSON)
    json_extract(tcgplayer_data, '$.prices.normal.low') as tcg_normal_low,
    json_extract(tcgplayer_data, '$.prices.normal.mid') as tcg_normal_mid,
    json_extract(tcgplayer_data, '$.prices.normal.high') as tcg_normal_high,
    json_extract(tcgplayer_data, '$.prices.normal.market') as tcg_normal_market,
    
    json_extract(tcgplayer_data, '$.prices.holofoil.low') as tcg_holo_low,
    json_extract(tcgplayer_data, '$.prices.holofoil.mid') as tcg_holo_mid,
    json_extract(tcgplayer_data, '$.prices.holofoil.high') as tcg_holo_high,
    json_extract(tcgplayer_data, '$.prices.holofoil.market') as tcg_holo_market,
    
    -- CardMarket prices
    json_extract(cardmarket_data, '$.prices.averageSellPrice') as cm_average_sell,
    json_extract(cardmarket_data, '$.prices.trendPrice') as cm_trend,
    json_extract(cardmarket_data, '$.prices.lowPrice') as cm_low,
    
    -- eBay PSA 10 prices (most common grade)
    json_extract(ebay_data, '$.prices.10.stats.average') as ebay_psa10_avg,
    json_extract(ebay_data, '$.prices.10.stats.min') as ebay_psa10_min,
    json_extract(ebay_data, '$.prices.10.stats.max') as ebay_psa10_max,
    
    highest_market_price,
    last_synced
FROM pokemon_products;

-- Pokemon Graded Prices view (detailed graded pricing)
CREATE VIEW pokemon_graded_prices AS
SELECT 
    p.api_id,
    p.name,
    p.set_name,
    p.number,
    
    -- Extract all available grades from eBay data
    grade.key as grade,
    json_extract(grade.value, '$.stats.average') as average_price,
    json_extract(grade.value, '$.stats.min') as min_price,
    json_extract(grade.value, '$.stats.max') as max_price,
    json_extract(grade.value, '$.stats.median') as median_price,
    json_extract(grade.value, '$.stats.count') as sale_count,
    json_extract(grade.value, '$.updated') as grade_updated,
    
    p.last_synced
FROM pokemon_products p,
     json_each(p.ebay_data, '$.prices') as grade
WHERE p.ebay_data IS NOT NULL
  AND json_valid(p.ebay_data);

-- Pokemon Market Trends view (for trend analysis)
CREATE VIEW pokemon_market_trends AS
SELECT 
    api_id,
    name,
    set_name,
    number,
    rarity,
    
    -- Price comparison across platforms
    CASE 
        WHEN json_extract(tcgplayer_data, '$.prices.holofoil.market') IS NOT NULL 
        THEN json_extract(tcgplayer_data, '$.prices.holofoil.market')
        ELSE json_extract(tcgplayer_data, '$.prices.normal.market')
    END as tcg_market_price,
    
    json_extract(cardmarket_data, '$.prices.trendPrice') as cm_trend_price,
    json_extract(ebay_data, '$.prices.10.stats.average') as psa10_price,
    
    highest_market_price,
    
    -- Sales velocity indicators
    json_extract(ebay_data, '$.salesVelocity.dailyAverage') as daily_sales_avg,
    json_extract(ebay_data, '$.salesVelocity.weeklyAverage') as weekly_sales_avg,
    json_extract(ebay_data, '$.salesVelocity.monthlyTotal') as monthly_sales_total,
    
    last_synced
FROM pokemon_products
WHERE highest_market_price IS NOT NULL;
