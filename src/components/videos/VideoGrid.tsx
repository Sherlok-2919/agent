"use client";
import { useState } from "react";
import { videos, videoCategories } from "@/data";
import type { Video } from "@/data";

export default function VideoGrid() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const filtered = activeCategory === "All" ? videos : videos.filter((v) => v.category === activeCategory);

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 justify-center flex-wrap px-5 pb-10">
        {videoCategories.map((cat) => (
          <button
            key={cat}
            className={`px-5 py-2 rounded-full font-heading text-[0.72rem] font-semibold tracking-wider cursor-pointer transition-all duration-300 border ${
              activeCategory === cat
                ? "bg-val-red border-val-red text-white shadow-[0_0_20px_rgba(255,70,85,0.4)]"
                : "bg-transparent border-glass-border text-gray-500 hover:border-val-red hover:text-val-red"
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto px-5 md:px-10 pb-20">
        {filtered.map((video) => (
          <div
            key={video.id}
            className="card-glass overflow-hidden cursor-pointer group"
            onClick={() => setSelectedVideo(video.id)}
          >
            <div className="relative aspect-video overflow-hidden">
              {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-dark-bg2 to-[#1a1a30] flex items-center justify-center">
                  <span className="text-4xl text-val-red drop-shadow-[0_0_12px_rgba(255,70,85,0.4)] transition-transform duration-300 group-hover:scale-125">▶</span>
                </div>
              )}
              <div className="absolute -top-full left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-val-red/[0.04] to-transparent pointer-events-none group-hover:animate-scan-line" />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 rounded font-mono text-[0.7rem] text-val-cream">{video.duration}</span>
            </div>
            <div className="p-4">
              <h3 className="font-heading text-[0.85rem] font-bold tracking-wider mb-2 text-val-cream">{video.title}</h3>
              <div className="flex items-center gap-1.5 text-[0.78rem] text-gray-600 mb-2">
                <span className="text-val-teal">{video.uploader}</span>
                <span className="opacity-30">•</span>
                <span>{video.date}</span>
              </div>
              <span className="inline-block px-2.5 py-0.5 bg-val-red/10 border border-val-red/20 rounded-full font-mono text-[0.65rem] text-val-red tracking-wider">
                {video.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          video={videos.find((v) => v.id === selectedVideo)!}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
}

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-5 animate-fade-in-up" onClick={onClose}>
      <div className="bg-dark-card border border-glass-border rounded-2xl max-w-[900px] w-full overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 z-10 bg-black/50 border border-glass-border text-val-cream w-9 h-9 rounded-full cursor-pointer text-base flex items-center justify-center hover:bg-val-red hover:border-val-red transition-all duration-300" onClick={onClose}>✕</button>
        <div className="aspect-video">
          {video.src ? (
            <video src={video.src} controls className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0a0a16] to-[#14142a] flex flex-col items-center justify-center gap-4 text-gray-600 text-sm">
              <span className="text-6xl text-val-red drop-shadow-[0_0_20px_rgba(255,70,85,0.4)]">▶</span>
              <p>Connect Google Drive to stream videos</p>
            </div>
          )}
        </div>
        <div className="p-6">
          <h2 className="font-heading text-lg mb-1.5">{video.title}</h2>
          <p className="text-gray-500 text-sm">Uploaded by {video.uploader} · {video.duration}</p>
        </div>
      </div>
    </div>
  );
}
