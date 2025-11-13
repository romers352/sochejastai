import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "home_cta.json");

export async function GET() {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}");
    return NextResponse.json(json || {});
  } catch (e) {
    // default empty state
    return NextResponse.json({ photos: null, videos: null, graphics: null });
  }
}