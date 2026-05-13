"use client";
import { useState, useMemo } from "react";
import {
  GAMES,
  GAME_CATEGORIES,
  GENERAL_GAME,
  getGamesByCategory,
} from "@/data/games";
import type { GameInfo, GameCategory } from "@/data/games";

interface GameSelectorProps {
  selectedGame: string;
  onSelect: (gameId: string) => void;
}

export default function GameSelector({ selectedGame, onSelect }: GameSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<GameCategory | "all">("all");

  const gamesByCategory = useMemo(() => getGamesByCategory(), []);

  const allGames: (GameInfo | typeof GENERAL_GAME)[] = useMemo(() => {
    return [...GAMES, GENERAL_GAME];
  }, []);

  const filteredGames = useMemo(() => {
    let games = activeCategory === "all"
      ? allGames
      : allGames.filter(
          (g) => g.category === activeCategory || (activeCategory === "other" && g.id === "general")
        );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      games = games.filter(
        (g) => g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q)
      );
    }

    return games;
  }, [allGames, activeCategory, searchQuery]);

  const categories: { key: GameCategory | "all"; label: string; icon: string }[] = [
    { key: "all", label: "All Games", icon: "🎮" },
    ...Object.entries(GAME_CATEGORIES).map(([key, val]) => ({
      key: key as GameCategory,
      label: val.label,
      icon: val.icon,
    })),
  ];

  return (
    <div className="max-w-[700px] w-[90%] mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-base font-bold tracking-wider flex items-center gap-2">
          <span className="text-val-red">◈</span> SELECT GAME
        </h2>
        {selectedGame && selectedGame !== "general" && (
          <button
            onClick={() => onSelect("general")}
            className="font-mono text-[0.65rem] text-gray-500 hover:text-val-red transition-colors duration-300 tracking-wider"
          >
            CLEAR SELECTION
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search games..."
          className="w-full pl-10 pr-4 py-2.5 bg-dark-card border border-glass-border rounded-lg text-val-cream font-body text-sm outline-none focus:border-val-red/40 focus:shadow-[0_0_20px_rgba(255,70,85,0.08)] transition-all duration-300"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[0.65rem] tracking-wider border transition-all duration-300 cursor-pointer whitespace-nowrap ${
              activeCategory === cat.key
                ? "bg-val-red/15 border-val-red/40 text-val-red shadow-[0_0_15px_rgba(255,70,85,0.1)]"
                : "bg-dark-card border-glass-border text-gray-500 hover:border-val-red/20 hover:text-gray-400"
            }`}
          >
            <span className="text-xs">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {filteredGames.map((game) => {
          const isSelected = selectedGame === game.id;
          return (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className={`relative flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all duration-300 cursor-pointer group overflow-hidden ${
                isSelected
                  ? "border-opacity-60 scale-[1.02] -translate-y-0.5"
                  : "border-glass-border bg-dark-card hover:border-opacity-30 hover:-translate-y-0.5"
              }`}
              style={{
                borderColor: isSelected ? game.color : undefined,
                background: isSelected
                  ? `linear-gradient(135deg, ${game.color}15, ${game.color}08)`
                  : undefined,
                boxShadow: isSelected
                  ? `0 8px 30px ${game.color}25, 0 0 0 1px ${game.color}30`
                  : undefined,
              }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[0.5rem] font-bold"
                  style={{ background: game.color }}
                >
                  ✓
                </div>
              )}

              {/* Glow effect on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
                style={{
                  background: `radial-gradient(circle at center, ${game.color}08, transparent 70%)`,
                }}
              />

              <span className="text-2xl relative z-10 transition-transform duration-300 group-hover:scale-110">
                {game.icon}
              </span>
              <span
                className={`font-mono text-[0.6rem] tracking-wider text-center leading-tight relative z-10 transition-colors duration-300 ${
                  isSelected ? "font-semibold" : "text-gray-500 group-hover:text-gray-300"
                }`}
                style={{ color: isSelected ? game.color : undefined }}
              >
                {game.name.length > 12 ? game.name.slice(0, 11) + "…" : game.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* No results */}
      {filteredGames.length === 0 && (
        <div className="text-center py-8 text-gray-600 font-mono text-sm">
          No games found for &ldquo;{searchQuery}&rdquo;
        </div>
      )}

      {/* Selected Game Banner */}
      {selectedGame && (
        <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-dark-card border border-glass-border rounded-lg">
          <span className="text-xl">
            {(allGames.find((g) => g.id === selectedGame) || GENERAL_GAME).icon}
          </span>
          <div className="flex-1">
            <span className="font-heading text-sm tracking-wider">
              {(allGames.find((g) => g.id === selectedGame) || GENERAL_GAME).name}
            </span>
            <p className="text-gray-600 text-[0.65rem] font-mono">
              Files will be uploaded to the{" "}
              <span
                className="font-semibold"
                style={{
                  color: (allGames.find((g) => g.id === selectedGame) || GENERAL_GAME).color,
                }}
              >
                {(allGames.find((g) => g.id === selectedGame) || GENERAL_GAME).name}
              </span>{" "}
              folder
            </p>
          </div>
          <span
            className="w-3 h-3 rounded-full shadow-lg"
            style={{
              background: (allGames.find((g) => g.id === selectedGame) || GENERAL_GAME).color,
              boxShadow: `0 0 12px ${(allGames.find((g) => g.id === selectedGame) || GENERAL_GAME).color}60`,
            }}
          />
        </div>
      )}
    </div>
  );
}
