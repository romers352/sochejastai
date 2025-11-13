import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

const dataPath = path.join(process.cwd(), "data", "home_sections.json");

async function readData() {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(buf || "{}");
  } catch {
    return { sections: [] };
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin")?.value === "1";
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await readData();
  return NextResponse.json(json || {});
}

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin")?.value === "1";
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || !Array.isArray(body.sections)) {
      return NextResponse.json({ error: "Invalid payload: expected { sections: [] }" }, { status: 400 });
    }
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}