import { NextResponse } from 'next/server';
import { executeGraphQL } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';
import { IUser } from '@/types/user';

// GraphQL query to find a user by their ID and get their password
const GET_USER_PASSWORD_QUERY = `
  query GetUserForPasswordChange($_id: String!) {
    users_by_pk(_id: $_id) {
      _id
      password
    }
  }
`;

// GraphQL mutation to update a user's password
const UPDATE_PASSWORD_MUTATION = `
  mutation UpdateUserPassword($_id: String!, $password: String!, $updatedAt: String!) {
    update_users_by_pk(
      pk_columns: { _id: $_id },
      _set: { password: $password, updatedAt: $updatedAt }
    ) {
      _id
    }
  }
`;

/**
 * Handles PUT requests to /api/auth/change-password
 * This endpoint allows an authenticated user to change their password using GraphQL.
 */
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }

    // Fetch the user from the database using their ID from the token
    const { data, errors } = await executeGraphQL<{ users_by_pk: IUser }> (
        GET_USER_PASSWORD_QUERY,
        { _id: authUser.id }
    );

    if (errors) {
        console.error('Error fetching user for password change:', errors);
        return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
    }

    const user = data?.users_by_pk;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    const { errors: updateErrors } = await executeGraphQL(
      UPDATE_PASSWORD_MUTATION,
      {
        _id: authUser.id,
        password: hashedNewPassword,
        updatedAt: new Date().toISOString(),
      }
    );

    if (updateErrors) {
        console.error('Error updating password:', updateErrors);
        return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (err: any) {
    console.error('Change Password Error:', err);
    if (err.code === 'ERR_JWT_EXPIRED') {
        return NextResponse.json({ error: 'Session expired, please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}


