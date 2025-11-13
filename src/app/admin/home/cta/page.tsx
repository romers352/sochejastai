"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

async function uploadWithProgress(url: string, fd: FormData, onProgress: (n: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      onProgress(pct);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}

export default function AdminHomeCTA() {
  const [current, setCurrent] = useState<{ photos: string | null; videos: string | null; graphics: string | null } | null>(null);
  const [message, setMessage] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);

  const [photosFile, setPhotosFile] = useState<File | null>(null);
  const [videosFile, setVideosFile] = useState<File | null>(null);
  const [graphicsFile, setGraphicsFile] = useState<File | null>(null);

  const photosUrl = useObjectUrl(photosFile);
  const videosUrl = useObjectUrl(videosFile);
  const graphicsUrl = useObjectUrl(graphicsFile);

  async function load() {
    try {
      const r = await fetch("/api/home/cta");
      const j = await r.json();
      setCurrent(j);
    } catch {}
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    if (photosFile) fd.append("photos", photosFile);
    if (videosFile) fd.append("videos", videosFile);
    if (graphicsFile) fd.append("graphics", graphicsFile);
    try {
      setMessage("");
      setProgress(0);
      setUploading(true);
      await uploadWithProgress("/api/admin/home/cta", fd, (n) => setProgress(n));
      setMessage("CTA images updated");
      setPhotosFile(null);
      setVideosFile(null);
      setGraphicsFile(null);
      setTimeout(() => setProgress(0), 600);
      await load();
    } catch (err: any) {
      setMessage(err.message || "Upload failed");
      setTimeout(() => setProgress(0), 600);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">Homepage CTA</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Homepage CTA Images</h1>
      <p className="text-black/70 mb-6">Upload images for the three containers below the hero section (Photos, Videos, Graphics).</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="upload-cta" className="rounded-xl border border-black/10 p-6 bg-white mb-8">
        <h2 id="upload-cta" className="text-xl font-semibold text-black mb-2">Upload CTA Images</h2>
        <p className="text-sm text-black/70 mb-2">Upload PNG/JPG/WEBP up to 10MB each.</p>
        <form onSubmit={handleUpload} className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-black/70 mb-1">Photos Card</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotosFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
            {(photosUrl || current?.photos) && (
              <div className="mt-2 h-32 rounded-md overflow-hidden border border-black/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photosUrl || current?.photos || ""} alt="Preview Photos" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-black/70 mb-1">Videos Card</label>
            <input type="file" accept="image/*" onChange={(e) => setVideosFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
            {(videosUrl || current?.videos) && (
              <div className="mt-2 h-32 rounded-md overflow-hidden border border-black/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={videosUrl || current?.videos || ""} alt="Preview Videos" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-black/70 mb-1">Graphics Card</label>
            <input type="file" accept="image/*" onChange={(e) => setGraphicsFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
            {(graphicsUrl || current?.graphics) && (
              <div className="mt-2 h-32 rounded-md overflow-hidden border border-black/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={graphicsUrl || current?.graphics || ""} alt="Preview Graphics" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button type="submit" disabled={uploading} className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-60">{uploading ? "Uploading…" : "Save"}</button>
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
      </section>

      <section aria-labelledby="current-cta">
        <h2 id="current-cta" className="text-xl font-semibold text-black mb-3">Current CTA Images</h2>
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 text-black">
              <tr>
                <th className="text-left px-4 py-2">Card</th>
                <th className="text-left px-4 py-2">Image</th>
              </tr>
            </thead>
            <tbody>
              {(["photos", "videos", "graphics"] as const).map((key) => (
                <tr key={key} className="border-t border-black/10">
                  <td className="px-4 py-2 capitalize">{key}</td>
                  <td className="px-4 py-2">{current?.[key] ? <a href={current[key]!} className="text-black hover:underline" target="_blank" rel="noreferrer">View</a> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}