"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPartnerLogosPage() {
  const [logos, setLogos] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  async function load() {
    try {
      const res = await fetch("/api/admin/partner-logos");
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to load logos");
      const j = await res.json();
      setLogos(Array.isArray(j.logos) ? j.logos : []);
    } catch (e: any) {
      setMessage(e.message || "Failed to load logos");
    }
  }

  useEffect(() => { load(); }, []);

  async function save(next: string[]) {
    const res = await fetch("/api/admin/partner-logos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logos: next }) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Save failed");
  }

  async function addByUrl(e: React.FormEvent) {
    e.preventDefault();
    const url = newUrl.trim();
    if (!url) return;
    try {
      setMessage("");
      const next = [...logos, url];
      await save(next);
      setLogos(next);
      setNewUrl("");
    } catch (err: any) {
      setMessage(err.message || "Failed to add logo");
    }
  }

  async function removeLogo(idx: number) {
    try {
      setMessage("");
      const next = logos.filter((_, i) => i !== idx);
      await save(next);
      setLogos(next);
    } catch (err: any) {
      setMessage(err.message || "Failed to remove logo");
    }
  }

  function uploadWithProgress(url: string, formData: FormData): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(pct);
        }
      };
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          try {
            const json = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(json);
            } else {
              reject(new Error(json.error || "Upload failed"));
            }
          } catch (err) {
            reject(new Error("Upload failed"));
          }
        }
      };
      xhr.send(formData);
    });
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const files = fd.getAll("logo") as File[];
    if (!files || files.length === 0) return;
    try {
      setMessage("");
      setUploadProgress(0);
      const res = await uploadWithProgress("/api/admin/partner-logos/upload", fd);
      const urls: string[] = Array.isArray(res?.urls) ? res.urls : (res?.src ? [res.src] : []);
      if (!urls.length) throw new Error("Upload failed");
      const next = [...logos, ...urls];
      await save(next);
      setLogos(next);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setUploadProgress(0), 600);
    } catch (err: any) {
      setMessage(err.message || "Upload failed");
      setTimeout(() => setUploadProgress(0), 600);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">Partner Logos</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Partner Logos</h1>
      <p className="text-black/70 mb-6">Add logos via URL or upload files. Admin can add any amount of logos.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="add-logo-url" className="rounded-xl border border-black/10 p-6 bg-white mb-8">
        <h2 id="add-logo-url" className="text-xl font-semibold text-black mb-2">Add Logo by URL</h2>
        <form onSubmit={addByUrl} className="flex gap-3">
          <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/logo.png" className="flex-1 rounded-md border border-black/20 px-3 py-2" />
          <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 shrink-0 whitespace-nowrap">Add</button>
        </form>
        <div className="text-sm text-black/60 mt-2">Accepted: PNG, JPG, WEBP, SVG. Prefer CDN URLs.</div>
      </section>

      <section aria-labelledby="upload-logo" className="rounded-xl border border-black/10 p-6 bg-white mb-8">
        <h2 id="upload-logo" className="text-xl font-semibold text-black mb-2">Upload Logos</h2>
        <p className="text-sm text-black/70 mb-2">Select one or more image files (max 10MB each).</p>
        <form onSubmit={handleUpload} className="flex items-center gap-3">
          <input name="logo" type="file" accept="image/*" multiple className="flex-1 rounded-md border border-black/20 px-3 py-2" />
          <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 shrink-0 whitespace-nowrap">Upload</button>
          {uploadProgress > 0 && (
            <div className="flex-1">
              <div className="h-2 w-full bg-gray-200 rounded">
                <div className="h-2 bg-black rounded" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </form>
      </section>

      <section aria-labelledby="manage-logos" className="rounded-xl border border-black/10 p-6 bg-white mb-8">
        <h2 id="manage-logos" className="text-xl font-semibold text-black mb-4">Current Logos</h2>
        {logos.length === 0 ? (
          <div className="rounded-md border border-black/20 bg-black/5 p-3 text-black/80">No logos yet. Add some above.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {logos.map((src, idx) => (
              <div key={idx} className="rounded-md border border-black/10 bg-white p-3 flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Logo ${idx + 1}`} className="h-16 w-auto object-contain mb-3" />
                <button onClick={() => removeLogo(idx)} className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10">Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}