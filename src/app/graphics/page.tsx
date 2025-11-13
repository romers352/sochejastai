"use client";
import { useEffect, useState } from "react";

type Graphic = { id: string; title: string; src: string };

export default function GraphicsPage() {
  const [items, setItems] = useState<Graphic[]>([]);
  const [active, setActive] = useState<Graphic | null>(null);

  useEffect(() => {
    fetch("/api/gallery/graphics")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-[#ff914d] mb-2">Graphic Design Gallery</h1>
      <p className="text-[#ff914d]/80 mb-6">Visual designs and illustrations from our latest work.</p>
      <section aria-labelledby="graphics-grid-heading">
        <h2 id="graphics-grid-heading" className="sr-only">Graphic Items</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((g) => (
          <button
            key={g.id}
            onClick={() => setActive(g)}
            className="group relative overflow-hidden rounded-lg border border-[#ff914d] bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.src} alt={g.title} className="h-40 w-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#ff914d]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute bottom-2 left-2 text-[#ff914d] text-sm">{g.title}</span>
          </button>
        ))}
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 bg-[#ff914d]/20 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setActive(null)}>
          <div className="bg-white rounded-xl overflow-hidden max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.src} alt={active.title} className="w-full max-h-[70vh] object-contain bg-white" />
            <div className="p-4 flex justify-between items-center">
              <h2 className="text-[#ff914d] font-semibold">{active.title}</h2>
              <button className="px-3 py-1.5 rounded-md bg-white text-[#ff914d] hover:bg-white/90" onClick={() => setActive(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}