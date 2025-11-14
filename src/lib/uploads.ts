
import { promises as fs } from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { Readable } from "stream";

function toPublicUrl(relPath: string): string {
  const clean = relPath.replace(/\\+/g, "/");
  return clean.startsWith("/") ? clean : `/${clean}`;
}

function isReadOnlyFsError(err: any): boolean {
  const msg = String(err?.message || "");
  return msg.includes("read-only") || msg.includes("EROFS") || process.env.VERCEL === "1";
}

export async function savePublicUpload(relPath: string, buffer: Buffer, contentType: string): Promise<string> {
  const absPath = path.join(process.cwd(), "public", relPath);
  const preferBlob = process.env.VERCEL === "1";

  // In Vercel prod, write to Blob first to ensure public availability
  if (preferBlob) {
    const cleanRel = relPath.replace(/^\/+/, "");
    try {
      const { url } = await put(cleanRel, buffer, {
        access: "public",
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return url;
    } catch (blobErr: any) {
      const msg = String(blobErr?.message || "Blob upload failed");
      throw new Error(
        `Blob upload failed: ${msg}. Link a Vercel Blob store or set BLOB_READ_WRITE_TOKEN.`
      );
    }
  }

  // Local/dev: write to public folder; fallback to Blob if read-only
  try {
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, buffer);
    return toPublicUrl(relPath);
  } catch (err) {
    if (!isReadOnlyFsError(err)) throw err;
    const cleanRel = relPath.replace(/^\/+/, "");
    try {
      const { url } = await put(cleanRel, buffer, {
        access: "public",
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return url;
    } catch (blobErr: any) {
      const msg = String(blobErr?.message || "Blob upload failed");
      throw new Error(
        `Blob upload failed: ${msg}. Link a Vercel Blob store to this project or set BLOB_READ_WRITE_TOKEN.`
      );
    }
  }
}

export async function savePublicUploadStream(relPath: string, webStream: ReadableStream | null, fallbackBuffer: Buffer | null, contentType: string): Promise<string> {
  const absPath = path.join(process.cwd(), "public", relPath);
  const preferBlob = process.env.VERCEL === "1";

  if (preferBlob) {
    const cleanRel = relPath.replace(/^\/+/, "");
    try {
      if (webStream) {
        const { url } = await put(cleanRel, webStream as any, {
          access: "public",
          contentType,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        return url;
      }
      if (!fallbackBuffer) throw new Error("Cannot blob-upload without buffer");
      const { url } = await put(cleanRel, fallbackBuffer, {
        access: "public",
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return url;
    } catch (blobErr: any) {
      const msg = String(blobErr?.message || "Blob upload failed");
      throw new Error(
        `Blob upload failed: ${msg}. Link a Vercel Blob store or set BLOB_READ_WRITE_TOKEN.`
      );
    }
  }

  try {
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    if (webStream) {
      const nodeStream = Readable.fromWeb(webStream as any);
      const chunks: Buffer[] = [];
      for await (const chunk of nodeStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      await fs.writeFile(absPath, Buffer.concat(chunks));
    } else if (fallbackBuffer) {
      await fs.writeFile(absPath, fallbackBuffer);
    } else {
      throw new Error("No stream or buffer provided");
    }
    return toPublicUrl(relPath);
  } catch (err) {
    if (!isReadOnlyFsError(err)) throw err;
    const cleanRel = relPath.replace(/^\/+/, "");
    try {
      if (webStream) {
        const { url } = await put(cleanRel, webStream as any, {
          access: "public",
          contentType,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        return url;
      }
      if (!fallbackBuffer) throw new Error("Cannot blob-upload without buffer");
      const { url } = await put(cleanRel, fallbackBuffer, {
        access: "public",
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return url;
    } catch (blobErr: any) {
      const msg = String(blobErr?.message || "Blob upload failed");
      throw new Error(
        `Blob upload failed: ${msg}. Link a Vercel Blob store to this project or set BLOB_READ_WRITE_TOKEN.`
      );
    }
  }
}