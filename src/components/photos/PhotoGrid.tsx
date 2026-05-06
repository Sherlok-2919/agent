"use client";
import { useState } from "react";
import { photos, photoAlbums, placeholderGradients } from "@/data";

const aspectMap = { landscape: "aspect-[16/10]", portrait: "aspect-[3/4]", square: "aspect-square" };

export default function PhotoGrid() {
  const [activeAlbum, setActiveAlbum] = useState("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = activeAlbum === "All" ? photos : photos.filter((p) => p.album === activeAlbum);

  const navigateLightbox = (dir: number) => {
    if (lightbox === null) return;
    const newIdx = lightbox + dir;
    if (newIdx >= 0 && newIdx < filtered.length) setLightbox(newIdx);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 justify-center flex-wrap px-5 pb-10">
        {photoAlbums.map((album) => (
          <button
            key={album}
            className={`px-5 py-2 rounded-full font-heading text-[0.72rem] font-semibold tracking-wider cursor-pointer transition-all duration-300 border ${
              activeAlbum === album
                ? "bg-val-teal border-val-teal text-white shadow-[0_0_20px_rgba(23,222,166,0.4)]"
                : "bg-transparent border-glass-border text-gray-500 hover:border-val-teal hover:text-val-teal"
            }`}
            onClick={() => setActiveAlbum(album)}
          >
            {album}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      <div className="columns-1 md:columns-2 xl:columns-3 gap-5 max-w-[1400px] mx-auto px-5 md:px-10 pb-20">
        {filtered.map((photo, i) => (
          <div
            key={photo.id}
            className="break-inside-avoid mb-5 rounded-lg overflow-hidden relative cursor-pointer border border-transparent hover:border-val-teal/40 hover:scale-[1.02] hover:shadow-[0_12px_50px_rgba(23,222,166,0.15)] transition-all duration-300 group"
            onClick={() => setLightbox(i)}
          >
            <div className={`w-full flex items-center justify-center ${aspectMap[photo.aspect]}`} style={{ background: photo.src ? undefined : placeholderGradients[i % placeholderGradients.length] }}>
              {photo.src ? (
                <img src={photo.src} alt={photo.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl opacity-30 text-val-cream">◈</span>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-5 bg-gradient-to-t from-black/85 to-transparent opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <h3 className="font-heading text-[0.8rem] font-bold tracking-wider mb-1">{photo.title}</h3>
              <span className="text-[0.72rem] text-val-teal">{photo.uploader}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/92 backdrop-blur-md z-[200] flex items-center justify-center animate-fade-in-up" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 bg-white/[0.08] border border-white/15 text-white w-10 h-10 rounded-full cursor-pointer text-lg flex items-center justify-center z-10 hover:bg-val-red hover:border-val-red transition-all duration-300" onClick={() => setLightbox(null)}>✕</button>
          <button className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/[0.06] border border-white/10 text-white w-12 h-12 rounded-full cursor-pointer text-3xl flex items-center justify-center z-10 hover:bg-val-red/20 hover:border-val-red transition-all duration-300" onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}>‹</button>
          <button className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/[0.06] border border-white/10 text-white w-12 h-12 rounded-full cursor-pointer text-3xl flex items-center justify-center z-10 hover:bg-val-red/20 hover:border-val-red transition-all duration-300" onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}>›</button>

          <div className="max-w-[800px] w-[90%] rounded-2xl overflow-hidden bg-dark-card border border-glass-border" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-[16/10] flex flex-col items-center justify-center gap-3" style={{ background: filtered[lightbox]?.src ? undefined : placeholderGradients[lightbox % placeholderGradients.length] }}>
              {filtered[lightbox]?.src ? (
                <img src={filtered[lightbox].src} alt={filtered[lightbox].title} className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-6xl opacity-30 text-val-cream">◈</span>
                  <p className="text-sm text-gray-600">Connect Google Drive to view photos</p>
                </>
              )}
            </div>
            <div className="p-5 px-6">
              <h2 className="font-heading text-base mb-1">{filtered[lightbox]?.title}</h2>
              <p className="text-sm text-gray-500">by {filtered[lightbox]?.uploader} · {filtered[lightbox]?.album}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
