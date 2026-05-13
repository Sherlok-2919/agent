// ============================================
//  DRIVE BACKEND — Express Server
//  Handles Google Drive listing + upload
//  Now with game-based subfolder sorting
//  Deploy on Render as a Web Service
// ============================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- CORS ----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Upload-Password"],
  })
);

app.use(express.json());

// ---------- Multer (temp file storage) ----------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-matroska",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// ---------- Google Drive Auth (Service Account for uploads) ----------
function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    return null;
  }

  const auth = new google.auth.JWT(
    email,
    null,
    key.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/drive.file"]
  );

  return google.drive({ version: "v3", auth });
}

// ---------- Config ----------
const PHOTO_FOLDER_ID = process.env.PHOTO_FOLDER_ID || "";
const VIDEO_FOLDER_ID = process.env.VIDEO_FOLDER_ID || "";
const API_KEY = process.env.GOOGLE_API_KEY || "";
const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD || "";

// ---------- Game Subfolder Cache ----------
// Stores: "photos:valorant" -> "folderId"
const subfolderCache = {};

/**
 * Find or create a game subfolder inside a parent folder.
 * Falls back to parent folder if creation fails.
 */
async function getOrCreateGameFolder(drive, parentFolderId, gameName, mediaType) {
  if (!gameName || gameName === "general") {
    return parentFolderId;
  }

  const cacheKey = `${mediaType}:${gameName.toLowerCase()}`;
  if (subfolderCache[cacheKey]) {
    return subfolderCache[cacheKey];
  }

  try {
    // Search for existing subfolder
    const searchRes = await drive.files.list({
      q: `'${parentFolderId}' in parents and name='${gameName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name)",
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      subfolderCache[cacheKey] = searchRes.data.files[0].id;
      return searchRes.data.files[0].id;
    }

    // Create new subfolder
    const createRes = await drive.files.create({
      requestBody: {
        name: gameName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      },
      fields: "id,name",
    });

    // Make subfolder publicly viewable
    await drive.permissions.create({
      fileId: createRes.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    subfolderCache[cacheKey] = createRes.data.id;
    console.log(`[Drive] Created game folder: ${gameName} (${createRes.data.id})`);
    return createRes.data.id;
  } catch (err) {
    console.error(`[Drive] Failed to create game folder ${gameName}:`, err.message);
    return parentFolderId; // Fallback to parent
  }
}

/**
 * List all game subfolders inside a parent folder.
 * Returns a map of { folderName: folderId }.
 */
async function listGameSubfolders(parentFolderId) {
  try {
    const query = `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const url =
      `https://www.googleapis.com/drive/v3/files?` +
      `q=${encodeURIComponent(query)}` +
      `&fields=files(id,name)` +
      `&pageSize=100` +
      `&key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) return {};

    const data = await response.json();
    const result = {};
    for (const f of data.files || []) {
      result[f.name.toLowerCase()] = f.id;
    }
    return result;
  } catch (err) {
    console.error("[Drive] Failed to list subfolders:", err.message);
    return {};
  }
}

/**
 * List files of a specific type from a folder.
 */
async function listFilesFromFolder(folderId, mimeFilter, gameName) {
  try {
    const query = `'${folderId}' in parents and trashed=false and (${mimeFilter})`;
    const url =
      `https://www.googleapis.com/drive/v3/files?` +
      `q=${encodeURIComponent(query)}` +
      `&fields=files(id,name,mimeType,thumbnailLink,createdTime,size,videoMediaMetadata)` +
      `&pageSize=100` +
      `&orderBy=createdTime desc` +
      `&key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.files || []).map((f) => ({ ...f, game: gameName }));
  } catch (err) {
    console.error(`[Drive] Failed to list from folder ${gameName}:`, err.message);
    return [];
  }
}

// ---------- MIME Type Helpers ----------
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_MIMES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

function isImage(mimeType) {
  return IMAGE_MIMES.some((m) => mimeType.startsWith(m.split("/")[0]));
}

function isVideo(mimeType) {
  return VIDEO_MIMES.some((m) => mimeType.startsWith(m.split("/")[0]));
}

// ==========================================================
//  ROUTE: GET /api/photos
//  Lists image files from the Photos Google Drive folder
//  Supports ?game=all|valorant|bgmi|... for filtering
// ==========================================================
app.get("/api/photos", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.json({
        files: [],
        source: "fallback",
        message: "No GOOGLE_API_KEY configured",
      });
    }

    const gameFilter = req.query.game || "all";
    const mimeFilter = "mimeType contains 'image/'";

    // List game subfolders
    const subfolders = await listGameSubfolders(PHOTO_FOLDER_ID);
    let allFiles = [];

    if (gameFilter === "all") {
      // Root folder files
      const rootFiles = await listFilesFromFolder(PHOTO_FOLDER_ID, mimeFilter, "general");
      allFiles.push(...rootFiles);

      // All subfolder files
      for (const [name, id] of Object.entries(subfolders)) {
        const files = await listFilesFromFolder(id, mimeFilter, name);
        allFiles.push(...files);
      }

      // Sort by createdTime desc
      allFiles.sort((a, b) => {
        const ta = a.createdTime ? new Date(a.createdTime).getTime() : 0;
        const tb = b.createdTime ? new Date(b.createdTime).getTime() : 0;
        return tb - ta;
      });
    } else if (gameFilter === "general") {
      allFiles = await listFilesFromFolder(PHOTO_FOLDER_ID, mimeFilter, "general");
    } else {
      const folderId = subfolders[gameFilter.toLowerCase()];
      if (folderId) {
        allFiles = await listFilesFromFolder(folderId, mimeFilter, gameFilter.toLowerCase());
      }
    }

    // Transform files
    const files = allFiles.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      thumbnail: `https://lh3.googleusercontent.com/d/${f.id}=w600`,
      fullSrc: `https://lh3.googleusercontent.com/d/${f.id}=w1920`,
      alt: f.name.replace(/\.\w+$/, ""),
      createdTime: f.createdTime,
      size: f.size,
      game: f.game || "general",
    }));

    // Game stats
    const gameStats = {};
    for (const f of files) {
      gameStats[f.game] = (gameStats[f.game] || 0) + 1;
    }

    res.json({
      files,
      source: "drive",
      count: files.length,
      gameFilter,
      gameStats,
      availableGames: Object.keys(subfolders),
    });
  } catch (err) {
    console.error("[Photos] Error:", err);
    res.status(500).json({ files: [], source: "error", message: String(err) });
  }
});

