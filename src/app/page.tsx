"use client";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Link from "next/link";
import React from "react";

type Slide = {
  title: string;
  subtitle: string;
  bg: string;
  bg_wide?: string;
  bg_square?: string;
  photo1?: string;
  photo2?: string;
  photo3?: string;
};

export default function Home() {
  type HomeSection = {
    id: string;
    type: string;
    title?: string;
    layout?: Record<string, any>;
    styles?: Record<string, any>;
    elements: any[];
  };
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  type Service = { id: number; title: string; description: string; icon?: string | null };
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => {
        setSlides(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setSlides([]);
      });
    // Load homepage sections
    fetch("/api/home/sections")
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.sections)) setSections(data.sections);
      })
      .catch(() => {});

    // Load services for the Services section
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        setServices(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="">
      {/* Hero Section with sliding banners - Restored Original */}
      <section className="relative animate-fade-in p-3">
        {/* Navigation Arrows */}
        <button
          className="hero-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 focus:outline-none"
          aria-label="Previous banner"
          title="Previous"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M15.78 18.28a.75.75 0 01-1.06 0l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 111.06 1.06L10.06 12l5.72 5.72a.75.75 0 010 1.06z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          className="hero-next absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 focus:outline-none"
          aria-label="Next banner"
          title="Next"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M8.22 5.72a.75.75 0 011.06 0l6 6a.75.75 0 010 1.06l-6 6a.75.75 0 11-1.06-1.06L13.94 12 8.22 6.78a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {slides.length === 0 && (
          <div className="w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] flex items-center justify-center text-[#ff914d]">
            Loading banners...
          </div>
        )}
        {slides.length > 0 && (
          <Swiper
            key={slides.length}
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation={{ prevEl: ".hero-prev", nextEl: ".hero-next" }}
            loop={slides.length > 1}
            autoHeight={true}
            observer
            observeParents
            className="w-full h-auto"
          >
          {slides.map((s, i) => (
            <SwiperSlide key={i}>
              {(() => {
                const looksLikeUrl = (v?: string) => !!v && (v.startsWith("/") || v.startsWith("http"));
                const hasResponsive = looksLikeUrl(s.bg_wide) || looksLikeUrl(s.bg_square);
                const photos = [s.photo1, s.photo2, s.photo3].filter((p): p is string => !!p);
                if (hasResponsive) {
                  const wideUrl = looksLikeUrl(s.bg_wide)
                    ? s.bg_wide
                    : looksLikeUrl(s.bg)
                    ? s.bg
                    : undefined;
                  const squareUrl = looksLikeUrl(s.bg_square)
                    ? s.bg_square
                    : looksLikeUrl(s.bg_wide)
                    ? s.bg_wide
                    : looksLikeUrl(s.bg)
                    ? s.bg
                    : undefined;
                  const classFallback = !looksLikeUrl(s.bg) && typeof s.bg === "string" ? s.bg : "bg-center bg-cover";
                  return (
                    <div className="w-full relative text-[#ff914d]">
                      {/* Render banner image at natural size, no crop */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {wideUrl && (
                        <img src={wideUrl} alt="Banner" className="hidden md:block max-w-full h-auto mx-auto" />
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {squareUrl && (
                        <img src={squareUrl} alt="Banner" className="block md:hidden max-w-full h-auto mx-auto" />
                      )}
                      {/* Overlay text centered over the image */}
                      <div className="absolute inset-0 flex items-center justify-center text-center px-4 pointer-events-none">
                        <div className="pointer-events-auto">
                          <h1 className="text-3xl sm:text-5xl font-extrabold animate-fade-in-up delay-300">{s.title}</h1>
                          <p className="mt-3 text-base sm:text-xl animate-fade-in-up delay-500">{s.subtitle}</p>
                          {photos.length > 0 && (
                            <div className="mt-4 flex justify-center gap-3 px-2 animate-fade-in-up delay-700">
                              {photos.map((src, idx) => {
                                const targets = ["/photos", "/videos", "/graphics"] as const;
                                const href = targets[idx] || "/photos";
                                const labels = ["Go to Photos", "Go to Videos", "Go to Graphics"];
                                return (
                                  <Link key={idx} href={href} aria-label={labels[idx] || "Open gallery"} className="block">
                                    <div className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-md overflow-hidden border border-white/30 bg-white/90 hover:ring-2 hover:ring-[#ff914d] transition-all duration-300 hover:shadow-lg transform">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={src} alt={`Banner photo ${idx + 1}`} className="h-full w-full object-cover transition-transform duration-300" />
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                // Fallback: original behavior using bg as class or single image URL
                const isUrl = looksLikeUrl(s.bg);
                const isClass = !isUrl && typeof s.bg === "string";
                const style = undefined;
                const classes = isClass ? s.bg : "";
                return (
                  <div className={`w-full ${classes} text-[#ff914d] relative transition-transform duration-700`} style={style}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {isUrl && <img src={s.bg as string} alt="Banner" className="max-w-full h-auto mx-auto" />}
                    <div className="absolute inset-0 flex items-center justify-center text-center px-4 pointer-events-none">
                      <div className="pointer-events-auto">
                        <h1 className="text-3xl sm:text-5xl font-extrabold animate-fade-in-up delay-300">{s.title}</h1>
                        <p className="mt-3 text-base sm:text-xl animate-fade-in-up delay-500">{s.subtitle}</p>
                        {photos.length > 0 && (
                          <div className="mt-4 flex justify-center gap-3 px-2 animate-fade-in-up delay-700">
                            {photos.map((src, idx) => {
                              const targets = ["/photos", "/videos", "/graphics"] as const;
                              const href = targets[idx] || "/photos";
                              const labels = ["Go to Photos", "Go to Videos", "Go to Graphics"];
                              return (
                                <Link key={idx} href={href} aria-label={labels[idx] || "Open gallery"} className="block">
                                  <div className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-md overflow-hidden border border-white/30 bg-white/90 hover:ring-2 hover:ring-[#ff914d] transition-all duration-300 hover:shadow-lg transform">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt={`Banner photo ${idx + 1}`} className="h-full w-full object-cover transition-transform duration-300" />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </SwiperSlide>
          ))}
          </Swiper>
        )}
      </section>

      {/*  */}

      {/* Services Section */}
      <section className="py-16 sm:py-20 bg-white animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up delay-200">Our Services</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto animate-fade-in-up delay-400">
              We understand the different avenues of digital marketing and know how to bring it all together. 
              Our services have a real impact on the online world as well as in the conventional marketplace.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {services.map((s, index) => {
              const iconIsImage = !!s.icon && (s.icon.startsWith("/") || s.icon.startsWith("http"));
              const emoji = (() => {
                switch (s.icon) {
                  case "share": return "🔗";
                  case "video": return "🎬";
                  case "palette": return "🎨";
                  case "camera": return "📷";
                  default: return "★";
                }
              })();
              return (
                <div key={s.id} className={`bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-xl hover:shadow-lg transition-all duration-500 hover:scale-105 hover:-translate-y-2 transform animate-fade-in-up`} style={{animationDelay: `${(index + 1) * 100}ms`}}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ff914d] rounded-lg flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300 hover:scale-110 hover:rotate-6 transform overflow-hidden">
                    {iconIsImage ? (
                      <img src={s.icon || ""} alt={s.title} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                    ) : (
                      <span className="text-xl sm:text-2xl leading-none text-white">{emoji}</span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{s.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Homepage Canvas: Dynamic sections from admin */}
      {sections.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in-up" aria-labelledby="homepage-canvas">
          <h2 id="homepage-canvas" className="text-2xl font-bold text-[#ff914d] mb-4 animate-fade-in-up">Homepage Canvas</h2>
          <div className="space-y-8">
            {sections.map((s, index) => (
              <div key={s.id} className={`p-4 rounded-lg border border-[#ff914d]/30 bg-white hover:shadow-lg transition-all duration-300 hover:scale-[1.02] transform animate-fade-in-up`} style={{animationDelay: `${index * 100}ms`}}>
                {s.title && <h3 className="text-xl font-semibold text-[#ff914d] mb-2">{s.title}</h3>}
                {s.type !== 'canvas' && (
                  <div className="space-y-3">
                    {s.elements.map((el: any) => {
                      switch (el.type) {
                        case "heading":
                          return <h4 key={el.id} className="text-lg font-bold animate-fade-in">{el.props?.text}</h4>;
                        case "text":
                          return <p key={el.id} className="text-black/80 animate-fade-in">{el.props?.text}</p>;
                        case "image":
                          return <img key={el.id} src={el.props?.src || ""} alt={el.props?.alt || ""} className="max-w-full rounded transition-transform duration-300 hover:scale-105" />;
                        case "video":
                          return <video key={el.id} src={el.props?.src || ""} poster={el.props?.poster || undefined} controls={el.props?.controls ?? true} autoPlay={el.props?.autoplay ?? false} loop={el.props?.loop ?? false} className="w-full rounded transition-transform duration-300 hover:scale-105" />;
                        case "button":
                          return <a key={el.id} href={el.props?.href || "#"} className="inline-block px-3 py-1.5 rounded bg-black text-white transition-all duration-300 hover:scale-105 hover:shadow-lg transform">{el.props?.text}</a>;
                        case "feature":
                          return (
                            <div key={el.id} className="flex items-center gap-2 animate-fade-in">
                              <span>{el.props?.icon}</span>
                              <div>
                                <div className="font-medium">{el.props?.title}</div>
                                <div className="text-black/70 text-sm">{el.props?.text}</div>
                              </div>
                            </div>
                          );
                        case "container":
                          return (
                            <div key={el.id} className="p-3 rounded border border-black/10 transition-all duration-300 hover:shadow-md">
                              <div className="space-y-2">
                                {(el.children || []).map((child: any) => {
                                  switch (child.type) {
                                    case "heading":
                                      return <h5 key={child.id} className="text-lg font-bold animate-fade-in">{child.props?.text}</h5>;
                                    case "text":
                                      return <p key={child.id} className="text-black/80 animate-fade-in">{child.props?.text}</p>;
                                    case "image":
                                      return <img key={child.id} src={child.props?.src || ""} alt={child.props?.alt || ""} className="max-w-full rounded transition-transform duration-300 hover:scale-105" />;
                                    case "video":
                                      return <video key={child.id} src={child.props?.src || ""} poster={child.props?.poster || undefined} controls={child.props?.controls ?? true} autoPlay={child.props?.autoplay ?? false} loop={child.props?.loop ?? false} className="w-full rounded transition-transform duration-300 hover:scale-105" />;
                                    case "button":
                                      return <a key={child.id} href={child.props?.href || "#"} className="inline-block px-3 py-1.5 rounded bg-black text-white transition-all duration-300 hover:scale-105 hover:shadow-lg transform">{child.props?.text}</a>;
                                    case "feature":
                                      return (
                                        <div key={child.id} className="flex items-center gap-2 animate-fade-in">
                                          <span>{child.props?.icon}</span>
                                          <div>
                                            <div className="font-medium">{child.props?.title}</div>
                                            <div className="text-black/70 text-sm">{child.props?.text}</div>
                                          </div>
                                        </div>
                                      );
                                    default:
                                      return <div key={child.id} className="text-xs text-black/50">Unsupported element: {child.type}</div>;
                                  }
                                })}
                              </div>
                            </div>
                          );
                        default:
                          return <div key={el.id} className="text-xs text-black/50">Unsupported element: {el.type}</div>;
                      }
                    })}
                  </div>
                )}
                {s.type === 'canvas' && (
                  <div className="relative border border-black/20 bg-white transition-all duration-300 hover:shadow-lg" style={{ height: (s.layout?.canvasHeight ?? 600) + 'px' }}>
                    {s.elements.map((el: any) => (
                      <div
                        key={el.id}
                        className="absolute rounded border border-black/20 bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg transform"
                        style={{
                          top: `${el.layout?.top ?? 10}%`,
                          left: `${el.layout?.left ?? 10}%`,
                          width: `${el.layout?.width ?? 30}%`,
                          height: `${el.layout?.height ?? 20}%`,
                          zIndex: el.layout?.z ?? 1,
                        }}
                      >
                        {el.type === "image" && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={el.props?.src || ""} alt={el.props?.alt || ""} className="h-full w-full object-cover transition-transform duration-300 hover:scale-110" />
                        )}
                        {el.type === "video" && (
                          <video src={el.props?.src || ""} poster={el.props?.poster || undefined} controls={el.props?.controls ?? true} autoPlay={el.props?.autoplay ?? false} loop={el.props?.loop ?? false} className="h-full w-full object-cover" />
                        )}
                        {el.type === "text" && (
                          <div className="h-full w-full p-2 text-sm text-black/80 overflow-auto">
                            {el.props?.text || "Text"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Galleries CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 animate-fade-in-up" aria-labelledby="galleries-heading">
        <div className="mb-12 text-center">
          <h2 id="galleries-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up delay-200">Explore Our Work</h2>
          <p className="text-lg text-gray-600 animate-fade-in-up delay-400">Photos, Videos, and Graphics curated for you.</p>
        </div>
        <CTAImages />
      </section>

      {/* Logo Carousel Section (Below Explore Our Work) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 animate-fade-in-up" aria-label="Brand Logos">
        <LogoCarousel />
      </section>

      

      {/* Contact CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20 animate-fade-in-up" aria-labelledby="contact-heading">
        <div className="bg-gradient-to-r from-[#ff914d] to-[#ff914d]/80 rounded-2xl p-6 sm:p-12 text-center text-white">
          <h2 id="contact-heading" className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 animate-fade-in-up delay-200">Have a Project in Mind?</h2>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90 animate-fade-in-up delay-400">
            Reach out and let's craft something great together.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/contact" className="inline-block w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-white text-[#ff914d] font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Contact Us
            </Link>
            <Link href="/photos" className="inline-block w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#ff914d] transition-colors">
              View Portfolio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function TestimonialsSection() {
  const [items, setItems] = useState<{ id: number; name: string; role: string; initials?: string | null; quote: string; rating?: number | null; avatar?: string | null }[]>([]);
  const [swiperInst, setSwiperInst] = useState<any | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/testimonials", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
    return () => controller.abort();
  }, []);
  const handleMouseEnter = () => swiperInst?.autoplay?.stop();
  const handleMouseLeave = () => swiperInst?.autoplay?.start();
  const handleTouchStart = () => swiperInst?.autoplay?.stop();
  const handleTouchEnd = () => swiperInst?.autoplay?.start();
  return (
    <section className="py-20 bg-gray-50 animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up delay-200">Testimonials</h2>
          <p className="text-lg text-gray-600 animate-fade-in-up delay-400">
            Testimonials from customers who are satisfied with our services.
          </p>
        </div>
        {items.length > 0 && (
          <div className="relative">
            <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <Swiper
            key={items.length}
            modules={[Autoplay]}
            loop={items.length > 1}
            autoplay={{ delay: 4000, pauseOnMouseEnter: true, disableOnInteraction: false }}
            slidesPerView={1}
            spaceBetween={20}
            allowTouchMove={false}
            onSwiper={(s) => setSwiperInst(s)}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 3, spaceBetween: 28 },
            }}
            className="w-full"
            aria-label="Testimonials carousel"
          >
            {items.map((t, index) => (
              <SwiperSlide key={t.id} className="!h-auto">
                <div className={`bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-500 hover:scale-105 hover:-translate-y-2 transform animate-fade-in-up`} style={{ animationDelay: `${(index + 1) * 200}ms` }}>
                  <div className="flex items-center mb-4">
                    <div className="flex text-[#ff914d]">
                      {[...Array(Math.max(1, Math.min(5, t.rating || 5)))].map((_, i) => (
                        <svg key={i} className={`w-5 h-5 fill-current animate-fade-in`} style={{ animationDelay: `${i * 100}ms` }} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 animate-fade-in delay-300">"{t.quote}"</p>
                  <div className="flex items-center animate-fade-in delay-500">
                    {t.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border border-black/10" />
                    ) : (
                      <div className="w-12 h-12 bg-[#ff914d] rounded-full flex items-center justify-center text-white font-semibold transition-all duration-300 hover:scale-110 hover:rotate-6 transform">
                        {t.initials || (t.name || "").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">{t.name}</h4>
                      <p className="text-gray-500 text-sm">{t.role}</p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CTAImages() {
  const [data, setData] = useState<{ photos: string | null; videos: string | null; graphics: string | null } | null>(null);
  useEffect(() => {
    fetch("/api/home/cta")
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => {});
  }, []);
  return (
    <div className="grid sm:grid-cols-3 gap-6">
      <Link href="/photos" className="group block overflow-hidden rounded-xl border border-[#ff914d] bg-white">
        <div className="h-64 flex items-end p-4 relative">
          {data?.photos && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.photos} alt="Photos" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="absolute bottom-4 right-4 opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-focus-within:opacity-100 sm:group-focus-within:translate-y-0 transition-all duration-300">
            <span className="px-4 py-2 rounded-lg bg-[#ff914d] text-white shadow">Click Me</span>
          </div>
          <div className="relative">
            <h3 className="text-xl font-semibold text-[#ff914d] group-hover:opacity-80 transition-opacity">Photo Gallery</h3>
            <p className="text-[#ff914d]/80 text-sm">Click to view photos</p>
          </div>
        </div>
      </Link>
      <Link href="/videos" className="group block overflow-hidden rounded-xl border border-[#ff914d] bg-white">
        <div className="h-64 flex items-end p-4 relative">
          {data?.videos && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.videos} alt="Videos" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="absolute bottom-4 right-4 opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-focus-within:opacity-100 sm:group-focus-within:translate-y-0 transition-all duration-300">
            <span className="px-4 py-2 rounded-lg bg-[#ff914d] text-white shadow">Click Me</span>
          </div>
          <div className="relative">
            <h3 className="text-xl font-semibold text-[#ff914d] group-hover:opacity-80 transition-opacity">Video Gallery</h3>
            <p className="text-[#ff914d]/80 text-sm">Click to watch videos</p>
          </div>
        </div>
      </Link>
      <Link href="/graphics" className="group block overflow-hidden rounded-xl border border-[#ff914d] bg-white">
        <div className="h-64 flex items-end p-4 relative">
          {data?.graphics && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.graphics} alt="Graphics" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="absolute bottom-4 right-4 opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-focus-within:opacity-100 sm:group-focus-within:translate-y-0 transition-all duration-300">
            <span className="px-4 py-2 rounded-lg bg-[#ff914d] text-white shadow">Click Me</span>
          </div>
          <div className="relative">
            <h3 className="text-xl font-semibold text-[#ff914d] group-hover:opacity-80 transition-opacity">Graphic Design</h3>
            <p className="text-[#ff914d]/80 text-sm">Click to view designs</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

function LogoCarousel() {
  const [logos, setLogos] = useState<string[]>([]);
  const placeholders = [
    "/next.svg",
    "/vercel.svg",
    "/globe.svg",
    "/window.svg",
    "/file.svg",
  ];

  useEffect(() => {
    fetch("/api/partner-logos")
      .then((r) => r.json())
      .then((j) => {
        if (j && Array.isArray(j.logos)) setLogos(j.logos);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-xl border border-[#ff914d]/30 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Our Partners & Clients</h3>
      </div>
      <Swiper
        modules={[Autoplay]}
        loop
        autoplay={{ delay: 2000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        slidesPerView={3}
        spaceBetween={24}
        breakpoints={{
          480: { slidesPerView: 4, spaceBetween: 24 },
          640: { slidesPerView: 5, spaceBetween: 24 },
          768: { slidesPerView: 6, spaceBetween: 28 },
          1024: { slidesPerView: 7, spaceBetween: 32 },
        }}
        className="w-full"
        aria-label="Logo carousel"
     >
        {(logos.length ? logos : placeholders).concat(logos.length ? logos : placeholders).map((src, idx) => (
          <SwiperSlide key={idx} className="!h-auto">
            <div className="h-16 sm:h-20 md:h-24 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Brand logo ${idx + 1}`}
                className="max-h-full w-auto opacity-90 hover:opacity-100 transition-opacity"
                draggable={false}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
