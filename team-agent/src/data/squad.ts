// ============================================
//  SQUAD DATA — Valorant ACT Rank Tiers
// ============================================

export interface Player {
  name: string;
  role: string;
  photo?: string; // URL or path to player photo
  uploads: number;
}

export interface RankTier {
  rank: string;
  color: string;
  bgGradient: string;
  icon: string;
  players: Player[];
}

export const rankTiers: RankTier[] = [
  {
    rank: "ASCENDANT",
    color: "#2DEB90",
    bgGradient: "linear-gradient(135deg, #0d2e1f, #14382a)",
    icon: "▲",
    players: [
      { name: "XonorOP", role: "Duelist Main", uploads: 47, photo: "" },
      { name: "CTRL", role: "Pagolchoda Instalocker", uploads: 38, photo: "" },
    ],
  },
  {
    rank: "DIAMOND",
    color: "#B489C4",
    bgGradient: "linear-gradient(135deg, #1f1428, #2a1a35)",
    icon: "◆",
    players: [
      { name: "Chronic", role: "Flex", uploads: 28, photo: "" },
      { name: "Aegon", role: "Jogot Shreshto Chamber Chodna", uploads: 24, photo: "" },
    ],
  },
  {
    rank: "PLATINUM",
    color: "#59C8C8",
    bgGradient: "linear-gradient(135deg, #0f2328, #142e33)",
    icon: "⬡",
    players: [
      { name: "ArkeNova", role: "Flex", uploads: 21, photo: "" },
      { name: "Sherlok", role: "FLex/DudhSaken", uploads: 18, photo: "" },
      { name: "KING", role: "Entry/Smoker", uploads: 15, photo: "" },
    ],
  },
  {
    rank: "GOLD",
    color: "#ECB940",
    bgGradient: "linear-gradient(135deg, #1f1a0d, #2a2214)",
    icon: "★",
    players: [
      { name: "AGENT ENGINEER", role: "Support", uploads: 12, photo: "" },
      { name: "BIPROJIT", role: "SAGE", uploads: 9, photo: "" },
    ],
  },
];

// ACT info
export const actInfo = {
  act: "ACT III",
  episode: "EPISODE 9",
  label: "ACT III // EPISODE 9",
};
