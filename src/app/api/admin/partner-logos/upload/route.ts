import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import path from "path";
import { promises as fs } from "fs";
import pool from "@/lib/db";
import { savePublicUpload } from "@/lib/uploads";

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  };
  return map[mime] || "";
}

function safeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(req: Request) {
  const adminCookie = req.headers.get("cookie") || "";
  if (!adminCookie.includes("admin=1")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const files = form.getAll("logo") as File[];
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    const urls: string[] = [];
    for (const f of files) {
      if (!f || !f.type?.startsWith("image/")) continue;
      const size = (f as any).size || 0;
      if (size > MAX_BYTES) continue;
      const original = (f as any).name || "logo";
      const ext = path.extname(original) || extFromMime(f.type) || ".bin";
      const base = safeName(path.parse(original).name) || "logo";
      const filename = `${base}-${Date.now()}${ext}`;
      const relPath = path.join("uploads", "partners", filename);
      const buf = Buffer.from(await f.arrayBuffer());
      const src = await savePublicUpload(relPath, buf, f.type || "application/octet-stream");
      urls.push(src);
    }
    if (urls.length === 0) {
      return NextResponse.json({ error: "No valid images" }, { status: 400 });
    }
    // Best-effort: ensure table exists so admin page can persist URLs via its PUT
    try {
      await pool.execute(
        "CREATE TABLE IF NOT EXISTS partner_logos (id INT AUTO_INCREMENT PRIMARY KEY, src VARCHAR(255) NOT NULL)"
      );
    } catch {}
    return NextResponse.json({ ok: true, urls });
  } catch (e) {
    console.error("Partner logo upload failed", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}