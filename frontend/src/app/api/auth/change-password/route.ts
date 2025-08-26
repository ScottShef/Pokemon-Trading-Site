import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/turso';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';

/**
 * Handles PUT requests to /api/auth/change-password
 * This endpoint allows an authenticated user to change their password using Turso database.
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

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // Fetch the user from the database using their ID from the token
    const userResult = await executeQuery(
      'SELECT id, password FROM users WHERE id = ?',
      [authUser.id]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const userPassword = user.password as string;

    if (!userPassword) {
      return NextResponse.json({ error: 'User password not found' }, { status: 404 });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userPassword);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await executeQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, authUser.id]
    );

    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (err: any) {
    console.error('Change Password Error:', err);
    if (err.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ error: 'Session expired, please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}


