import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function POST(req: Request) {
  const adminCookie = req.headers.get("cookie") || "";
  if (!adminCookie.includes("admin=1")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { title, youtubeId } = body || {};
    if (!title || !youtubeId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const [result] = await pool.execute(
      "INSERT INTO videos (title, type, youtubeId) VALUES (?, 'youtube', ?)",
      [title, youtubeId]
    );
    const id = (result as any).insertId;
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save video" }, { status: 500 });
  }
}