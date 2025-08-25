import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { insertOne, findOne } from "@/lib/mongodb";
import { IListing } from "@/types/listing";
import { IPokemonCard } from "@/types/pokemon";
import { UserProfile } from "@/types/user";

/**
 * POST /api/listings/create
 * Creates a new listing for a Pokémon card.
 * This is a protected route, requiring authentication.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate the user
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the request body
    const { cardId, price, condition, description, imageUrl } = await req.json();

    // 3. Validate input
    if (!cardId || !price || !condition) {
      return NextResponse.json(
        { error: "Missing required fields: cardId, price, and condition are required." },
        { status: 400 }
      );
    }

    // 4. Fetch the full card data from the 'cards' collection
    const cardResult = await findOne("cards", { apiId: cardId });
    if (!cardResult || !cardResult.document) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }
    const cardData: IPokemonCard = cardResult.document;

    // 5. Construct the seller's profile from the authenticated user's JWT payload
    const sellerProfile: UserProfile = {
        id: user.id, // The 'id' from the JWT payload
        username: user.username,
    };

    // 6. Construct the new listing object
    const newListing: Omit<IListing, '_id'> = {
      card: cardData,
      seller: sellerProfile,
      price: parseFloat(price),
      condition,
      description,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "Available",
    };

    // 7. Insert the new listing into the database
    const result = await insertOne("listings", newListing);
    if (!result.insertedId) {
        throw new Error("Failed to insert the new listing.");
    }

    // 8. Return a success response
    return NextResponse.json(
      { message: "Listing created successfully!", listingId: result.insertedId },
      { status: 201 }
    );

  } catch (error) {
    console.error("Failed to create listing:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the listing." },
      { status: 500 }
    );
  }
}
