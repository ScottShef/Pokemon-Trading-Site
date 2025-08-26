import { NextResponse } from 'next/server';
import { executeGraphQL } from '@/lib/mongodb';
import { IPokemonCard } from '@/types/pokemon';

// GraphQL query to find a Pokémon card by its apiId
const GET_CARD_BY_API_ID_QUERY = `
  query GetCardByApiId($apiId: String!) {
    pokemon_products(where: {apiId: {_eq: $apiId}}, limit: 1) {
      _id
      apiId
      name
      images
      set
      rarity
      cardmarket
      tcgplayer
      ebay
      highestMarketPrice
      lastUpdated
    }
  }
`;

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * Handles GET requests to /api/cards/[id]
 * This endpoint fetches a single Pokémon card by its unique `apiId` using GraphQL.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Execute the query using the GraphQL helper
    const { data, errors } = await executeGraphQL<{ pokemon_products: IPokemonCard[] }> (
      GET_CARD_BY_API_ID_QUERY,
      { apiId: id }
    );

    if (errors) {
        console.error(`Error fetching card ${id}:`, errors);
        return NextResponse.json({ error: 'An error occurred while fetching the card.' }, { status: 500 });
    }

    const card = data?.pokemon_products[0];

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json(card);

  } catch (err) {
    console.error(`Error fetching card ${context.params.id}:`, err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}


