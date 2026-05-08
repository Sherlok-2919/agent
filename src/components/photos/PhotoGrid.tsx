"use client";
import { useState, useCallback, useEffect } from "react";
import { useDriveFiles } from "@/lib/useDriveFiles";
import { fetchPhotos } from "@/lib/drive";
import type { DrivePhoto } from "@/lib/drive";

export default function PhotoGrid() {
  const {
    files: photos,
    loading,
    refreshing,
    refresh,
    lastRefreshed,
    error,
  } = useDriveFiles<DrivePhoto>({
    fetchFn: fetchPhotos,
    interval: 30000, // Auto-refresh every 30 seconds
  });

  const [lightbox, setLightbox] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  const navigateLightbox = useCallback(
    (dir: number) => {
      if (lightbox === null) return;
      const newIdx = lightbox + dir;
      if (newIdx >= 0 && newIdx < photos.length) setLightbox(newIdx);
    },
    [lightbox, photos.length]
  );

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox, navigateLightbox]);

  return (
    <>
      {/* Section Header */}
      <section className="text-center px-5 py-10 relative">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-val-teal/40 to-transparent" />
        <h2 className="text-neon-teal text-[clamp(1.5rem,3vw,2.2rem)] mb-3 font-heading">
          BROWSE THE COLLECTION
        </h2>
        <p className="text-gray-500 text-base mb-6">
          Filter by album &amp; explore every shot.
        </p>

        {/* Refresh controls */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-[0.7rem] tracking-wider bg-val-teal/10 border border-val-teal/20 text-val-teal hover:bg-val-teal/20 hover:border-val-teal/40 hover:shadow-[0_0_20px_rgba(23,222,166,0.15)] transition-all duration-300 cursor-pointer disabled:opacity-50"
          >
            <span
              className={`inline-block transition-transform duration-500 ${
                refreshing ? "animate-spin" : ""
              }`}
            >
              ↻
            </span>
            {refreshing ? "SYNCING..." : "SYNC DRIVE"}
          </button>
          {lastRefreshed && (
            <span className="font-mono text-[0.65rem] text-gray-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-val-teal/60 animate-pulse" />
              Live — updated{" "}
              {lastRefreshed.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {photos.length > 0 && (
            <span className="px-3 py-1 bg-val-teal/10 border border-val-teal/20 rounded-full font-mono text-[0.65rem] text-val-teal">
              {photos.length} photo{photos.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-2 border-val-teal/10 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-val-teal rounded-full animate-spin" />
            <div className="absolute inset-2 border-2 border-transparent border-b-val-teal/50 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="font-mono text-sm text-gray-500 tracking-wider">
            LOADING PHOTOS FROM DRIVE...
          </p>
          <p className="font-mono text-[0.65rem] text-gray-700 tracking-wider">
            Auto-syncing with Google Drive
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-2xl bg-val-red/10 border border-val-red/20 flex items-center justify-center">
            <span className="text-4xl opacity-60">⚠</span>
          </div>
          <p className="font-mono text-sm text-val-red tracking-wider">
            DRIVE CONNECTION ERROR
          </p>
          <p className="text-gray-600 text-xs max-w-md text-center">{error}</p>
          <button
            onClick={refresh}
            className="btn-val-primary text-[0.7rem] px-6 py-2 mt-2"
          >
            RETRY CONNECTION
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-24 h-24 rounded-2xl bg-val-teal/5 border border-val-teal/10 flex items-center justify-center relative">
            <span className="text-5xl opacity-20">◈</span>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-val-teal/20 border border-val-teal/40 flex items-center justify-center">
              <span className="text-[0.5rem] text-val-teal">+</span>
            </div>
          </div>
          <p className="font-heading text-lg text-gray-500 tracking-wider">
            NO PHOTOS YET
          </p>
          <p className="text-gray-600 text-sm max-w-md text-center">
            Upload photos through the Upload Hub and they&apos;ll appear here
            automatically within 30 seconds.
          </p>
          <a href="/upload" className="btn-val-secondary text-[0.7rem] px-6 py-2 mt-2">
            GO TO UPLOAD HUB
          </a>
        </div>
      )}

      {/* Masonry Grid */}
      {!loading && photos.length > 0 && (
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-5 max-w-[1400px] mx-auto px-5 md:px-10 pb-20">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="break-inside-avoid mb-5 rounded-xl overflow-hidden relative cursor-pointer group"
              style={{
                opacity: 0,
                animation: `fade-in-up 0.6s ease forwards`,
                animationDelay: `${i * 80}ms`,
              }}
              onClick={() => setLightbox(i)}
            >
              {/* Card border with glow */}
              <div className="absolute inset-0 rounded-xl border border-white/[0.06] group-hover:border-val-teal/40 transition-all duration-500 z-10 pointer-events-none" />
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none shadow-[0_12px_50px_rgba(23,222,166,0.12),inset_0_0_0_1px_rgba(23,222,166,0.15)]" />

              {/* Image */}
              <div className="w-full aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-dark-card to-dark-bg">
                {/* Skeleton loader */}
                {!loadedImages.has(photo.id) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-dark-card via-dark-bg2 to-dark-card animate-pulse" />
                )}
                <img
                  src={photo.thumbnail}
                  alt={photo.alt}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                    loadedImages.has(photo.id) ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => handleImageLoad(photo.id)}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                  }}
                />
                {/* Scan line effect */}
                <div className="absolute -top-full left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-val-teal/[0.04] to-transparent pointer-events-none group-hover:animate-scan-line" />
              </div>

              {/* Overlay info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20">
                <h3 className="font-heading text-[0.8rem] font-bold tracking-wider mb-1 text-val-cream truncate">
                  {photo.alt}
                </h3>
                <div className="flex items-center gap-2">
                  {photo.createdTime && (
                    <span className="text-[0.68rem] text-val-teal font-mono">
                      {new Date(photo.createdTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {photo.size && (
                    <>
                      <span className="text-gray-600 text-[0.6rem]">•</span>
                      <span className="text-[0.65rem] text-gray-500 font-mono">
                        {(parseInt(photo.size) / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* MIME type badge */}
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-val-teal/80 rounded font-mono text-[0.55rem] text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                {photo.mimeType?.split("/")[1] || "image"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center"
          style={{ animation: "fade-in-up 0.3s ease" }}
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-5 right-5 bg-white/[0.08] border border-white/15 text-white w-11 h-11 rounded-full cursor-pointer text-lg flex items-center justify-center z-10 hover:bg-val-red hover:border-val-red transition-all duration-300"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>

          {/* Nav buttons */}
          {lightbox > 0 && (
            <button
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/[0.06] border border-white/10 text-white w-12 h-12 rounded-full cursor-pointer text-2xl flex items-center justify-center z-10 hover:bg-val-teal/20 hover:border-val-teal transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(-1);
              }}
            >
              ‹
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/[0.06] border border-white/10 text-white w-12 h-12 rounded-full cursor-pointer text-2xl flex items-center justify-center z-10 hover:bg-val-teal/20 hover:border-val-teal transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(1);
              }}
            >
              ›
            </button>
          )}

          {/* Image container */}
          <div
            className="max-w-[950px] w-[94%] rounded-2xl overflow-hidden bg-dark-card border border-glass-border shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={photos[lightbox].fullSrc}
                alt={photos[lightbox].alt}
                className="w-full max-h-[75vh] object-contain bg-black"
              />
              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-val-teal/30 rounded-tl" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-val-teal/30 rounded-tr" />
            </div>
            <div className="p-5 px-6 flex items-center justify-between border-t border-glass-border">
              <div>
                <h2 className="font-heading text-base mb-1">
                  {photos[lightbox].alt}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {photos[lightbox].createdTime && (
                    <span>
                      {new Date(photos[lightbox].createdTime!).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  )}
                  {photos[lightbox].size && (
                    <span className="font-mono text-xs text-gray-600">
                      {(parseInt(photos[lightbox].size!) / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>
              </div>
              <span className="font-mono text-[0.65rem] text-gray-600 bg-dark-bg px-3 py-1.5 rounded-full border border-glass-border">
                {lightbox + 1} / {photos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
