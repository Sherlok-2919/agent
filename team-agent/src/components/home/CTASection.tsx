import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24 px-5 text-center relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,70,85,0.08),transparent_70%)] pointer-events-none" />

      <h2 className="text-neon-teal text-[clamp(1.8rem,4vw,3rem)] mb-4 relative">
        READY TO EXPLORE?
      </h2>
      <p className="text-gray-500 mb-9 text-base relative">
        Dive into the vault. Relive every moment.
      </p>
      <div className="flex gap-4 justify-center flex-wrap relative">
        <Link href="/upload" className="btn-val-primary">⬆ UPLOAD NOW</Link>
        <Link href="/squad" className="btn-val-secondary">◉ VIEW SQUAD</Link>
      </div>
    </section>
  );
}
