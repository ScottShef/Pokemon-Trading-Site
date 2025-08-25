import { NextResponse } from 'next/server';
import { find } from '@/lib/mongodb'; // MongoDB Data API helper
import { IPokemonCard } from '@/types/pokemon';

/**
 * Handles GET requests to /api/cards/search
 * This endpoint searches for Pokémon cards based on a query parameter.
 */
export async function GET(request: Request) {
  try {
    // Step 1: Get the search query from the URL parameters.
    // e.g., /api/cards/search?q=charizard
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // If no query is provided, return an error.
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Step 2: Construct the MongoDB query filter.
    // This example uses a regular expression to perform a case-insensitive search on the card's name.
    // The `$options: 'i'` flag makes the search case-insensitive.
    const filter = {
      name: { $regex: query, $options: 'i' },
    };

    // Step 3: Define search options.
    // - `projection` specifies which fields to return, reducing the response payload size.
    // - `limit` restricts the number of results to prevent overwhelming the client.
    // - `sort` can be used to order the results (e.g., by name or release date).
    const options = {
      projection: {
        apiId: 1,
        name: 1,
        'images.small': 1,
        'set.name': 1,
        rarity: 1,
      },
      limit: 50, // Return a maximum of 50 cards
      sort: { name: 1 }, // Sort by name in ascending order
    };

    // Step 4: Execute the search using the `find` helper.
    const { documents: cards } = await find('pokemon_products', filter, options);

    // Step 5: If no cards are found, return an empty array.
    if (!cards || cards.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Step 6: Return the found cards to the client.
    return NextResponse.json(cards);

  } catch (err) {
    // Step 7: Handle any unexpected errors during the search process.
    console.error('Card Search Error:', err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

