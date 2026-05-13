// ============================================
//  DRIVE BACKEND — Express Server
//  Handles Google Drive listing + upload
//  Now with game-based subfolder sorting
//  Deploy on Render as a Web Service
//
//  🔒 SECURITY: All operations are confined
//     to the AGENT shared folder ONLY.
//     No files/folders can be created or
//     accessed outside the allowed folder IDs.
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

// ---------- Input Sanitization ----------
/**
 * Sanitize game names to prevent Drive API query injection.
 * Only allows alphanumeric characters, hyphens, underscores, and spaces.
 */
function sanitizeGameName(name) {
  if (!name || typeof name !== "string") return "general";
  const cleaned = name.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 50);
  return cleaned || "general";
}

// ---------- Basic Rate Limiting (in-memory) ----------
const uploadRateMap = new Map(); // IP -> { count, resetTime }
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max uploads per window

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = uploadRateMap.get(ip);
  if (!entry || now > entry.resetTime) {
    uploadRateMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ---------- CORS ----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

// CORS preflight is handled automatically by the cors() middleware below.

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`[CORS] Blocked origin: ${origin}. Allowed: ${allowedOrigins.join(", ")}`);
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
    // 🔒 SECURITY: Only `drive.file` scope — service account can ONLY
    // access files/folders it has explicitly created or been shared on.
    // It CANNOT browse, list, or modify any other files in the Drive.
    ["https://www.googleapis.com/auth/drive.file"]
  );

  return google.drive({ version: "v3", auth });
}

// ---------- Config ----------
const PHOTO_FOLDER_ID = process.env.PHOTO_FOLDER_ID || "";
const VIDEO_FOLDER_ID = process.env.VIDEO_FOLDER_ID || "";
const API_KEY = process.env.GOOGLE_API_KEY || "";
const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD || "";

// ---------- Startup Validation ----------
(function validateEnv() {
  const warnings = [];
  if (!API_KEY) warnings.push("GOOGLE_API_KEY is not set — listing endpoints will fail");
  if (!PHOTO_FOLDER_ID) warnings.push("PHOTO_FOLDER_ID is not set");
  if (!VIDEO_FOLDER_ID) warnings.push("VIDEO_FOLDER_ID is not set");
  if (!UPLOAD_PASSWORD) warnings.push("UPLOAD_PASSWORD is not set — uploads will be BLOCKED");
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) warnings.push("GOOGLE_SERVICE_ACCOUNT_EMAIL is not set — uploads disabled");
  warnings.forEach((w) => console.warn(`[⚠ Config] ${w}`));
})();

// ==========================================================
//  🔒 SECURITY: ALLOWED FOLDER WHITELIST
//  These are the ONLY folders inside the AGENT shared folder
//  where files/subfolders can be created or read from.
//  Any operation targeting a folder NOT in this set is BLOCKED.
// ==========================================================
const ALLOWED_ROOT_FOLDER_IDS = new Set([
  PHOTO_FOLDER_ID,
  VIDEO_FOLDER_ID,
].filter(Boolean));

// Track subfolders we create — they're also allowed targets
// Key: folderId, Value: parentFolderId (must be in ALLOWED_ROOT_FOLDER_IDS)
const ALLOWED_SUBFOLDER_IDS = new Set();

/**
 * 🔒 Validate that a folder ID is an allowed target for operations.
 * Only root folders (Photo/Video) and their direct child subfolders
 * (game folders we created/discovered) are permitted.
 */
function isAllowedFolder(folderId) {
  return ALLOWED_ROOT_FOLDER_IDS.has(folderId) || ALLOWED_SUBFOLDER_IDS.has(folderId);
}

/**
 * 🔒 Validate that a parent folder ID is a root folder (Photo or Video).
 * Subfolders can ONLY be created inside root folders, NOT nested deeper.
 */
function isAllowedParentForSubfolder(parentFolderId) {
  return ALLOWED_ROOT_FOLDER_IDS.has(parentFolderId);
}

// ---------- Game Subfolder Cache ----------
// Stores: "photos:valorant" -> "folderId"
const subfolderCache = {};

/**
 * Find or create a game subfolder inside a parent folder.
 * Falls back to parent folder if creation fails.
 *
 * 🔒 SECURITY: Parent MUST be one of the root AGENT folders.
 *    Created subfolders are registered in the allowed set.
 */
