"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Testimonial = {
  id: number;
  name: string;
  role: string;
  initials?: string | null;
  quote: string;
  rating?: number | null;
  avatar?: string | null;
};

async function postJSON(url: string, data: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.json().catch(() => ({}));
}

async function patchJSON(url: string, data: any) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.json().catch(() => ({}));
}

async function del(url: string) {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
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

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const newAvatarUrl = useObjectUrl(newAvatar);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [avatarFiles, setAvatarFiles] = useState<Record<number, File | null>>({});

  async function load() {
    try {
      setLoading(true);
      const data = await fetch("/api/testimonials").then((r) => r.json()).catch(() => []);
      setItems(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (err: any) {
      setMessage(err.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const role = String(fd.get("role") || "").trim();
    const quote = String(fd.get("quote") || "").trim();
    const initials = String(fd.get("initials") || "").trim();
    const rating = Number(fd.get("rating") || 5);
    try {
      setMessage("");
      if (!name || !role || !quote) throw new Error("Name, role, and quote are required");
      const { id } = await postJSON("/api/admin/testimonials", { name, role, quote, initials: initials || null, rating });
      // Optional avatar upload
      const file = newAvatar;
      if (file) {
        const ffd = new FormData();
        ffd.append("avatar", file);
        ffd.append("testimonial_id", String(id));
        await uploadWithProgress("/api/admin/testimonials/upload", ffd, setUploadProgress);
        setTimeout(() => setUploadProgress(0), 600);
        setNewAvatar(null);
      }
      (e.target as HTMLFormElement).reset();
      await load();
      setMessage("Testimonial added");
    } catch (err: any) {
      setMessage(err.message || "Failed to add testimonial");
      setTimeout(() => setUploadProgress(0), 600);
    }
  }

  async function handleRowSave(id: number, data: Partial<Testimonial>) {
    try {
      setMessage("");
      await patchJSON(`/api/admin/testimonials/${id}`, data);
      const file = avatarFiles[id] || null;
      if (file) {
        const ffd = new FormData();
        ffd.append("avatar", file);
        ffd.append("testimonial_id", String(id));
        await uploadWithProgress("/api/admin/testimonials/upload", ffd, setUploadProgress);
        setTimeout(() => setUploadProgress(0), 600);
        setAvatarFiles((m) => ({ ...m, [id]: null }));
      }
      await load();
      setEditingId(null);
      setMessage("Testimonial updated");
    } catch (err: any) {
      setMessage(err.message || "Failed to update testimonial");
      setTimeout(() => setUploadProgress(0), 600);
    }
  }

  async function handleDelete(id: number) {
    try {
      setMessage("");
      await del(`/api/admin/testimonials/${id}`);
      await load();
      setMessage("Testimonial deleted");
    } catch (err: any) {
      setMessage(err.message || "Failed to delete testimonial");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">Testimonials</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Testimonials</h1>
      <p className="text-black/70 mb-6">Upload, edit, and remove customer testimonials shown on the homepage.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="add-testimonial" className="rounded-xl border border-black/10 p-6 bg-white mb-8" id="add">
        <h2 id="add-testimonial" className="text-xl font-semibold text-black mb-2">Add Testimonial</h2>
        <p className="text-sm text-black/70 mb-2">Provide the customer details and quote. Optionally upload an avatar.</p>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-3">
          <input name="name" placeholder="Name" className="w-full rounded-md border border-black/20 px-3 py-2" />
          <input name="role" placeholder="Role / Company" className="w-full rounded-md border border-black/20 px-3 py-2" />
          <input name="initials" placeholder="Initials (optional)" className="w-full rounded-md border border-black/20 px-3 py-2" />
          <input name="rating" type="number" min={1} max={5} defaultValue={5} placeholder="Rating (1-5)" className="w-full rounded-md border border-black/20 px-3 py-2" />
          <textarea name="quote" placeholder="Quote" className="sm:col-span-2 w-full rounded-md border border-black/20 px-3 py-2" rows={3} />
          <div className="sm:col-span-2 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={(e) => setNewAvatar(e.target.files?.[0] || null)} className="w-full rounded-md border border-black/20 px-3 py-2" />
            <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90">Add</button>
          </div>
          {(newAvatarUrl) && (
            <div className="sm:col-span-2 mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={newAvatarUrl} alt="Avatar preview" className="h-20 w-20 rounded-full border border-black/10" />
            </div>
          )}
          {uploadProgress > 0 && (
            <div className="sm:col-span-2">
              <div className="h-2 w-full bg-gray-200 rounded">
                <div className="h-2 bg-black rounded" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="text-xs text-gray-600">{uploadProgress}%</span>
            </div>
          )}
        </form>
      </section>

      <section aria-labelledby="current-testimonials" className="rounded-xl border border-black/10 p-6 bg-white">
        <h2 id="current-testimonials" className="text-xl font-semibold text-black mb-3">Current Testimonials</h2>
        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="text-left px-4 py-2">Person</th>
                <th className="text-left px-4 py-2">Quote</th>
                <th className="text-left px-4 py-2">Avatar</th>
                <th className="text-left px-4 py-2">Rating</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-gray-600">No testimonials yet. Add one above.</td>
                </tr>
              )}
              {items.map((t) => {
                const isEditing = editingId === t.id;
                const file = avatarFiles[t.id] || null;
                const fileUrl = file ? URL.createObjectURL(file) : "";
                return (
                  <tr key={t.id} className="border-t border-gray-300 align-top">
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <div className="grid gap-2">
                          <input defaultValue={t.name} placeholder="Name" className="w-full rounded-md border border-black/20 px-3 py-2" id={`name-${t.id}`} />
                          <input defaultValue={t.role} placeholder="Role / Company" className="w-full rounded-md border border-black/20 px-3 py-2" id={`role-${t.id}`} />
                          <input defaultValue={t.initials || ""} placeholder="Initials" className="w-full rounded-md border border-black/20 px-3 py-2" id={`initials-${t.id}`} />
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-black">{t.name}</div>
                          <div className="text-black/70 text-sm">{t.role}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <textarea defaultValue={t.quote} className="w-full rounded-md border border-black/20 px-3 py-2" rows={4} id={`quote-${t.id}`} />
                      ) : (
                        <p className="text-black/80">{t.quote}</p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fileUrl || t.avatar || "/avatar.svg"} alt={t.name} className="h-12 w-12 rounded-full border border-black/10" />
                        {isEditing && (
                          <input type="file" accept="image/*" onChange={(e) => setAvatarFiles((m) => ({ ...m, [t.id]: e.target.files?.[0] || null }))} className="w-full rounded-md border border-black/20 px-3 py-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input type="number" min={1} max={5} defaultValue={t.rating || 5} className="w-20 rounded-md border border-black/20 px-2 py-1" id={`rating-${t.id}`} />
                      ) : (
                        <div className="flex text-[#ff914d]">
                          {[...Array(Math.max(1, Math.min(5, t.rating || 5)))].map((_, i) => (
                            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.392 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-black/90"
                            onClick={() => {
                              const data: any = {
                                name: (document.getElementById(`name-${t.id}`) as HTMLInputElement)?.value,
                                role: (document.getElementById(`role-${t.id}`) as HTMLInputElement)?.value,
                                initials: (document.getElementById(`initials-${t.id}`) as HTMLInputElement)?.value || null,
                                quote: (document.getElementById(`quote-${t.id}`) as HTMLTextAreaElement)?.value,
                                rating: Number((document.getElementById(`rating-${t.id}`) as HTMLInputElement)?.value || 5),
                              };
                              handleRowSave(t.id, data);
                            }}
                          >Save</button>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10"
                            onClick={() => setEditingId(null)}
                          >Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button type="button" className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10" onClick={() => setEditingId(t.id)}>Edit</button>
                          <button type="button" className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10" onClick={() => handleDelete(t.id)}>Delete</button>
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