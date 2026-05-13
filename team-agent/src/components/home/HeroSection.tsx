"use client";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Link from "next/link";
import HeroScene from "@/components/3d/HeroScene";
import ParticleField from "@/components/3d/ParticleField";

function SceneLoader() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-xs text-gray-600 tracking-[0.15em]">
      LOADING ENVIRONMENT...
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<SceneLoader />}>
          <Canvas
            camera={{ position: [0, 0, 8], fov: 55 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <HeroScene />
            <ParticleField count={500} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.4}
              maxPolarAngle={Math.PI / 1.8}
              minPolarAngle={Math.PI / 3}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(10,16,24,0.4)_0%,#0A1018_75%)]" />

      {/* Hero Content */}
      <div className="relative z-[2] text-center px-5">
        <div className="badge-val mb-6 animate-fade-in-up">
          <span className="w-1.5 h-1.5 bg-val-teal rounded-full animate-pulse-glow shadow-[0_0_8px_rgba(23,222,166,0.6)]" />
          SYSTEM ONLINE
        </div>

        <h1 className="font-heading text-[clamp(2.8rem,8vw,6.5rem)] font-black leading-none tracking-wider mb-5 opacity-0 animate-fade-in-up-delay-1">
          <span className="bg-gradient-to-br from-val-red via-val-cream to-val-red bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient-shift">
            TEAM AGENT
          </span>
        </h1>

        <p className="text-sm md:text-base text-gray-400 max-w-[550px] mx-auto mb-9 leading-relaxed opacity-0 animate-fade-in-up-delay-2">
          The ultimate squad portfolio — showcase your gaming moments,
          upload and share memories, all in one immersive 3D vault.
        </p>

        <div className="flex gap-4 justify-center flex-wrap opacity-0 animate-fade-in-up-delay-3">
          <Link href="/videos" className="btn-val-primary">▶ VIDEO VAULT</Link>
          <Link href="/photos" className="btn-val-secondary">◈ PHOTO ARENA</Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-2 opacity-0 animate-float" style={{ animation: "fade-in-up 1s ease 0.8s forwards, float 3s ease-in-out infinite" }}>
        <div className="w-px h-10 bg-gradient-to-b from-val-red to-transparent" />
        <span className="font-mono text-[0.65rem] text-gray-600 tracking-[0.2em]">SCROLL</span>
      </div>
    </section>
  );
}
