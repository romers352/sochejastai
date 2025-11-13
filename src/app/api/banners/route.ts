import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET() {
  // Try selecting extended columns; if table doesn't have them yet, fall back gracefully
  try {
    const [rows] = await pool.query(
      "SELECT id, title, subtitle, bg, bg_wide, bg_square, photo1, photo2, photo3 FROM banners ORDER BY id DESC"
    );
    return NextResponse.json(rows);
  } catch (e) {
    try {
      const [rowsBasic] = await pool.query(
        "SELECT id, title, subtitle, bg FROM banners ORDER BY id DESC"
      );
      // Map basic rows to include fallbacks so admin UI can still show desktop/mobile images
      const mapped = Array.isArray(rowsBasic)
        ? (rowsBasic as any[]).map((r: any) => ({
            ...r,
            bg_wide: r.bg,
            bg_square: r.bg,
            photo1: null,
            photo2: null,
            photo3: null,
          }))
        : [];
      return NextResponse.json(mapped);
    } catch (e2) {
      return NextResponse.json({ error: "Failed to load banners" }, { status: 500 });
    }
  }
}