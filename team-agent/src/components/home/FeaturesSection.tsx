import { features } from "@/data";

export default function FeaturesSection() {
  return (
    <section className="py-24 px-5 md:px-10 max-w-[1400px] mx-auto">
      <h2 className="text-center text-neon-red text-[clamp(1.6rem,3.5vw,2.5rem)] mb-3">
        WHAT&apos;S INSIDE
      </h2>
      <p className="text-center text-gray-500 text-sm mb-14 max-w-[500px] mx-auto">
        Everything you need in one cybernetic vault.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <div key={i} className="card-glass p-8 group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-val-red to-val-teal opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="text-4xl block mb-4">{f.icon}</span>
            <h3 className="font-heading text-sm font-bold tracking-wider mb-2 text-val-cream">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
