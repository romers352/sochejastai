"use client";
import { useEffect, useRef, useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [contactEmail, setContactEmail] = useState<string>("hello@sochejastai.example");
  const [contactPhone, setContactPhone] = useState<string>("+977-9800000000");
  const [contactHours, setContactHours] = useState<string>("Mon–Fri, 9:00 AM – 6:00 PM");
  const apiKey = process.env.NEXT_PUBLIC_GMAPS_API_KEY;
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const listenersRef = useRef<{ cleanup?: () => void }>({});
  const markerRef = useRef<any>(null);
  const nbLat = Number(process.env.NEXT_PUBLIC_NBTC_LAT ?? 27.7172);
  const nbLng = Number(process.env.NEXT_PUBLIC_NBTC_LNG ?? 85.3240);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    setSuccess(false);

    const form = new FormData(e.currentTarget);
    const formData = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      phone: String(form.get("phone")) || null,
      message: String(form.get("message")),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setStatus("Thanks! We'll get back to you soon.");
        (e.target as HTMLFormElement).reset();
      } else {
        setSuccess(false);
        setStatus(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setSuccess(false);
      setStatus("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Initialize Google Maps JS API if API key available; add right-click drag support
  useEffect(() => {
    if (!apiKey) return; // Fallback to iframe embed when no API key
    const scriptId = "gmap-script";
    const existing = document.getElementById(scriptId);
    const initMap = () => {
      const google = (window as any).google;
      if (!google || !mapDivRef.current) return;
      const map = new google.maps.Map(mapDivRef.current, {
        center: { lat: nbLat, lng: nbLng },
        zoom: 13,
        mapTypeId: mapType === "satellite" ? "satellite" : "roadmap",
        gestureHandling: "greedy", // allow wheel/trackpad
      });
      mapRef.current = map;
      markerRef.current = new google.maps.Marker({ position: { lat: nbLat, lng: nbLng }, map });

      // Right-click drag
      const el = mapDivRef.current;
      if (!el) return;
      const onContextMenu = (e: MouseEvent) => e.preventDefault();
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      const onMouseDown = (e: MouseEvent) => {
        if (e.button === 2) { // right button
          dragging = true;
          lastX = e.clientX;
          lastY = e.clientY;
          e.preventDefault();
        }
      };
      const onMouseUp = () => { dragging = false; };
      const onMouseMove = (e: MouseEvent) => {
        if (!dragging || !mapRef.current) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        // Pan opposite to cursor movement to simulate drag
        mapRef.current.panBy(-dx, -dy);
      };
      el.addEventListener("contextmenu", onContextMenu);
      el.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      el.addEventListener("mousemove", onMouseMove);
      listenersRef.current.cleanup = () => {
        el.removeEventListener("contextmenu", onContextMenu);
        el.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        el.removeEventListener("mousemove", onMouseMove);
      };
    };
    if (!existing) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=quarterly&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
    return () => {
      listenersRef.current.cleanup?.();
    };
  }, [apiKey]);

  // Keep map type in sync when using JS API
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapTypeId(mapType === "satellite" ? "satellite" : "roadmap");
    }
  }, [mapType]);

  // No search; fixed NBTC pin from env coords

  // Load contact settings (email, phone, hours) from public API
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/contact-settings");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setContactEmail(String(data.email || "hello@sochejastai.example"));
        setContactPhone(String(data.phone || "+977-9800000000"));
        setContactHours(String(data.hours || "Mon–Fri, 9:00 AM – 6:00 PM"));
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-[#ff914d]/5 to-white py-16 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 animate-fade-in-up">Contact Us</h1>
          <p className="mt-3 text-base sm:text-xl text-gray-600 animate-fade-in-up delay-200">Have a project in mind? We'd love to hear from you.</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-fade-in-up">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-[#ff914d]/30 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a message</h2>
            <p className="text-gray-600 mb-6">Fill out the form and we’ll get back to you shortly.</p>

            <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="contact-form-heading">
              <h3 id="contact-form-heading" className="sr-only">Message Form</h3>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  className="mt-1 w-full rounded-md border border-[#ff914d]/50 px-3 py-2 focus:ring-2 focus:ring-[#ff914d]/50 focus:outline-none placeholder:text-black/50 text-black"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-md border border-[#ff914d]/50 px-3 py-2 focus:ring-2 focus:ring-[#ff914d]/50 focus:outline-none placeholder:text-black/50 text-black"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone (optional)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  pattern="^[0-9+\-()\s]{7,}$"
                  className="mt-1 w-full rounded-md border border-[#ff914d]/50 px-3 py-2 focus:ring-2 focus:ring-[#ff914d]/50 focus:outline-none placeholder:text-black/50 text-black"
                  placeholder="+977-9800000000"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  minLength={10}
                  className="mt-1 w-full rounded-md border border-[#ff914d]/50 px-3 py-2 focus:ring-2 focus:ring-[#ff914d]/50 focus:outline-none placeholder:text-black/50 text-black"
                  placeholder="Tell us a bit about your project"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#ff914d] text-white font-semibold hover:bg-[#ff914d]/90 transition-colors disabled:opacity-50"
                aria-live="polite"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>Send Message</>
                )}
              </button>
            </form>

            {status && (
              <div
                className={`mt-4 rounded-md px-3 py-2 text-sm ${success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                role="status"
                aria-live="polite"
              >
                {status}
              </div>
            )}
          </div>

          {/* Contact Info Card */}
          <div className="bg-white rounded-2xl border border-[#ff914d]/30 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in touch</h2>
            <p className="text-gray-600 mb-6">Prefer email or phone? Reach us directly.</p>

            <div className="space-y-4 text-gray-700">
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <a href={`mailto:${contactEmail}`} className="text-[#ff914d] font-semibold hover:underline">{contactEmail}</a>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="text-[#ff914d] font-semibold hover:underline">{contactPhone}</a>
              </div>
              <div>
                <div className="text-sm text-gray-500">Hours</div>
                <div>{contactHours}</div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-sm text-gray-500 mb-2">Find us</div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setMapType("roadmap")}
                  className={`px-3 py-1 text-sm rounded border ${mapType === "roadmap" ? "bg-[#ff914d] text-white border-[#ff914d]" : "border-[#ff914d]/40 text-[#ff914d]"}`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("satellite")}
                  className={`px-3 py-1 text-sm rounded border ${mapType === "satellite" ? "bg-[#ff914d] text-white border-[#ff914d]" : "border-[#ff914d]/40 text-[#ff914d]"}`}
                >
                  Satellite
                </button>
              </div>
              {apiKey ? (
                <div ref={mapDivRef} className="h-48 w-full rounded-lg border border-[#ff914d]/30 overflow-hidden" />
              ) : (
                <div className="h-48 w-full rounded-lg border border-[#ff914d]/30 overflow-hidden">
                  <iframe
                    title="Location Map"
                    src={`https://maps.google.com/maps?q=${nbLat},${nbLng}&ll=${nbLat},${nbLng}&hl=en&z=15&t=${mapType === "satellite" ? "k" : "m"}&output=embed`}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}