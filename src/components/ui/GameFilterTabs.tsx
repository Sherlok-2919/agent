"use client";
import { useMemo } from "react";
import { getGameById, GENERAL_GAME } from "@/data/games";

interface GameFilterTabsProps {
  gameStats: Record<string, number>;
  activeGame: string;
  onSelectGame: (game: string) => void;
  totalCount: number;
  /** Accent color for the "ALL" tab */
  accentColor?: string;
}

export default function GameFilterTabs({
  gameStats,
  activeGame,
  onSelectGame,
  totalCount,
  accentColor = "#17dea6",
}: GameFilterTabsProps) {
  const gameEntries = useMemo(() => {
    return Object.entries(gameStats)
      .sort((a, b) => b[1] - a[1]) // Sort by count desc
      .map(([gameId, count]) => {
        const info = getGameById(gameId) || (gameId === "general" ? GENERAL_GAME : null);
        return {
          id: gameId,
          name: info?.name || gameId,
          icon: info?.icon || "📁",
          color: info?.color || "#666",
          count,
        };
      });
  }, [gameStats]);

  if (gameEntries.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-wrap justify-center max-w-[900px]">
      {/* ALL tab */}
      <button
        onClick={() => onSelectGame("all")}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[0.7rem] tracking-wider border transition-all duration-300 cursor-pointer whitespace-nowrap ${
          activeGame === "all"
            ? "shadow-lg -translate-y-0.5"
            : "bg-dark-card border-glass-border text-gray-500 hover:border-opacity-50 hover:text-gray-300"
        }`}
        style={
          activeGame === "all"
            ? {
                background: `${accentColor}18`,
                borderColor: `${accentColor}50`,
                color: accentColor,
                boxShadow: `0 4px 20px ${accentColor}20`,
              }
            : undefined
        }
      >
        🎮 ALL
        <span
          className="px-1.5 py-0.5 rounded-full text-[0.6rem] font-semibold"
          style={
            activeGame === "all"
              ? { background: `${accentColor}25`, color: accentColor }
              : { background: "rgba(255,255,255,0.06)", color: "inherit" }
          }
        >
          {totalCount}
        </span>
      </button>

      {/* Game tabs */}
      {gameEntries.map((entry) => {
        const isActive = activeGame === entry.id;
        return (
          <button
            key={entry.id}
            onClick={() => onSelectGame(entry.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[0.7rem] tracking-wider border transition-all duration-300 cursor-pointer whitespace-nowrap ${
              isActive
                ? "shadow-lg -translate-y-0.5"
                : "bg-dark-card border-glass-border text-gray-500 hover:text-gray-300"
            }`}
            style={
              isActive
                ? {
                    background: `${entry.color}18`,
                    borderColor: `${entry.color}50`,
                    color: entry.color,
                    boxShadow: `0 4px 20px ${entry.color}20`,
                  }
                : undefined
            }
          >
            <span className="text-xs">{entry.icon}</span>
            {entry.name}
            <span
              className="px-1.5 py-0.5 rounded-full text-[0.6rem] font-semibold"
              style={
                isActive
                  ? { background: `${entry.color}25`, color: entry.color }
                  : { background: "rgba(255,255,255,0.06)", color: "inherit" }
              }
            >
              {entry.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
