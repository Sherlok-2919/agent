import { siteMeta } from "@/data";

export default function Footer() {
  return (
    <footer className="py-10 px-5 text-center border-t border-val-red/[0.06]">
      <p className="font-mono text-xs text-gray-600 tracking-wider">
        © {siteMeta.year} <span className="text-val-red">{siteMeta.name}</span> — ALL RIGHTS RESERVED
      </p>
    </footer>
  );
}
