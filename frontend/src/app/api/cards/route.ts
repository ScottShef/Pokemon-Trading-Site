import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/turso";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "price-desc";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build WHERE clause for database query
    let whereClause = "";
    const params: any[] = [];

    if (query.trim()) {
      whereClause = "WHERE name LIKE ? OR set_name LIKE ? OR number LIKE ?";
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Build ORDER BY clause
    let orderClause = "";
    switch (sort) {
      case "price-desc":
        orderClause = "ORDER BY highest_market_price DESC NULLS LAST, name ASC";
        break;
      case "price-asc":
        orderClause = "ORDER BY highest_market_price ASC NULLS LAST, name ASC";
        break;
      case "name":
        orderClause = "ORDER BY name ASC";
        break;
      default:
        orderClause = "ORDER BY highest_market_price DESC NULLS LAST, name ASC";
        break;
    }

    // Query pokemon_products table
    const dbQuery = `
      SELECT 
        api_id,
        name,
        number,
        rarity,
        set_id,
        set_name,
        set_series,
        image_small,
        highest_market_price,
        tcgplayer_data,
        last_synced
      FROM pokemon_products
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const result = await executeQuery(dbQuery, params);

    // Transform the data for frontend
    const cards = result.rows.map((row: any) => {
      let tcgplayerPrices = null;
      
      // Parse TCGPlayer data if available
      if (row.tcgplayer_data) {
        try {
          const tcgData = JSON.parse(row.tcgplayer_data);
          tcgplayerPrices = tcgData.prices || null;
        } catch (e) {
          console.warn("Failed to parse TCGPlayer data for", row.api_id);
        }
      }

      return {
        _id: row.api_id,
        name: row.name,
        number: row.number,
        rarity: row.rarity,
        images: {
          small: row.image_small
        },
        set: {
          id: row.set_id,
          name: row.set_name,
          series: row.set_series
        },
        tcgplayer: tcgplayerPrices ? {
          prices: tcgplayerPrices
        } : null,
        highestMarketPrice: row.highest_market_price,
        lastSynced: row.last_synced
      };
    });

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pokemon_products
      ${whereClause}
    `;
    
    const countParams = whereClause ? params.slice(0, -2) : []; // Remove limit and offset
    const countResult = await executeQuery(countQuery, countParams);
    const total = Number(countResult.rows[0]?.total || 0);

    return NextResponse.json({
      data: cards,
      total,
      page: Math.floor(offset / limit) + 1,
      hasMore: offset + cards.length < total
    });

  } catch (error) {
    console.error("Pokemon cards fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Pokemon cards" },
      { status: 500 }
    );
  }
}
