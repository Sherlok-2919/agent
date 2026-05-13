import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/drive/auth
 * Validates the upload password before showing the upload UI.
 */

const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD || "";

export async function POST(req: NextRequest) {
  if (!UPLOAD_PASSWORD) {
    return NextResponse.json(
      { valid: false, error: "Uploads not configured" },
      { status: 503 }
    );
  }

  try {
    const { password } = await req.json();

    if (!password || password !== UPLOAD_PASSWORD) {
      return NextResponse.json(
        { valid: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
