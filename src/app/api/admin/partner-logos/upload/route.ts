import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { promises as fs } from "fs";
import path from "path";
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
    const files = (form.getAll("logo") as any[])
      .concat(form.getAll("logos") as any[])
      .filter((f) => f && typeof f === "object" && typeof (f as File).arrayBuffer === "function") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const urls: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
        // Skip invalid files silently; only process valid images up to 10MB
        continue;
      }
      const original = (file as any).name || "logo";
      const ext = path.extname(original) || extFromMime(file.type) || ".bin";
      const base = safeName(path.parse(original).name) || "logo";
      const filename = `${base}-${Date.now()}${ext}`;
      const relPath = path.join("uploads", "partners", filename);
      const buf = Buffer.from(await file.arrayBuffer());
      const publicSrc = await savePublicUpload(relPath, buf, file.type || "application/octet-stream");
      urls.push(publicSrc);
    }

    if (!urls.length) {
      return NextResponse.json({ error: "No valid image files uploaded" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, urls, src: urls[0] });
  } catch (e) {
    console.error("Partner logo upload failed", e);
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}