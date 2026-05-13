import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/drive/upload
 * Uploads files to Google Drive using API key.
 * Files are sorted into game-specific subfolders based on the `game` field.
 * If no game subfolder exists, it's created automatically.
 * Requires X-Upload-Password header for auth.
 */

const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD || "agent2026";
const API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const PHOTO_FOLDER_ID = process.env.GOOGLE_DRIVE_PHOTO_FOLDER_ID || "1P-kiu4d1vV-XDjku8EwuAO-0-n06pAmp";
const VIDEO_FOLDER_ID = process.env.GOOGLE_DRIVE_VIDEO_FOLDER_ID || "18z7X9jm9m8a0-wc7ukqY15VTzcYBvYaM";
const FOLDER_MIME = "application/vnd.google-apps.folder";

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isVideo(mimeType: string) {
  return mimeType.startsWith("video/");
}

/** Cache of game subfolder IDs: "photos:valorant" -> "folderId" */
const subfolderCache: Record<string, string> = {};

/**
 * Find or create a game subfolder inside a parent folder.
 * Uses Google Drive API key for read, but creating folders requires
 * appropriate permissions. Falls back to parent folder if creation fails.
 */
async function getOrCreateGameFolder(
  parentFolderId: string,
  gameName: string,
  mediaType: "photos" | "videos"
): Promise<string> {
  // "general" means use the root folder directly
  if (!gameName || gameName === "general") {
    return parentFolderId;
  }

  const cacheKey = `${mediaType}:${gameName.toLowerCase()}`;
  if (subfolderCache[cacheKey]) {
    return subfolderCache[cacheKey];
  }

  // Try to find existing subfolder
  const searchQuery = `'${parentFolderId}' in parents and mimeType='${FOLDER_MIME}' and name='${gameName}' and trashed=false`;
  const searchUrl = new URL("https://www.googleapis.com/drive/v3/files");
  searchUrl.searchParams.set("q", searchQuery);
  searchUrl.searchParams.set("fields", "files(id,name)");
  searchUrl.searchParams.set("key", API_KEY);

  try {
    const searchRes = await fetch(searchUrl.toString());
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        subfolderCache[cacheKey] = searchData.files[0].id;
        return searchData.files[0].id;
      }
    }
  } catch (err) {
    console.error(`[Upload] Error searching for subfolder ${gameName}:`, err);
  }

  // Try to create the subfolder
  try {
    const createRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: gameName,
          mimeType: FOLDER_MIME,
          parents: [parentFolderId],
        }),
      }
    );

    if (createRes.ok) {
      const createData = await createRes.json();
      subfolderCache[cacheKey] = createData.id;
      console.log(`[Upload] Created subfolder: ${gameName} (${createData.id})`);
      return createData.id;
    } else {
      console.warn(`[Upload] Could not create subfolder ${gameName}, using parent folder. Status: ${createRes.status}`);
    }
  } catch (err) {
    console.error(`[Upload] Error creating subfolder ${gameName}:`, err);
  }

  // Fallback: use parent folder
  return parentFolderId;
}

export async function POST(req: NextRequest) {
  // Auth check
  const password = req.headers.get("X-Upload-Password");
  if (password !== UPLOAD_PASSWORD) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Google API key not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const game = (formData.get("game") as string) || "general";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const results = [];

    for (const file of files) {
      try {
        // Determine target parent folder based on MIME type
        const isVideoFile = isVideo(file.type);
        const parentFolderId = isVideoFile ? VIDEO_FOLDER_ID : PHOTO_FOLDER_ID;
        const mediaType = isVideoFile ? "videos" : "photos";
        const fileType = isVideoFile ? "video" : "photo";

        // Get or create game-specific subfolder
        const targetFolderId = await getOrCreateGameFolder(
          parentFolderId,
          game,
          mediaType as "photos" | "videos"
        );

        // Prepare multipart upload metadata
        const metadata = {
          name: file.name,
          parents: [targetFolderId],
        };

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBytes = new Uint8Array(arrayBuffer);

        // Build multipart body
        const boundary = "===upload_boundary_" + Date.now() + "===";
        const metadataPart = JSON.stringify(metadata);

        const encoder = new TextEncoder();
        const beforeFile = encoder.encode(
          `--${boundary}\r\n` +
          `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
          `${metadataPart}\r\n` +
          `--${boundary}\r\n` +
          `Content-Type: ${file.type}\r\n\r\n`
        );
        const afterFile = encoder.encode(`\r\n--${boundary}--`);

        // Combine parts
        const body = new Uint8Array(beforeFile.length + fileBytes.length + afterFile.length);
        body.set(beforeFile, 0);
        body.set(fileBytes, beforeFile.length);
        body.set(afterFile, beforeFile.length + fileBytes.length);

        const uploadRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body: body,
          }
        );

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          results.push({
            success: true,
            fileName: file.name,
            fileType,
            game,
            driveId: uploadData.id,
            folderId: targetFolderId,
          });
        } else {
          const errText = await uploadRes.text();
          console.error(`[Upload] Failed for ${file.name}:`, uploadRes.status, errText);
          results.push({
            success: false,
            fileName: file.name,
            error: `Upload failed: ${uploadRes.status}`,
          });
        }
      } catch (fileErr) {
        console.error(`[Upload] Error for ${file.name}:`, fileErr);
        results.push({
          success: false,
          fileName: file.name,
          error: String(fileErr),
        });
      }
    }

    const allSuccess = results.every((r) => r.success);
    return NextResponse.json({
      success: allSuccess,
      results,
      uploaded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      game,
    });
  } catch (err) {
    console.error("[Upload] Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