async function getOrCreateGameFolder(drive, parentFolderId, gameName, mediaType) {
  if (!gameName || gameName === "general") {
    return parentFolderId;
  }

  // 🔒 Block creating subfolders in non-root folders
  if (!isAllowedParentForSubfolder(parentFolderId)) {
    console.error(`[🔒 Security] BLOCKED: Cannot create subfolder in non-root folder ${parentFolderId}`);
    return parentFolderId;
  }

  const cacheKey = `${mediaType}:${gameName.toLowerCase()}`;
  if (subfolderCache[cacheKey]) {
    return subfolderCache[cacheKey];
  }

  try {
    // Search for existing subfolder (gameName already sanitized by caller)
    const safeGameName = sanitizeGameName(gameName);
    const searchRes = await drive.files.list({
      q: `'${parentFolderId}' in parents and name='${safeGameName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name)",
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      const folderId = searchRes.data.files[0].id;
      subfolderCache[cacheKey] = folderId;
      ALLOWED_SUBFOLDER_IDS.add(folderId); // 🔒 Register as allowed
      return folderId;
    }

    // Create new subfolder
    const createRes = await drive.files.create({
      requestBody: {
        name: safeGameName,
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
    ALLOWED_SUBFOLDER_IDS.add(createRes.data.id); // 🔒 Register as allowed
    console.log(`[Drive] Created game folder: ${gameName} (${createRes.data.id}) inside ${parentFolderId}`);
    return createRes.data.id;
  } catch (err) {
    console.error(`[Drive] Failed to create game folder ${gameName}:`, err.message);
    return parentFolderId; // Fallback to parent
  }
}

/**
 * List all game subfolders inside a parent folder.
 * Returns a map of { folderName: folderId }.
 *
 * 🔒 SECURITY: Parent MUST be in the allowed root set.
 *    Discovered subfolders are registered as allowed.
 */
async function listGameSubfolders(parentFolderId) {
  // 🔒 Block listing subfolders of non-allowed folders
  if (!ALLOWED_ROOT_FOLDER_IDS.has(parentFolderId)) {
    console.error(`[🔒 Security] BLOCKED: Cannot list subfolders of non-root folder ${parentFolderId}`);
    return {};
  }

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
      ALLOWED_SUBFOLDER_IDS.add(f.id); // 🔒 Register discovered subfolders
    }
    return result;
  } catch (err) {
    console.error("[Drive] Failed to list subfolders:", err.message);
    return {};
  }
}

/**
 * List files of a specific type from a folder.
 *
 * 🔒 SECURITY: Folder MUST be in the allowed set (root or registered subfolder).
 */
async function listFilesFromFolder(folderId, mimeFilter, gameName) {
  // 🔒 Block listing files from non-allowed folders
  if (!isAllowedFolder(folderId)) {
    console.error(`[🔒 Security] BLOCKED: Cannot list files from unauthorized folder ${folderId}`);
    return [];
  }

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

// ---------- MIME Type Constants ----------
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_MIMES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

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

    if (!PHOTO_FOLDER_ID) {
      return res.status(500).json({ files: [], error: "PHOTO_FOLDER_ID not configured" });
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

    if (!VIDEO_FOLDER_ID) {
      return res.status(500).json({ files: [], error: "VIDEO_FOLDER_ID not configured" });
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
//
//  🔒 SECURITY: Files can ONLY be uploaded into the
//     whitelisted Photo/Video folders or their game subfolders.
// ==========================================================
app.post("/api/upload", upload.array("files", 10), async (req, res) => {
  try {
    // Rate limiting
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      if (req.files) {
        req.files.forEach((f) => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }
      return res.status(429).json({ error: "Too many uploads — try again later" });
    }

    // Password auth (REQUIRED — no fallback)
    const password = req.headers["x-upload-password"] || req.body?.password;
    if (!UPLOAD_PASSWORD || password !== UPLOAD_PASSWORD) {
      // Clean up temp files
      if (req.files) {
        req.files.forEach((f) => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }
      return res.status(401).json({ error: !UPLOAD_PASSWORD ? "Uploads not configured" : "Invalid upload password" });
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
    const game = sanitizeGameName(req.body?.game);

    const results = [];

    for (const file of req.files) {
      // Determine target folder based on MIME type
      const isVideoFile = file.mimetype.startsWith("video/");
      const parentFolderId = isVideoFile ? VIDEO_FOLDER_ID : PHOTO_FOLDER_ID;
      const mediaType = isVideoFile ? "videos" : "photos";
      const fileType = isVideoFile ? "video" : "photo";

      // 🔒 SECURITY: Verify the parent folder is in our allowed set
      if (!ALLOWED_ROOT_FOLDER_IDS.has(parentFolderId)) {
        console.error(`[🔒 Security] BLOCKED: Upload to unauthorized root folder ${parentFolderId}`);
        results.push({
          success: false,
          fileName: file.originalname,
          error: "Upload target folder is not authorized",
        });
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        continue;
      }

      try {
        // Get or create game-specific subfolder (security-checked inside)
        const targetFolderId = await getOrCreateGameFolder(
          drive,
          parentFolderId,
          game,
          mediaType
        );

        // 🔒 SECURITY: Final check — target must be in allowed set
        if (!isAllowedFolder(targetFolderId)) {
          console.error(`[🔒 Security] BLOCKED: Upload to unauthorized folder ${targetFolderId}`);
          results.push({
            success: false,
            fileName: file.originalname,
            error: "Upload target folder is not authorized",
          });
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          continue;
        }

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
  if (!UPLOAD_PASSWORD) {
    return res.status(503).json({ valid: false, error: "Uploads not configured" });
  }
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
    security: {
      folderConfinement: "enabled",
      allowedRootFolders: ALLOWED_ROOT_FOLDER_IDS.size,
      trackedSubfolders: ALLOWED_SUBFOLDER_IDS.size,
      serviceAccountScope: "drive.file (restricted)",
    },
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
    version: "3.0.0",
    features: [
      "Game-based subfolder sorting",
      "Auto-create game folders",
      "🔒 AGENT folder confinement — all ops restricted to whitelisted folders",
    ],
    security: {
      folderConfinement: true,
      scope: "drive.file",
      description: "All file operations are restricted to the AGENT shared folder (Photo + Video folders and their game subfolders only).",
    },
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
  console.log(`\n⬡ TEAM AGENT — Drive Backend v3.0 (Secured)`);
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
  console.log(`  ➜ Game Sorting: ✓ enabled`);
  console.log(`  🔒 Folder Confinement: ✓ ACTIVE`);
  console.log(`  🔒 Allowed Root Folders: ${ALLOWED_ROOT_FOLDER_IDS.size}`);
  console.log(`  🔒 Scope: drive.file (restricted)\n`);
});
