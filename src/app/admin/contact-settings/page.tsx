"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type ContactSettings = {
  email: string;
  phone: string;
  hours: string;
};

export default function AdminContactSettingsPage() {
  const [settings, setSettings] = useState<ContactSettings>({ email: "", phone: "", hours: "" });
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage("");
      try {
        const res = await fetch("/api/admin/contact-settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        setSettings({
          email: String(data.email || ""),
          phone: String(data.phone || ""),
          hours: String(data.hours || ""),
        });
      } catch (e) {
        setMessage("Could not load current settings.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/admin/contact-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("Saved successfully.");
    } catch (e) {
      setMessage("Failed to save settings.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">Contact Settings</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Get in touch Details</h1>
      <p className="text-black/70 mb-6">Edit email, phone, and business hours shown on the Contact page.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="contact-settings" className="rounded-xl border border-black/10 p-6 bg-white">
        <h2 id="contact-settings" className="text-xl font-semibold text-black mb-3">Details</h2>
        {loading ? (
          <div className="text-black/70">Loading…</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
                placeholder="hello@yourdomain.com"
                className="w-full rounded-md border border-black px-3 py-2"
              />
              <p className="text-xs text-black/50 mt-1">Shown as a clickable mailto link.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
                placeholder="+977-98XXXXXXX"
                className="w-full rounded-md border border-black px-3 py-2"
              />
              <p className="text-xs text-black/50 mt-1">Shown as a clickable tel link.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-black mb-1">Hours</label>
              <input
                type="text"
                value={settings.hours}
                onChange={(e) => setSettings((s) => ({ ...s, hours: e.target.value }))}
                placeholder="Mon–Fri, 9:00 AM – 6:00 PM"
                className="w-full rounded-md border border-black px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90">Save</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}