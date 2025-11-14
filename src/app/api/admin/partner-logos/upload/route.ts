import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import path from "path";
import { isAuthenticatedAdminFromCookieHeader } from "@/lib/auth";
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!isAuthenticatedAdminFromCookieHeader(cookieHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const files = form.getAll("logo") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    const MAX_BYTES = 10 * 1024 * 1024; // 10MB per file
    const urls: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      const type = file.type || "";
      if (!type.startsWith("image/")) {
        return NextResponse.json({ error: "Invalid file type (image only)" }, { status: 400 });
      }
      const size = (file as any).size ?? 0;
      if (size > MAX_BYTES) {
        return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
      }

      const originalName = (file as any).name || "logo";
      const ext = extFromMime(type) || path.extname(originalName) || ".jpg";
      const base = slugify(path.basename(originalName, path.extname(originalName)) || "logo") || "logo";
      const filename = `${base}-${Date.now()}${ext}`;
      const relPath = path.join("uploads", "partner-logos", filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      const publicSrc = await savePublicUpload(relPath, buffer, type || "application/octet-stream");
      urls.push(publicSrc);
    }

    return NextResponse.json({ ok: true, urls });
  } catch (e: any) {
    const message = e?.message ? String(e.message) : "Failed to upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}