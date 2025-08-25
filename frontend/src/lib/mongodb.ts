/**
 * This file contains helper functions for interacting with the MongoDB Atlas Data API.
 * It abstracts the `fetch` logic, making it reusable across all API routes.
 * This approach is necessary for serverless environments like Cloudflare Workers
 * where traditional TCP database connections (like Mongoose) are not supported.
 */

// These environment variables must be set in your Cloudflare Pages project settings.
const DATA_API_KEY = process.env.MONGO_DATA_API_KEY;
const API_ENDPOINT = process.env.MONGO_API_ENDPOINT;
const DATA_SOURCE = process.env.MONGO_DATA_SOURCE;
const DATABASE_NAME = process.env.MONGO_DATABASE_NAME;

// Define the basic structure for any action sent to the Data API.
interface MongoDbPayload {
  collection: string;
  database: string;
  dataSource: string;
  filter?: object;
  projection?: object;
  document?: object;
  update?: object;
  sort?: object;
  limit?: number;
  skip?: number;
}

/**
 * The main request handler for all MongoDB Data API calls.
 * @param action The Data API action to perform (e.g., 'findOne', 'insertOne').
 * @param body The payload containing collection, filter, document, etc.
 * @returns The JSON response from the Data API.
 */
async function mongoDbRequest(action: string, body: Partial<MongoDbPayload>) {
  // Ensure all required environment variables are present.
  if (!DATA_API_KEY || !API_ENDPOINT || !DATA_SOURCE || !DATABASE_NAME) {
    throw new Error('Missing MongoDB environment variables');
  }

  const res = await fetch(`${API_ENDPOINT}/action/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': DATA_API_KEY,
    },
    body: JSON.stringify({
      ...body,
      database: DATABASE_NAME,
      dataSource: DATA_SOURCE,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`MongoDB Data API Error (${res.status}): ${errorBody}`);
    throw new Error(`Database request failed with status ${res.status}`);
  }

  return res.json();
}

// Below are exported helper functions that wrap the `mongoDbRequest` function
// for common database operations, making them easy to use in API routes.

/**
 * Finds a single document in a collection.
 * @param collection The name of the collection to search.
 * @param filter The query filter to apply.
 * @param projection Optional. The fields to include or exclude.
 * @returns The result of the findOne operation.
 */
export async function findOne(collection: string, filter: object, projection?: object) {
  return mongoDbRequest('findOne', { collection, filter, projection });
}

/**
 * Inserts a single document into a collection.
 * @param collection The name of the collection.
 * @param document The document to insert.
 * @returns The result of the insertOne operation.
 */
export async function insertOne(collection: string, document: object) {
  return mongoDbRequest('insertOne', { collection, document });
}

/**
 * Updates a single document in a collection.
 * @param collection The name of the collection.
 * @param filter The filter to select the document to update.
 * @param update The update operations to be applied to the document.
 * @returns The result of the updateOne operation.
 */
export async function updateOne(collection: string, filter: object, update: object) {
  return mongoDbRequest('updateOne', { collection, filter, update });
}

/**
 * Finds multiple documents in a collection.
 * @param collection The name of the collection.
 * @param filter The query filter.
 * @param options Optional. Includes projection, sort, limit, and skip.
 * @returns The result of the find operation.
 */
export async function find(collection: string, filter: object, options: { projection?: object, sort?: object, limit?: number, skip?: number } = {}) {
    return mongoDbRequest('find', {
        collection,
        filter,
        ...options
    });
}

