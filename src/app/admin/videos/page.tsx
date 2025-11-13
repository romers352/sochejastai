"use client";
// Admin modal preview integration pending
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminModal from "@/components/AdminModal";

type Video = { id: number; title: string; youtubeId?: string; src?: string; type?: "youtube" | "file" };

async function postJSON(url: string, data: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
}

export default function AdminVideosPage() {
  const [items, setItems] = useState<Video[]>([]);
  const [message, setMessage] = useState<string>("");
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [preview, setPreview] = useState<{ type: "file" | "youtube"; src?: string; youtubeId?: string; title: string } | null>(null);

  async function load() {
    const data = await fetch("/api/gallery/videos").then((r) => r.json()).catch(() => []);
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
      await postJSON("/api/admin/videos", {
        title: String(form.get("title")),
        youtubeId: String(form.get("youtubeId")),
      });
      setMessage("Video added");
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err: any) {
      setMessage(err.message || "Error adding video");
    }
  }

  async function handleDelete(id: number) {
    try {
      if (!confirm("Delete this video? This cannot be undone.")) return;
      setMessage("");
      const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to delete video");
      }
      setMessage("Video deleted");
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
    const MAX_BYTES = 1024 * 1024 * 1024; // 1GB
    try {
      setMessage("");
      setUploadProgress(0);
      if (!file || !title) throw new Error("Title and file are required");
      if (!file.type.startsWith("video/")) throw new Error("Only video files are allowed");
      if (file.size > MAX_BYTES) throw new Error("File too large (max 1GB)");
      await uploadWithProgress("/api/admin/videos/upload", fd);
      setMessage("Video uploaded");
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
      <AdminModal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.title || "Video Preview"}>
        {preview && (
          preview.type === "file" && preview.src ? (
            <video src={preview.src} controls autoPlay className="w-full max-h-[70vh]" />
          ) : preview.type === "youtube" && preview.youtubeId ? (
            <div className="w-full">
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${preview.youtubeId}`}
                  title={preview.title || "YouTube video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null
        )}
      </AdminModal>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold">Videos</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Videos</h1>
      <p className="text-gray-700 mb-6">Manage YouTube videos for the gallery.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="add-video" className="rounded-xl border border-black p-6 bg-white mb-8">
        <h2 id="add-video" className="text-xl font-semibold text-black mb-2">Add Video</h2>
        <p className="text-sm text-gray-700 mb-2">Paste the YouTube ID from the URL; for example, in <span className="font-mono">https://youtube.com/watch?v=dQw4w9WgXcQ</span>, the ID is <span className="font-mono">dQw4w9WgXcQ</span>.</p>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-3">
          <input name="title" placeholder="Title" className="w-full rounded-md border border-black px-3 py-2" />
          <input name="youtubeId" placeholder="YouTube ID (e.g., dQw4w9WgXcQ)" className="w-full rounded-md border border-black px-3 py-2" aria-describedby="youtube-help" />
          <div className="sm:col-span-3">
            <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900">Add Video</button>
          </div>
        </form>
        <div className="mt-3 text-sm">
          <button type="button" onClick={() => setHelpOpen((v) => !v)} className="text-black hover:underline" aria-expanded={helpOpen} aria-controls="youtube-help">How to find the YouTube ID?</button>
          {helpOpen && (
            <div id="youtube-help" className="mt-2 rounded-md border border-gray-300 bg-gray-50 p-3 text-gray-800">
              Open the YouTube video and copy the value after <span className="font-mono">v=</span> in the URL. Alternatively, use the share link and extract the ID.
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="upload-video" className="rounded-xl border border-black p-6 bg-white mb-8">
        <h2 id="upload-video" className="text-xl font-semibold text-black mb-2">Upload Video File</h2>
        <p className="text-sm text-gray-700 mb-2">Upload an MP4, WebM, or Ogg video. Max 1GB.</p>
        <form onSubmit={handleUpload} className="grid sm:grid-cols-3 gap-3">
          <input name="title" placeholder="Title" className="w-full rounded-md border border-black px-3 py-2" />
          <input name="file" type="file" accept="video/*" className="w-full rounded-md border border-black px-3 py-2" />
          <div className="sm:col-span-3 flex items-center gap-3">
            <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900">Upload</button>
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

      <section aria-labelledby="current-videos">
        <h2 id="current-videos" className="text-xl font-semibold text-black mb-3">Current Videos</h2>
        <div className="overflow-x-auto rounded-xl border border-black bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Source</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-gray-600">No videos yet. Add one above.</td>
                </tr>
              )}
              {items.map((v, i) => (
                <tr key={i} className="border-t border-gray-300">
                  <td className="px-4 py-2">{v.title}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {v.type === "file" && v.src ? (
                        <video
                          src={v.src}
                          className="h-12 w-auto rounded border border-black/10 cursor-pointer"
                          controls
                          muted
                          onClick={() => setPreview({ type: "file", src: v.src, title: v.title })}
                        />
                      ) : v.youtubeId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                          alt={v.title || "YouTube thumbnail"}
                          className="h-12 w-auto rounded border border-black/10 cursor-pointer"
                          onClick={() => setPreview({ type: "youtube", youtubeId: v.youtubeId!, title: v.title })}
                        />
                      ) : (
                        <span className="text-gray-600">Invalid video entry</span>
                      )}
                      {v.type === "file" && v.src ? (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10"
                          onClick={() => setPreview({ type: "file", src: v.src, title: v.title })}
                          title="Preview video"
                        >
                          Preview
                        </button>
                      ) : v.youtubeId ? (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10"
                          onClick={() => setPreview({ type: "youtube", youtubeId: v.youtubeId!, title: v.title })}
                          title="Preview YouTube video"
                        >
                          Preview
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10"
                      title="Delete video"
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