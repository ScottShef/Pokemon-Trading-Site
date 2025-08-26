import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/turso";
import bcrypt from "bcryptjs";

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
    const result = await executeQuery(
      `INSERT INTO users (username, email, password, reputation, review_count) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, 100, 0]
    );

    return NextResponse.json(
      { 
        message: "User registered successfully",
        userId: result.lastInsertRowid
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
