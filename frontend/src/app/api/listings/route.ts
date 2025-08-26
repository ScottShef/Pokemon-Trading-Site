import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/turso";
import { jwtVerify } from "jose";

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    
    let payload;
    try {
      const { payload: jwtPayload } = await jwtVerify(token, secret);
      payload = jwtPayload;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { 
      card_name, 
      card_number,
      set_series,
      description, 
      price, 
      image_urls, 
      listing_type, 
      condition,
      graded_company, 
      graded_grade 
    } = await request.json();

    // Validate input
    if (!card_name || !price || !listing_type) {
      return NextResponse.json(
        { error: "Card name, price, and listing type are required" },
        { status: 400 }
      );
    }

    if (!["raw", "graded"].includes(listing_type)) {
      return NextResponse.json(
        { error: "Listing type must be 'raw' or 'graded'" },
        { status: 400 }
      );
    }

    // For raw cards, combine listing_type with condition
    let finalListingType = listing_type;
    if (listing_type === "raw" && condition) {
      finalListingType = `Raw - ${condition}`;
    }

    // Insert new listing with condition field
    const result = await executeQuery(
      `INSERT INTO listings (
        card_name, card_number, set_series, description, price, image_urls, seller_id, 
        listing_type, condition, graded_company, graded_grade
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card_name,
        card_number || null,
        set_series || null,
        description || null,
        price,
        image_urls ? JSON.stringify(image_urls) : null,
        payload.userId,
        finalListingType,
        condition || null,
        graded_company || null,
        graded_grade || null
      ]
    );

    return NextResponse.json(
      { 
        message: "Listing created successfully",
        listingId: Number(result.lastInsertRowid)
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const cardName = searchParams.get("cardName");
    const listingType = searchParams.get("listingType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];

    if (cardName) {
      conditions.push("l.card_name LIKE ?");
      params.push(`%${cardName}%`);
    }

    if (listingType && ["raw", "graded"].includes(listingType)) {
      conditions.push("l.listing_type = ?");
      params.push(listingType);
    }

    if (minPrice) {
      conditions.push("l.price >= ?");
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      conditions.push("l.price <= ?");
      params.push(parseFloat(maxPrice));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get listings with seller info including condition field
    const query = `
      SELECT 
        l.id,
        l.card_name,
        l.card_number,
        l.set_series,
        l.description,
        l.price,
        l.image_urls,
        l.listing_type,
        l.condition,
        l.graded_company,
        l.graded_grade,
        l.created_at,
        l.updated_at,
        u.id as seller_id,
        u.username as seller_username,
        u.reputation as seller_reputation,
        u.review_count as seller_review_count
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      ${whereClause}
      ORDER BY l.price DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const result = await executeQuery(query, params);

    // Transform the data including condition field
    const listings = result.rows.map((row: any) => ({
      id: row.id,
      card_name: row.card_name,
      card_number: row.card_number,
      set_series: row.set_series,
      description: row.description,
      price: row.price,
      image_urls: row.image_urls ? JSON.parse(row.image_urls) : [],
      listing_type: row.listing_type,
      condition: row.condition,
      graded_company: row.graded_company,
      graded_grade: row.graded_grade,
      created_at: row.created_at,
      updated_at: row.updated_at,
      seller_info: {
        id: row.seller_id,
        username: row.seller_username,
        reputation: row.seller_reputation,
        review_count: row.seller_review_count
      }
    }));

    return NextResponse.json({
      listings,
      page,
      limit,
      hasMore: listings.length === limit
    });

  } catch (error) {
    console.error("Get listings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
