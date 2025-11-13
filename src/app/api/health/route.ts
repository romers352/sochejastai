import { NextResponse } from "next/server";
export const runtime = "nodejs";
import pool from "@/lib/db";

function envSummary() {
  return {
    NODE_ENV: process.env.NODE_ENV ?? null,
    MYSQL_HOST: !!process.env.MYSQL_HOST,
    MYSQL_PORT: !!process.env.MYSQL_PORT,
    MYSQL_USER: !!process.env.MYSQL_USER,
    MYSQL_PASSWORD: !!process.env.MYSQL_PASSWORD,
    MYSQL_DATABASE: !!process.env.MYSQL_DATABASE,
    MYSQL_SSL: process.env.MYSQL_SSL ?? null,
    MYSQL_CA: !!process.env.MYSQL_CA,
    JWT_SECRET: !!process.env.JWT_SECRET,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    ADMIN_PASSWORD_HASH: !!process.env.ADMIN_PASSWORD_HASH,
  };
}

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    const ok = Array.isArray(rows) && (rows as any)[0]?.ok === 1;
    return NextResponse.json({ status: "ok", db: ok ? "connected" : "unknown", env: envSummary() });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", db: "disconnected", error: e?.message || "unknown", env: envSummary() },
      { status: 500 }
    );
  }
}