"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Banner = { id: number; title: string; subtitle: string; bg: string; bg_wide?: string; bg_square?: string; photo1?: string; photo2?: string; photo3?: string };

function uploadWithProgress(url: string, formData: FormData, onProgress: (pct: number) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        onProgress(pct);
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

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
    };
  }, [file]);
  return url;
}

function BannerUploadCard({ banner, onUploaded }: { banner: Banner; onUploaded: () => void }) {
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  const url1 = useObjectUrl(photo1);
  const url2 = useObjectUrl(photo2);
  const url3 = useObjectUrl(photo3);

  async function doUpload() {
    const MAX_BYTES = 10 * 1024 * 1024;
    try {
      setMessage("");
      setProgress(0);
      setUploading(true);
      if (!photo1 && !photo2 && !photo3) throw new Error("Choose at least one photo");
      for (const f of [photo1, photo2, photo3]) {
        if (!f) continue;
        if (!f.type.startsWith("image/")) throw new Error("Only image files are allowed");
        if (f.size > MAX_BYTES) throw new Error("Photo too large (max 10MB)");
      }
      const fd = new FormData();
      if (photo1) fd.append("photo1", photo1);
      if (photo2) fd.append("photo2", photo2);
      if (photo3) fd.append("photo3", photo3);
      fd.append("banner_id", String(banner.id));
      await uploadWithProgress("/api/admin/banners/photos", fd, setProgress);
      setMessage("Uploaded successfully");
      setPhoto1(null);
      setPhoto2(null);
      setPhoto3(null);
      setTimeout(() => setProgress(0), 600);
      onUploaded();
    } catch (err: any) {
      setMessage(err.message || "Upload failed");
      setTimeout(() => setProgress(0), 600);
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = window.confirm(`Upload selected photos to banner: ${banner.title || `#${banner.id}`}?`);
    if (!ok) return;
    void doUpload();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-black/10 p-4 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-black">{banner.title || `Banner #${banner.id}`}</h3>
          <p className="text-sm text-black/60">{banner.subtitle}</p>
        </div>
        <div className="text-xs text-black/60">ID: {banner.id}</div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-black/70 mb-1">Photo 1</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto1(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
          {url1 && (
            <img src={url1} alt="Preview 1" className="mt-2 h-24 w-full object-cover rounded-md border border-black/10" />
          )}
        </div>
        <div>
          <label className="block text-sm text-black/70 mb-1">Photo 2</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto2(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
          {url2 && (
            <img src={url2} alt="Preview 2" className="mt-2 h-24 w-full object-cover rounded-md border border-black/10" />
          )}
        </div>
        <div>
          <label className="block text-sm text-black/70 mb-1">Photo 3</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto3(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
          {url3 && (
            <img src={url3} alt="Preview 3" className="mt-2 h-24 w-full object-cover rounded-md border border-black/10" />
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={uploading} className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-60">Confirm & Upload</button>
        {progress > 0 && (
          <div className="flex-1">
            <div className="h-2 w-full bg-black/10 rounded">
              <div className="h-2 bg-black rounded" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-black/60">{progress}%</span>
          </div>
        )}
      </div>

      {message && <div className="mt-2 text-sm text-black/70">{message}</div>}
    </form>
  );
}

export default function AdminBannerUploadsPage() {
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
        <span className="font-semibold text-black">Upload Photos</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Upload Banner Photos</h1>
      <p className="text-black/70 mb-6">Select images, preview them, and confirm before applying to each banner.</p>

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
            <BannerUploadCard key={b.id} banner={b} onUploaded={load} />
          ))}
        </div>
      )}
    </div>
  );
}