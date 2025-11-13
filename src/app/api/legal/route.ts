import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "legal.json");

async function readLegal(): Promise<{ privacy_html: string; terms_html: string }> {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    const privacy_html = typeof json.privacy_html === "string" ? json.privacy_html : "";
    const terms_html = typeof json.terms_html === "string" ? json.terms_html : "";
    return { privacy_html, terms_html };
  } catch (e) {
    return { privacy_html: "", terms_html: "" };
  }
}

export async function GET() {
  const data = await readLegal();
  return NextResponse.json(data);
}