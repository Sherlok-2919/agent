/**
 * 🔒 AGENT Folder Security — Shared Configuration
 *
 * This module defines the ONLY Google Drive folder IDs that the
 * application is allowed to read from, write to, or create subfolders in.
 * All Drive API operations MUST validate against this whitelist.
 *
 * Folder Structure (inside AGENT shared folder):
 *   AGENT/
 *   ├── Photo/          ← PHOTO_FOLDER_ID
 *   │   ├── valorant/   ← auto-created game subfolders
 *   │   ├── bgmi/
 *   │   └── ...
 *   └── Video/          ← VIDEO_FOLDER_ID
 *       ├── valorant/
 *       └── ...
 */

// Root folder IDs inside the AGENT shared folder
export const PHOTO_FOLDER_ID =
  process.env.GOOGLE_DRIVE_PHOTO_FOLDER_ID || "1P-kiu4d1vV-XDjku8EwuAO-0-n06pAmp";
export const VIDEO_FOLDER_ID =
  process.env.GOOGLE_DRIVE_VIDEO_FOLDER_ID || "18z7X9jm9m8a0-wc7ukqY15VTzcYBvYaM";

export const API_KEY =
  process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

export const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD || "";

export const FOLDER_MIME = "application/vnd.google-apps.folder";

/**
 * 🔒 Sanitize game names to prevent Drive API query injection.
 * Only allows alphanumeric characters, hyphens, underscores, and spaces.
 */
export function sanitizeGameName(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "general";
  const cleaned = name.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 50);
  return cleaned || "general";
}

// ==========================================================
//  🔒 ALLOWED FOLDER WHITELIST
//  These are the ONLY folders where operations are permitted.
//  Root folders (Photo/Video) can have subfolders created inside.
//  Files can only be uploaded to root folders or their subfolders.
// ==========================================================
const ALLOWED_ROOT_FOLDER_IDS = new Set(
  [PHOTO_FOLDER_ID, VIDEO_FOLDER_ID].filter(Boolean)
);

// Track discovered/created subfolders at runtime
const ALLOWED_SUBFOLDER_IDS = new Set<string>();

/**
 * 🔒 Check if a folder ID is an allowed target for any operation.
 */
export function isAllowedFolder(folderId: string): boolean {
  return ALLOWED_ROOT_FOLDER_IDS.has(folderId) || ALLOWED_SUBFOLDER_IDS.has(folderId);
}

/**
 * 🔒 Check if a folder ID is a root AGENT folder (Photo or Video).
 * Only root folders can have subfolders created inside them.
 */
export function isAllowedRootFolder(folderId: string): boolean {
  return ALLOWED_ROOT_FOLDER_IDS.has(folderId);
}

/**
 * 🔒 Register a discovered or newly created subfolder as allowed.
 * Must only be called for subfolders whose parent is a root folder.
 */
export function registerSubfolder(folderId: string): void {
  ALLOWED_SUBFOLDER_IDS.add(folderId);
}

/**
 * Get security status for health check endpoints.
 */
export function getSecurityStatus() {
  return {
    folderConfinement: "enabled",
    allowedRootFolders: ALLOWED_ROOT_FOLDER_IDS.size,
    trackedSubfolders: ALLOWED_SUBFOLDER_IDS.size,
    description:
      "All operations confined to AGENT shared folder (Photo + Video folders and their game subfolders only)",
  };
}
