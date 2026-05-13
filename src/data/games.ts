// ============================================
//  GAME CONFIG — All supported games & categories
// ============================================

export interface GameInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: GameCategory;
  /** Regex patterns to auto-detect from filenames */
  filenamePatterns: RegExp[];
}

export type GameCategory =
  | "fps"
  | "battle-royale"
  | "racing"
  | "open-world"
  | "sandbox"
  | "story"
  | "sports"
  | "moba"
  | "other";

export const GAME_CATEGORIES: Record<GameCategory, { label: string; icon: string }> = {
  fps:           { label: "FPS / Shooter", icon: "🎯" },
  "battle-royale": { label: "Battle Royale", icon: "🔫" },
  racing:        { label: "Racing", icon: "🏎️" },
  "open-world":  { label: "Open World", icon: "🌍" },
  sandbox:       { label: "Sandbox", icon: "⛏️" },
  story:         { label: "Story / Adventure", icon: "📖" },
  sports:        { label: "Sports", icon: "⚽" },
  moba:          { label: "MOBA / Strategy", icon: "🏰" },
  other:         { label: "Other", icon: "🎮" },
};

export const GAMES: GameInfo[] = [
  // ─── FPS / Shooter ───
  {
    id: "valorant",
    name: "Valorant",
    icon: "🎯",
    color: "#ff4655",
    category: "fps",
    filenamePatterns: [/valorant/i, /valo/i],
  },
  {
    id: "csgo",
    name: "CS2",
    icon: "💣",
    color: "#de9b35",
    category: "fps",
    filenamePatterns: [/cs2/i, /csgo/i, /counter[\s_-]?strike/i],
  },
  {
    id: "cod",
    name: "Call of Duty",
    icon: "🪖",
    color: "#4a7c2e",
    category: "fps",
    filenamePatterns: [/cod/i, /call[\s_-]?of[\s_-]?duty/i, /warzone/i, /modern[\s_-]?warfare/i],
  },
  {
    id: "overwatch",
    name: "Overwatch 2",
    icon: "🛡️",
    color: "#fa9c1e",
    category: "fps",
    filenamePatterns: [/overwatch/i, /ow2/i],
  },
  {
    id: "apex",
    name: "Apex Legends",
    icon: "🔺",
    color: "#cd3333",
    category: "fps",
    filenamePatterns: [/apex/i],
  },
  {
    id: "rainbow6",
    name: "Rainbow Six Siege",
    icon: "🛡️",
    color: "#2e6b8a",
    category: "fps",
    filenamePatterns: [/rainbow/i, /r6/i, /siege/i],
  },

  // ─── Battle Royale ───
  {
    id: "bgmi",
    name: "BGMI / PUBG",
    icon: "🔫",
    color: "#f5a623",
    category: "battle-royale",
    filenamePatterns: [/bgmi/i, /pubg/i, /battleground/i],
  },
  {
    id: "fortnite",
    name: "Fortnite",
    icon: "🏗️",
    color: "#3b82f6",
    category: "battle-royale",
    filenamePatterns: [/fortnite/i, /fn_/i],
  },
  {
    id: "freefire",
    name: "Free Fire",
    icon: "🔥",
    color: "#ff6b35",
    category: "battle-royale",
    filenamePatterns: [/free[\s_-]?fire/i, /garena/i, /ff_/i],
  },

  // ─── Racing ───
  {
    id: "forza",
    name: "Forza Horizon",
    icon: "🏎️",
    color: "#0078d4",
    category: "racing",
    filenamePatterns: [/forza/i, /fh5/i, /fh4/i],
  },
  {
    id: "nfs",
    name: "Need for Speed",
    icon: "🏁",
    color: "#1a1a2e",
    category: "racing",
    filenamePatterns: [/nfs/i, /need[\s_-]?for[\s_-]?speed/i],
  },
  {
    id: "asphalt",
    name: "Asphalt",
    icon: "🚗",
    color: "#e63946",
    category: "racing",
    filenamePatterns: [/asphalt/i],
  },
  {
    id: "rocketleague",
    name: "Rocket League",
    icon: "⚽",
    color: "#0080ff",
    category: "racing",
    filenamePatterns: [/rocket[\s_-]?league/i, /rl_/i],
  },

  // ─── Open World ───
  {
    id: "gtav",
    name: "GTA V / GTA Online",
    icon: "🚗",
    color: "#8b5cf6",
    category: "open-world",
    filenamePatterns: [/gta/i, /grand[\s_-]?theft/i],
  },
  {
    id: "rdr2",
    name: "Red Dead Redemption 2",
    icon: "🤠",
    color: "#8b4513",
    category: "open-world",
    filenamePatterns: [/rdr/i, /red[\s_-]?dead/i],
  },
  {
    id: "eldenring",
    name: "Elden Ring",
    icon: "⚔️",
    color: "#c8a951",
    category: "open-world",
    filenamePatterns: [/elden[\s_-]?ring/i],
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk 2077",
    icon: "🤖",
    color: "#fcee09",
    category: "open-world",
    filenamePatterns: [/cyberpunk/i, /cp2077/i],
  },

  // ─── Sandbox ───
  {
    id: "minecraft",
    name: "Minecraft",
    icon: "⛏️",
    color: "#62b85b",
    category: "sandbox",
    filenamePatterns: [/minecraft/i, /mc_/i],
  },
  {
    id: "terraria",
    name: "Terraria",
    icon: "🌳",
    color: "#3e8948",
    category: "sandbox",
    filenamePatterns: [/terraria/i],
  },
  {
    id: "roblox",
    name: "Roblox",
    icon: "🧱",
    color: "#e2231a",
    category: "sandbox",
    filenamePatterns: [/roblox/i],
  },

  // ─── Story / Adventure ───
  {
    id: "godofwar",
    name: "God of War",
    icon: "🪓",
    color: "#b91c1c",
    category: "story",
    filenamePatterns: [/god[\s_-]?of[\s_-]?war/i, /gow/i],
  },
  {
    id: "spiderman",
    name: "Spider-Man",
    icon: "🕷️",
    color: "#ef4444",
    category: "story",
    filenamePatterns: [/spider[\s_-]?man/i],
  },
  {
    id: "horizon",
    name: "Horizon",
    icon: "🦕",
    color: "#e06c2d",
    category: "story",
    filenamePatterns: [/horizon/i, /forbidden[\s_-]?west/i, /zero[\s_-]?dawn/i],
  },
  {
    id: "lastofus",
    name: "The Last of Us",
    icon: "🍄",
    color: "#4a6741",
    category: "story",
    filenamePatterns: [/last[\s_-]?of[\s_-]?us/i, /tlou/i],
  },
  {
    id: "uncharted",
    name: "Uncharted",
    icon: "🗺️",
    color: "#2563eb",
    category: "story",
    filenamePatterns: [/uncharted/i],
  },

  // ─── Sports ───
  {
    id: "fc",
    name: "EA FC / FIFA",
    icon: "⚽",
    color: "#1e40af",
    category: "sports",
    filenamePatterns: [/fifa/i, /ea[\s_-]?fc/i, /eafc/i],
  },
  {
    id: "nba2k",
    name: "NBA 2K",
    icon: "🏀",
    color: "#ea580c",
    category: "sports",
    filenamePatterns: [/nba/i, /2k/i],
  },
  {
    id: "cricket",
    name: "Cricket (Any)",
    icon: "🏏",
    color: "#15803d",
    category: "sports",
    filenamePatterns: [/cricket/i, /wcc/i],
  },

  // ─── MOBA / Strategy ───
  {
    id: "lol",
    name: "League of Legends",
    icon: "⚔️",
    color: "#c89b3c",
    category: "moba",
    filenamePatterns: [/league/i, /lol/i],
  },
  {
    id: "dota2",
    name: "Dota 2",
    icon: "🏰",
    color: "#b91c1c",
    category: "moba",
    filenamePatterns: [/dota/i],
  },
];

/**
 * Detect game from a filename using pattern matching.
 * Returns the game ID or "general" if no match found.
 */
export function detectGameFromFilename(filename: string): string {
  for (const game of GAMES) {
    for (const pattern of game.filenamePatterns) {
      if (pattern.test(filename)) {
        return game.id;
      }
    }
  }
  return "general";
}

/**
 * Get GameInfo by ID. Returns undefined for "general".
 */
export function getGameById(id: string): GameInfo | undefined {
  return GAMES.find((g) => g.id === id);
}

/**
 * Get all games grouped by category.
 */
export function getGamesByCategory(): Record<GameCategory, GameInfo[]> {
  const grouped = {} as Record<GameCategory, GameInfo[]>;
  for (const cat of Object.keys(GAME_CATEGORIES) as GameCategory[]) {
    grouped[cat] = GAMES.filter((g) => g.category === cat);
  }
  return grouped;
}

/** The general / uncategorized fallback */
export const GENERAL_GAME = {
  id: "general",
  name: "General",
  icon: "📸",
  color: "#17dea6",
  category: "other" as GameCategory,
  filenamePatterns: [],
};
