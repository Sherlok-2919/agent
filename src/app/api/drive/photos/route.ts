import { NextResponse } from "next/server";

/**
 * GET /api/drive/photos
 * Directly queries Google Drive API to list image files
 * from the configured "Photos" folder.
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

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { files: [], source: "error", message: "Google API key not configured. Set GOOGLE_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  try {
    const query = `'${PHOTO_FOLDER_ID}' in parents and (${IMAGE_MIME_QUERY}) and trashed=false`;
    const fields = "files(id,name,mimeType,thumbnailLink,createdTime,size,imageMediaMetadata)";

    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", query);
    url.searchParams.set("fields", fields);
    url.searchParams.set("orderBy", "createdTime desc");
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("key", API_KEY);

    const res = await fetch(url.toString(), {
      next: { revalidate: 30 }, // ISR cache 30s
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[API/drive/photos] Google API error:", res.status, errText);
      return NextResponse.json(
        { files: [], source: "error", message: `Google API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const driveFiles = data.files || [];

    // Transform to our DrivePhoto format
    // Use internal image proxy for reliable loading
    const files = driveFiles.map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      thumbnail: `/api/drive/image/${f.id}`,
      fullSrc: `/api/drive/image/${f.id}`,
      alt: f.name.replace(/\.\w+$/, ""),
      createdTime: f.createdTime,
      size: f.size,
    }));

    return NextResponse.json({
      files,
      count: files.length,
      source: "google-drive",
      folderId: PHOTO_FOLDER_ID,
    });
  } catch (err) {
    console.error("[API/drive/photos] Fetch error:", err);
    return NextResponse.json(
      { files: [], source: "error", message: String(err) },
      { status: 500 }
    );
  }
}
