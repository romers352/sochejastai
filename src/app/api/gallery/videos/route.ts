import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, type, youtubeId, src FROM videos ORDER BY id DESC"
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: "Failed to load videos" }, { status: 500 });
  }
}