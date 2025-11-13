"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminModal from "@/components/AdminModal";

type Banner = { id: number; title: string; subtitle: string; bg: string; bg_wide?: string; bg_square?: string; photo1?: string; photo2?: string; photo3?: string };

async function postJSON(url: string, data: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
}

export default function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [message, setMessage] = useState<string>("");
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [rowUploadingId, setRowUploadingId] = useState<number | null>(null);
  const [openUploadId, setOpenUploadId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(null);

  function isImageBg(bg: string): boolean {
    const hasExt = /\.(png|jpe?g|webp|gif)$/i.test(bg);
    return hasExt || bg.startsWith("/") || bg.startsWith("http://") || bg.startsWith("https://");
  }

  async function load() {
    const data = await fetch("/api/banners").then((r) => r.json()).catch(() => []);
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  // Removed image dimension labels for cleaner UI

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      setMessage("");
      await postJSON("/api/admin/banners", {
        title: String(form.get("title")),
        subtitle: String(form.get("subtitle")),
        bg: String(form.get("bg")),
      });
      setMessage("Banner added");
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err: any) {
      setMessage(err.message || "Error adding banner");
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
    const fileWide = fd.get("file_wide") as File | null;
    const fileSquare = fd.get("file_square") as File | null;
    const title = String(fd.get("title") || "").trim();
    const subtitle = String(fd.get("subtitle") || "").trim();
    const MAX_BYTES = 4 * 1024 * 1024; // 4MB
    try {
      setMessage("");
      setUploadProgress(0);
      // Require both files in the requested sizes
      if (!fileWide || !fileSquare) throw new Error("Two files are required: wide (1920×720) and square (1080×1080)");
      if (!fileWide.type.startsWith("image/") || !fileSquare.type.startsWith("image/")) throw new Error("Only image files are allowed");
      if (fileWide.size > MAX_BYTES || fileSquare.size > MAX_BYTES) throw new Error("File too large (max 4MB each)");
      await uploadWithProgress("/api/admin/banners/upload", fd);
      setMessage("Banner uploaded");
      formEl.reset();
      setTimeout(() => setUploadProgress(0), 600);
      await load();
    } catch (err: any) {
      setMessage(err.message || "Upload failed");
      setTimeout(() => setUploadProgress(0), 600);
    }
  }

  // Inline per-banner photo upload (no separate selection section)
  async function handleRowUploadPhotos(e: React.FormEvent<HTMLFormElement>, bannerId: number) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB per photo
    try {
      setMessage("");
      setUploadProgress(0);
      setRowUploadingId(bannerId);
      const p1 = fd.get("photo1") as File | null;
      const p2 = fd.get("photo2") as File | null;
      const p3 = fd.get("photo3") as File | null;
      if (!p1 && !p2 && !p3) throw new Error("Choose at least one photo");
      for (const f of [p1, p2, p3]) {
        if (!f) continue;
        if (!f.type.startsWith("image/")) throw new Error("Only image files are allowed");
        if (f.size > MAX_BYTES) throw new Error("Photo too large (max 10MB)");
      }
      // Attach banner id implicitly
      fd.append("banner_id", String(bannerId));
      await uploadWithProgress("/api/admin/banners/photos", fd);
      setMessage("Banner photos uploaded");
      formEl.reset();
      setTimeout(() => setUploadProgress(0), 600);
      setRowUploadingId(null);
      await load();
    } catch (err: any) {
      setMessage(err.message || "Upload failed");
      setTimeout(() => setUploadProgress(0), 600);
      setRowUploadingId(null);
    }
  }

  async function handleUploadPhotos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const bannerId = Number(fd.get("banner_id"));
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB per photo
    try {
      setMessage("");
      setUploadProgress(0);
      if (!bannerId) throw new Error("Select a banner");
      const p1 = fd.get("photo1") as File | null;
      const p2 = fd.get("photo2") as File | null;
      const p3 = fd.get("photo3") as File | null;
      if (!p1 && !p2 && !p3) throw new Error("Choose at least one photo");
      for (const f of [p1, p2, p3]) {
        if (!f) continue;
        if (!f.type.startsWith("image/")) throw new Error("Only image files are allowed");
        if (f.size > MAX_BYTES) throw new Error("Photo too large (max 10MB)");
      }
      await uploadWithProgress("/api/admin/banners/photos", fd);
      setMessage("Banner photos uploaded");
      formEl.reset();
      setTimeout(() => setUploadProgress(0), 600);
      await load();
    } catch (err: any) {
      setMessage(err.message || "Upload failed");
      setTimeout(() => setUploadProgress(0), 600);
    }
  }

  async function deleteBanner(id: number) {
    try {
      setMessage("");
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to delete banner");
      }
      setMessage("Banner deleted");
      await load();
    } catch (err: any) {
      setMessage(err.message || "Delete failed");
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <AdminModal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.title || "Banner Preview"}>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.src} alt={preview.title || "Banner image"} className="max-h-[70vh] w-auto mx-auto" />
        )}
      </AdminModal>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">Banners</span>
      </nav>

  <h1 className="text-3xl font-bold text-black mb-2">Banners</h1>
  <p className="text-black/70 mb-6">Manage hero banner slides for the homepage.</p>
  <div className="mb-6">
    <Link href="/admin/banners/uploads" className="inline-block px-4 py-2 rounded-md border border-black/20 text-black hover:bg-black/5">Upload Photos (Preview & Confirm)</Link>
    <Link href="/admin/banners/photos" className="ml-2 inline-block px-4 py-2 rounded-md border border-black/20 text-black hover:bg-black/5">Upload Container Photos (div/div/div)</Link>
  </div>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="add-banner" className="rounded-xl border border-black/10 p-6 bg-white mb-8">
        <h2 id="add-banner" className="text-xl font-semibold text-black mb-2">Add Banner</h2>
        <p className="text-sm text-[#0B0C10]/70 mb-2">Use Tailwind gradients in the background field, such as <span className="font-mono">from-orange-500 to-orange-700</span>.</p>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-3">
          <input name="title" placeholder="Title" className="w-full rounded-md border border-black/20 px-3 py-2" />
          <input name="subtitle" placeholder="Subtitle" className="w-full rounded-md border border-black/20 px-3 py-2" />
          <input name="bg" placeholder="Tailwind gradient (e.g., from-orange-500 to-orange-700)" className="w-full rounded-md border border-black/20 px-3 py-2" aria-describedby="bg-help" />
          <div className="sm:col-span-3">
            <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90">Add Banner</button>
          </div>
        </form>
        <div className="mt-3 text-sm">
          <button type="button" onClick={() => setHelpOpen((v) => !v)} className="text-[#ff914d] hover:underline" aria-expanded={helpOpen} aria-controls="bg-help">What is a Tailwind gradient?</button>
          {helpOpen && (
            <div id="bg-help" className="mt-2 rounded-md border border-[#ff914d]/40 bg-[#ff914d]/5 p-3">
              Combine utility classes like <span className="font-mono">bg-gradient-to-r from-orange-500 to-orange-700</span> to create a gradient background.
            </div>
          )}
        </div>
      </section>

      {/* Removed separate photo upload section; inline uploads are available per banner below. */}

      <section aria-labelledby="upload-banner" className="rounded-xl border border-black/10 p-6 bg-white mb-8">
        <h2 id="upload-banner" className="text-xl font-semibold text-black mb-2">Upload Banner Background</h2>
        <p className="text-sm text-black/70 mb-2">Upload two image files (PNG, JPG, WEBP). Max 10MB each. One for desktop and one for mobile. Any resolution is accepted.</p>
        <form onSubmit={handleUpload} className="grid sm:grid-cols-3 gap-3">
          <input name="title" placeholder="Title" className="w-full rounded-md border border-black/20 px-3 py-2" />
          <input name="subtitle" placeholder="Subtitle" className="w-full rounded-md border border-black/20 px-3 py-2" />
          <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-black/70 mb-1">Desktop Wide</label>
              <input name="file_wide" type="file" accept="image/*" className="w-full rounded-md border border-black/20 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Mobile/Square</label>
              <input name="file_square" type="file" accept="image/*" capture="environment" className="w-full rounded-md border border-black/20 px-3 py-2" />
            </div>
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90">Upload</button>
            {uploadProgress > 0 && (
              <div className="flex-1">
                <div className="h-2 w-full bg-black/10 rounded">
                  <div className="h-2 bg-black rounded" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-xs text-black/60">{uploadProgress}%</span>
              </div>
            )}
          </div>
        </form>
        <p className="mt-2 text-sm text-black/60">Tip: Any resolution is accepted. Recommended (not required): 1920×720 for desktop and 1080×1080 for mobile. On mobile, you can use the camera directly for square.</p>
      </section>

      <section aria-labelledby="current-banners">
        <h2 id="current-banners" className="text-xl font-semibold text-black mb-3">Current Banners</h2>
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 text-black">
              <tr>
                <th className="text-left px-4 py-2">Banner</th>
                <th className="text-left px-4 py-2">Desktop (Wide)</th>
                <th className="text-left px-4 py-2">Mobile (Square)</th>
                <th className="text-left px-4 py-2">Legacy Bg</th>
                <th className="text-left px-4 py-2">Photos</th>
                <th className="text-left px-4 py-2">Upload</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-black/70">No banners yet. Add one above.</td>
                </tr>
              )}
              {items.map((b, i) => (
                <React.Fragment key={b.id}>
                <tr className="border-t border-black/10">
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-black">{b.title}</span>
                      {b.subtitle && <span className="text-black/70 text-xs">{b.subtitle}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {(() => {
                      const wideSrc = (b.bg_wide && isImageBg(b.bg_wide)) ? b.bg_wide : (isImageBg(b.bg) ? b.bg : undefined);
                      if (!wideSrc) return "—";
                      return (
                        <div className="flex items-center gap-3">
                          <img
                            src={wideSrc}
                            alt={`Wide ${b.title || "banner"}`}
                            className="h-12 w-auto rounded border border-black/10 cursor-pointer"
                            onClick={() => setPreview({ src: wideSrc, title: b.title })}
                          />
                          {/* Thumbnail click opens modal; removed extra Preview button and size label */}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2">
                    {(() => {
                      const squareSrc = (b.bg_square && isImageBg(b.bg_square)) ? b.bg_square : (isImageBg(b.bg) ? b.bg : undefined);
                      if (!squareSrc) return "—";
                      return (
                        <div className="flex items-center gap-3">
                          <img
                            src={squareSrc}
                            alt={`Square ${b.title || "banner"}`}
                            className="h-12 w-auto rounded border border-black/10 cursor-pointer"
                            onClick={() => setPreview({ src: squareSrc, title: b.title })}
                          />
                          {/* Thumbnail click opens modal; removed extra Preview button and size label */}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2 font-mono truncate max-w-[12rem]" title={b.bg}>{b.bg}</td>
                  <td className="px-4 py-2">
                    {(() => {
                      const photos = [b.photo1, b.photo2, b.photo3].filter((v): v is string => !!v);
                      if (photos.length === 0) return "—";
                      return (
                        <div className="flex items-center gap-2">
                          {photos.map((src, idx) => (
                            <img
                              key={src + idx}
                              src={src}
                              alt={`Photo ${idx + 1}`}
                              className="h-10 w-10 object-cover rounded border border-black/10 cursor-pointer"
                              onClick={() => setPreview({ src, title: `${b.title} • Photo ${idx + 1}` })}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setOpenUploadId((id) => (id === b.id ? null : b.id))}
                      className="px-3 py-1 rounded-md border border-black/20 text-xs hover:bg-black/5"
                      aria-expanded={openUploadId === b.id}
                      aria-controls={`upload-form-${b.id}`}
                    >
                      {openUploadId === b.id ? "Hide Upload Form" : "Show Upload Form"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(b.id)}
                      className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10"
                      title="Delete banner"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {openUploadId === b.id && (
                  <tr className="border-t border-black/10">
                    <td colSpan={10} className="px-4 py-3">
                      <div id={`upload-form-${b.id}`} className="rounded-md border border-black/10 bg-white p-3">
                        <form onSubmit={(e) => handleRowUploadPhotos(e, b.id)} className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm text-black/70 mb-1">Photo 1</label>
                            <input name="photo1" type="file" accept="image/*" className="w-full rounded-md border border-black/20 px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm text-black/70 mb-1">Photo 2</label>
                            <input name="photo2" type="file" accept="image/*" className="w-full rounded-md border border-black/20 px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm text-black/70 mb-1">Photo 3</label>
                            <input name="photo3" type="file" accept="image/*" className="w-full rounded-md border border-black/20 px-3 py-2" />
                          </div>
                          <div className="sm:col-span-3 flex items-center gap-3">
                            <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90">Upload</button>
                            {rowUploadingId === b.id && uploadProgress > 0 && (
                              <div className="flex-1">
                                <div className="h-2 w-full bg-black/10 rounded">
                                  <div className="h-2 bg-black rounded" style={{ width: `${uploadProgress}%` }} />
                                </div>
                                <span className="text-xs text-black/60">{uploadProgress}%</span>
                              </div>
                            )}
                          </div>
                        </form>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {pendingDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-md shadow-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-black mb-1">Delete this banner?</h3>
            <p className="text-sm text-black/70 mb-4">This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="px-3 py-1.5 rounded-md border border-black/30 text-black hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteBanner(pendingDeleteId!)}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}