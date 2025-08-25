import { NextResponse } from 'next/server';
import { findOne, updateOne } from '@/lib/mongodb'; // We will create these helpers to interact with the MongoDB Data API
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth'; // We will create this helper to verify the JWT from the request

/**
 * Handles PUT requests to /api/auth/change-password
 * This endpoint allows an authenticated user to change their password.
 */
export async function PUT(request: Request) {
  try {
    // Step 1: Authenticate the user from the request headers.
    // The `getAuthUser` helper will extract the JWT from the Authorization header,
    // verify it using the 'jose' library, and return the user's payload (e.g., their ID).
    // This replaces the need for Express middleware.
    const authUser = await getAuthUser(request);
    if (!authUser) {
      // If no valid token is found, return an unauthorized error.
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Parse the incoming JSON body from the request.
    const { currentPassword, newPassword } = await request.json();

    // Step 3: Validate that the necessary data was provided.
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }

    // Step 4: Fetch the full user document from the database.
    // We use the user's ID from the authenticated token to find them.
    // Note: The MongoDB Data API requires the ID to be in a specific format (`$oid`).
    const { document: user } = await findOne('users', { _id: { $oid: authUser.id } });

    if (!user) {
      // This is a safety check. If the user ID from a valid token doesn't exist in the DB,
      // something is wrong.
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Step 5: Compare the provided `currentPassword` with the hashed password stored in the database.
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      // If the passwords do not match, return an error.
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Step 6: If the current password is correct, hash the `newPassword` for secure storage.
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Step 7: Update the user's document in the database with the new hashed password.
    await updateOne(
      'users', // The collection to update
      { _id: { $oid: authUser.id } }, // The filter to find the correct user document
      { $set: { password: hashedNewPassword } } // The update operation
    );

    // Step 8: Return a success message to the client.
    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (err: any) {
    // General error handling for the entire process.
    console.error('Change Password Error:', err);

    // Specifically handle JWT errors, such as an expired token.
    if (err.code === 'ERR_JWT_EXPIRED') {
        return NextResponse.json({ error: 'Session expired, please log in again.' }, { status: 401 });
    }

    // For any other errors, return a generic server error response.
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

