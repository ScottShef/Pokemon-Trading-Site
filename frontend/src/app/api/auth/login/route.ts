import { NextResponse } from 'next/server';
import { findOne } from '@/lib/mongodb'; // MongoDB Data API helper
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose'; // 'jose' is used for JWTs in edge environments
import { IUser, UserProfile } from '@/types/user'; // User interfaces

/**
 * Handles POST requests to /api/auth/login
 * This endpoint authenticates a user and returns a JWT.
 */
export async function POST(request: Request) {
  try {
    // Step 1: Parse the identifier (username or email) and password from the request body.
    const { identifier, password } = await request.json();

    // Step 2: Validate that the necessary credentials were provided.
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Identifier and password are required' }, { status: 400 });
    }

    // Step 3: Find the user in the database by their email or username.
    // The query is case-insensitive for the email.
    const { document: user } = await findOne('users', {
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    });

    // If no user is found, return a generic "Invalid credentials" error.
    // We don't specify whether the username or password was wrong for security reasons.
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Step 4: Compare the provided password with the hashed password from the database.
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // If the passwords don't match, return the same generic error.
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Step 5: If authentication is successful, create a JWT.
    // The secret key is retrieved from environment variables and must be encoded as a Uint8Array.
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set.');
    }

    // The 'jose' library is used to sign the token. It's compatible with the Web Crypto API.
    const token = await new SignJWT({ id: user._id.$oid, username: user.username })
      .setProtectedHeader({ alg: 'HS256' }) // Algorithm for signing
      .setIssuedAt() // Sets the "iat" claim to the current time
      .setExpirationTime('1d') // Sets the token to expire in 1 day
      .sign(secret); // Signs the token with the secret

    // Step 6: Prepare the user profile data to be sent back to the client.
    // This object excludes the password hash.
    const userProfile: UserProfile = {
      id: user._id.$oid,
      username: user.username,
      email: user.email,
    };

    // Step 7: Return a success response containing the token and user profile.
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userProfile,
    });

  } catch (err) {
    // Step 8: Handle any unexpected errors during the login process.
    console.error('Login Error:', err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

