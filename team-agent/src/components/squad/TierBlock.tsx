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
      {/* Tier Header — centered */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
        <div className="flex items-center gap-3 text-center">
          <span className="text-2xl flex-shrink-0" style={{ color, textShadow: `0 0 15px ${color}60` }}>{icon}</span>
          <div>
            <h2 className="font-heading text-lg font-extrabold tracking-[0.12em]" style={{ color }}>{rank}</h2>
            <span className="font-mono text-[0.65rem] text-gray-600 tracking-[0.15em]">{players.length} AGENTS</span>
          </div>
        </div>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
      </div>

      {/* Player Cards — centered */}
      <div className="flex flex-wrap justify-center gap-4">
        {players.map((player) => (
          <div key={player.name} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]">
            <PlayerCard player={player} rankColor={color} bgGradient={bgGradient} rankIcon={icon} />
          </div>
        ))}
      </div>
    </div>
  );
}
