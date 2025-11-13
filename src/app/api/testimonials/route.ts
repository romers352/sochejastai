import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, role, initials, quote, rating, avatar FROM testimonials ORDER BY id DESC"
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: "Failed to load testimonials" }, { status: 500 });
  }
}