# Drive Backend — Express Server

> Google Drive API backend for **Team Agent** — handles file uploads, auth, and game-based folder sorting.  
> Deploy to **Render** as a Web Service.

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth` | Validate upload password |
| `POST` | `/api/upload` | Upload files (multipart, `files[]` + `game` field) |
| `GET`  | `/api/photos?game=all` | List photos (with game filter) |
| `GET`  | `/api/videos?game=all` | List videos (with game filter) |
| `GET`  | `/api/games` | List available game subfolders |
| `GET`  | `/api/health` | Health check |

## Deploy to Render

1. **Create a Web Service** on [Render](https://render.com)
2. Connect your repo (or upload this folder)
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node version:** `18+`
4. Add **Environment Variables** (copy from `.env`):

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | ✅ | Google Drive API key for reading |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ | Service account email for uploads |
| `GOOGLE_PRIVATE_KEY` | ✅ | Service account private key |
| `PHOTO_FOLDER_ID` | ✅ | Google Drive Photos folder ID |
| `VIDEO_FOLDER_ID` | ✅ | Google Drive Videos folder ID |
| `UPLOAD_PASSWORD` | ✅ | Upload auth password (must match frontend) |
| `ALLOWED_ORIGINS` | ✅ | Frontend URL, e.g. `https://agent.gxrxt.dev` |

5. After deploy, copy the Render URL (e.g. `https://drive-backend-xxxx.onrender.com`)
6. Add it to the frontend's `.env.local`:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://drive-backend-xxxx.onrender.com
   ```

## Local Dev

```bash
npm install
npm run dev   # runs on http://localhost:4000
```

## File Structure

```
drive-backend/
├── server.js         # Express server with all routes
├── package.json      # Dependencies: express, cors, multer, googleapis
├── .env              # Environment variables (template)
├── .gitignore        # Ignores node_modules, .env, uploads/
└── README.md         # This file
```
