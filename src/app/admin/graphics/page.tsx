"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminModal from "@/components/AdminModal";

type Graphic = { id: number; title: string; src: string };

async function postJSON(url: string, data: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
}

export default function AdminGraphicsPage() {
  const [items, setItems] = useState<Graphic[]>([]);
  const [message, setMessage] = useState<string>("");
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(null);

  async function load() {
    const data = await fetch("/api/gallery/graphics").then((r) => r.json()).catch(() => []);
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      setMessage("");
      await postJSON("/api/admin/graphics", {
        title: String(form.get("title")),
        src: String(form.get("src")),
      });
      setMessage("Graphic added");
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err: any) {
      setMessage(err.message || "Error adding graphic");
    }
  }

  async function handleDelete(id: number) {
    try {
      if (!confirm("Delete this graphic? This cannot be undone.")) return;
      setMessage("");
      const res = await fetch(`/api/admin/graphics/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to delete graphic");
      }
      setMessage("Graphic deleted");
      await load();
    } catch (err: any) {
      setMessage(err.message || "Delete failed");
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
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const file = fd.get("file") as File | null;
    const title = String(fd.get("title") || "").trim();
    const MAX_BYTES = 4 * 1024 * 1024; // 4MB
    try {
      setMessage("");
      setUploadProgress(0);
      if (!file || !title) throw new Error("Title and file are required");
      if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
      if (file.size > MAX_BYTES) throw new Error("File too large (max 4MB)");
      await uploadWithProgress("/api/admin/graphics/upload", fd);
      setMessage("Graphic uploaded");
      formEl.reset();
      setTimeout(() => setUploadProgress(0), 600);
      await load();
    } catch (err: any) {
      setMessage(err.message || "Upload failed");
      setTimeout(() => setUploadProgress(0), 600);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <AdminModal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.title || "Graphic Preview"}>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.src} alt={preview.title || "Graphic preview"} className="max-h-[70vh] w-auto mx-auto" />
        )}
      </AdminModal>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold">Graphics</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Graphics</h1>
      <p className="text-gray-700 mb-6">Manage graphic designs for the gallery.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="add-graphic" className="rounded-xl border border-black p-6 bg-white mb-8">
        <h2 id="add-graphic" className="text-xl font-semibold text-black mb-2">Add Graphic</h2>
        <p className="text-sm text-gray-700 mb-2">Use a direct image URL; ensure it is accessible over HTTPS.</p>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-3">
          <input name="title" placeholder="Title" className="w-full rounded-md border border-black px-3 py-2" />
          <input name="src" placeholder="Image URL" className="w-full rounded-md border border-black px-3 py-2" />
          <div className="sm:col-span-3">
            <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 shrink-0 whitespace-nowrap">Add Graphic</button>
          </div>
        </form>
        <div className="mt-3 text-sm">
          <button type="button" onClick={() => setHelpOpen((v) => !v)} className="text-black hover:underline" aria-expanded={helpOpen} aria-controls="graphic-help">Tips for image URLs</button>
          {helpOpen && (
            <div id="graphic-help" className="mt-2 rounded-md border border-gray-300 bg-gray-50 p-3 text-gray-800">
              Prefer CDN-hosted images. Test the URL in a new tab to confirm it loads and supports CORS if required.
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="upload-graphic" className="rounded-xl border border-black p-6 bg-white mb-8">
        <h2 id="upload-graphic" className="text-xl font-semibold text-black mb-2">Upload Graphic</h2>
        <p className="text-sm text-gray-700 mb-2">Upload an image file (PNG, JPG, WEBP). Max 4MB.</p>
        <form onSubmit={handleUpload} className="grid sm:grid-cols-3 gap-3">
          <input name="title" placeholder="Title" className="w-full rounded-md border border-black px-3 py-2" />
          <input name="file" type="file" accept="image/*" className="w-full rounded-md border border-black px-3 py-2" />
          <div className="sm:col-span-3 flex items-center gap-3">
            <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 shrink-0 whitespace-nowrap">Upload</button>
            {uploadProgress > 0 && (
              <div className="flex-1">
                <div className="h-2 w-full bg-gray-200 rounded">
                  <div className="h-2 bg-black rounded" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-xs text-gray-600">{uploadProgress}%</span>
              </div>
            )}
          </div>
        </form>
      </section>

      <section aria-labelledby="current-graphics">
        <h2 id="current-graphics" className="text-xl font-semibold text-black mb-3">Current Graphics</h2>
        <div className="overflow-x-auto rounded-xl border border-black bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Image</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-gray-600">No graphics yet. Add one above.</td>
                </tr>
              )}
              {items.map((g, i) => (
                <tr key={i} className="border-t border-gray-300">
                  <td className="px-4 py-2">{g.title}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.src}
                        alt={g.title || "Graphic"}
                        className="h-12 w-auto rounded border border-black/10 cursor-pointer"
                        onClick={() => setPreview({ src: g.src, title: g.title })}
                      />
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10"
                        onClick={() => setPreview({ src: g.src, title: g.title })}
                        title="Preview graphic"
                      >
                        Preview
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10"
                      title="Delete graphic"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}