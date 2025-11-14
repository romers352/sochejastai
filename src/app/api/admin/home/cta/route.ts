import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { savePublicUpload } from "@/lib/uploads";

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

    const saved: Record<string, string | null> = { photos: null, videos: null, graphics: null };

    async function saveFile(f: File | null, slot: "photos" | "videos" | "graphics") {
      if (!f) return;
      const original = (f as any).name || slot;
      const ext = path.extname(original) || extFromMime(f.type) || ".bin";
      const base = safeName(path.parse(original).name) || slot;
      const filename = `${base}-${Date.now()}-${slot}${ext}`;
      const relPath = path.join("uploads", "home", "cta", filename);
      const buf = Buffer.from(await f.arrayBuffer());
      const publicSrc = await savePublicUpload(relPath, buf, f.type || "application/octet-stream");
      saved[slot] = publicSrc;
    }

    await Promise.all([
      saveFile(photos, "photos"),
      saveFile(videos, "videos"),
      saveFile(graphics, "graphics"),
    ]);

    // Read current from DB first, fallback to JSON to avoid stale overwrites
    let current: { photos: string | null; videos: string | null; graphics: string | null } = {
      photos: null,
      videos: null,
      graphics: null,
    };
    try {
      const [rows] = await pool.query(
        "SELECT photos, videos, graphics FROM home_cta WHERE id = 1 LIMIT 1"
      );
      const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
      if (row) {
        current = {
          photos: row.photos || null,
          videos: row.videos || null,
          graphics: row.graphics || null,
        };
      } else {
        const buf = await fs.readFile(dataPath, "utf-8").catch(() => "");
        const json = buf ? JSON.parse(buf || "{}") || {} : {};
        current = {
          photos: json.photos || null,
          videos: json.videos || null,
          graphics: json.graphics || null,
        };
      }
    } catch {
      try {
        const buf = await fs.readFile(dataPath, "utf-8");
        const json = JSON.parse(buf || "{}") || {};
        current = {
          photos: json.photos || null,
          videos: json.videos || null,
          graphics: json.graphics || null,
        };
      } catch {}
    }

    const next = {
      photos: saved.photos || current.photos || null,
      videos: saved.videos || current.videos || null,
      graphics: saved.graphics || current.graphics || null,
    };

    // Write to JSON file and ALSO upsert into DB to keep GET in sync
    try {
      await fs.writeFile(dataPath, JSON.stringify(next, null, 2), "utf-8");
    } catch (err) {
      // Ignore file write errors; we'll still try DB below
    }

    try {
      await pool.execute(
        "CREATE TABLE IF NOT EXISTS home_cta (id INT UNSIGNED NOT NULL, photos VARCHAR(1024) NULL, videos VARCHAR(1024) NULL, graphics VARCHAR(1024) NULL, PRIMARY KEY (id))"
      );
      await pool.execute(
        "INSERT INTO home_cta (id, photos, videos, graphics) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE photos=VALUES(photos), videos=VALUES(videos), graphics=VALUES(graphics)",
        [next.photos, next.videos, next.graphics]
      );
    } catch (dbErr) {
      // If DB fails, still return success so file-based environments work
    }

    return NextResponse.json({ ok: true, ...next });
  } catch (e) {
    console.error("CTA upload failed", e);
    return NextResponse.json({ error: "Failed to upload CTA images" }, { status: 500 });
  }
}