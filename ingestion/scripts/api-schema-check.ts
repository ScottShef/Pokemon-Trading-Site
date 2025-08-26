import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_KEY = process.env.POKEMON_PRICE_API_KEY!;
const API_BASE_URL = process.env.POKEMON_PRICE_API_URL!;

async function fetchSingleCard() {
  console.log('Fetching a single card from Pokemon Price Tracker API...');
  
  try {
    // First, let's get a list of sets to find a card ID
    const setsResponse = await fetch(`${API_BASE_URL}/sets`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!setsResponse.ok) {
      throw new Error(`Sets API failed: ${setsResponse.status} ${setsResponse.statusText}`);
    }

    const setsData = await setsResponse.json();
    console.log('Sets response structure:', Object.keys(setsData));
    console.log('First few sets:', JSON.stringify(setsData, null, 2).slice(0, 500) + '...');

    // The response might be wrapped in a data property or be a different structure
    let sets = setsData;
    if (setsData.data) {
      sets = setsData.data;
    } else if (setsData.sets) {
      sets = setsData.sets;
    }

    if (!Array.isArray(sets)) {
      console.log('Sets is not an array, full response:', setsData);
      return;
    }

    console.log('First few sets:', sets.slice(0, 3).map((s: any) => ({ id: s.id, name: s.name })));

    // Get cards from the first set
    const firstSetId = sets[0].id;
    console.log(`\nFetching cards from set: ${firstSetId} (${sets[0].name})`);

    const cardsResponse = await fetch(`${API_BASE_URL}/prices?setId=${firstSetId}&limit=3`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!cardsResponse.ok) {
      throw new Error(`Cards API failed: ${cardsResponse.status} ${cardsResponse.statusText}`);
    }

    const cardsData = await cardsResponse.json();
    console.log(`Found ${cardsData.data ? cardsData.data.length : cardsData.length} cards in set`);

    // Get the first card's details
    const cards = cardsData.data || cardsData;
    const firstCard = cards[0];
    console.log('\n=== FIRST CARD WITH PRICING DATA ===');
    console.log(JSON.stringify(firstCard, null, 2));

    // This should already include all pricing information
    console.log('\n=== PRICING STRUCTURE ANALYSIS ===');
    if (firstCard.tcgplayer) {
      console.log('TCGPlayer pricing structure:');
      console.log(JSON.stringify(firstCard.tcgplayer, null, 2));
    }
    if (firstCard.cardmarket) {
      console.log('CardMarket pricing structure:');
      console.log(JSON.stringify(firstCard.cardmarket, null, 2));
    }
    if (firstCard.ebay) {
      console.log('eBay pricing structure:');
      console.log(JSON.stringify(firstCard.ebay, null, 2));
    }

  } catch (error) {
    console.error('❌ Error fetching card data:', error);
  }
}

fetchSingleCard();
