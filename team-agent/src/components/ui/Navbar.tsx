"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { navLinks } from "@/data";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] py-4 transition-all duration-300 ${scrolled ? "bg-dark-bg/90 backdrop-blur-xl border-b border-val-red/10 py-2.5" : ""}`}>
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 z-[101]">
          <span className="text-2xl text-val-red animate-float drop-shadow-[0_0_8px_rgba(255,70,85,0.5)]">⬡</span>
          <span className="font-heading text-lg font-extrabold tracking-[0.12em] text-val-cream">TEAM AGENT</span>
        </Link>

        <button
          className="md:hidden flex flex-col gap-[5px] bg-none border-none cursor-pointer p-1 z-[101]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-val-cream rounded-sm transition-all duration-300 ${menuOpen ? "rotate-45 translate-x-[5px] translate-y-[5px]" : ""}`} />
          <span className={`block w-6 h-0.5 bg-val-cream rounded-sm transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-val-cream rounded-sm transition-all duration-300 ${menuOpen ? "-rotate-45 translate-x-[5px] -translate-y-[5px]" : ""}`} />
        </button>

        <ul className={`list-none flex items-center gap-1 max-md:fixed max-md:inset-0 max-md:bg-dark-bg/[0.97] max-md:backdrop-blur-3xl max-md:flex-col max-md:justify-center max-md:items-center max-md:gap-3 max-md:transition-opacity max-md:duration-300 ${menuOpen ? "max-md:opacity-100 max-md:pointer-events-auto" : "max-md:opacity-0 max-md:pointer-events-none"}`}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center gap-1.5 px-4 py-2 font-heading text-[0.7rem] font-semibold tracking-[0.1em] text-gray-500 rounded hover:text-val-red hover:bg-val-red/[0.06] transition-all duration-300 max-md:text-base max-md:px-7 max-md:py-3.5"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-sm opacity-70">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
