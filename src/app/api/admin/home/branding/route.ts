import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";
import { savePublicUpload } from "@/lib/uploads";

const dataPath = path.join(process.cwd(), "data", "branding.json");

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
    const navbar = form.get("navbar") as File | null;
    const footer = form.get("footer") as File | null;
    const favicon = form.get("favicon") as File | null;

    const allow = (f: File | null) => !f || (f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
    if (!allow(navbar) || !allow(footer) || !allow(favicon)) {
      return NextResponse.json({ error: "Only images up to 10MB are allowed" }, { status: 400 });
    }

    const saved: Record<string, string | null> = { navbar: null, footer: null, favicon: null };

    async function saveFile(f: File | null, slot: "navbar" | "footer" | "favicon") {
      if (!f) return;
      const original = (f as any).name || slot;
      const ext = path.extname(original) || extFromMime(f.type) || ".bin";
      const base = safeName(path.parse(original).name) || slot;
      const filename = `${base}-${Date.now()}-${slot}${ext}`;
      const relPath = path.join("uploads", "home", "branding", filename);
      const buf = Buffer.from(await f.arrayBuffer());
      const publicSrc = await savePublicUpload(relPath, buf, f.type || "application/octet-stream");
      saved[slot] = publicSrc;
    }

    await Promise.all([
      saveFile(navbar, "navbar"),
      saveFile(footer, "footer"),
      saveFile(favicon, "favicon"),
    ]);

    let current: Record<string, any> = {};
    try {
      const buf = await fs.readFile(dataPath, "utf-8");
      current = JSON.parse(buf || "{}") || {};
    } catch {}

    const next = {
      navbar: saved.navbar || current.navbar || null,
      footer: saved.footer || current.footer || null,
      favicon: saved.favicon || current.favicon || null,
    };

    try {
      await fs.mkdir(path.dirname(dataPath), { recursive: true });
      await fs.writeFile(dataPath, JSON.stringify(next, null, 2), "utf-8");
    } catch (err: any) {
      // Fallback to DB in read-only environments
      try {
        await pool.execute(
          "CREATE TABLE IF NOT EXISTS branding (id INT PRIMARY KEY, navbar VARCHAR(255) NULL, footer VARCHAR(255) NULL, favicon VARCHAR(255) NULL)"
        );
        await pool.execute(
          "INSERT INTO branding (id, navbar, footer, favicon) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE navbar=VALUES(navbar), footer=VALUES(footer), favicon=VALUES(favicon)",
          [next.navbar || null, next.footer || null, next.favicon || null]
        );
      } catch (dbErr) {
        console.error("Branding DB save failed", dbErr);
        return NextResponse.json({ error: "Failed to persist branding settings" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, ...next });
  } catch (e) {
    console.error("Branding upload failed", e);
    return NextResponse.json({ error: "Failed to upload branding images" }, { status: 500 });
  }
}