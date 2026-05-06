// ============================================
//  SITE CONFIG — Global site data
// ============================================

// ---------- Navigation ----------
export interface NavLink {
  href: string;
  label: string;
  icon: string;
}

export const navLinks: NavLink[] = [
  { href: "/", label: "HOME", icon: "⌂" },
  { href: "/videos", label: "VIDEO VAULT", icon: "▶" },
  { href: "/photos", label: "PHOTO ARENA", icon: "◈" },
  { href: "/squad", label: "SQUAD", icon: "◉" },
  { href: "/upload", label: "UPLOAD", icon: "⬆" },
];

// ---------- Features ----------
export interface Feature {
  icon: string;
  title: string;
  desc: string;
}

export const features: Feature[] = [
  {
    icon: "🎬",
    title: "VIDEO VAULT",
    desc: "Cinematic showcase of your best gaming moments, montages, and vlogs — streamed directly from the cloud.",
  },
  {
    icon: "📸",
    title: "PHOTO ARENA",
    desc: "Stunning photo gallery with masonry layouts, lightbox viewing, and 3D hover effects.",
  },
  {
    icon: "👥",
    title: "SQUAD ZONE",
    desc: "Your crew's hub — profile cards, upload stats, and a gamified leaderboard for the squad.",
  },
  {
    icon: "⬆️",
    title: "CLOUD UPLOAD",
    desc: "Friends can upload directly to your Google Drive vault — drag, drop, and you're live.",
  },
];

// ---------- Stats ----------
export interface Stat {
  value: string;
  label: string;
}

export const stats: Stat[] = [
  { value: "3TB+", label: "CLOUD STORAGE" },
  { value: "∞", label: "MEMORIES" },
  { value: "SQUAD", label: "POWERED" },
];

// ---------- Site Meta ----------
export const siteMeta = {
  name: "TEAM AGENT",
  tagline: "The ultimate squad portfolio",
  description: "An immersive 3D gaming portfolio — video vault, photo arena, and squad zone. Built by Team Agent.",
  year: 2026,
};

// ---------- Upload Config ----------
export const uploadConfig = {
  acceptedVideoTypes: ["video/mp4", "video/webm", "video/quicktime"],
  acceptedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  acceptString: "video/*,image/*",
  maxFileSizeMB: 500,
};
