import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { promises as fs } from "fs";
import path from "path";
import pool from "../../../../../lib/db";
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
    const bannerIdRaw = form.get("banner_id");
    const bannerId = Number(bannerIdRaw);
    const photo1 = form.get("photo1") as File | null;
    const photo2 = form.get("photo2") as File | null;
    const photo3 = form.get("photo3") as File | null;

    if (!bannerId || Number.isNaN(bannerId)) {
      return NextResponse.json({ error: "Invalid banner_id" }, { status: 400 });
    }
    if (!photo1 && !photo2 && !photo3) {
      return NextResponse.json({ error: "Provide at least one photo" }, { status: 400 });
    }

    const allow = (f: File | null) => !f || (f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
    if (!allow(photo1) || !allow(photo2) || !allow(photo3)) {
      return NextResponse.json({ error: "Only images up to 10MB are allowed" }, { status: 400 });
    }

    const saved: Record<string, string> = {};
    async function saveFile(f: File | null, slot: "photo1" | "photo2" | "photo3") {
      if (!f) return;
      const original = (f as any).name || slot;
      const ext = path.extname(original) || extFromMime(f.type) || ".bin";
      const base = safeName(path.parse(original).name) || slot;
      const filename = `${base}-${Date.now()}-${slot}${ext}`;
      const relPath = path.join("uploads", "banners", "photos", filename);
      const buf = Buffer.from(await f.arrayBuffer());
      const publicSrc = await savePublicUpload(relPath, buf, f.type || "application/octet-stream");
      saved[slot] = publicSrc;
    }

    await Promise.all([saveFile(photo1, "photo1"), saveFile(photo2, "photo2"), saveFile(photo3, "photo3")]);

    // Build dynamic update set for provided photos only
    const fields = Object.keys(saved);
    if (fields.length === 0) {
      return NextResponse.json({ error: "No files saved" }, { status: 400 });
    }

    const setClause = fields.map((k) => `${k} = ?`).join(", ");
    const values = fields.map((k) => (saved as any)[k]);

    try {
      await pool.execute(`UPDATE banners SET ${setClause} WHERE id = ?`, [...values, bannerId]);
      return NextResponse.json({ ok: true, banner_id: bannerId, ...saved });
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
        await pool.query("ALTER TABLE banners ADD COLUMN photo1 VARCHAR(255) NULL, ADD COLUMN photo2 VARCHAR(255) NULL, ADD COLUMN photo3 VARCHAR(255) NULL");
        await pool.execute(`UPDATE banners SET ${setClause} WHERE id = ?`, [...values, bannerId]);
        return NextResponse.json({ ok: true, banner_id: bannerId, ...saved });
      }
      console.error("Banner photos update failed", err);
      return NextResponse.json({ error: "Failed to save banner photos" }, { status: 500 });
    }
  } catch (e) {
    console.error("Banner photos upload failed", e);
    return NextResponse.json({ error: "Failed to upload banner photos" }, { status: 500 });
  }
}