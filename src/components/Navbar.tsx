"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [branding, setBranding] = useState<{ navbar: string | null } | null>(null);
  const [agentUrl, setAgentUrl] = useState<string>("https://convicted-collected-internationally-sunny.trycloudflare.com/");
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Load branding (navbar logo)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/home/branding");
        const data = await res.json();
        setBranding({ navbar: data?.navbar || null });
      } catch {}
    })();
  }, []);
  // Load AI Agent URL
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ai-agent");
        const data = await res.json();
        if (data?.url) setAgentUrl(String(data.url));
      } catch {}
    })();
  }, []);
  // Hide public navbar on admin routes
  if (pathname.startsWith("/admin")) return null;
  return (
    <header className="sticky top-0 z-40 bg-[#ff914d] border-b border-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white">
              {branding?.navbar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.navbar} alt="Logo" className="h-8 w-auto" />
              ) : (
                <>
                  <span className="inline-block w-8 h-8 rounded-full bg-white/20" aria-hidden />
                  <span className="font-bold">Soche Jastai</span>
                </>
              )}
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-white" role="navigation" aria-label="Main Navigation">
            <Link
              href="/"
              className={`transition-opacity ${pathname === "/" ? "font-semibold" : "hover:opacity-80"}`}
            >
              Home
            </Link>
            <Link
              href="/photos"
              className={`transition-opacity ${pathname === "/photos" ? "font-semibold" : "hover:opacity-80"}`}
            >
              Photos
            </Link>
            <Link
              href="/videos"
              className={`transition-opacity ${pathname === "/videos" ? "font-semibold" : "hover:opacity-80"}`}
            >
              Videos
            </Link>
            <Link
              href="/graphics"
              className={`transition-opacity ${pathname === "/graphics" ? "font-semibold" : "hover:opacity-80"}`}
            >
              Graphics
            </Link>
            <Link
              href="/contact"
              className={`transition-opacity ${pathname === "/contact" ? "font-semibold" : "hover:opacity-80"}`}
            >
              Contact Us
            </Link>
            <a
              href={agentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md bg-white text-[#ff914d] hover:bg-white/90 transition-colors"
            >
              AI Agent
            </a>
          </nav>

          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 shrink-0"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-white bg-[#ff914d]">
          <div className="px-4 py-3 space-y-2">
            <Link href="/" className={`block py-2 text-white ${pathname === "/" ? "font-semibold" : "hover:opacity-80"}`}>Home</Link>
            <Link href="/photos" className={`block py-2 text-white ${pathname === "/photos" ? "font-semibold" : "hover:opacity-80"}`}>Photos</Link>
            <Link href="/videos" className={`block py-2 text-white ${pathname === "/videos" ? "font-semibold" : "hover:opacity-80"}`}>Videos</Link>
            <Link href="/graphics" className={`block py-2 text-white ${pathname === "/graphics" ? "font-semibold" : "hover:opacity-80"}`}>Graphics</Link>
            <Link href="/contact" className={`block py-2 text-white ${pathname === "/contact" ? "font-semibold" : "hover:opacity-80"}`}>Contact Us</Link>
            <a
              href={agentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-white"
            >
              AI Agent
            </a>
          </div>
        </div>
      )}
    </header>
  );
}