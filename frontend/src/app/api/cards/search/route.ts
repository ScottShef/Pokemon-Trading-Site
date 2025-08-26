import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/turso";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const setId = searchParams.get("setId");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query && !setId) {
      return NextResponse.json(
        { error: "Query parameter 'q' or 'setId' is required" },
        { status: 400 }
      );
    }

    // Build WHERE clause for database query
    const conditions: string[] = [];
    const params: any[] = [];

    if (query) {
      conditions.push("c.name LIKE ?");
      params.push(`%${query}%`);
    }

    if (setId) {
      conditions.push("c.set_id = ?");
      params.push(setId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Query local database for Pokemon cards
    const dbQuery = `
      SELECT 
        c.id,
        c.name,
        c.set_id,
        c.number,
        c.rarity,
        c.artist,
        c.image_url,
        s.name as set_name,
        -- Get current market prices
        GROUP_CONCAT(
          CASE WHEN p.price_type = 'tcgplayer_normal' THEN p.market_price END
        ) as tcgplayer_normal_price,
        GROUP_CONCAT(
          CASE WHEN p.price_type = 'tcgplayer_holofoil' THEN p.market_price END
        ) as tcgplayer_holofoil_price,
        GROUP_CONCAT(
          CASE WHEN p.price_type = 'cardmarket' THEN p.market_price END
        ) as cardmarket_price
      FROM pokemon_cards c
      LEFT JOIN pokemon_sets s ON c.set_id = s.id
      LEFT JOIN pokemon_card_prices p ON c.id = p.card_id
      ${whereClause}
      GROUP BY c.id, c.name, c.set_id, c.number, c.rarity, c.artist, c.image_url, s.name
      ORDER BY c.name ASC
      LIMIT ?
    `;

    params.push(limit);

    const result = await executeQuery(dbQuery, params);

    // Transform the data for frontend
    const cards = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      set: {
        id: row.set_id,
        name: row.set_name
      },
      number: row.number,
      image: row.image_url,
      prices: {
        tcgplayer: {
          normal: row.tcgplayer_normal_price ? parseFloat(row.tcgplayer_normal_price) : null,
          holofoil: row.tcgplayer_holofoil_price ? parseFloat(row.tcgplayer_holofoil_price) : null
        },
        cardmarket: row.cardmarket_price ? parseFloat(row.cardmarket_price) : null
      },
      rarity: row.rarity,
      artist: row.artist
    }));

    return NextResponse.json({
      cards,
      total: cards.length,
      page: 1,
      hasMore: cards.length === limit
    });

  } catch (error) {
    console.error("Pokemon card search error:", error);
    return NextResponse.json(
      { error: "Failed to search Pokemon cards" },
      { status: 500 }
    );
  }
}


