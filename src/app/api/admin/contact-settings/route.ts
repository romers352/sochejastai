import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import pool from "@/lib/db";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use only the inner project data directory
const dataPath = path.join(process.cwd(), "data", "contact_settings.json");

type ContactSettings = {
  email: string;
  phone: string;
  hours: string;
};

async function readSettings(): Promise<ContactSettings> {
  // Prefer DB first, fallback to file
  try {
    const [rows] = await pool.query("SELECT email, phone, hours FROM contact_info WHERE id = 1");
    const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
    if (row) return { email: row.email || "", phone: row.phone || "", hours: row.hours || "" };
  } catch {}
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    return {
      email: typeof json.email === "string" ? json.email : "",
      phone: typeof json.phone === "string" ? json.phone : "",
      hours: typeof json.hours === "string" ? json.hours : "",
    };
  } catch {
    return { email: "", phone: "", hours: "" };
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
    const email = typeof body?.email === "string" ? body.email.trim() : null;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
    const hours = typeof body?.hours === "string" ? body.hours.trim() : null;

    if (!email && !phone && !hours) {
      return NextResponse.json({ error: "No fields provided" }, { status: 400 });
    }

    const current = await readSettings();
    const next: ContactSettings = {
      email: email ?? current.email ?? "",
      phone: phone ?? current.phone ?? "",
      hours: hours ?? current.hours ?? "",
    };

    try {
      await fs.mkdir(path.dirname(dataPath), { recursive: true });
      await fs.writeFile(dataPath, JSON.stringify(next, null, 2), "utf-8");
      return NextResponse.json({ ok: true, ...next });
    } catch (err) {
      try {
        await pool.execute(
          "CREATE TABLE IF NOT EXISTS contact_info (id INT UNSIGNED NOT NULL, email VARCHAR(255) NULL, phone VARCHAR(64) NULL, hours VARCHAR(255) NULL, PRIMARY KEY (id))"
        );
        await pool.execute(
          "INSERT INTO contact_info (id, email, phone, hours) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE email=VALUES(email), phone=VALUES(phone), hours=VALUES(hours)",
          [next.email || null, next.phone || null, next.hours || null]
        );
        return NextResponse.json({ ok: true, ...next });
      } catch (dbErr) {
        return NextResponse.json({ error: "Failed to persist contact settings" }, { status: 500 });
      }
    }
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}