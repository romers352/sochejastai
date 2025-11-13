"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
}

export default function AdminBrandingPage() {
  const [current, setCurrent] = useState<{ navbar: string | null; footer: string | null; favicon: string | null } | null>(null);
  const [message, setMessage] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const [navbarFile, setNavbarFile] = useState<File | null>(null);
  const [footerFile, setFooterFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const navbarUrl = useObjectUrl(navbarFile);
  const footerUrl = useObjectUrl(footerFile);
  const faviconUrl = useObjectUrl(faviconFile);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/home/branding");
        const data = await res.json();
        setCurrent({ navbar: data?.navbar || null, footer: data?.footer || null, favicon: data?.favicon || null });
      } catch {}
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setUploading(true);
    setProgress(0);
    try {
      const form = new FormData();
      if (navbarFile) form.append("navbar", navbarFile);
      if (footerFile) form.append("footer", footerFile);
      if (faviconFile) form.append("favicon", faviconFile);

      const res = await fetch("/api/admin/home/branding", {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        setMessage("Branding updated successfully.");
        setCurrent({ navbar: data.navbar || null, footer: data.footer || null, favicon: data.favicon || null });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to update branding.");
      }
    } catch (err) {
      setMessage("Error uploading files.");
    } finally {
      setUploading(false);
      setProgress(0);
      setNavbarFile(null);
      setFooterFile(null);
      setFaviconFile(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">Branding</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Branding</h1>
      <p className="text-black/70 mb-6">Upload logos for the navbar and footer, and set a custom favicon.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="upload-branding" className="rounded-xl border border-black/10 p-6 bg-white mb-8">
        <h2 id="upload-branding" className="text-xl font-semibold text-black mb-2">Upload Logos & Favicon</h2>
        <p className="text-black/70 mb-4">Accepted formats: PNG, JPG, WEBP, SVG. Max 10MB each. For favicon, PNG/WebP are recommended.</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="navbar-logo" className="block text-sm font-medium text-black mb-1">Navbar Logo</label>
              <input
                id="navbar-logo"
                type="file"
                accept="image/*"
                onChange={(e) => setNavbarFile(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              {(navbarUrl || current?.navbar) && (
                <div className="mt-3 rounded-lg border border-black/10 p-2 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={navbarUrl || current?.navbar || ""} alt="Navbar Logo Preview" className="h-14 w-auto" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="footer-logo" className="block text-sm font-medium text-black mb-1">Footer Logo</label>
              <input
                id="footer-logo"
                type="file"
                accept="image/*"
                onChange={(e) => setFooterFile(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              {(footerUrl || current?.footer) && (
                <div className="mt-3 rounded-lg border border-black/10 p-2 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={footerUrl || current?.footer || ""} alt="Footer Logo Preview" className="h-14 w-auto" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="favicon" className="block text-sm font-medium text-black mb-1">Favicon</label>
            <input
              id="favicon"
              type="file"
              accept="image/*"
              onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
            {(faviconUrl || current?.favicon) && (
              <div className="mt-3 rounded-lg border border-black/10 p-2 bg-gray-50 inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={faviconUrl || current?.favicon || ""} alt="Favicon Preview" className="h-8 w-8 rounded" />
                <span className="text-xs text-black/70">Preview</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Save Branding"}
            </button>
            {uploading && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-black/10 rounded" aria-hidden>
                  <div className="h-2 bg-black rounded" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-gray-600">{progress}%</span>
              </div>
            )}
          </div>
        </form>
      </section>

      <section aria-labelledby="current-branding">
        <h2 id="current-branding" className="text-xl font-semibold text-black mb-3">Current Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-black/10 p-4 bg-white">
            <p className="text-sm text-black/70 mb-2">Navbar Logo</p>
            {current?.navbar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.navbar} alt="Navbar Logo" className="h-14 w-auto" />
            ) : (
              <p className="text-sm text-gray-600">Not set</p>
            )}
          </div>
          <div className="rounded-xl border border-black/10 p-4 bg-white">
            <p className="text-sm text-black/70 mb-2">Footer Logo</p>
            {current?.footer ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.footer} alt="Footer Logo" className="h-14 w-auto" />
            ) : (
              <p className="text-sm text-gray-600">Not set</p>
            )}
          </div>
          <div className="rounded-xl border border-black/10 p-4 bg-white">
            <p className="text-sm text-black/70 mb-2">Favicon</p>
            {current?.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.favicon} alt="Favicon" className="h-8 w-8" />
            ) : (
              <p className="text-sm text-gray-600">Not set</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}