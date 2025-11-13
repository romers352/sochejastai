import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import pool from "../../../../../lib/db";
import { isAuthenticatedAdminFromCookieHeader } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export async function PATCH(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const adminCookie = req.headers.get("cookie") || "";
  if (!isAuthenticatedAdminFromCookieHeader(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idNum = Number(params.id);
  if (!idNum) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];
    for (const key of ["name", "role", "quote", "initials", "rating", "avatar"]) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }
    }
    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    await pool.execute(`UPDATE testimonials SET ${fields.join(", ")} WHERE id = ?`, [...values, idNum]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const adminCookie = req.headers.get("cookie") || "";
  if (!isAuthenticatedAdminFromCookieHeader(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idNum = Number(params.id);
  if (!idNum) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    // Remove avatar file if it is a local upload
    const [rows] = await pool.execute("SELECT avatar FROM testimonials WHERE id = ?", [idNum]);
    const row = Array.isArray(rows) && rows.length ? (rows as any)[0] as { avatar: string | null } : null;
    const avatar: string | null = row?.avatar || null;
    if (avatar && avatar.startsWith("/uploads/testimonials/")) {
      const filePath = path.join(process.cwd(), "public", avatar.replace(/^\//, ""));
      try { await fs.unlink(filePath); } catch (_) {}
    }
    await pool.execute("DELETE FROM testimonials WHERE id = ?", [idNum]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}