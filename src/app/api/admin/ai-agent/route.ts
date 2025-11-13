import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

// Use only the inner project data directory
const dataPath = path.join(process.cwd(), "data", "ai_agent.json");

type AiAgentSettings = { url: string };

async function readSettings(): Promise<AiAgentSettings> {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    return { url: typeof json.url === "string" ? json.url : "" };
  } catch {
    return { url: "" };
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const hasLegacyAdmin = cookieStore.get("admin")?.value === "1";
  const hasJwt = !!cookieStore.get("admin-token")?.value;
  if (!(hasLegacyAdmin || hasJwt)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await readSettings();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const hasLegacyAdmin = cookieStore.get("admin")?.value === "1";
  const hasJwt = !!cookieStore.get("admin-token")?.value;
  if (!(hasLegacyAdmin || hasJwt)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const url = typeof body?.url === "string" ? body.url.trim() : null;
    if (!url) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify({ url }, null, 2), "utf-8");
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}