// ============================================
//  VIDEO DATA — Video Vault entries
// ============================================

export interface Video {
  id: string;
  title: string;
  uploader: string;
  category: VideoCategory;
  date: string;
  duration: string;
  thumbnail?: string;  // URL or Google Drive file ID
  src?: string;        // Video source URL or Google Drive file ID
  description?: string;
}

export type VideoCategory = "Gaming Clips" | "Montages" | "Vlogs" | "Highlights";

export const videoCategories: string[] = [
  "All",
  "Gaming Clips",
  "Montages",
  "Vlogs",
  "Highlights",
];

export const videos: Video[] = [
  {
    id: "1",
    title: "CLUTCH ACE — VALORANT",
    uploader: "Agent_X",
    category: "Gaming Clips",
    date: "2026-04-20",
    duration: "3:42",
    thumbnail: "",
    src: "",
  },
  {
    id: "2",
    title: "SQUAD MONTAGE #3",
    uploader: "ShadowFX",
    category: "Montages",
    date: "2026-04-18",
    duration: "5:17",
    thumbnail: "",
    src: "",
  },
  {
    id: "3",
    title: "LATE NIGHT GAMING VLOG",
    uploader: "Agent_X",
    category: "Vlogs",
    date: "2026-04-15",
    duration: "12:04",
    thumbnail: "",
    src: "",
  },
  {
    id: "4",
    title: "1v5 IMPOSSIBLE CLUTCH",
    uploader: "CyberNova",
    category: "Gaming Clips",
    date: "2026-04-12",
    duration: "1:58",
    thumbnail: "",
    src: "",
  },
  {
    id: "5",
    title: "BEST OF APRIL 2026",
    uploader: "ShadowFX",
    category: "Highlights",
    date: "2026-04-10",
    duration: "8:33",
    thumbnail: "",
    src: "",
  },
  {
    id: "6",
    title: "ROAD TO IMMORTAL EP.7",
    uploader: "Agent_X",
    category: "Vlogs",
    date: "2026-04-08",
    duration: "15:21",
    thumbnail: "",
    src: "",
  },
];
