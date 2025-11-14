import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ClientNavbar, ClientFooter } from "../components/ClientChrome";
import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  let favicon: string | null = null;
  // Prefer DB first to avoid stale JSON in deployments; fallback to local JSON
  try {
    const [rows] = await pool.query("SELECT favicon FROM branding WHERE id = 1");
    const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
    favicon = row?.favicon || null;
  } catch {
    try {
      const dataPath = path.join(process.cwd(), "data", "branding.json");
      const buf = await fs.readFile(dataPath, "utf-8");
      const json = JSON.parse(buf || "{}") || {};
      if (typeof json.favicon === "string" && json.favicon) {
        favicon = json.favicon;
      }
    } catch {}
  }
  return {
    title: "Soche Jastai Digital Marketing",
    description: "Portfolio, galleries, and admin management for Soche Jastai.",
    icons: favicon ? { icon: favicon } : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <ClientNavbar />
        <main className="min-h-[60vh]">{children}</main>
        <ClientFooter />
      </body>
    </html>
  );
}
