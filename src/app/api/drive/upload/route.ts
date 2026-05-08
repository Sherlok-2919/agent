import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/drive/upload
 * Uploads files to Google Drive using a service account or API key.
 * Files are auto-sorted into Photos or Videos folders based on MIME type.
 * Requires X-Upload-Password header for auth.
 */

const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD || "agent2026";
const API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const PHOTO_FOLDER_ID = process.env.GOOGLE_DRIVE_PHOTO_FOLDER_ID || "1P-kiu4d1vV-XDjku8EwuAO-0-n06pAmp";
const VIDEO_FOLDER_ID = process.env.GOOGLE_DRIVE_VIDEO_FOLDER_ID || "18z7X9jm9m8a0-wc7ukqY15VTzcYBvYaM";

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isVideo(mimeType: string) {
  return mimeType.startsWith("video/");
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

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const results = [];

    for (const file of files) {
      try {
        // Determine target folder
        const folderId = isVideo(file.type) ? VIDEO_FOLDER_ID : PHOTO_FOLDER_ID;
        const fileType = isVideo(file.type) ? "video" : "photo";

        // Prepare multipart upload metadata
        const metadata = {
          name: file.name,
          parents: [folderId],
        };

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBytes = new Uint8Array(arrayBuffer);

        // Build multipart body
        const boundary = "===upload_boundary_" + Date.now() + "===";
        const metadataPart = JSON.stringify(metadata);

        // Create the multipart body manually
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
            driveId: uploadData.id,
            folderId,
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
    });
  } catch (err) {
    console.error("[Upload] Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
