import { NextResponse } from "next/server";
import { driveConfig } from "@/lib/drive";
import type { DriveFile } from "@/lib/drive";

/**
 * GET /api/drive/photos
 * Lists image files from the Google Drive "Photo" folder.
 * Falls back to empty array if no API key or folder is empty.
 */
export async function GET() {
  const apiKey = driveConfig.apiKey;

  if (!apiKey) {
    return NextResponse.json({
      files: [],
      source: "fallback",
      message: "No NEXT_PUBLIC_GOOGLE_API_KEY configured",
    });
  }

  try {
    const url = driveConfig.listFilesUrl(driveConfig.photoFolderId, apiKey);
    const res = await fetch(url, { next: { revalidate: 60 } });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[API/drive/photos] Drive API error:", res.status, errText);
      return NextResponse.json(
        { files: [], source: "error", message: errText },
        { status: 502 }
      );
    }

    const data = await res.json();
    const files: DriveFile[] = data.files || [];

    // Transform to gallery-ready format
    const images = files.map((f) => ({
      id: f.id,
      name: f.name,
      src: driveConfig.thumbnailUrl(f.id),
      fullSrc: driveConfig.fullUrl(f.id),
      alt: f.name.replace(/\.\w+$/, ""),
      createdTime: f.createdTime,
    }));

    return NextResponse.json({ files: images, source: "drive" });
  } catch (err) {
    console.error("[API/drive/photos] Fetch error:", err);
    return NextResponse.json(
      { files: [], source: "error", message: String(err) },
      { status: 500 }
    );
  }
}
