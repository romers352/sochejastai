"use client";
import { useEffect, useState } from "react";

type Video = {
  id: string;
  title: string;
  type: "youtube" | "file";
  youtubeId?: string;
  src?: string;
};

export default function VideosPage() {
  const [items, setItems] = useState<Video[]>([]);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    fetch("/api/gallery/videos")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  function guessMimeFromSrc(src?: string) {
    if (!src) return "video/mp4";
    const ext = src.split(".").pop()?.toLowerCase() || "";
    switch (ext) {
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "ogg":
      case "ogv":
        return "video/ogg";
      default:
        return "video/mp4";
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-[#ff914d] mb-2">Video Gallery</h1>
      <p className="text-[#ff914d]/80 mb-6">Watch highlights and stories from our latest projects.</p>
      <section aria-labelledby="videos-grid-heading">
        <h2 id="videos-grid-heading" className="sr-only">Video Items</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((v) => (
            <button key={v.id} onClick={() => setActive(v)} className="block text-left">
              <div className="relative aspect-video overflow-hidden rounded-lg border border-[#ff914d] bg-white">
                {/* Thumbnail layer */}
                {v.youtubeId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                    alt={v.title || "Video thumbnail"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : v.src ? (
                  <video
                    src={v.src}
                    muted
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white" />
                )}

                {/* Overlay + play icon */}
                <div className="absolute inset-0 bg-black/10 hover:bg-black/20 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-[#ff914d]" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              <div className="mt-2 text-[#ff914d] font-medium">{v.title}</div>
            </button>
          ))}
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 bg-[#ff914d]/20 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setActive(null)}>
          <div className="bg-white rounded-xl overflow-hidden max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video w-full relative">
              {active.type === "youtube" && active.youtubeId ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${active.youtubeId}`}
                  title={active.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : active.type === "file" && active.src ? (
                <>
                  <video
                    className="w-full h-full"
                    controls
                    preload="metadata"
                    playsInline
                    // discourage native download button
                    controlsList="nodownload"
                    // make sure audio is enabled by default
                    muted={false}
                    onPlay={(ev) => {
                      try {
                        const v = ev.currentTarget as HTMLVideoElement;
                        v.muted = false;
                        v.volume = 1.0;
                      } catch {}
                    }}
                    onLoadedMetadata={(ev) => {
                      try {
                        const v = ev.currentTarget as HTMLVideoElement;
                        v.muted = false;
                        if (v.volume === 0) v.volume = 1.0;
                      } catch {}
                    }}
                  >
                    <source src={active.src} type={guessMimeFromSrc(active.src)} />
                    Your browser does not support the video tag.
                  </video>
                  {/* Visible watermark overlay during playback */}
                  <div className="pointer-events-none absolute bottom-2 right-3 text-white/70 bg-black/30 px-2 py-1 rounded-md text-xs">
                    © Soche Jastai
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#ff914d]">
                  <span>Invalid video</span>
                </div>
              )}
            </div>
            <div className="p-4 flex justify-between items-center">
              <h2 className="text-[#ff914d] font-semibold">{active.title}</h2>
              <button className="px-3 py-1.5 rounded-md bg-[#ff914d] text-white hover:opacity-90" onClick={() => setActive(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}