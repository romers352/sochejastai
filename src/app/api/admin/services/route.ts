import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { isAuthenticatedAdminFromCookieHeader } from "@/lib/auth";

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!isAuthenticatedAdminFromCookieHeader(cookieHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { title, description, icon } = body || {};
    if (!title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const [result] = await pool.execute(
      "INSERT INTO services (title, description, icon) VALUES (?, ?, ?)",
      [title, description, icon || null]
    );
    const id = (result as any).insertId;
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save service" }, { status: 500 });
  }
}

export async function GET() {
  // Optional: expose admin list too
  try {
    const [rows] = await pool.query(
      "SELECT id, title, description, icon FROM services ORDER BY id ASC"
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}