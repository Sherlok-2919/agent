import { NextResponse } from "next/server";

/**
 * GET /api/drive/photos
 * Lists image files from the Google Drive "Photos" folder.
 * Supports game-based subfolders: ?game=valorant or ?game=all (default).
 * Uses the API key from env (server-side only).
 */

const PHOTO_FOLDER_ID = process.env.GOOGLE_DRIVE_PHOTO_FOLDER_ID || "1P-kiu4d1vV-XDjku8EwuAO-0-n06pAmp";
const API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

const IMAGE_MIME_QUERY = [
  "mimeType='image/jpeg'",
  "mimeType='image/png'",
  "mimeType='image/webp'",
  "mimeType='image/gif'",
  "mimeType='image/bmp'",
  "mimeType='image/svg+xml'",
].join(" or ");

const FOLDER_MIME = "application/vnd.google-apps.folder";

/** Cache subfolder IDs for the lifetime of the serverless function */
const subfolderCache: Record<string, string> = {};

/**
 * Find all game subfolders inside the Photos parent folder.
 * Returns a map of { folderName: folderId }.
 */
async function listGameSubfolders(): Promise<Record<string, string>> {
  if (Object.keys(subfolderCache).length > 0) return subfolderCache;

  const query = `'${PHOTO_FOLDER_ID}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`;
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
  }
  return subfolderCache;
}

/**
 * List image files from a specific folder ID.
 */
async function listImagesFromFolder(
  folderId: string,
  gameName: string
): Promise<any[]> {
  const query = `'${folderId}' in parents and (${IMAGE_MIME_QUERY}) and trashed=false`;
  const fields = "files(id,name,mimeType,thumbnailLink,createdTime,size,imageMediaMetadata)";

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", query);
  url.searchParams.set("fields", fields);
  url.searchParams.set("orderBy", "createdTime desc");
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    thumbnail: `/api/drive/image/${f.id}`,
    fullSrc: `/api/drive/image/${f.id}`,
    alt: f.name.replace(/\.\w+$/, ""),
    createdTime: f.createdTime,
    size: f.size,
    game: gameName,
  }));
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
      // Fetch from root Photos folder (ungrouped/general files)
      const rootFiles = await listImagesFromFolder(PHOTO_FOLDER_ID, "general");
      allFiles.push(...rootFiles);

      // Fetch from every game subfolder
      const subfolderEntries = Object.entries(subfolders);
      const subfolderResults = await Promise.all(
        subfolderEntries.map(([name, id]) => listImagesFromFolder(id, name))
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
      // Only root folder (non-game) photos
      allFiles = await listImagesFromFolder(PHOTO_FOLDER_ID, "general");
    } else {
      // Specific game subfolder
      const folderId = subfolders[gameFilter.toLowerCase()];
      if (folderId) {
        allFiles = await listImagesFromFolder(folderId, gameFilter.toLowerCase());
      }
    }

    // Build game stats (count per game)
    const gameStats: Record<string, number> = {};
    for (const file of allFiles) {
      gameStats[file.game] = (gameStats[file.game] || 0) + 1;
    }

    return NextResponse.json({
      files: allFiles,
      count: allFiles.length,
      source: "google-drive",
      folderId: PHOTO_FOLDER_ID,
      gameFilter,
      gameStats,
      availableGames: Object.keys(subfolders),
    });
  } catch (err) {
    console.error("[API/drive/photos] Fetch error:", err);
    return NextResponse.json(
      { files: [], source: "error", message: String(err) },
      { status: 500 }
    );
  }
}
