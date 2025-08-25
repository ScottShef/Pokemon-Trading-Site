import { NextResponse } from "next/server";
import { find } from "@/lib/mongodb";

/**
 * GET /api/listings
 * Fetches all available listings from the database.
 * 
 * @returns {NextResponse} - A JSON response with the listings or an error message.
 */
export async function GET() {
  try {
    // Fetch all documents from the "listings" collection where status is "Available"
    const listings = await find("listings", { query: { status: "Available" } });

    // The `find` function from our mongodb lib returns the documents directly.
    return NextResponse.json(listings, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching listings." },
      { status: 500 }
    );
  }
}
