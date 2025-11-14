import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { promises as fs } from "fs";
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

export async function POST(req: Request) {
  const adminCookie = req.headers.get("cookie") || "";
  if (!isAuthenticatedAdminFromCookieHeader(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const file = form.get("icon") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    if ((file as any).size > MAX_BYTES) return NextResponse.json({ error: "File too large" }, { status: 400 });

    const ext = extFromMime(file.type) || path.extname(file.name) || ".jpg";
    const baseName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9_-]/g, "-");
    const filename = `${baseName}-${Date.now()}${ext}`;
    const relPath = path.join("uploads", "services", filename);
    const buf = Buffer.from(await file.arrayBuffer());
    const src = await savePublicUpload(relPath, buf, file.type || "application/octet-stream");

    return NextResponse.json({ ok: true, src });
  } catch (e) {
    console.error("Service icon upload failed", e);
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}