// ==========================================================
//  ROUTE: GET /api/videos
//  Lists video files from the Videos Google Drive folder
//  Supports ?game=all|valorant|bgmi|... for filtering
// ==========================================================
app.get("/api/videos", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.json({
        files: [],
        source: "fallback",
        message: "No GOOGLE_API_KEY configured",
      });
    }

    const gameFilter = req.query.game || "all";
    const mimeFilter = "mimeType contains 'video/'";

    // List game subfolders
    const subfolders = await listGameSubfolders(VIDEO_FOLDER_ID);
    let allFiles = [];

    if (gameFilter === "all") {
      const rootFiles = await listFilesFromFolder(VIDEO_FOLDER_ID, mimeFilter, "general");
      allFiles.push(...rootFiles);

      for (const [name, id] of Object.entries(subfolders)) {
        const files = await listFilesFromFolder(id, mimeFilter, name);
        allFiles.push(...files);
      }

      allFiles.sort((a, b) => {
        const ta = a.createdTime ? new Date(a.createdTime).getTime() : 0;
        const tb = b.createdTime ? new Date(b.createdTime).getTime() : 0;
        return tb - ta;
      });
    } else if (gameFilter === "general") {
      allFiles = await listFilesFromFolder(VIDEO_FOLDER_ID, mimeFilter, "general");
    } else {
      const folderId = subfolders[gameFilter.toLowerCase()];
      if (folderId) {
        allFiles = await listFilesFromFolder(folderId, mimeFilter, gameFilter.toLowerCase());
      }
    }

    const files = allFiles.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      thumbnail: `https://lh3.googleusercontent.com/d/${f.id}=w600`,
      streamUrl: `https://drive.google.com/file/d/${f.id}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
      alt: f.name.replace(/\.\w+$/, ""),
      createdTime: f.createdTime,
      size: f.size,
      duration: f.videoMediaMetadata?.durationMillis
        ? formatDuration(parseInt(f.videoMediaMetadata.durationMillis))
        : null,
      game: f.game || "general",
    }));

    const gameStats = {};
    for (const f of files) {
      gameStats[f.game] = (gameStats[f.game] || 0) + 1;
    }

    res.json({
      files,
      source: "drive",
      count: files.length,
      gameFilter,
      gameStats,
      availableGames: Object.keys(subfolders),
    });
  } catch (err) {
    console.error("[Videos] Error:", err);
    res.status(500).json({ files: [], source: "error", message: String(err) });
  }
});

// ==========================================================
//  ROUTE: GET /api/games
//  Returns available game subfolders for both Photos & Videos
// ==========================================================
app.get("/api/games", async (req, res) => {
  try {
    const photoSubfolders = await listGameSubfolders(PHOTO_FOLDER_ID);
    const videoSubfolders = await listGameSubfolders(VIDEO_FOLDER_ID);

    res.json({
      photoGames: Object.keys(photoSubfolders),
      videoGames: Object.keys(videoSubfolders),
      allGames: [...new Set([...Object.keys(photoSubfolders), ...Object.keys(videoSubfolders)])],
    });
  } catch (err) {
    console.error("[Games] Error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// ==========================================================
//  ROUTE: POST /api/upload
//  Upload files to Google Drive (game-specific subfolders)
//  Accepts: files[], game (form field), X-Upload-Password
// ==========================================================
app.post("/api/upload", upload.array("files", 10), async (req, res) => {
  try {
    // Simple password auth
    const password = req.headers["x-upload-password"] || req.body?.password;
    if (UPLOAD_PASSWORD && password !== UPLOAD_PASSWORD) {
      // Clean up temp files
      if (req.files) {
        req.files.forEach((f) => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }
      return res.status(401).json({ error: "Invalid upload password" });
    }

    const drive = getDriveClient();
    if (!drive) {
      // Clean up temp files
      if (req.files) {
        req.files.forEach((f) => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }
      return res.status(500).json({
        error: "Google Drive service account not configured",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    // Get game tag from form body
    const game = req.body?.game || "general";

    const results = [];

    for (const file of req.files) {
      // Determine target folder based on MIME type
      const isVideoFile = file.mimetype.startsWith("video/");
      const parentFolderId = isVideoFile ? VIDEO_FOLDER_ID : PHOTO_FOLDER_ID;
      const mediaType = isVideoFile ? "videos" : "photos";
      const fileType = isVideoFile ? "video" : "photo";

      try {
        // Get or create game-specific subfolder
        const targetFolderId = await getOrCreateGameFolder(
          drive,
          parentFolderId,
          game,
          mediaType
        );

        const driveResponse = await drive.files.create({
          requestBody: {
            name: file.originalname,
            parents: [targetFolderId],
          },
          media: {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path),
          },
          fields: "id, name, mimeType, webViewLink",
        });

        // Make the file publicly viewable
        await drive.permissions.create({
          fileId: driveResponse.data.id,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });

        results.push({
          success: true,
          fileName: file.originalname,
          type: fileType,
          game,
          driveId: driveResponse.data.id,
          webViewLink: driveResponse.data.webViewLink,
        });
      } catch (uploadErr) {
        console.error(`[Upload] Failed for ${file.originalname}:`, uploadErr);
        results.push({
          success: false,
          fileName: file.originalname,
          error: uploadErr.message,
        });
      } finally {
        // Clean up temp file
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    res.json({
      message: `${successCount}/${results.length} files uploaded successfully`,
      results,
      game,
    });
  } catch (err) {
    console.error("[Upload] Error:", err);
    // Clean up any remaining temp files
    if (req.files) {
      req.files.forEach((f) => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }
    res.status(500).json({ error: String(err) });
  }
});

// ==========================================================
//  ROUTE: POST /api/auth
//  Validates the upload password before showing upload UI
// ==========================================================
app.post("/api/auth", (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== UPLOAD_PASSWORD) {
    return res.status(401).json({ valid: false, error: "Invalid password" });
  }
  res.json({ valid: true });
});

// ==========================================================
//  ROUTE: GET /api/health
//  Health check for Render deployment
// ==========================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: {
      hasApiKey: !!API_KEY,
      hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      photoFolder: !!PHOTO_FOLDER_ID,
      videoFolder: !!VIDEO_FOLDER_ID,
    },
  });
});

// ==========================================================
//  ROUTE: GET /
//  Root info
// ==========================================================
app.get("/", (req, res) => {
  res.json({
    name: "Team Agent — Drive Backend",
    version: "2.0.0",
    features: ["Game-based subfolder sorting", "Auto-create game folders"],
    endpoints: {
      auth: "POST /api/auth { password }",
      photos: "GET /api/photos?game=all|valorant|bgmi|...",
      videos: "GET /api/videos?game=all|valorant|bgmi|...",
      games: "GET /api/games",
      upload: "POST /api/upload (files[] + game field)",
      health: "GET /api/health",
    },
  });
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ error: `Upload error: ${err.message}` });
  }
  res.status(500).json({ error: err.message });
});

// ---------- Duration formatter ----------
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`\n⬡ TEAM AGENT — Drive Backend v2.0`);
  console.log(`  ➜ Server running on http://localhost:${PORT}`);
  console.log(`  ➜ API Key: ${API_KEY ? "✓ configured" : "✗ missing"}`);
  console.log(
    `  ➜ Service Account: ${
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
        ? "✓ configured"
        : "✗ missing (uploads disabled)"
    }`
  );
  console.log(`  ➜ Photo Folder: ${PHOTO_FOLDER_ID || "not set"}`);
  console.log(`  ➜ Video Folder: ${VIDEO_FOLDER_ID || "not set"}`);
  console.log(`  ➜ Game Sorting: ✓ enabled\n`);
});
