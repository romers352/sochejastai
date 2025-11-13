"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Service = { id: number; title: string; description: string; icon?: string | null };

async function postJSON(url: string, data: any) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.json().catch(() => ({}));
}
async function patchJSON(url: string, data: any) {
  const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.json().catch(() => ({}));
}
async function del(url: string) {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.json().catch(() => ({}));
}

function useObjectUrl(file: File | null) {
  return useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
}

async function uploadWithProgress(url: string, formData: FormData, setProgress?: (n: number) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (!setProgress) return;
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
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

const ICONS = [
  { value: "share", label: "Social / Share" },
  { value: "video", label: "Video" },
  { value: "palette", label: "Palette / Design" },
  { value: "camera", label: "Camera" },
];

export default function AdminServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [addIconFile, setAddIconFile] = useState<File | null>(null);
  const addIconPreviewUrl = useObjectUrl(addIconFile);
  const [rowIconFiles, setRowIconFiles] = useState<Record<number, File | null>>({});

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (e: any) {
      setMessage(e?.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Partial<Service> = {
      title: String(fd.get("title") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      icon: String(fd.get("icon") || "").trim() || null,
    };
    if (!payload.title || !payload.description) {
      setMessage("Title and description are required");
      return;
    }
    try {
      setMessage("");
      // If a file is chosen, upload first and use its URL as icon
      if (addIconFile) {
        const ffd = new FormData();
        ffd.append("icon", addIconFile);
        const { src } = await uploadWithProgress("/api/admin/services/upload", ffd, setUploadProgress);
        payload.icon = src || null;
      }
      await postJSON("/api/admin/services", payload);
      (e.currentTarget as any).reset();
      setAddIconFile(null);
      setTimeout(() => setUploadProgress(0), 500);
      await load();
      setMessage("Service added");
    } catch (err: any) {
      setMessage(err?.message || "Failed to add service");
      setTimeout(() => setUploadProgress(0), 500);
    }
  }

  async function handleRowSave(id: number, data: Partial<Service>) {
    try {
      setMessage("");
      const file = rowIconFiles[id] || null;
      // If a new icon file is attached, upload it first and include in patch
      if (file) {
        const ffd = new FormData();
        ffd.append("icon", file);
        const { src } = await uploadWithProgress("/api/admin/services/upload", ffd, setUploadProgress);
        data.icon = src || null;
      }
      await patchJSON(`/api/admin/services/${id}`, data);
      setRowIconFiles((prev) => ({ ...prev, [id]: null }));
      await load();
      setEditingId(null);
      setMessage("Service updated");
    } catch (err: any) {
      setMessage(err?.message || "Failed to update service");
      setTimeout(() => setUploadProgress(0), 500);
    }
  }

  async function handleDelete(id: number) {
    try {
      await del(`/api/admin/services/${id}`);
      await load();
      setMessage("Service deleted");
    } catch (err: any) {
      setMessage(err?.message || "Failed to delete service");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">Services</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Services</h1>
      <p className="text-black/70 mb-6">Manage the “Our Services” items shown on the homepage.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="add-service" className="rounded-xl border border-black/10 p-6 bg-white mb-8" id="add">
        <h2 id="add-service" className="text-xl font-semibold text-black mb-2">Add Service</h2>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-3">
          <input name="title" placeholder="Title" className="w-full rounded-md border border-black/20 px-3 py-2" />
          <select name="icon" className="w-full rounded-md border border-black/20 px-3 py-2">
            <option value="">Icon (optional)</option>
            {ICONS.map((i) => (<option key={i.value} value={i.value}>{i.label}</option>))}
          </select>
          <div className="sm:col-span-2">
            <label className="block text-sm text-black/70 mb-1">Upload icon (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setAddIconFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
            {addIconPreviewUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img src={addIconPreviewUrl} alt="Icon preview" className="w-12 h-12 rounded bg-gray-100 object-cover" />
                {uploadProgress > 0 && (<div className="flex-1 h-2 bg-gray-200 rounded"><div className="h-2 bg-black rounded" style={{ width: `${uploadProgress}%` }} /></div>)}
              </div>
            )}
            <p className="text-xs text-black/60 mt-1">If a file is chosen, it will be used instead of the dropdown icon.</p>
          </div>
          <textarea name="description" placeholder="Description" className="w-full rounded-md border border-black/20 px-3 py-2 sm:col-span-2" rows={4} />
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90">Add</button>
            <a href="#list" className="px-4 py-2 rounded-md border border-black text-black hover:bg-black/10">Go to list</a>
          </div>
        </form>
      </section>

      <section aria-labelledby="current-services" className="rounded-xl border border-black/10 p-6 bg-white" id="list">
        <h2 id="current-services" className="text-xl font-semibold text-black mb-3">Current Services</h2>
        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Description</th>
                <th className="text-left px-4 py-2">Icon</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-3 text-gray-600">No services yet. Add one above.</td></tr>
              )}
              {items.map((s) => {
                const isEditing = editingId === s.id;
                return (
                  <tr key={s.id} className="border-t border-black/10">
                    <td className="px-4 py-2 align-top">
                      {isEditing ? (
                        <input defaultValue={s.title} onChange={(e) => (s.title = e.target.value)} className="w-full rounded-md border border-black/20 px-2 py-1" />
                      ) : (
                        <div className="font-semibold text-black">{s.title}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top">
                      {isEditing ? (
                        <textarea defaultValue={s.description} onChange={(e) => (s.description = e.target.value)} className="w-full rounded-md border border-black/20 px-2 py-1" rows={3} />
                      ) : (
                        <div className="text-black/70 whitespace-pre-line">{s.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top">
                      {isEditing ? (
                        <div className="space-y-2">
                          <select defaultValue={s.icon || ''} onChange={(e) => (s.icon = e.target.value)} className="w-full rounded-md border border-black/20 px-2 py-1">
                            <option value="">None</option>
                            {ICONS.map((i) => (<option key={i.value} value={i.value}>{i.label}</option>))}
                          </select>
                          <div>
                            <label className="block text-xs text-black/70 mb-1">Replace with uploaded icon</label>
                            <input type="file" accept="image/*" onChange={(e) => setRowIconFiles((prev) => ({ ...prev, [s.id]: e.target.files?.[0] || null }))} className="w-full rounded-md border border-black/20 px-2 py-1" />
                            {rowIconFiles[s.id] && (
                              <div className="mt-2 flex items-center gap-2">
                                <img src={useObjectUrl(rowIconFiles[s.id] || null)} alt="Preview" className="w-10 h-10 rounded bg-gray-100 object-cover" />
                                {uploadProgress > 0 && (<div className="flex-1 h-2 bg-gray-200 rounded"><div className="h-2 bg-black rounded" style={{ width: `${uploadProgress}%` }} /></div>)}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const v = s.icon || '';
                          const isImage = v.startsWith('/') || v.startsWith('http');
                          if (isImage) {
                            return <img src={v} alt="Icon" className="w-10 h-10 rounded bg-gray-100 object-cover" />;
                          }
                          return <span className="text-black/70">{v || '—'}</span>;
                        })()
                      )}
                    </td>
                    <td className="px-4 py-2 align-top">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-black/90" onClick={() => handleRowSave(s.id, { title: s.title, description: s.description, icon: s.icon || null })}>Save</button>
                          <button className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10" onClick={() => setEditingId(s.id)}>Edit</button>
                          <button className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={() => handleDelete(s.id)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}