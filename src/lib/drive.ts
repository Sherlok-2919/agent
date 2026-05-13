// ============================================
//  GOOGLE DRIVE CONFIG — Internal API Integration
//  Now supports game-based subfolder sorting
// ============================================

/**
 * All Drive operations go through Next.js internal API routes:
 *   /api/drive/photos  — list photos (supports ?game=all|valorant|etc)
 *   /api/drive/videos  — list videos (supports ?game=all|valorant|etc)
 *   /api/drive/upload  — upload files (accepts game field in FormData)
 *
 * No external backend needed — the API key is used server-side only.
 */

export const driveConfig = {
  /** Root shared folder: AGENT */
  rootFolderId: "1VLIi-vb4zYh05I9of4hIZ-OSHijF9Sgv",

  /** Photo subfolder inside AGENT */
  photoFolderId: "1P-kiu4d1vV-XDjku8EwuAO-0-n06pAmp",

  /** Video subfolder inside AGENT */
  videoFolderId: "18z7X9jm9m8a0-wc7ukqY15VTzcYBvYaM",

  /** Internal API endpoints */
  photosEndpoint: "/api/drive/photos",
  videosEndpoint: "/api/drive/videos",
  uploadEndpoint: "/api/drive/upload",

  /** Build a direct thumbnail URL from a Drive file ID */
  thumbnailUrl: (fileId: string, size = 600) =>
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`,

  /** Build a full-resolution URL from a Drive file ID */
  fullUrl: (fileId: string) =>
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`,

  /** Drive preview/embed URL */
  previewUrl: (fileId: string) =>
    `https://drive.google.com/file/d/${fileId}/preview`,
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  createdTime?: string;
}

export interface DrivePhoto {
  id: string;
  name: string;
  mimeType?: string;
  thumbnail: string;
  fullSrc: string;
  alt: string;
  createdTime?: string;
  size?: string;
  /** Game tag — e.g. "valorant", "bgmi", "general" */
  game?: string;
}

export interface DriveVideo {
  id: string;
  name: string;
  mimeType?: string;
  thumbnail: string;
  streamUrl: string;
  downloadUrl: string;
  alt: string;
  createdTime?: string;
  size?: string;
  duration?: string;
  /** Game tag — e.g. "valorant", "bgmi", "general" */
  game?: string;
}

export interface DriveListResponse<T> {
  files: T[];
  count: number;
  source: string;
  gameFilter?: string;
  gameStats?: Record<string, number>;
  availableGames?: string[];
}

/**
 * Fetch photos from the internal API route.
 * Optionally filter by game. Default: all photos.
 */
export async function fetchPhotos(game?: string): Promise<DrivePhoto[]> {
  try {
    const url = game && game !== "all"
      ? `${driveConfig.photosEndpoint}?game=${encodeURIComponent(game)}`
      : driveConfig.photosEndpoint;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[Drive] Photos fetch error:", res.status);
      return [];
    }
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error("[Drive] Photos fetch failed:", err);
    return [];
  }
}

/**
 * Fetch photos with full metadata (including game stats).
 */
export async function fetchPhotosWithStats(
  game?: string
): Promise<DriveListResponse<DrivePhoto>> {
  try {
    const url = game && game !== "all"
      ? `${driveConfig.photosEndpoint}?game=${encodeURIComponent(game)}`
      : driveConfig.photosEndpoint;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[Drive] Photos fetch error:", res.status);
      return { files: [], count: 0, source: "error" };
    }
    return await res.json();
  } catch (err) {
    console.error("[Drive] Photos fetch failed:", err);
    return { files: [], count: 0, source: "error" };
  }
}

/**
 * Fetch videos from the internal API route.
 * Optionally filter by game. Default: all videos.
 */
export async function fetchVideos(game?: string): Promise<DriveVideo[]> {
  try {
    const url = game && game !== "all"
      ? `${driveConfig.videosEndpoint}?game=${encodeURIComponent(game)}`
      : driveConfig.videosEndpoint;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[Drive] Videos fetch error:", res.status);
      return [];
    }
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error("[Drive] Videos fetch failed:", err);
    return [];
  }
}

/**
 * Fetch videos with full metadata (including game stats).
 */
export async function fetchVideosWithStats(
  game?: string
): Promise<DriveListResponse<DriveVideo>> {
  try {
    const url = game && game !== "all"
      ? `${driveConfig.videosEndpoint}?game=${encodeURIComponent(game)}`
      : driveConfig.videosEndpoint;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[Drive] Videos fetch error:", res.status);
      return { files: [], count: 0, source: "error" };
    }
    return await res.json();
  } catch (err) {
    console.error("[Drive] Videos fetch failed:", err);
    return { files: [], count: 0, source: "error" };
  }
}

/**
 * Upload a single file to Google Drive through the internal API route.
 * Files are auto-sorted into Photos/Videos folders by MIME type,
 * then further into game-specific subfolders.
 */
async function uploadSingleFile(
  file: File,
  password: string,
  game: string
): Promise<{ success: boolean; fileName: string; driveId?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("files", file);
    formData.append("game", game);

    const res = await fetch(driveConfig.uploadEndpoint, {
      method: "POST",
      headers: {
        "X-Upload-Password": password,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, fileName: file.name, error: data.error || `Upload failed: ${res.status}` };
    }

    const result = data.results?.[0];
    return {
      success: result?.success ?? false,
      fileName: file.name,
      driveId: result?.driveId,
      error: result?.error,
    };
  } catch (err) {
    console.error(`[Drive] Upload failed for ${file.name}:`, err);
    return { success: false, fileName: file.name, error: String(err) };
  }
}

/**
 * Upload files to Google Drive — one at a time to avoid body size limits.
 * Each file is uploaded in a separate request for reliability.
 */
export async function uploadFiles(
  files: File[],
  password: string,
  game: string = "general",
  onFileComplete?: (index: number, result: { success: boolean; driveId?: string; error?: string }) => void
): Promise<{ success: boolean; results: any[] }> {
  const results: any[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadSingleFile(files[i], password, game);
    results.push(result);

    // Notify per-file completion so UI can update live
    if (onFileComplete) {
      onFileComplete(i, result);
    }
  }

  const allSuccess = results.every((r) => r.success);
  return { success: allSuccess, results };
}

/**
 * Convert Drive files to the format expected by InfiniteGallery.
 */
export function driveFilesToGalleryImages(
  files: DrivePhoto[]
): { src: string; alt: string }[] {
  return files.map((f) => ({
    src: f.thumbnail || driveConfig.thumbnailUrl(f.id),
    alt: f.alt || f.name.replace(/\.\w+$/, ""),
  }));
}
