import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/drive/image/[id]
 * Server-side proxy for Google Drive images.
 * Fetches the image using the API key and serves it directly,
 * bypassing CORS and sharing permission issues.
 */

const API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params;

  if (!fileId) {
    return NextResponse.json({ error: "File ID required" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    // Fetch the file content directly using Drive API
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      // Fallback: try the thumbnail endpoint
      const thumbUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink&key=${API_KEY}`;
      const thumbRes = await fetch(thumbUrl);
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData.thumbnailLink) {
          return NextResponse.redirect(thumbData.thumbnailLink);
        }
      }
      return NextResponse.json(
        { error: `Failed to fetch image: ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[Image Proxy] Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
