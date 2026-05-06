import PlayerCard from "./PlayerCard";

interface Player {
  name: string;
  role: string;
  uploads: number;
}

interface TierBlockProps {
  rank: string;
  color: string;
  bgGradient: string;
  icon: string;
  players: Player[];
}

export default function TierBlock({ rank, color, bgGradient, icon, players }: TierBlockProps) {
  return (
    <div className="relative">
      {/* Tier Header */}
      <div className="flex items-center gap-3.5 mb-6 pl-4 border-l-[3px]" style={{ borderLeftColor: color }}>
        <span className="text-2xl flex-shrink-0" style={{ color, textShadow: `0 0 15px ${color}60` }}>{icon}</span>
        <div>
          <h2 className="font-heading text-lg font-extrabold tracking-[0.12em]" style={{ color }}>{rank}</h2>
          <span className="font-mono text-[0.65rem] text-gray-600 tracking-[0.15em]">{players.length} AGENTS</span>
        </div>
        <div className="flex-1 h-px ml-4" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
      </div>

      {/* Player Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <PlayerCard key={player.name} player={player} rankColor={color} bgGradient={bgGradient} rankIcon={icon} />
        ))}
      </div>
    </div>
  );
}
