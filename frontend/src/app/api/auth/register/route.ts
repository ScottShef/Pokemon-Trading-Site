import { NextResponse } from 'next/server';
import { findOne, insertOne } from '@/lib/mongodb'; // Helpers for MongoDB Data API
import bcrypt from 'bcryptjs';
import { IUser } from '@/types/user'; // User interface

/**
 * Handles POST requests to /api/auth/register
 * This endpoint creates a new user in the database.
 */
export async function POST(request: Request) {
  try {
    // Step 1: Parse the incoming request body to get user details.
    const { username, email, password } = await request.json();

    // Step 2: Validate the input.
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 });
    }

    // Step 3: Check if a user with the same email or username already exists.
    // The MongoDB Data API's `findOne` action is used here.
    // We use the `$or` operator to check both fields in a single query.
    const { document: existingUser } = await findOne('users', {
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      // If a user is found, return a conflict error.
      return NextResponse.json({ error: 'User with that email or username already exists' }, { status: 409 });
    }

    // Step 4: If the user does not exist, hash the password for security.
    // `bcryptjs` is used here as it's a pure JavaScript implementation suitable for serverless environments.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 5: Create the new user document to be inserted into the database.
    // We conform to the IUser interface, ensuring type safety.
    const newUser: Omit<IUser, '_id' | 'createdAt'> = {
      username,
      email: email.toLowerCase(), // Store email in lowercase for consistency
      password: hashedPassword,
    };

    // Step 6: Insert the new user document into the 'users' collection.
    // The `insertOne` helper abstracts the fetch call to the Data API.
    const result = await insertOne('users', newUser);

    // Step 7: Return a success response, including the ID of the newly created user.
    return NextResponse.json(
      { message: 'User created successfully', userId: result.insertedId },
      { status: 201 }
    );

  } catch (err) {
    // Step 8: Handle any unexpected errors during the registration process.
    console.error('Registration Error:', err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

