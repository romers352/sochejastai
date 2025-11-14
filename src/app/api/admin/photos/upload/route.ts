import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";
import { savePublicUpload } from "@/lib/uploads";

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[mime] || "";
}

function slugify(input: string): string {
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
    const title = String(form.get("title") || "").trim();
    const file = form.get("file") as File | null;

    if (!title || !file) {
      return NextResponse.json({ error: "Missing title or file" }, { status: 400 });
    }

    // Validation
    const allowed = file.type.startsWith("image/");
    const maxBytes = 4 * 1024 * 1024; // 4MB
    if (!allowed) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });
    }

    const original = (file as any).name || "image";
    const ext = path.extname(original) || extFromMime(file.type) || ".bin";
    const base = slugify(title || path.parse(original).name) || "photo";
    const filename = `${base}-${Date.now()}${ext}`;
    const relPath = path.join("uploads", "photos", filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicSrc = await savePublicUpload(relPath, buffer, file.type || "application/octet-stream");

    // Ensure table exists and insert into MySQL
    await pool.execute(
      "CREATE TABLE IF NOT EXISTS photos (id INT UNSIGNED NOT NULL AUTO_INCREMENT, title VARCHAR(255) NOT NULL, src VARCHAR(1024) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), INDEX (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    const [result] = await pool.execute(
      "INSERT INTO photos (title, src) VALUES (?, ?)",
      [title, publicSrc]
    );
    const id = (result as any).insertId;
    return NextResponse.json({ ok: true, id, src: publicSrc });
  } catch (e: any) {
    const message = e?.message ? String(e.message) : "Failed to upload photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}