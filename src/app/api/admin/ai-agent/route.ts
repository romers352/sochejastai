import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
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
    if (row) return { url: String(row.url || "") };
  } catch {}
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    return { url: typeof json.url === "string" ? json.url : "" };
  } catch {
    return { url: "" };
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const hasLegacyAdmin = cookieStore.get("admin")?.value === "1";
  const hasJwt = !!cookieStore.get("admin-token")?.value;
  if (!(hasLegacyAdmin || hasJwt)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await readSettings();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const hasLegacyAdmin = cookieStore.get("admin")?.value === "1";
  const hasJwt = !!cookieStore.get("admin-token")?.value;
  if (!(hasLegacyAdmin || hasJwt)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const url = typeof body?.url === "string" ? body.url.trim() : null;
    if (!url) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    // Try file save, fallback to DB in read-only env
    try {
      await fs.mkdir(path.dirname(dataPath), { recursive: true });
      await fs.writeFile(dataPath, JSON.stringify({ url }, null, 2), "utf-8");
      return NextResponse.json({ ok: true, url });
    } catch (err) {
      try {
        await pool.execute(
          "CREATE TABLE IF NOT EXISTS ai_agent (id INT UNSIGNED NOT NULL, url VARCHAR(1024) NOT NULL, PRIMARY KEY (id))"
        );
        await pool.execute(
          "INSERT INTO ai_agent (id, url) VALUES (1, ?) ON DUPLICATE KEY UPDATE url=VALUES(url)",
          [url]
        );
        return NextResponse.json({ ok: true, url });
      } catch (dbErr) {
        return NextResponse.json({ error: "Failed to persist AI Agent settings" }, { status: 500 });
      }
    }
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}