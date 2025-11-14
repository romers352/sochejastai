import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import pool from "../../../../lib/db";

const dataPath = path.join(process.cwd(), "data", "legal.json");

type LegalPayload = { privacy_html?: string; terms_html?: string };

async function readFromFile(): Promise<{ privacy_html: string; terms_html: string }> {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    return {
      privacy_html: typeof json.privacy_html === "string" ? json.privacy_html : "",
      terms_html: typeof json.terms_html === "string" ? json.terms_html : "",
    };
  } catch {
    return { privacy_html: "", terms_html: "" };
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const hasLegacyAdmin = cookieStore.get("admin")?.value === "1";
  const hasJwt = !!cookieStore.get("admin-token")?.value;
  if (!(hasLegacyAdmin || hasJwt)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Prefer DB first, fallback to file
  try {
    const [rows] = await pool.query("SELECT privacy_html, terms_html FROM legal WHERE id = 1");
    const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
    if (row) {
      return NextResponse.json({
        privacy_html: row.privacy_html || "",
        terms_html: row.terms_html || "",
      });
    }
  } catch {}

  const data = await readFromFile();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const hasLegacyAdmin = cookieStore.get("admin")?.value === "1";
  const hasJwt = !!cookieStore.get("admin-token")?.value;
  if (!(hasLegacyAdmin || hasJwt)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as LegalPayload;
    const privacy_html = typeof body?.privacy_html === "string" ? body.privacy_html : "";
    const terms_html = typeof body?.terms_html === "string" ? body.terms_html : "";

    // Try file write first
    try {
      await fs.mkdir(path.dirname(dataPath), { recursive: true });
      await fs.writeFile(dataPath, JSON.stringify({ privacy_html, terms_html }, null, 2), "utf-8");
      return NextResponse.json({ ok: true, privacy_html, terms_html });
    } catch (err) {
      // Fallback to DB in read-only environments
      try {
        await pool.execute(
          "CREATE TABLE IF NOT EXISTS legal (id INT UNSIGNED NOT NULL, privacy_html MEDIUMTEXT NULL, terms_html MEDIUMTEXT NULL, PRIMARY KEY (id))"
        );
        await pool.execute(
          "INSERT INTO legal (id, privacy_html, terms_html) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE privacy_html=VALUES(privacy_html), terms_html=VALUES(terms_html)",
          [privacy_html, terms_html]
        );
        return NextResponse.json({ ok: true, privacy_html, terms_html });
      } catch (dbErr) {
        return NextResponse.json({ error: "Failed to persist legal content" }, { status: 500 });
      }
    }
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}