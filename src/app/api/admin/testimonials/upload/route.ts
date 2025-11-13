import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import pool from "../../../../../lib/db";
import { isAuthenticatedAdminFromCookieHeader } from "@/lib/auth";

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

export async function POST(req: Request) {
  const adminCookie = req.headers.get("cookie") || "";
  if (!isAuthenticatedAdminFromCookieHeader(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const file = form.get("avatar") as File | null;
    const testimonialId = Number(form.get("testimonial_id") || 0);
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    if ((file as any).size > MAX_BYTES) return NextResponse.json({ error: "File too large" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buf = Buffer.from(bytes);
    const ext = extFromMime(file.type) || path.extname(file.name) || ".jpg";
    const baseName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9_-]/g, "-");
    const filename = `${baseName}-${Date.now()}${ext}`;
    const relPath = path.join("uploads", "testimonials", filename);
    const outPath = path.join(process.cwd(), "public", relPath);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, buf);
    const src = `/${relPath.replace(/\\/g, "/")}`;

    if (testimonialId) {
      await pool.execute("UPDATE testimonials SET avatar = ? WHERE id = ?", [src, testimonialId]);
    }

    return NextResponse.json({ ok: true, src });
  } catch (e) {
    console.error("Testimonial avatar upload failed", e);
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}