import Navbar from "@/components/ui/Navbar";
import VideoGrid from "@/components/videos/VideoGrid";

export const metadata = {
  title: "Video Arena | TEAM AGENT",
  description:
    "Stream the squad's best gaming moments — auto-synced from Google Drive. Playable video cards with cloud streaming.",
};

export default function VideosPage() {
  return (
    <>
      <Navbar />
      <VideoArenaHero />
      <VideoGrid />
    </>
  );
}

function VideoArenaHero() {
  return (
    <section className="relative pt-28 pb-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-val-red/[0.03] to-dark-bg" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-val-red/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-val-teal/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-val-red/25"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-5">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-1.5 font-mono text-xs font-semibold text-val-red mb-6"
          style={{
            letterSpacing: "0.18em",
            border: "1px solid rgba(255, 70, 85, 0.3)",
            background: "rgba(255, 70, 85, 0.05)",
            clipPath:
              "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
          }}
        >
          ▶ VIDEO ARENA
        </div>

        {/* Title */}
        <h1 className="font-heading text-[clamp(2.5rem,7vw,4.5rem)] font-black tracking-tight leading-none mb-5">
          <span className="text-val-cream">STREAM </span>
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #FF4655, #ff7b85, #FF4655)",
              backgroundSize: "200% 200%",
              animation: "gradient-shift 4s ease infinite",
            }}
          >
            THE VAULT
          </span>
        </h1>

        <p className="text-gray-500 text-base max-w-lg mx-auto mb-8">
          Your squad&apos;s best moments — streamed directly from Google Drive.
          New uploads appear automatically.
        </p>

        {/* Status indicators */}
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-val-teal shadow-[0_0_8px_rgba(23,222,166,0.6)] animate-pulse" />
            <span className="font-mono text-[0.7rem] text-val-teal tracking-wider">
              GOOGLE DRIVE CONNECTED
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-val-red/60 shadow-[0_0_8px_rgba(255,70,85,0.4)]" />
            <span className="font-mono text-[0.7rem] text-gray-500 tracking-wider">
              AUTO-REFRESH: 30s
            </span>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-val-red/30 to-transparent" />
    </section>
  );
}
