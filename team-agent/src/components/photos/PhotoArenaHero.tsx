"use client";

import { useState, useEffect, useRef } from "react";
import { fetchPhotos, driveFilesToGalleryImages } from "@/lib/drive";
import type { DrivePhoto } from "@/lib/drive";

// Fallback images when no Drive photos available
const fallbackImages = [
  {
    src: "https://images.unsplash.com/photo-1741332966416-414d8a5b8887?w=600&auto=format&fit=crop&q=60",
    alt: "Landscape Vista",
  },
  {
    src: "https://images.unsplash.com/photo-1754769440490-2eb64d715775?q=80&w=1113&auto=format&fit=crop",
    alt: "Urban Dreams",
  },
  {
    src: "https://images.unsplash.com/photo-1758640920659-0bb864175983?w=600&auto=format&fit=crop&q=60",
    alt: "Golden Hour",
  },
  {
    src: "https://plus.unsplash.com/premium_photo-1758367454070-731d3cc11774?w=600&auto=format&fit=crop&q=60",
    alt: "Reflection",
  },
  {
    src: "https://images.unsplash.com/photo-1746023841657-e5cd7cc90d2c?w=600&auto=format&fit=crop&q=60",
    alt: "Mountain Peak",
  },
  {
    src: "https://images.unsplash.com/photo-1741715661559-6149723ea89a?w=600&auto=format&fit=crop&q=60",
    alt: "Ocean Blue",
  },
];

export default function PhotoArenaHero() {
  const [images, setImages] = useState(fallbackImages);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadDrivePhotos() {
      const drivePhotos = await fetchPhotos();
      if (drivePhotos.length > 0) {
        const galleryImages = driveFilesToGalleryImages(drivePhotos);
        if (galleryImages.length >= 4) {
          setImages(galleryImages);
        } else {
          setImages([
            ...galleryImages,
            ...fallbackImages.slice(0, 6 - galleryImages.length),
          ]);
        }
      }
    }
    loadDrivePhotos();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 600);
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [images.length]);

  const goTo = (idx: number) => {
    if (idx === activeIdx) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setIsTransitioning(false);
    }, 400);
    // Reset auto-rotate timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 600);
    }, 4000);
  };

  const prevIdx = (activeIdx - 1 + images.length) % images.length;
  const nextIdx = (activeIdx + 1) % images.length;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${images[activeIdx]?.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px) brightness(0.25) saturate(1.5)",
            transform: "scale(1.2)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/80 via-transparent to-dark-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/50 via-transparent to-dark-bg/50" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-val-teal/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className="relative z-10 text-center mb-12">
        <div className="badge-val mb-5 mx-auto">◈ PHOTO ARENA</div>
        <h1 className="font-heading text-[clamp(2.5rem,7vw,5rem)] font-black tracking-tight leading-none mb-4">
          <span className="text-val-cream">VISUAL </span>
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #17DEA6, #00d4ff, #17DEA6)",
              backgroundSize: "200% 200%",
              animation: "gradient-shift 4s ease infinite",
            }}
          >
            GALLERY
          </span>
        </h1>
        <p className="text-gray-500 text-base max-w-lg mx-auto px-5">
          Browse the squad&apos;s finest shots — auto-synced from the cloud
        </p>
      </div>

      {/* 3D Carousel */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-center gap-4 md:gap-8 px-5 mb-12 perspective-[1200px]">
        {/* Previous */}
        <button
          onClick={() => goTo(prevIdx)}
          className="relative w-[18%] md:w-[22%] aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/5 opacity-50 hover:opacity-80 transition-all duration-500 flex-shrink-0"
          style={{ transform: "rotateY(25deg) scale(0.85) translateZ(-60px)" }}
        >
          <img
            src={images[prevIdx]?.src}
            alt={images[prevIdx]?.alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </button>

        {/* Active */}
        <div
          className={`relative w-[55%] md:w-[45%] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-val-teal/30 shadow-[0_20px_80px_rgba(23,222,166,0.15),0_0_0_1px_rgba(23,222,166,0.1)] flex-shrink-0 transition-all duration-700 ${
            isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          <img
            src={images[activeIdx]?.src}
            alt={images[activeIdx]?.alt}
            className="w-full h-full object-cover"
          />
          {/* Scan line */}
          <div className="absolute -top-full left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-val-teal/[0.06] to-transparent pointer-events-none animate-scan-line" />
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pt-16 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="font-heading text-sm md:text-base font-bold tracking-wider text-val-cream">
              {images[activeIdx]?.alt}
            </h3>
            <span className="font-mono text-[0.65rem] text-val-teal tracking-wider">
              {activeIdx + 1} / {images.length}
            </span>
          </div>
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-val-teal/40 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-val-teal/40 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-val-teal/40 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-val-teal/40 rounded-br-2xl" />
        </div>

        {/* Next */}
        <button
          onClick={() => goTo(nextIdx)}
          className="relative w-[18%] md:w-[22%] aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/5 opacity-50 hover:opacity-80 transition-all duration-500 flex-shrink-0"
          style={{
            transform: "rotateY(-25deg) scale(0.85) translateZ(-60px)",
          }}
        >
          <img
            src={images[nextIdx]?.src}
            alt={images[nextIdx]?.alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </button>
      </div>

      {/* Dots */}
      <div className="relative z-10 flex items-center gap-2 mb-8">
        {images.slice(0, 8).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 cursor-pointer border-none ${
              i === activeIdx
                ? "w-8 h-2 bg-val-teal shadow-[0_0_12px_rgba(23,222,166,0.5)]"
                : "w-2 h-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div className="relative z-10 flex flex-col items-center gap-2 text-gray-600 animate-float">
        <span className="font-mono text-[0.65rem] tracking-[0.2em]">
          SCROLL TO EXPLORE
        </span>
        <span className="text-lg">↓</span>
      </div>
    </section>
  );
}
