"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminAiAgentPage() {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage("");
      try {
        const res = await fetch("/api/admin/ai-agent");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setUrl(String(data.url || ""));
      } catch (e) {
        setMessage("Could not load current AI Agent URL.");
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
      const res = await fetch("/api/admin/ai-agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("Saved successfully.");
    } catch (e) {
      setMessage("Failed to save AI Agent URL.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">AI Agent Link</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">AI Agent Button Link</h1>
      <p className="text-black/70 mb-6">Set the URL opened by the AI Agent button in the navigation bar.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      <section aria-labelledby="ai-agent-settings" className="rounded-xl border border-black/10 p-6 bg-white">
        <h2 id="ai-agent-settings" className="text-xl font-semibold text-black mb-3">Link</h2>
        {loading ? (
          <div className="text-black/70">Loading…</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-black mb-1">URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/ai"
                className="w-full rounded-md border border-black px-3 py-2"
              />
              <p className="text-xs text-black/50 mt-1">Use a full URL, including https://</p>
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