import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "partner_logos.json");

export async function GET() {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    const logos = Array.isArray(json.logos) ? json.logos : [];
    return NextResponse.json({ logos });
  } catch (e) {
    return NextResponse.json({ logos: [] });
  }
}