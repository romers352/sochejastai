import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

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
  const cookieStore = await cookies();
  const hasLegacyAdmin = cookieStore.get("admin")?.value === "1";
  const hasJwt = !!cookieStore.get("admin-token")?.value;
  if (!(hasLegacyAdmin || hasJwt)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await readLegal();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const hasLegacyAdmin = cookieStore.get("admin")?.value === "1";
  const hasJwt = !!cookieStore.get("admin-token")?.value;
  if (!(hasLegacyAdmin || hasJwt)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const privacy_html = typeof body?.privacy_html === "string" ? body.privacy_html : undefined;
    const terms_html = typeof body?.terms_html === "string" ? body.terms_html : undefined;
    if (privacy_html === undefined && terms_html === undefined) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const current = await readLegal();
    const next = {
      privacy_html: privacy_html ?? current.privacy_html,
      terms_html: terms_html ?? current.terms_html,
    };
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(next, null, 2), "utf-8");
    return NextResponse.json({ ok: true, ...next });
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}