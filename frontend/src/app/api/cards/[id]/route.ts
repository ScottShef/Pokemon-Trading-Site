import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * Handles GET requests to /api/cards/[id]
 * This endpoint fetches a single Pokémon card by its unique `api_id` from Turso database.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Query the Turso database for the card
    const result = await client.execute({
      sql: `SELECT 
              api_id as _id,
              api_id,
              name,
              number,
              rarity,
              set_id,
              set_name,
              set_series,
              set_release_date,
              image_small,
              highest_market_price,
              tcgplayer_data,
              cardmarket_data,
              ebay_data,
              last_updated,
              created_at,
              updated_at
            FROM pokemon_products 
            WHERE api_id = ?`,
      args: [id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const row = result.rows[0];
    
    // Parse JSON data fields
    const parseJsonField = (field: any) => {
      if (!field) return null;
      try {
        return typeof field === 'string' ? JSON.parse(field) : field;
      } catch {
        return null;
      }
    };

    // Construct the card object
    const card = {
      _id: row.api_id,
      apiId: row.api_id,
      name: row.name,
      number: row.number,
      rarity: row.rarity,
      images: {
        small: row.image_small,
        large: row.image_small // Using small as large for now
      },
      set: {
        id: row.set_id,
        name: row.set_name,
        series: row.set_series,
        releaseDate: row.set_release_date
      },
      highestMarketPrice: row.highest_market_price,
      tcgplayer: parseJsonField(row.tcgplayer_data),
      cardmarket: parseJsonField(row.cardmarket_data),
      ebay: parseJsonField(row.ebay_data),
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    return NextResponse.json(card);

  } catch (err) {
    console.error(`Error fetching card ${context.params.id}:`, err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}


