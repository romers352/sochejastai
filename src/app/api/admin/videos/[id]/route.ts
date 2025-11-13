import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { promises as fs } from "fs";
import path from "path";
import pool from "../../../../../lib/db";

export async function DELETE(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const adminCookie = req.headers.get("cookie") || "";
  if (!adminCookie.includes("admin=1")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idNum = Number(params.id);
  if (!idNum) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const [rows] = await pool.execute("SELECT type, src FROM videos WHERE id = ?", [idNum]);
    const row = Array.isArray(rows) && rows.length ? (rows as any)[0] as { type: string; src?: string | null } : null;
    const type = row?.type || "youtube";
    const src = row?.src || null;
    if (type === "file" && src && src.startsWith("/uploads/videos/")) {
      const filePath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
      try {
        await fs.unlink(filePath);
      } catch (e) {
        // ignore missing file
      }
    }
    await pool.execute("DELETE FROM videos WHERE id = ?", [idNum]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}