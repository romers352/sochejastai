import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import pool from "../../../../../lib/db";

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
    const subtitle = String(form.get("subtitle") || "").trim();
    // Expect two files: wide (1920x720) and square (1080x1080)
    const fileWide = form.get("file_wide") as File | null;
    const fileSquare = form.get("file_square") as File | null;

    if (!fileWide || !fileSquare) {
      return NextResponse.json({ error: "Both files are required: wide (1920×720) and square (1080×1080)" }, { status: 400 });
    }

    // Validation
    const originalWide = (fileWide as any).name || "wide";
    const extWide = path.extname(originalWide).toLowerCase();
    const originalSquare = (fileSquare as any).name || "square";
    const extSquare = path.extname(originalSquare).toLowerCase();
    const allowedExts = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
    const isTypeImageWide = !!fileWide.type && fileWide.type.startsWith("image/");
    const isExtImageWide = allowedExts.has(extWide);
    const isTypeImageSquare = !!fileSquare.type && fileSquare.type.startsWith("image/");
    const isExtImageSquare = allowedExts.has(extSquare);
    const allowedWide = isTypeImageWide || isExtImageWide;
    const allowedSquare = isTypeImageSquare || isExtImageSquare;
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (!allowedWide || !allowedSquare) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    if (fileWide.size > maxBytes || fileSquare.size > maxBytes) {
      return NextResponse.json({ error: "File too large (max 10MB each)" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "banners");
    await fs.mkdir(uploadsDir, { recursive: true });

    const base = slugify(title || path.parse(originalWide).name) || "banner";
    const ts = Date.now();

    // Prepare buffers
    const bufWide = Buffer.from(await fileWide.arrayBuffer());
    const bufSquare = Buffer.from(await fileSquare.arrayBuffer());

    // Resolution is flexible; no strict dimension validation required.

    const extOutWide = extWide || extFromMime(fileWide.type) || ".bin";
    const extOutSquare = extSquare || extFromMime(fileSquare.type) || ".bin";
    const filenameWide = `${base}-${ts}-wide${extOutWide}`;
    const filenameSquare = `${base}-${ts}-square${extOutSquare}`;
    const filepathWide = path.join(uploadsDir, filenameWide);
    const filepathSquare = path.join(uploadsDir, filenameSquare);

    await fs.writeFile(filepathWide, bufWide);
    await fs.writeFile(filepathSquare, bufSquare);

    const publicSrcWide = `/uploads/banners/${filenameWide}`;
    const publicSrcSquare = `/uploads/banners/${filenameSquare}`;

    // Insert into MySQL: store image path in `bg`
    // Insert with new columns; alter table if needed
    try {
      const [result] = await pool.execute(
        "INSERT INTO banners (title, subtitle, bg, bg_wide, bg_square) VALUES (?, ?, ?, ?, ?)",
        [title || "", subtitle || "", publicSrcWide, publicSrcWide, publicSrcSquare]
      );
      const id = (result as any).insertId;
      return NextResponse.json({ ok: true, id, wide: publicSrcWide, square: publicSrcSquare });
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
        await pool.query("ALTER TABLE banners ADD COLUMN bg_wide VARCHAR(255) NULL, ADD COLUMN bg_square VARCHAR(255) NULL");
        const [result2] = await pool.execute(
          "INSERT INTO banners (title, subtitle, bg, bg_wide, bg_square) VALUES (?, ?, ?, ?, ?)",
          [title || "", subtitle || "", publicSrcWide, publicSrcWide, publicSrcSquare]
        );
        const id2 = (result2 as any).insertId;
        return NextResponse.json({ ok: true, id: id2, wide: publicSrcWide, square: publicSrcSquare });
      }
      console.error("Banner insert failed", err);
      return NextResponse.json({ error: "Failed to save banner" }, { status: 500 });
    }
  } catch (e) {
    console.error("Banner upload failed", e);
    return NextResponse.json({ error: "Failed to upload banner" }, { status: 500 });
  }
}