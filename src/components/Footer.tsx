"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Footer() {
  const pathname = usePathname();
  const [branding, setBranding] = useState<{ footer: string | null } | null>(null);
  const year = new Date().getUTCFullYear();
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/home/branding");
        const data = await res.json();
        setBranding({ footer: data?.footer || null });
      } catch {}
    })();
  }, []);
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-16 bg-[#0A2540] text-white border-t border-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-white">
              {branding?.footer ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.footer} alt="Logo" className="h-7 w-auto" />
              ) : (
                <>
                  <span className="inline-block w-7 h-7 rounded-full bg-white/20" aria-hidden />
                  <span className="font-semibold">Soche Jastai</span>
                </>
              )}
            </Link>
            <p className="mt-3 text-sm">Digital Marketing Agency crafting Photos, Videos & Graphics.</p>
          </div>

          <nav aria-label="Quick Links" className="text-sm">
            <h2 className="text-sm font-semibold mb-2">Quick Links</h2>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:opacity-80 transition-opacity">Home</Link></li>
              <li><Link href="/photos" className="hover:opacity-80 transition-opacity">Photos</Link></li>
              <li><Link href="/videos" className="hover:opacity-80 transition-opacity">Videos</Link></li>
              <li><Link href="/graphics" className="hover:opacity-80 transition-opacity">Graphics</Link></li>
              <li><Link href="/contact" className="hover:opacity-80 transition-opacity">Contact Us</Link></li>
            </ul>
          </nav>

          <nav aria-label="Legal" className="text-sm">
            <h2 className="text-sm font-semibold mb-2">Legal</h2>
            <ul className="space-y-2">
              <li><Link href="/terms" className="hover:opacity-80 transition-opacity">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:opacity-80 transition-opacity">Privacy Policy</Link></li>
            </ul>
          </nav>

          <div className="text-sm">
            <h2 className="text-sm font-semibold mb-2">Get in Touch</h2>
            <p>Questions or projects? Visit our <Link href="/contact" className="underline hover:opacity-80 transition-opacity">Contact page</Link>.</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" suppressHydrationWarning>© {year} Soche Jastai Digital Marketing Agency</p>
          <p className="text-xs">Built with Next.js & Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}