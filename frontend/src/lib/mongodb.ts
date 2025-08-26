/**
 * This file contains a helper function for interacting with the Hasura GraphQL API.
 * It abstracts the `fetch` logic, making it reusable across all API routes.
 * This approach is necessary for serverless environments like Cloudflare Workers
 * where traditional TCP database connections (like Mongoose) are not supported.
 */

// These environment variables must be set in your Cloudflare Pages project settings.
const HASURA_GRAPHQL_API_ENDPOINT = process.env.HASURA_GRAPHQL_API_ENDPOINT;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

/**
 * Interface representing the structure of a GraphQL response.
 */
interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions: any }>;
}

/**
 * Executes a GraphQL query or mutation.
 * @param query The GraphQL query or mutation string.
 * @param variables Optional. A record of variables to include with the query.
 * @returns A promise that resolves to the GraphQL response.
 */
export async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  if (!HASURA_GRAPHQL_API_ENDPOINT || !HASURA_ADMIN_SECRET) {
    throw new Error(
      "Missing Hasura environment variables. Please check your .env.local file."
    );
  }

  try {
    const response = await fetch(HASURA_GRAPHQL_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `GraphQL request failed with status ${response.status}: ${errorBody}`
      );
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors) {
      console.error("GraphQL Errors:", JSON.stringify(result.errors, null, 2));
    }

    return result;
  } catch (error) {
    console.error("Error executing GraphQL query:", error);
    throw new Error("Failed to execute GraphQL query.");
  }
}

