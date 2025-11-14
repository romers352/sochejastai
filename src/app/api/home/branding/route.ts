import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";

const dataPath = path.join(process.cwd(), "data", "branding.json");

export async function GET() {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}");
    return NextResponse.json(json || {});
  } catch (e) {
    try {
      const [rows] = await pool.query("SELECT navbar, footer, favicon FROM branding WHERE id = 1");
      const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
      return NextResponse.json({ navbar: row?.navbar || null, footer: row?.footer || null, favicon: row?.favicon || null });
    } catch (dbErr) {
      return NextResponse.json({ navbar: null, footer: null, favicon: null });
    }
  }
}