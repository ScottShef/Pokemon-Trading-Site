import { createClient } from '@libsql/client'

// Create the connection configuration
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Helper function to execute queries with error handling
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const result = await client.execute({
      sql: query,
      args: params
    })
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw new Error('Database operation failed')
  }
}

// Helper function for multiple queries (using transactions)
export async function executeTransaction(queries: Array<{ query: string; params?: any[] }>) {
  const tx = await client.batch(
    queries.map(({ query, params = [] }) => ({
      sql: query,
      args: params
    }))
  )
  return tx
}

// Helper function for a single transaction
export async function executeMultipleQueries(queries: Array<{ query: string; params?: any[] }>) {
  try {
    const results = []
    for (const { query, params = [] } of queries) {
      const result = await executeQuery(query, params)
      results.push(result)
    }
    return results
  } catch (error) {
    console.error('Multiple queries error:', error)
    throw new Error('Multiple queries failed')
  }
}

export { client as db }
