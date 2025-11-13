import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "home_cta.json");

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
    const photos = form.get("photos") as File | null; // left CTA (Photos)
    const videos = form.get("videos") as File | null; // middle CTA (Videos)
    const graphics = form.get("graphics") as File | null; // right CTA (Graphics)

    const allow = (f: File | null) => !f || (f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
    if (!allow(photos) || !allow(videos) || !allow(graphics)) {
      return NextResponse.json({ error: "Only images up to 10MB are allowed" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "home", "cta");
    await fs.mkdir(uploadsDir, { recursive: true });

    const saved: Record<string, string | null> = { photos: null, videos: null, graphics: null };

    async function saveFile(f: File | null, slot: "photos" | "videos" | "graphics") {
      if (!f) return;
      const original = (f as any).name || slot;
      const ext = path.extname(original) || extFromMime(f.type) || ".bin";
      const base = safeName(path.parse(original).name) || slot;
      const filename = `${base}-${Date.now()}-${slot}${ext}`;
      const filepath = path.join(uploadsDir, filename);
      const buf = Buffer.from(await f.arrayBuffer());
      await fs.writeFile(filepath, buf);
      saved[slot] = `/uploads/home/cta/${filename}`;
    }

    await Promise.all([
      saveFile(photos, "photos"),
      saveFile(videos, "videos"),
      saveFile(graphics, "graphics"),
    ]);

    // Merge into existing JSON (if any)
    let current: Record<string, any> = {};
    try {
      const buf = await fs.readFile(dataPath, "utf-8");
      current = JSON.parse(buf || "{}") || {};
    } catch {}

    const next = {
      photos: saved.photos || current.photos || null,
      videos: saved.videos || current.videos || null,
      graphics: saved.graphics || current.graphics || null,
    };

    await fs.writeFile(dataPath, JSON.stringify(next, null, 2), "utf-8");

    return NextResponse.json({ ok: true, ...next });
  } catch (e) {
    console.error("CTA upload failed", e);
    return NextResponse.json({ error: "Failed to upload CTA images" }, { status: 500 });
  }
}