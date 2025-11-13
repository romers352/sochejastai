"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [banners, setBanners] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [graphics, setGraphics] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const [p, v, g, b, t] = await Promise.all([
          fetch("/api/gallery/photos", { signal: controller.signal }).then((r) => r.json()).catch(() => []),
          fetch("/api/gallery/videos", { signal: controller.signal }).then((r) => r.json()).catch(() => []),
          fetch("/api/gallery/graphics", { signal: controller.signal }).then((r) => r.json()).catch(() => []),
          fetch("/api/banners", { signal: controller.signal }).then((r) => r.json()).catch(() => []),
          fetch("/api/testimonials", { signal: controller.signal }).then((r) => r.json()).catch(() => []),
        ]);
        setPhotos(Array.isArray(p) ? p : []);
        setVideos(Array.isArray(v) ? v : []);
        setGraphics(Array.isArray(g) ? g : []);
        setBanners(Array.isArray(b) ? b : []);
        setTestimonials(Array.isArray(t) ? t : []);
        setError(null);
      } catch (err: any) {
        if (err?.name !== "AbortError") setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Banners", count: banners.length, manage: "/admin/banners", add: "/admin/banners#add" },
      { label: "Photos", count: photos.length, manage: "/admin/photos", add: "/admin/photos#add" },
      { label: "Videos", count: videos.length, manage: "/admin/videos", add: "/admin/videos#add" },
      { label: "Graphics", count: graphics.length, manage: "/admin/graphics", add: "/admin/graphics#add" },
      { label: "Testimonials", count: testimonials.length, manage: "/admin/testimonials", add: "/admin/testimonials#add" },
    ],
    [banners.length, photos.length, videos.length, graphics.length, testimonials.length]
  );

  const recent = useMemo(() => {
    const items = [
      ...banners.map((b) => ({ type: "Banner", title: b.title, preview: b.bg })),
      ...photos.map((p) => ({ type: "Photo", title: p.title ?? p.src ?? "Photo", preview: p.src })),
      ...videos.map((v) => ({ type: "Video", title: v.title ?? v.youtubeId ?? "Video", preview: v.youtubeId ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` : undefined })),
      ...graphics.map((g) => ({ type: "Graphic", title: g.title ?? g.src ?? "Graphic", preview: g.src })),
    ];
    return items.slice(0, 6);
  }, [banners, photos, videos, graphics]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-black mb-2">Dashboard</h1>
      <p className="text-black/70 mb-6">
        Overview of site content. Current totals — Banners: {loading ? "—" : banners.length}, Photos: {loading ? "—" : photos.length}, Videos: {loading ? "—" : videos.length}, Graphics: {loading ? "—" : graphics.length}
      </p>

      {error && (
        <div role="alert" className="mb-6 rounded-md bg-white border border-black text-black px-4 py-2">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <section key={s.label} aria-label={`${s.label} summary`} className="rounded-xl border border-black/10 p-4 bg-white">
            <div className="text-sm text-black/60">{s.label}</div>
            <div className="text-3xl font-semibold text-black">{loading ? "—" : s.count}</div>
            <div className="mt-3 h-2 w-full bg-black/10 rounded" aria-hidden>
              <div className="h-2 bg-black rounded" style={{ width: `${Math.min(100, (s.count || 0) * 5)}%` }} />
            </div>
            <div className="mt-3 flex gap-2">
              <Link href={s.manage} className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10 shrink-0 whitespace-nowrap" title={`Go to ${s.label} management`}>Manage</Link>
              <Link href={s.add} className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-black/90 shrink-0 whitespace-nowrap" title={`Quick add ${s.label.slice(0, -1)}`}>Add</Link>
            </div>
          </section>
        ))}
      </div>

      <section aria-labelledby="quick-actions" className="rounded-xl border border-black/10 p-6 bg-white mb-8">
        <h2 id="quick-actions" className="text-xl font-semibold text-black">Quick Actions</h2>
        <p className="text-black/70">Jump straight into common tasks.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/banners#add" className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-black/90 shrink-0 whitespace-nowrap" title="Quickly add a new banner">Add Banner</Link>
          <Link href="/admin/photos#add" className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-black/90 shrink-0 whitespace-nowrap" title="Upload a new photo">Add Photo</Link>
          <Link href="/admin/videos#add" className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-black/90 shrink-0 whitespace-nowrap" title="Add a new video">Add Video</Link>
          <Link href="/admin/graphics#add" className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-black/90 shrink-0 whitespace-nowrap" title="Add a new graphic">Add Graphic</Link>
          <Link href="/admin/home/cta" className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10 shrink-0 whitespace-nowrap" title="Upload images for the three CTA containers">Edit Homepage CTA Images</Link>
          <Link href="/admin/home/sections" className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10 shrink-0 whitespace-nowrap" title="Arrange homepage sections and edit content">Edit Homepage Sections</Link>
          <Link href="/admin/home/branding" className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10 shrink-0 whitespace-nowrap" title="Upload navbar and footer logos">Edit Branding (Navbar & Footer)</Link>
          <Link href="/admin/legal" className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10 shrink-0 whitespace-nowrap" title="Edit Privacy Policy and Terms & Conditions">Edit Legal (Privacy & Terms)</Link>
          <Link href="/admin/contact-settings" className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10 shrink-0 whitespace-nowrap" title="Edit email, phone, and hours shown on Contact page">Edit Contact Info</Link>
          <Link href="/admin/ai-agent" className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10 shrink-0 whitespace-nowrap" title="Set the external URL for the AI Agent navbar button">Edit AI Agent Link</Link>
        </div>
      </section>

      <section aria-labelledby="recent" className="rounded-xl border border-black/10 p-6 bg-white">
        <h2 id="recent" className="text-xl font-semibold text-black">Recent Items</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 text-black">
              <tr>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Preview</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-black/70">No items found.</td>
                </tr>
              )}
              {recent.map((item, idx) => (
                <tr key={idx} className="border-t border-black/10">
                  <td className="px-4 py-2">{item.type}</td>
                  <td className="px-4 py-2">{item.title}</td>
                  <td className="px-4 py-2">
                    {item.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.preview} alt={item.title} className="w-20 h-12 rounded-md object-cover" />
                    ) : (
                      <span className="text-[#0B0C10]/60">—</span>
                    )}
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