const fs = require("fs");
const path = require("path");

async function testUpload() {
  // Create a tiny test PNG (1x1 pixel)
  const pngData = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/58BAwAI/AL+hc2rNAAAAABJRU5ErkJggg==",
    "base64"
  );

  const boundary = "----TestUpload" + Date.now();
  const fileName = "test_upload_" + Date.now() + ".png";

  // Build multipart body manually
  let body = "";
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="game"\r\n\r\n`;
  body += `general\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n`;
  body += `Content-Type: image/png\r\n\r\n`;

  const beforeFile = Buffer.from(body, "utf-8");
  const afterFile = Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8");
  const fullBody = Buffer.concat([beforeFile, pngData, afterFile]);

  console.log(`\nTesting upload to http://localhost:4000/api/upload`);
  console.log(`File: ${fileName} (${pngData.length} bytes)\n`);

  try {
    const res = await fetch("http://localhost:4000/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "X-Upload-Password": "agent2026",
      },
      body: fullBody,
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (data.results && data.results[0] && data.results[0].success) {
      console.log("\n✅ UPLOAD SUCCESSFUL!");
      console.log(`   Drive ID: ${data.results[0].driveId}`);
    } else {
      console.log("\n❌ UPLOAD FAILED");
      console.log(`   Error: ${data.results?.[0]?.error || data.error || "Unknown"}`);
    }
  } catch (err) {
    console.error("❌ Request failed:", err.message);
  }
}

testUpload();
