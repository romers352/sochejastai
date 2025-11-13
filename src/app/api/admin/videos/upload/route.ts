import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import path from "path";
import pool from "../../../../../lib/db";

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
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
    const allowed = file.type.startsWith("video/");
    const maxBytes = 1024 * 1024 * 1024; // 1GB
    if (!allowed) {
      return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "File too large (max 1GB)" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");
    await fs.mkdir(uploadsDir, { recursive: true });

    const original = (file as any).name || "video";
    const ext = path.extname(original) || extFromMime(file.type) || ".bin";
    const base = slugify(title || path.parse(original).name) || "video";
    const filename = `${base}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Stream the upload to disk to avoid loading the entire file in memory
    const webStream = (file as any).stream?.() || null;
    if (webStream) {
      const nodeStream = Readable.fromWeb(webStream as any);
      await pipeline(nodeStream, createWriteStream(filepath));
    } else {
      // Fallback for environments without Blob.stream
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filepath, buffer);
    }

    const publicSrc = `/uploads/videos/${filename}`;

    // Insert into MySQL
    const [result] = await pool.execute(
      "INSERT INTO videos (title, type, src) VALUES (?, 'file', ?)",
      [title, publicSrc]
    );
    const id = (result as any).insertId;
    return NextResponse.json({ ok: true, id, src: publicSrc });
  } catch (e) {
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
  }
}