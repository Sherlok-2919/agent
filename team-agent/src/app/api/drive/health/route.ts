import { NextResponse } from "next/server";
import {
  PHOTO_FOLDER_ID,
  API_KEY,
  getSecurityStatus,
} from "@/lib/drive-security";

/**
 * GET /api/drive/health
 * Health check endpoint — verifies Google Drive API connectivity.
 * 🔒 Now includes security confinement status.
 */

export async function GET() {
  const status: Record<string, any> = {
    service: "team-agent-drive",
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!API_KEY,
    photoFolderId: PHOTO_FOLDER_ID,
    security: getSecurityStatus(),
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
