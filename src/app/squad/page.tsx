import Navbar from "@/components/ui/Navbar";
import TierBlock from "@/components/squad/TierBlock";
import { rankTiers, actInfo } from "@/data";

export default function SquadPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen pb-20">
        <section className="text-center px-5 pb-14">
          <div className="badge-val mb-5">{actInfo.label}</div>
          <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-black tracking-[0.08em] text-val-cream mb-2.5">
            SQUAD RANKINGS
          </h1>
          <p className="text-gray-500 text-base tracking-wider">
            Team Agent — Competitive Tier Board
          </p>
        </section>

        <section className="max-w-[1100px] mx-auto px-5 md:px-8 flex flex-col gap-12">
          {rankTiers.map((tier) => (
            <TierBlock key={tier.rank} {...tier} />
          ))}
        </section>
      </main>
    </>
  );
}
