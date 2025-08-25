import { NextResponse } from 'next/server';
import { findOne } from '@/lib/mongodb'; // MongoDB Data API helper
import { IPokemonCard } from '@/types/pokemon';

// Define the structure of the context object passed to the function.
interface RouteContext {
  params: {
    id: string; // The card's `apiId` from the URL path
  };
}

/**
 * Handles GET requests to /api/cards/[id]
 * This endpoint fetches a single Pokémon card by its unique `apiId`.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    // Step 1: Extract the card ID from the route's context.
    const { id } = context.params;

    // If no ID is provided in the URL, return a bad request error.
    if (!id) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Step 2: Construct the MongoDB query filter to find the card by its `apiId`.
    const filter = {
      apiId: id,
    };

    // Step 3: Execute the query using the `findOne` helper.
    // This will fetch the complete document for the specified card.
    const { document: card } = await findOne('pokemon_products', filter);

    // Step 4: If no card is found with that ID, return a 404 Not Found error.
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Step 5: Return the found card document to the client.
    return NextResponse.json(card);

  } catch (err) {
    // Step 6: Handle any unexpected errors during the fetch process.
    console.error(`Error fetching card ${context.params.id}:`, err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

