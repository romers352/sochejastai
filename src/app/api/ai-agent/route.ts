import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Use only the inner project data directory
const dataPath = path.join(process.cwd(), "data", "ai_agent.json");

type AiAgentSettings = { url: string };

async function readSettings(): Promise<AiAgentSettings> {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    return { url: typeof json.url === "string" ? json.url : "https://example.com/ai" };
  } catch {
    return { url: "https://example.com/ai" };
  }
}

export async function GET() {
  const data = await readSettings();
  return NextResponse.json(data);
}