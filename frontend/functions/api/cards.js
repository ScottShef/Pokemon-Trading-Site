// Cloudflare Function for /api/cards
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  if (request.method === 'GET') {
    try {
      const query = url.searchParams.get('q') || '';
      const sort = url.searchParams.get('sort') || 'price-desc';
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let orderBy = 'name';
      let orderDirection = 'ASC';

      switch (sort) {
        case 'price-desc':
          orderBy = 'highest_market_price';
          orderDirection = 'DESC';
          break;
        case 'price-asc':
          orderBy = 'highest_market_price';
          orderDirection = 'ASC';
          break;
        case 'name':
          orderBy = 'name';
          orderDirection = 'ASC';
          break;
      }

      let whereClause = '';
      let args = [];

      if (query) {
        whereClause = `WHERE name LIKE ? OR set_name LIKE ? OR number LIKE ?`;
        const searchTerm = `%${query}%`;
        args = [searchTerm, searchTerm, searchTerm];
      }

      const countResult = await client.execute({
        sql: `SELECT COUNT(*) as count FROM pokemon_products ${whereClause}`,
        args: args
      });

      const total = Number(countResult.rows[0].count);

      const result = await client.execute({
        sql: `SELECT 
                api_id as _id,
                name,
                number,
                rarity,
                set_name,
                set_series,
                image_small,
                highest_market_price,
                tcgplayer_data,
                last_updated
              FROM pokemon_products 
              ${whereClause}
              ORDER BY ${orderBy} ${orderDirection} NULLS LAST
              LIMIT ? OFFSET ?`,
        args: [...args, limit, offset]
      });

      const cards = result.rows.map(row => ({
        _id: row.api_id,
        name: row.name,
        number: row.number,
        rarity: row.rarity,
        images: { small: row.image_small },
        set: { 
          name: row.set_name,
          series: row.set_series
        },
        highestMarketPrice: row.highest_market_price,
        tcgplayer: row.tcgplayer_data ? JSON.parse(row.tcgplayer_data) : null,
        lastSynced: row.last_updated
      }));

      const hasMore = offset + limit < total;

      return new Response(JSON.stringify({
        data: cards,
        total,
        page: Math.floor(offset / limit) + 1,
        hasMore
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Error fetching cards:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
