import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { promises as fs } from "fs";
import path from "path";
import pool from "../../../../../lib/db";

async function tryDeleteFile(publicPath: string | null | undefined) {
  if (!publicPath) return;
  if (!publicPath.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  try {
    await fs.unlink(filePath);
  } catch (e) {
    // ignore missing file
  }
}

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
    // Attempt to read extended columns; if not present, fall back
    let row: any = null;
    try {
      const [rows] = await pool.execute(
        "SELECT bg, bg_wide, bg_square, photo1, photo2, photo3 FROM banners WHERE id = ?",
        [idNum]
      );
      row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
    } catch (err) {
      const [rowsBasic] = await pool.execute(
        "SELECT bg FROM banners WHERE id = ?",
        [idNum]
      );
      row = Array.isArray(rowsBasic) && rowsBasic.length ? (rowsBasic as any)[0] : null;
    }

    // Delete any uploaded files referenced
    await Promise.all([
      tryDeleteFile(row?.bg),
      tryDeleteFile(row?.bg_wide),
      tryDeleteFile(row?.bg_square),
      tryDeleteFile(row?.photo1),
      tryDeleteFile(row?.photo2),
      tryDeleteFile(row?.photo3),
    ]);

    await pool.execute("DELETE FROM banners WHERE id = ?", [idNum]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}