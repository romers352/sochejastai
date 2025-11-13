"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Banner = {
  id: number;
  title: string;
  subtitle: string;
  bg: string;
  bg_wide?: string;
  bg_square?: string;
  photo1?: string;
  photo2?: string;
  photo3?: string;
};

function useObjectUrl(file: File | null) {
  return useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
}

function BannerPhotosCard({ banner, onUploaded }: { banner: Banner; onUploaded: () => void }) {
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  const url1 = useObjectUrl(photo1);
  const url2 = useObjectUrl(photo2);
  const url3 = useObjectUrl(photo3);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setProgress(0);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("banner_id", String(banner.id));
      if (photo1) fd.append("photo1", photo1);
      if (photo2) fd.append("photo2", photo2);
      if (photo3) fd.append("photo3", photo3);

      // Use XHR to provide progress feedback
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/banners/photos");
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300 && data?.ok) {
              setMessage("Uploaded successfully");
              setProgress(100);
              setPhoto1(null);
              setPhoto2(null);
              setPhoto3(null);
              onUploaded();
              resolve();
            } else {
              setMessage(data?.error || "Upload failed");
              reject(new Error(data?.error || "Upload failed"));
            }
          } catch (err: any) {
            setMessage("Upload failed");
            reject(err);
          }
        };
        xhr.onerror = () => {
          setMessage("Network error");
          reject(new Error("Network error"));
        };
        xhr.send(fd);
      });
    } catch (err: any) {
      // keep message set above
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-xl border border-black/10 p-4 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">{banner.title || `Banner #${banner.id}`}</h3>
          <p className="text-sm text-black/60">Upload photos into this banner’s container (div/div/div).</p>
        </div>
        <div className="text-sm text-black/70">
          <span className="mr-2">Current:</span>
          <span>{banner.photo1 ? "Photo1" : "—"}</span>
          <span className="mx-2">|</span>
          <span>{banner.photo2 ? "Photo2" : "—"}</span>
          <span className="mx-2">|</span>
          <span>{banner.photo3 ? "Photo3" : "—"}</span>
        </div>
      </div>

      <form onSubmit={handleUpload} className="mt-4 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-black/70 mb-1">Photo 1</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto1(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
          {url1 && (
            <div className="mt-2 aspect-square rounded-md overflow-hidden border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url1} alt="Preview 1" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm text-black/70 mb-1">Photo 2</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto2(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
          {url2 && (
            <div className="mt-2 aspect-square rounded-md overflow-hidden border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url2} alt="Preview 2" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm text-black/70 mb-1">Photo 3</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto3(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
          {url3 && (
            <div className="mt-2 aspect-square rounded-md overflow-hidden border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url3} alt="Preview 3" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div className="sm:col-span-3 flex items-center gap-3">
          <button type="submit" disabled={uploading} className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-60">{uploading ? "Uploading…" : "Upload"}</button>
          {progress > 0 && (
            <div className="flex-1">
              <div className="h-2 w-full bg-black/10 rounded">
                <div className="h-2 bg-black rounded" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-black/60">{progress}%</span>
            </div>
          )}
        </div>
      </form>
      {message && (
        <div className="mt-3 rounded-md border border-black/10 bg-white text-black px-3 py-2">{message}</div>
      )}
    </section>
  );
}

export default function AdminBannerPhotosPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");

  async function load() {
    try {
      setLoading(true);
      const data = await fetch("/api/banners").then((r) => r.json()).catch(() => []);
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMessage(err.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <Link href="/admin/banners" className="hover:underline">Banners</Link>
        <span> / </span>
        <span className="font-semibold text-black">Upload Container Photos (div/div/div)</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Upload Container Photos</h1>
      <p className="text-black/70 mb-6">Upload images directly into the three photo slots of each banner’s container.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      {loading ? (
        <div className="rounded-md border border-black/20 bg-black/5 p-3 text-black/80">Loading banners…</div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-black/20 bg-black/5 p-3 text-black/80">No banners found. Add one in the Banners page.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((b) => (
            <BannerPhotosCard key={b.id} banner={b} onUploaded={load} />
          ))}
        </div>
      )}
    </div>
  );
}