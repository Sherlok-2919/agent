import { NextResponse } from "next/server";

/**
 * GET /api/drive/videos
 * Directly queries Google Drive API to list video files
 * from the configured "Videos" folder.
 * Uses the API key from env (server-side only).
 */

const VIDEO_FOLDER_ID = process.env.GOOGLE_DRIVE_VIDEO_FOLDER_ID || "18z7X9jm9m8a0-wc7ukqY15VTzcYBvYaM";
const API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

const VIDEO_MIME_QUERY = [
  "mimeType='video/mp4'",
  "mimeType='video/webm'",
  "mimeType='video/quicktime'",
  "mimeType='video/x-msvideo'",
  "mimeType='video/x-matroska'",
  "mimeType='video/mpeg'",
].join(" or ");

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { files: [], source: "error", message: "Google API key not configured. Set GOOGLE_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  try {
    const query = `'${VIDEO_FOLDER_ID}' in parents and (${VIDEO_MIME_QUERY}) and trashed=false`;
    const fields = "files(id,name,mimeType,thumbnailLink,createdTime,size,videoMediaMetadata)";

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
      console.error("[API/drive/videos] Google API error:", res.status, errText);
      return NextResponse.json(
        { files: [], source: "error", message: `Google API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const driveFiles = data.files || [];

    // Transform to our DriveVideo format
    const files = driveFiles.map((f: any) => {
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
      };
    });

    return NextResponse.json({
      files,
      count: files.length,
      source: "google-drive",
      folderId: VIDEO_FOLDER_ID,
    });
  } catch (err) {
    console.error("[API/drive/videos] Fetch error:", err);
    return NextResponse.json(
      { files: [], source: "error", message: String(err) },
      { status: 500 }
    );
  }
}
