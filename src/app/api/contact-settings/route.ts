import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Use only the inner project data directory
const dataPath = path.join(process.cwd(), "data", "contact_settings.json");

type ContactSettings = {
  email: string;
  phone: string;
  hours: string;
};

async function readSettings(): Promise<ContactSettings> {
  try {
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    return {
      email: typeof json.email === "string" ? json.email : "hello@sochejastai.example",
      phone: typeof json.phone === "string" ? json.phone : "+977-9800000000",
      hours: typeof json.hours === "string" ? json.hours : "Mon–Fri, 9:00 AM – 6:00 PM",
    };
  } catch {
    return { email: "hello@sochejastai.example", phone: "+977-9800000000", hours: "Mon–Fri, 9:00 AM – 6:00 PM" };
  }
}

export async function GET() {
  const data = await readSettings();
  return NextResponse.json(data);
}