"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [compact, setCompact] = useState<boolean>(false);

  useEffect(() => {
    const c = localStorage.getItem("admin_sidebar_collapsed");
    const d = localStorage.getItem("admin_density_compact");
    setCollapsed(c === "true");
    setCompact(d === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("admin_sidebar_collapsed", String(collapsed));
  }, [collapsed]);
  useEffect(() => {
    localStorage.setItem("admin_density_compact", String(compact));
  }, [compact]);

  const navCategories: { title: string; items: { href: string; label: string }[] }[] = [
    { title: "Overview", items: [{ href: "/admin", label: "Dashboard" }] },
    {
      title: "Content",
      items: [
        { href: "/admin/banners", label: "Banners" },
        { href: "/admin/photos", label: "Photos" },
        { href: "/admin/videos", label: "Videos" },
        { href: "/admin/graphics", label: "Graphics" },
        { href: "/admin/testimonials", label: "Testimonials" },
        { href: "/admin/services", label: "Services" },
        { href: "/admin/home/branding", label: "Branding" },
        { href: "/admin/partner-logos", label: "Partner Logos" },
      ],
    },
    {
      title: "Communication",
      items: [
        { href: "/admin/contacts", label: "Contact Messages" },
      ],
    },
  ];

  return (
    <div className={`min-h-screen bg-[#ffffff] text-[#0B0C10] ${compact ? "text-[15px]" : "text-base"}`}>
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:block focus:p-2">Skip to content</a>
      <header className="border-b border-black/10 bg-white">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${compact ? "py-2" : "py-3"} flex items-center justify-between`}>
          <span className="text-xl font-bold text-black">Admin Panel</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompact((v) => !v)}
              className="px-3 py-1 rounded-md border border-black text-black bg-white hover:bg-black/10"
              title="Toggle compact density"
            >
              {compact ? "Comfortable" : "Compact"}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="px-3 py-1 rounded-md border border-black text-black bg-white hover:bg-black/10"
              title="Collapse/expand sidebar"
            >
              {collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            </button>
            <a
              href="/api/admin/logout"
              className="px-3 py-1 rounded-md border border-black text-black bg-white hover:bg-black/10 shrink-0 whitespace-nowrap"
              title="Logout"
            >
              Logout
            </a>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {!collapsed && (
          <aside className="md:sticky md:top-6 self-start rounded-xl border border-black/10 bg-white" aria-label="Admin Navigation">
            <nav className="py-2">
              {navCategories.map((cat) => (
                <div key={cat.title} className="mb-2">
                  <div className="px-4 py-2 text-xs uppercase tracking-wide text-black/60">{cat.title}</div>
                  {cat.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`block px-4 ${compact ? "py-1.5" : "py-2"} border-l-4 ${active ? "border-black bg-black/5 text-black" : "border-transparent text-black/70 hover:text-black"}`}
                        title={item.label}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        )}
        <main id="admin-main">{children}</main>
      </div>
    </div>
  );
}