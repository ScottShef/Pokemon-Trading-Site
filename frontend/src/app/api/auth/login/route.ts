import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/turso";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await executeQuery(
      "SELECT id, username, email, password, reputation, review_count FROM users WHERE email = ?",
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0] as any;

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password as string);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ 
      userId: user.id,
      username: user.username,
      email: user.email 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    // Return user info (without password) and token
    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      reputation: user.reputation,
      review_count: user.review_count
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