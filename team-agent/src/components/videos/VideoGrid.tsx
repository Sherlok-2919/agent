"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchVideosWithStats } from "@/lib/drive";
import type { DriveVideo, DriveListResponse } from "@/lib/drive";
import { getGameById, GENERAL_GAME } from "@/data/games";
import GameFilterTabs from "@/components/ui/GameFilterTabs";

export default function VideoGrid() {
  const [videos, setVideos] = useState<DriveVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Game filter state
  const [activeGame, setActiveGame] = useState("all");
  const [gameStats, setGameStats] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);

  const [selectedVideo, setSelectedVideo] = useState<DriveVideo | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const doFetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data: DriveListResponse<DriveVideo> = await fetchVideosWithStats("all");
      const allFiles = data.files || [];

      // Set stats from all files
      const stats: Record<string, number> = {};
      for (const f of allFiles) {
        const game = f.game || "general";
        stats[game] = (stats[game] || 0) + 1;
      }
      setGameStats(stats);
      setTotalCount(allFiles.length);

      // Apply local filter
      if (activeGame === "all") {
        setVideos(allFiles);
      } else {
        setVideos(allFiles.filter((f) => (f.game || "general") === activeGame));
      }

      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeGame]);

  // Initial fetch
  useEffect(() => {
    doFetch();
  }, [doFetch]);

  // Auto-refresh polling
  useEffect(() => {
    const timer = setInterval(() => doFetch(true), 30000);
    return () => clearInterval(timer);
  }, [doFetch]);

  const handleGameChange = useCallback((game: string) => {
    setActiveGame(game);
    setSelectedVideo(null);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!selectedVideo) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedVideo(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedVideo]);

  return (
    <>
      {/* Game Filter Tabs */}
      {Object.keys(gameStats).length > 0 && (
        <div className="mb-6 flex justify-center px-5">
          <GameFilterTabs
            gameStats={gameStats}
            activeGame={activeGame}
            onSelectGame={handleGameChange}
            totalCount={totalCount}
            accentColor="#ff4655"
          />
        </div>
      )}

      {/* Refresh indicator */}
      <div className="flex items-center justify-center gap-4 px-5 pb-8 flex-wrap">
        <button
          onClick={() => doFetch(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-[0.7rem] tracking-wider bg-val-red/10 border border-val-red/20 text-val-red hover:bg-val-red/20 hover:border-val-red/40 hover:shadow-[0_0_20px_rgba(255,70,85,0.15)] transition-all duration-300 cursor-pointer disabled:opacity-50"
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
            <span className="w-1.5 h-1.5 rounded-full bg-val-red/60 animate-pulse" />
            Live — updated{" "}
            {lastRefreshed.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {videos.length > 0 && (
          <span className="px-3 py-1 bg-val-red/10 border border-val-red/20 rounded-full font-mono text-[0.65rem] text-val-red">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
            {activeGame !== "all" && (
              <> in {(getGameById(activeGame) || GENERAL_GAME).name}</>
            )}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-2 border-val-red/10 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-val-red rounded-full animate-spin" />
            <div
              className="absolute inset-2 border-2 border-transparent border-b-val-red/50 rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-val-red text-lg">▶</span>
            </div>
          </div>
          <p className="font-mono text-sm text-gray-500 tracking-wider">
            LOADING VIDEOS FROM DRIVE...
          </p>
          <p className="font-mono text-[0.65rem] text-gray-700 tracking-wider">
            Fetching from cloud storage
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
            onClick={() => doFetch()}
            className="btn-val-primary text-[0.7rem] px-6 py-2 mt-2"
          >
            RETRY CONNECTION
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-24 h-24 rounded-2xl bg-val-red/5 border border-val-red/10 flex items-center justify-center relative">
            <span className="text-5xl opacity-20 text-val-red drop-shadow-[0_0_20px_rgba(255,70,85,0.3)]">
              ▶
            </span>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-val-red/20 border border-val-red/40 flex items-center justify-center">
              <span className="text-[0.5rem] text-val-red">+</span>
            </div>
          </div>
          <p className="font-heading text-lg text-gray-500 tracking-wider">
            {activeGame !== "all"
              ? `NO ${(getGameById(activeGame) || GENERAL_GAME).name.toUpperCase()} VIDEOS YET`
              : "NO VIDEOS YET"}
          </p>
          <p className="text-gray-600 text-sm max-w-md text-center">
            {activeGame !== "all"
              ? `Upload ${(getGameById(activeGame) || GENERAL_GAME).name} clips through the Upload Hub and they'll appear here.`
              : "Upload videos through the Upload Hub and they'll appear here automatically within 30 seconds."}
          </p>
          <div className="flex gap-3">
            {activeGame !== "all" && (
              <button
                onClick={() => handleGameChange("all")}
                className="btn-val-secondary text-[0.7rem] px-6 py-2"
              >
                VIEW ALL VIDEOS
              </button>
            )}
            <a
              href="/upload"
              className="btn-val-primary text-[0.7rem] px-6 py-2"
            >
              GO TO UPLOAD HUB
            </a>
          </div>
        </div>
      )}

      {/* Video Grid */}
      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto px-5 md:px-10 pb-20">
          {videos.map((video, i) => {
            const gameInfo = video.game ? (getGameById(video.game) || (video.game === "general" ? GENERAL_GAME : null)) : null;
            return (
              <div
                key={video.id}
                className="rounded-xl overflow-hidden cursor-pointer group relative"
                style={{
                  opacity: 0,
                  animation: "fade-in-up 0.6s ease forwards",
                  animationDelay: `${i * 100}ms`,
                }}
                onClick={() => setSelectedVideo(video)}
                onMouseEnter={() => setHoveredId(video.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Card border with glow */}
                <div className="absolute inset-0 rounded-xl border border-white/[0.06] group-hover:border-val-red/40 transition-all duration-500 z-10 pointer-events-none" />
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none shadow-[0_12px_50px_rgba(255,70,85,0.12),inset_0_0_0_1px_rgba(255,70,85,0.15)]" />

                {/* Background */}
                <div className="bg-dark-card">
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.alt}
                      loading="lazy"
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-75"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                      }}
                    />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                          hoveredId === video.id
                            ? "bg-val-red scale-110 shadow-[0_0_40px_rgba(255,70,85,0.5)]"
                            : "bg-black/50 border border-white/20 scale-100"
                        }`}
                      >
                        <span className="text-white text-2xl ml-1">▶</span>
                      </div>
                    </div>

                    {/* Scan line effect */}
                    <div className="absolute -top-full left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-val-red/[0.04] to-transparent pointer-events-none group-hover:animate-scan-line" />

                    {/* Duration badge */}
                    {video.duration && (
                      <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-black/80 backdrop-blur-sm rounded-md font-mono text-[0.72rem] text-val-cream border border-white/10">
                        {video.duration}
                      </span>
                    )}

                    {/* Game badge (top-left) */}
                    {gameInfo && gameInfo.id !== "general" && (
                      <span
                        className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded font-mono text-[0.6rem] text-white uppercase tracking-wider shadow-lg flex items-center gap-1 z-20"
                        style={{ background: `${gameInfo.color}cc` }}
                      >
                        {gameInfo.icon} {gameInfo.name}
                      </span>
                    )}

                    {/* File type badge (top-right, only if no game or show both) */}
                    {(!gameInfo || gameInfo.id === "general") && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-val-red/90 rounded font-mono text-[0.6rem] text-white uppercase tracking-wider shadow-[0_0_10px_rgba(255,70,85,0.3)]">
                        {video.mimeType?.split("/")[1] || "video"}
                      </span>
                    )}

                    {/* Top gradient */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                  </div>

                  {/* Info */}
                  <div className="p-4 relative">
                    <h3 className="font-heading text-[0.85rem] font-bold tracking-wider mb-2 text-val-cream line-clamp-1 group-hover:text-val-red transition-colors duration-300">
                      {video.alt}
                    </h3>
                    <div className="flex items-center gap-2 text-[0.75rem] text-gray-600 flex-wrap">
                      {video.createdTime && (
                        <>
                          <span className="text-val-teal font-mono">
                            {new Date(video.createdTime).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span className="opacity-30">•</span>
                        </>
                      )}
                      {video.size && (
                        <span className="font-mono">
                          {(parseInt(video.size) / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      )}
                      {/* Game tag */}
                      {gameInfo && gameInfo.id !== "general" && (
                        <>
                          <span className="opacity-30">•</span>
                          <span
                            className="font-mono text-[0.65rem]"
                            style={{ color: gameInfo.color }}
                          >
                            {gameInfo.icon} {gameInfo.name}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-val-red/20 to-transparent group-hover:via-val-red/40 transition-all duration-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
}

function VideoModal({
  video,
  onClose,
}: {
  video: DriveVideo;
  onClose: () => void;
}) {
  const gameInfo = video.game ? (getGameById(video.game) || (video.game === "general" ? GENERAL_GAME : null)) : null;

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-5"
      style={{ animation: "fade-in-up 0.3s ease" }}
      onClick={onClose}
    >
      <div
        className="bg-dark-card border border-glass-border rounded-2xl max-w-[960px] w-full overflow-hidden relative shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 z-10 bg-black/60 border border-white/10 text-val-cream w-10 h-10 rounded-full cursor-pointer text-base flex items-center justify-center hover:bg-val-red hover:border-val-red transition-all duration-300"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Video Player — using Google Drive preview embed */}
        <div className="aspect-video bg-black relative">
          <iframe
            src={video.streamUrl}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={video.alt}
          />
          {/* Corner accents */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-val-red/30 rounded-tl pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-val-red/30 rounded-tr pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-val-red/30 rounded-bl pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-val-red/30 rounded-br pointer-events-none" />
        </div>

        {/* Info */}
        <div className="p-6 flex items-center justify-between border-t border-glass-border flex-wrap gap-3">
          <div>
            <h2 className="font-heading text-lg mb-1.5">{video.alt}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              {/* Game badge */}
              {gameInfo && gameInfo.id !== "general" && (
                <span
                  className="px-2 py-0.5 rounded text-[0.65rem] font-mono border flex items-center gap-1"
                  style={{
                    background: `${gameInfo.color}15`,
                    borderColor: `${gameInfo.color}30`,
                    color: gameInfo.color,
                  }}
                >
                  {gameInfo.icon} {gameInfo.name}
                </span>
              )}
              {video.duration && (
                <span className="flex items-center gap-1">
                  <span className="text-val-red">⏱</span> {video.duration}
                </span>
              )}
              {video.createdTime && (
                <span>
                  {new Date(video.createdTime).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              {video.size && (
                <span className="font-mono text-xs">
                  {(parseInt(video.size) / (1024 * 1024)).toFixed(1)} MB
                </span>
              )}
              {video.mimeType && (
                <span className="px-2 py-0.5 bg-val-red/10 border border-val-red/20 rounded text-[0.65rem] font-mono text-val-red uppercase">
                  {video.mimeType.split("/")[1]}
                </span>
              )}
            </div>
          </div>
          <a
            href={video.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-val-secondary text-[0.7rem] px-5 py-2 flex items-center gap-2"
          >
            <span>⬇</span> DOWNLOAD
          </a>
        </div>
      </div>
    </div>
  );
}
