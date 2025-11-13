import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { isAuthenticatedAdminFromCookieHeader } from "@/lib/auth";

export async function POST(req: Request) {
  const adminCookie = req.headers.get("cookie") || "";
  if (!isAuthenticatedAdminFromCookieHeader(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { name, role, quote, initials, rating, avatar } = body || {};
    if (!name || !role || !quote) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const [result] = await pool.execute(
      "INSERT INTO testimonials (name, role, quote, initials, rating, avatar) VALUES (?, ?, ?, ?, ?, ?)",
      [name, role, quote, initials || null, rating ?? 5, avatar || null]
    );
    const id = (result as any).insertId;
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save testimonial" }, { status: 500 });
  }
}