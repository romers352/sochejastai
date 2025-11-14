import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import pool from "../../../../lib/db";

const dataPath = path.join(process.cwd(), "data", "partner_logos.json");

async function readData(): Promise<{ logos: string[] }> {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    return { logos: Array.isArray(json.logos) ? json.logos : [] };
  } catch {
    try {
      const [rows] = await pool.query("SELECT src FROM partner_logos ORDER BY id ASC");
      const logos = Array.isArray(rows) ? (rows as any[]).map((r) => String(r.src)).filter(Boolean) : [];
      return { logos };
    } catch {
      return { logos: [] };
    }
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin")?.value === "1";
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await readData();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin")?.value === "1";
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const logos = Array.isArray(body?.logos) ? body.logos.filter((s: any) => typeof s === "string" && s.trim()) : null;
    if (!logos) return NextResponse.json({ error: "Invalid payload: expected { logos: [] }" }, { status: 400 });
    try {
      await fs.mkdir(path.dirname(dataPath), { recursive: true });
      await fs.writeFile(dataPath, JSON.stringify({ logos }, null, 2), "utf-8");
      return NextResponse.json({ ok: true, logos });
    } catch (err: any) {
      try {
        await pool.execute(
          "CREATE TABLE IF NOT EXISTS partner_logos (id INT AUTO_INCREMENT PRIMARY KEY, src VARCHAR(255) NOT NULL)"
        );
        await pool.execute("TRUNCATE TABLE partner_logos");
        for (const src of logos) {
          await pool.execute("INSERT INTO partner_logos (src) VALUES (?)", [src]);
        }
        return NextResponse.json({ ok: true, logos });
      } catch (dbErr) {
        return NextResponse.json({ error: "Failed to persist partner logos" }, { status: 500 });
      }
    }
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}