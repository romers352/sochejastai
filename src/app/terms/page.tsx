import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

async function readLegal(): Promise<{ privacy_html: string; terms_html: string }> {
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

export default async function TermsPage() {
  const legal = await readLegal();
  const fallback = `
    <div>
      <h1>Terms and Conditions</h1>
      <p>Welcome to Soche Jastai Digital Marketing Agency. By accessing or using our website and services, you agree to be bound by these Terms and Conditions. If you do not agree with any part, please discontinue use.</p>
      <h2>Use of Content</h2>
      <p>All content, including photos, videos, and graphics, is owned by Soche Jastai or its licensors. You may not copy, redistribute, or use the content for commercial purposes without prior written consent.</p>
      <h2>Services</h2>
      <p>We strive to provide accurate information regarding our services. However, service descriptions and availability may change without notice.</p>
      <h2>Limitation of Liability</h2>
      <p>To the fullest extent permitted by law, Soche Jastai is not liable for any indirect, incidental, or consequential damages arising from the use of our website or services.</p>
      <h2>Contact</h2>
      <p>For questions about these Terms, please reach out via the Contact page.</p>
    </div>
  `;
  const html = legal.terms_html || fallback;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-black" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}