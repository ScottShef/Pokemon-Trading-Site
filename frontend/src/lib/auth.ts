import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

// Define the structure of the JWT payload we expect.
interface UserJwtPayload {
  id: string;
  username: string;
  iat: number;
  exp: number;
}

/**
 * Verifies the JWT from the Authorization header of a request.
 * @param request The incoming Next.js request object.
 * @returns The decoded user payload if the token is valid, otherwise null.
 */
export async function getAuthUser(request: NextRequest | Request): Promise<UserJwtPayload | null> {
  try {
    // Step 1: Get the "Authorization" header from the request.
    const authHeader = request.headers.get('Authorization');

    // Step 2: Check if the header exists and is in the correct "Bearer <token>" format.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No bearer token found in Authorization header');
      return null;
    }

    // Step 3: Extract the token string by removing "Bearer ".
    const token = authHeader.substring(7);

    // Step 4: Get the JWT secret from environment variables and encode it for the 'jose' library.
    // The secret must be a Uint8Array.
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set.');
    }

    // Step 5: Verify the token using `jwtVerify` from the 'jose' library.
    // 'jose' is recommended for edge environments because it uses the Web Crypto API.
    // It will throw an error if the token is invalid or expired.
    const { payload } = await jwtVerify<UserJwtPayload>(token, secret);

    // Step 6: If verification is successful, return the payload.
    return payload;

  } catch (err: any) {
    // Step 7: If any error occurs during the process (e.g., token expired, invalid signature),
    // log the error and re-throw it so the calling function can handle it.
    console.error('JWT Verification Error:', err.code, err.message);
    // Re-throwing the error allows the API route to catch it and send a specific
    // 401 Unauthorized response.
    throw err;
  }
}
