-- Add condition column to listings table for raw card conditions
-- This migration adds support for raw card conditions like 'Mint', 'Near Mint', etc.

ALTER TABLE listings ADD COLUMN condition TEXT;

-- Add an index for the condition column for better query performance
CREATE INDEX idx_listings_condition ON listings(condition);
