import { NextResponse } from "next/server";
import {
  VIDEO_FOLDER_ID,
  API_KEY,
  FOLDER_MIME,
  isAllowedFolder,
  isAllowedRootFolder,
  registerSubfolder,
} from "@/lib/drive-security";

/**
 * GET /api/drive/videos
 * Lists video files from the Google Drive "Videos" folder.
 * Supports game-based subfolders: ?game=valorant or ?game=all (default).
 * Uses the API key from env (server-side only).
 *
 * 🔒 SECURITY: All folder access is validated against the AGENT whitelist.
 */

const VIDEO_MIME_QUERY = [
  "mimeType='video/mp4'",
  "mimeType='video/webm'",
  "mimeType='video/quicktime'",
  "mimeType='video/x-msvideo'",
  "mimeType='video/x-matroska'",
  "mimeType='video/mpeg'",
].join(" or ");

/** Cache subfolder IDs for the lifetime of the serverless function */
const subfolderCache: Record<string, string> = {};

/**
 * Find all game subfolders inside the Videos parent folder.
 *
 * 🔒 Only scans the whitelisted VIDEO_FOLDER_ID.
 */
async function listGameSubfolders(): Promise<Record<string, string>> {
  if (Object.keys(subfolderCache).length > 0) return subfolderCache;

  // 🔒 Verify parent is a root AGENT folder
  if (!isAllowedRootFolder(VIDEO_FOLDER_ID)) {
    console.error("[🔒 Security] BLOCKED: VIDEO_FOLDER_ID is not in allowed set");
    return {};
  }

  const query = `'${VIDEO_FOLDER_ID}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`;
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", query);
  url.searchParams.set("fields", "files(id,name)");
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 120 } });
  if (!res.ok) return {};

  const data = await res.json();
  for (const f of data.files || []) {
    subfolderCache[f.name.toLowerCase()] = f.id;
    registerSubfolder(f.id); // 🔒 Register as allowed
  }
  return subfolderCache;
}

/**
 * List video files from a specific folder ID.
 *
 * 🔒 Folder ID must be in the allowed set.
 */
async function listVideosFromFolder(
  folderId: string,
  gameName: string
): Promise<any[]> {
  // 🔒 Verify folder is allowed
  if (!isAllowedFolder(folderId)) {
    console.error(`[🔒 Security] BLOCKED: Cannot list videos from unauthorized folder ${folderId}`);
    return [];
  }

  const query = `'${folderId}' in parents and (${VIDEO_MIME_QUERY}) and trashed=false`;
  const fields = "files(id,name,mimeType,thumbnailLink,createdTime,size,videoMediaMetadata)";

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", query);
  url.searchParams.set("fields", fields);
  url.searchParams.set("orderBy", "createdTime desc");
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.files || []).map((f: any) => {
    const durationMs = f.videoMediaMetadata?.durationMillis;
    let duration: string | undefined;
    if (durationMs) {
      const totalSec = Math.floor(Number(durationMs) / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      duration = `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      thumbnail: `/api/drive/image/${f.id}`,
      streamUrl: `https://drive.google.com/file/d/${f.id}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
      alt: f.name.replace(/\.\w+$/, ""),
      createdTime: f.createdTime,
      size: f.size,
      duration,
      game: gameName,
    };
  });
}

export async function GET(req: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { files: [], source: "error", message: "Google API key not configured. Set GOOGLE_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const gameFilter = searchParams.get("game") || "all";

    // List subfolders to find game-specific folders
    const subfolders = await listGameSubfolders();

    let allFiles: any[] = [];

    if (gameFilter === "all") {
      // Fetch from root Videos folder (ungrouped/general files)
      const rootFiles = await listVideosFromFolder(VIDEO_FOLDER_ID, "general");
      allFiles.push(...rootFiles);

      // Fetch from every game subfolder
      const subfolderEntries = Object.entries(subfolders);
      const subfolderResults = await Promise.all(
        subfolderEntries.map(([name, id]) => listVideosFromFolder(id, name))
      );
      for (const files of subfolderResults) {
        allFiles.push(...files);
      }

      // Sort all by createdTime desc
      allFiles.sort((a, b) => {
        const ta = a.createdTime ? new Date(a.createdTime).getTime() : 0;
        const tb = b.createdTime ? new Date(b.createdTime).getTime() : 0;
        return tb - ta;
      });
    } else if (gameFilter === "general") {
      allFiles = await listVideosFromFolder(VIDEO_FOLDER_ID, "general");
    } else {
      const folderId = subfolders[gameFilter.toLowerCase()];
      if (folderId) {
        allFiles = await listVideosFromFolder(folderId, gameFilter.toLowerCase());
      }
    }

    // Build game stats
    const gameStats: Record<string, number> = {};
    for (const file of allFiles) {
      gameStats[file.game] = (gameStats[file.game] || 0) + 1;
    }

    return NextResponse.json({
      files: allFiles,
      count: allFiles.length,
      source: "google-drive",
      folderId: VIDEO_FOLDER_ID,
      gameFilter,
      gameStats,
      availableGames: Object.keys(subfolders),
    });
  } catch (err) {
    console.error("[API/drive/videos] Fetch error:", err);
    return NextResponse.json(
      { files: [], source: "error", message: String(err) },
      { status: 500 }
    );
  }
}
