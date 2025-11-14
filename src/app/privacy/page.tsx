import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

async function readLegal(): Promise<{ privacy_html: string; terms_html: string }> {
  // Prefer DB first (dynamic), fallback to JSON file
  try {
    const [rows] = await pool.query("SELECT privacy_html, terms_html FROM legal WHERE id = 1");
    const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
    if (row) {
      return {
        privacy_html: row.privacy_html || "",
        terms_html: row.terms_html || "",
      };
    }
  } catch {}
  try {
    const dataPath = path.join(process.cwd(), "data", "legal.json");
    const buf = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(buf || "{}") || {};
    return {
      privacy_html: typeof json.privacy_html === "string" ? json.privacy_html : "",
      terms_html: typeof json.terms_html === "string" ? json.terms_html : "",
    };
  } catch {
    return { privacy_html: "", terms_html: "" };
  }
}

export default async function PrivacyPage() {
  const legal = await readLegal();
  const fallback = `
    <div>
      <h1>Privacy Policy</h1>
      <p>Soche Jastai Digital Marketing Agency respects your privacy. This policy explains how we collect, use, and protect your information.</p>
      <h2>Information We Collect</h2>
      <p>We may collect contact information that you voluntarily provide via our Contact form, including name, email, and message content.</p>
      <h2>Use of Information</h2>
      <p>We use submitted information to respond to inquiries and improve our services. We do not sell your personal data.</p>
      <h2>Cookies</h2>
      <p>Our admin area uses a session cookie to authenticate administrators. This cookie is not used for tracking site visitors.</p>
      <h2>Data Security</h2>
      <p>We take reasonable measures to protect your information. However, no method of transmission over the internet is 100% secure.</p>
      <h2>Contact</h2>
      <p>For privacy-related questions, please reach out via the Contact page.</p>
    </div>
  `;
  const html = legal.privacy_html || fallback;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-black" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}