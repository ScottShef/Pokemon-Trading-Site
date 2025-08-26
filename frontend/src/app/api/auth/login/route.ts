import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/turso";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
  try {
    const { email, identifier, password } = await request.json();

    // Accept either 'email', 'identifier', or both
    const loginIdentifier = email || identifier;

    // Validate input
    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    // Find user by email OR username
    const result = await executeQuery(
      `SELECT id, username, email, password, reputation, review_count 
       FROM users 
       WHERE email = ? OR username = ?`,
      [loginIdentifier, loginIdentifier]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0] as any;

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password as string);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    // Create JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ 
      userId: String(user.id),
      username: String(user.username),
      email: String(user.email)
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    // Return user info (without password) and token - convert BigInt values
    const userProfile = {
      id: String(user.id),
      username: String(user.username),
      email: String(user.email),
      reputation: Number(user.reputation),
      review_count: Number(user.review_count)
    };

    return NextResponse.json({
      message: "Login successful",
      user: userProfile,
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}