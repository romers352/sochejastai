import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import pool from "../../../../../lib/db";
import { isAuthenticatedAdminFromCookieHeader } from "@/lib/auth";

export async function PATCH(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const cookieHeader = req.headers.get("cookie") || "";
  if (!isAuthenticatedAdminFromCookieHeader(cookieHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idNum = Number(params.id);
  if (!idNum) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];
    for (const key of ["title", "description", "icon"]) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }
    }
    if (fields.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    await pool.execute(`UPDATE services SET ${fields.join(", ")} WHERE id = ?`, [...values, idNum]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const cookieHeader = req.headers.get("cookie") || "";
  if (!isAuthenticatedAdminFromCookieHeader(cookieHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idNum = Number(params.id);
  if (!idNum) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    await pool.execute("DELETE FROM services WHERE id = ?", [idNum]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}