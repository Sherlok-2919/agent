interface Player {
  name: string;
  role: string;
  uploads: number;
}

interface PlayerCardProps {
  player: Player;
  rankColor: string;
  bgGradient: string;
  rankIcon: string;
}

export default function PlayerCard({ player, rankColor, bgGradient, rankIcon }: PlayerCardProps) {
  return (
    <div
      className="rounded-lg p-7 pt-7 pb-5 text-center relative overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
      style={{ background: bgGradient, borderColor: `${rankColor}20` }}
    >
      {/* Top glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${rankColor}10, transparent 70%)` }} />

      {/* Avatar */}
      <div className="relative inline-block mb-4">
        <div
          className="w-[68px] h-[68px] rounded-full border-2 flex items-center justify-center bg-black/40 relative"
          style={{ borderColor: rankColor, boxShadow: `0 0 20px ${rankColor}25` }}
        >
          <span className="font-heading text-xl font-extrabold text-val-cream">{player.name[0]}</span>
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[0.6rem] font-black border-2 border-dark-bg"
          style={{ background: rankColor, color: "#0A1018" }}
        >
          {rankIcon}
        </div>
      </div>

      {/* Info */}
      <h3 className="font-heading text-sm font-bold tracking-wider mb-1 text-val-cream">{player.name}</h3>
      <span className="font-mono text-[0.68rem] tracking-wider block mb-4" style={{ color: rankColor }}>{player.role}</span>

      {/* Stats */}
      <div className="flex items-center justify-center pt-3.5 border-t border-white/5">
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="font-heading text-base font-extrabold text-val-cream">{player.uploads}</span>
          <span className="font-mono text-[0.58rem] text-gray-600 tracking-[0.15em]">UPLOADS</span>
        </div>
        <div className="w-px h-[30px] flex-shrink-0" style={{ background: `${rankColor}30` }} />
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="font-heading text-base font-extrabold" style={{ color: rankColor }}>{rankIcon}</span>
          <span className="font-mono text-[0.58rem] text-gray-600 tracking-[0.15em]">RANK</span>
        </div>
      </div>
    </div>
  );
}
