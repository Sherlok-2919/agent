// ============================================
//  PHOTO DATA — Photo Arena entries
// ============================================

export interface Photo {
  id: string;
  title: string;
  uploader: string;
  album: PhotoAlbum;
  aspect: "landscape" | "portrait" | "square";
  src?: string;       // Image URL or Google Drive file ID
  thumbnail?: string; // Thumbnail URL
}

export type PhotoAlbum = "Screenshots" | "Squad Pics" | "Events";

export const photoAlbums: string[] = [
  "All",
  "Screenshots",
  "Squad Pics",
  "Events",
];

// Gradient placeholders for when no image is loaded yet
export const placeholderGradients: string[] = [
  "linear-gradient(135deg, #1a1040, #2d1b69)",
  "linear-gradient(135deg, #0c2340, #1a4a6d)",
  "linear-gradient(135deg, #2d1040, #691b4a)",
  "linear-gradient(135deg, #0c3340, #1a6d5a)",
  "linear-gradient(135deg, #1a1040, #4a1b69)",
  "linear-gradient(135deg, #0c2340, #1a6d3a)",
  "linear-gradient(135deg, #2d1040, #691b2a)",
  "linear-gradient(135deg, #0c3340, #1a4a6d)",
  "linear-gradient(135deg, #1a1040, #2d1b69)",
];

export const photos: Photo[] = [
  { id: "1", title: "Victory Royale", uploader: "Agent_X", album: "Screenshots", aspect: "landscape", src: "", thumbnail: "" },
  { id: "2", title: "Squad Night", uploader: "ShadowFX", album: "Squad Pics", aspect: "portrait", src: "", thumbnail: "" },
  { id: "3", title: "Tournament Win", uploader: "CyberNova", album: "Events", aspect: "landscape", src: "", thumbnail: "" },
  { id: "4", title: "Setup Tour", uploader: "Agent_X", album: "Screenshots", aspect: "square", src: "", thumbnail: "" },
  { id: "5", title: "LAN Party 2026", uploader: "ShadowFX", album: "Events", aspect: "landscape", src: "", thumbnail: "" },
  { id: "6", title: "New Peripherals", uploader: "Agent_X", album: "Screenshots", aspect: "portrait", src: "", thumbnail: "" },
  { id: "7", title: "Rank Up!", uploader: "CyberNova", album: "Screenshots", aspect: "landscape", src: "", thumbnail: "" },
  { id: "8", title: "Team Photo", uploader: "ShadowFX", album: "Squad Pics", aspect: "square", src: "", thumbnail: "" },
  { id: "9", title: "Stream Setup", uploader: "Agent_X", album: "Screenshots", aspect: "landscape", src: "", thumbnail: "" },
];
