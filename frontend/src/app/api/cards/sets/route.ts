import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/turso";

export async function GET() {
  try {
    // Query local database for Pokemon sets
    const result = await executeQuery(
      `SELECT 
        id,
        name,
        series,
        release_date,
        card_count
      FROM pokemon_sets
      ORDER BY release_date DESC, name ASC`,
      []
    );

    // Transform the data for frontend
    const sets = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      series: row.series,
      releaseDate: row.release_date,
      cardCount: row.card_count
    }));

    return NextResponse.json({
      sets,
      total: sets.length
    });

  } catch (error) {
    console.error("Pokemon sets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Pokemon sets" },
      { status: 500 }
    );
  }
}
