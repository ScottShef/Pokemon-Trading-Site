import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/turso";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserByEmail = await executeQuery(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUserByEmail.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const existingUserByUsername = await executeQuery(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUserByUsername.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    await executeQuery(
      `INSERT INTO users (username, email, password, reputation, review_count) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, 100, 0]
    );

    // Get the created user
    const newUser = await executeQuery(
      "SELECT id, username, email, reputation, review_count FROM users WHERE email = ?",
      [email]
    );

    if (newUser.rows.length === 0) {
      throw new Error("Failed to retrieve created user");
    }

    const user = newUser.rows[0] as any;

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

    // Return user info and token - ensure all values are JSON-serializable
    const userProfile = {
      id: String(user.id),
      username: String(user.username),
      email: String(user.email),
      reputation: Number(user.reputation),
      review_count: Number(user.review_count)
    };

    return NextResponse.json(
      { 
        message: "User registered successfully",
        user: userProfile,
        token
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
