import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";

const dataPath = path.join(process.cwd(), "data", "partner_logos.json");

async function filterExistingLocal(logos: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const src of logos) {
    if (typeof src !== "string" || !src.trim()) continue;
    if (src.startsWith("/")) {
      const rel = src.replace(/^\/+/, "");
      const abs = path.join(process.cwd(), "public", rel);
      try {
        await fs.access(abs);
        out.push(src);
      } catch {
        // Skip missing local files to avoid 404s in UI
      }
    } else {
      out.push(src);
    }
  }
  return out;
}

export async function GET() {
  // Prefer database first (production writes go to DB). Fallback to JSON file if DB fails.
  try {
    const [rows] = await pool.query("SELECT src FROM partner_logos ORDER BY id ASC");
    const rowsLogos = Array.isArray(rows) ? (rows as any[]).map((r) => String(r.src)).filter(Boolean) : [];
    const logos = await filterExistingLocal(rowsLogos);
    return NextResponse.json({ logos });
  } catch (dbErr) {
    try {
      const buf = await fs.readFile(dataPath, "utf-8");
      const json = JSON.parse(buf || "{}") || {};
      const jsonLogos = Array.isArray(json.logos) ? json.logos : [];
      const logos = await filterExistingLocal(jsonLogos);
      return NextResponse.json({ logos });
    } catch {
      return NextResponse.json({ logos: [] });
    }
  }
}