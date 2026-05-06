// ============================================
//  GOOGLE DRIVE CONFIG — Folder IDs & API
// ============================================

export const driveConfig = {
  /** Root shared folder: AGENT */
  rootFolderId: "1VLIi-vb4zYh05I9of4hIZ-OSHijF9Sgv",

  /** Photo subfolder inside AGENT */
  photoFolderId: "1P-kiu4d1vV-XDjku8EwuAO-0-n06pAmp",

  /** Video subfolder inside AGENT */
  videoFolderId: "18z7X9jm9m8a0-wc7ukqY15VTzcYBvYaM",

  /**
   * Google Drive API key (read-only, public folders only).
   * Set via NEXT_PUBLIC_GOOGLE_API_KEY env variable.
   * Without this, the app falls back to placeholder images.
   */
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",

  /** Build a direct thumbnail URL from a Drive file ID */
  thumbnailUrl: (fileId: string, size = 600) =>
    `https://lh3.googleusercontent.com/d/${fileId}=w${size}`,

  /** Build a full-resolution URL from a Drive file ID */
  fullUrl: (fileId: string) =>
    `https://drive.google.com/uc?export=view&id=${fileId}`,

  /** Drive API endpoint for listing files */
  listFilesUrl: (folderId: string, apiKey: string, pageSize = 50) =>
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&fields=files(id,name,mimeType,thumbnailLink,createdTime)&pageSize=${pageSize}&orderBy=createdTime+desc&key=${apiKey}`,
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  createdTime?: string;
}

/**
 * Fetch image files from a Google Drive folder.
 * Returns empty array if API key is missing or folder is empty.
 */
export async function fetchDriveImages(
  folderId: string = driveConfig.photoFolderId
): Promise<DriveFile[]> {
  const apiKey = driveConfig.apiKey;
  if (!apiKey) {
    console.warn("[Drive] No API key set — using fallback images");
    return [];
  }

  try {
    const res = await fetch(driveConfig.listFilesUrl(folderId, apiKey), {
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    });

    if (!res.ok) {
      console.error("[Drive] API error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return (data.files || []) as DriveFile[];
  } catch (err) {
    console.error("[Drive] Fetch failed:", err);
    return [];
  }
}

/**
 * Convert Drive files to the format expected by InfiniteGallery.
 */
export function driveFilesToGalleryImages(
  files: DriveFile[]
): { src: string; alt: string }[] {
  return files.map((f) => ({
    src: driveConfig.thumbnailUrl(f.id),
    alt: f.name.replace(/\.\w+$/, ""), // Strip extension for alt text
  }));
}
