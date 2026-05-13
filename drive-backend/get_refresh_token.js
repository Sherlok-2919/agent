/**
 * One-time script to generate OAuth2 refresh token for Google Drive.
 * 
 * STEPS:
 * 1. Go to Google Cloud Console → APIs & Services → Credentials
 * 2. Create an "OAuth 2.0 Client ID" (type: Web Application)
 * 3. Add http://localhost:3333 as an Authorized Redirect URI
 * 4. Copy the Client ID and Client Secret into .env:
 *      GOOGLE_CLIENT_ID=...
 *      GOOGLE_CLIENT_SECRET=...
 * 5. Run: node get_refresh_token.js
 * 6. Open the URL in browser, authorize, copy the refresh token
 * 7. Add to .env: GOOGLE_REFRESH_TOKEN=...
 */

require("dotenv").config();
const http = require("http");
const { google } = require("googleapis");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3333";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("\n❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
  console.error("   Go to: https://console.cloud.google.com/apis/credentials");
  console.error("   Create OAuth 2.0 Client ID → Web Application");
  console.error("   Add redirect URI: http://localhost:3333\n");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("\n🔑 Open this URL in your browser:\n");
console.log(authUrl);
console.log("\n⏳ Waiting for authorization...\n");

// Start temporary server to catch the redirect
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3333`);
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400);
    res.end("No code received");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("✅ Success! Add this to your .env:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html><body style="font-family: monospace; padding: 40px; background: #0a0a0f; color: #17dea6;">
        <h1>✅ Authorization Successful!</h1>
        <p>Refresh token has been printed in the terminal.</p>
        <p>You can close this tab.</p>
      </body></html>
    `);
  } catch (err) {
    console.error("❌ Error getting token:", err.message);
    res.writeHead(500);
    res.end("Error: " + err.message);
  }

  server.close();
});

server.listen(3333, () => {
  console.log("Listening on http://localhost:3333 for OAuth callback...");
});
