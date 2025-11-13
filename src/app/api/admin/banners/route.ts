import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function POST(req: Request) {
  const adminCookie = req.headers.get("cookie") || "";
  if (!adminCookie.includes("admin=1")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const title = String((body || {}).title || "").trim();
    const subtitle = String((body || {}).subtitle || "").trim();
    const bg = String((body || {}).bg || "").trim();
    if (!bg) {
      return NextResponse.json({ error: "Missing background" }, { status: 400 });
    }
    await pool.execute(
      "INSERT INTO banners (title, subtitle, bg) VALUES (?, ?, ?)",
      [title || "", subtitle || "", bg]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save banner" }, { status: 500 });
  }
}