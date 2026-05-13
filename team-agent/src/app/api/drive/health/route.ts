import { NextResponse } from "next/server";

/**
 * GET /api/drive/health
 * Health check endpoint — verifies Google Drive API connectivity.
 */

const API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const PHOTO_FOLDER_ID = process.env.GOOGLE_DRIVE_PHOTO_FOLDER_ID || "1P-kiu4d1vV-XDjku8EwuAO-0-n06pAmp";

export async function GET() {
  const status: Record<string, any> = {
    service: "team-agent-drive",
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!API_KEY,
    photoFolderId: PHOTO_FOLDER_ID,
  };

  if (!API_KEY) {
    return NextResponse.json({
      ...status,
      healthy: false,
      error: "GOOGLE_API_KEY not configured in .env.local",
    });
  }

  try {
    // Quick test: list 1 file from photo folder
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", `'${PHOTO_FOLDER_ID}' in parents and trashed=false`);
    url.searchParams.set("fields", "files(id)");
    url.searchParams.set("pageSize", "1");
    url.searchParams.set("key", API_KEY);

    const res = await fetch(url.toString());

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        ...status,
        healthy: false,
        error: `Google API returned ${res.status}: ${errText}`,
      });
    }

    return NextResponse.json({
      ...status,
      healthy: true,
      driveApiStatus: "connected",
    });
  } catch (err) {
    return NextResponse.json({
      ...status,
      healthy: false,
      error: String(err),
    });
  }
}
