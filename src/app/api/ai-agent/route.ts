import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use only the inner project data directory
const dataPath = path.join(process.cwd(), "data", "ai_agent.json");

type AiAgentSettings = { url: string };

async function readSettings(): Promise<AiAgentSettings> {
  // Prefer DB first, fallback to file
  try {
    const [rows] = await pool.query("SELECT url FROM ai_agent WHERE id = 1");
    const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
    if (row && row.url) return { url: String(row.url) };
  } catch {}
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    return { url: typeof json.url === "string" ? json.url : "https://example.com/ai" };
  } catch {
    return { url: "https://example.com/ai" };
  }
}

export async function GET() {
  const data = await readSettings();
  return NextResponse.json(data);
}