import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { promises as fs } from "fs";
import path from "path";
import pool from "../../../lib/db";

const dataPath = path.join(process.cwd(), "data", "partner_logos.json");

export async function GET() {
  // Prefer database first (production writes go to DB). Fallback to JSON file if DB fails.
  try {
    const [rows] = await pool.query("SELECT src FROM partner_logos ORDER BY id ASC");
    const logos = Array.isArray(rows) ? (rows as any[]).map((r) => String(r.src)).filter(Boolean) : [];
    return NextResponse.json({ logos });
  } catch (dbErr) {
    try {
      const buf = await fs.readFile(dataPath, "utf-8");
      const json = JSON.parse(buf || "{}") || {};
      const logos = Array.isArray(json.logos) ? json.logos : [];
      return NextResponse.json({ logos });
    } catch {
      return NextResponse.json({ logos: [] });
    }
  }
}