import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const dataPath = path.join(process.cwd(), "data", "home_cta.json");

async function readFromJson() {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}");
    return json || { photos: null, videos: null, graphics: null };
  } catch {
    return { photos: null, videos: null, graphics: null };
  }
}

export async function GET() {
  // Prefer MySQL; fallback to JSON file
  try {
    const [rows] = await pool.query(
      "SELECT photos, videos, graphics FROM home_cta WHERE id = 1 LIMIT 1"
    );
    const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
    if (row) {
      return NextResponse.json({
        photos: row.photos || null,
        videos: row.videos || null,
        graphics: row.graphics || null,
      });
    }
  } catch {}

  const json = await readFromJson();
  return NextResponse.json(json);
}