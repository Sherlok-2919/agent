import { stats } from "@/data";

export default function StatsSection() {
  return (
    <section className="py-20 px-5 md:px-10 max-w-[1000px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="card-glass text-center py-10 px-5">
            <div className="font-heading text-[clamp(2rem,4vw,3rem)] font-black bg-gradient-to-br from-val-red to-val-cream bg-clip-text text-transparent mb-1">
              {s.value}
            </div>
            <div className="font-mono text-xs text-gray-600 tracking-[0.12em] uppercase">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
