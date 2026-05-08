// ============================================
//  GOOGLE DRIVE CONFIG — Internal API Integration
// ============================================

/**
 * All Drive operations now go through Next.js internal API routes:
 *   /api/drive/photos  — list photos from Google Drive
 *   /api/drive/videos  — list videos from Google Drive
 *   /api/drive/upload  — upload files to Google Drive
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
}

/**
 * Fetch photos from the internal API route.
 * Auto-refreshes from Google Drive on each call.
 */
export async function fetchPhotos(): Promise<DrivePhoto[]> {
  try {
    const res = await fetch(driveConfig.photosEndpoint);
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
 * Fetch videos from the internal API route.
 * Auto-refreshes from Google Drive on each call.
 */
export async function fetchVideos(): Promise<DriveVideo[]> {
  try {
    const res = await fetch(driveConfig.videosEndpoint);
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
 * Upload files to Google Drive through the internal API route.
 * Files are auto-sorted into Photos/Videos folders by MIME type.
 */
export async function uploadFiles(
  files: File[],
  password: string,
  onProgress?: (fileName: string, progress: number) => void
): Promise<{ success: boolean; results: any[] }> {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const res = await fetch(driveConfig.uploadEndpoint, {
      method: "POST",
      headers: {
        "X-Upload-Password": password,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, results: [{ error: data.error }] };
    }

    return { success: true, results: data.results || [] };
  } catch (err) {
    console.error("[Drive] Upload failed:", err);
    return { success: false, results: [{ error: String(err) }] };
  }
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
