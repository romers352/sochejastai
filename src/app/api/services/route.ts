import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, description, icon FROM services ORDER BY id ASC"
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}