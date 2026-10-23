import crypto from "node:crypto";

// ─── Cloudinary Deletion API ────────────────────────────────────────────────
// Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// Set these in Vercel Dashboard → Project → Settings → Environment Variables
// NEVER hardcode these values here — this file is tracked by Git.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Validate all three credentials are present
  if (!cloudName || !apiKey || !apiSecret) {
    const missing = [
      !cloudName && "CLOUDINARY_CLOUD_NAME",
      !apiKey && "CLOUDINARY_API_KEY",
      !apiSecret && "CLOUDINARY_API_SECRET",
    ].filter(Boolean);
    return res.status(503).json({
      error: `Cloudinary deletion is not configured. Missing environment variables: ${missing.join(", ")}. ` +
        `Add them in Vercel Dashboard → Project → Settings → Environment Variables.`,
    });
  }

  const assets = Array.isArray(req.body?.assets)
    ? req.body.assets.filter((asset) => asset?.publicId)
    : [];

  if (!assets.length) {
    return res.status(400).json({ error: "No media selected." });
  }

  const results = await Promise.all(
    assets.map(async ({ publicId, resourceType = "image" }) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = crypto
        .createHash("sha1")
        .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
        .digest("hex");
      const body = new URLSearchParams({
        public_id: publicId,
        timestamp: String(timestamp),
        api_key: apiKey,
        signature,
      });
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        }
      );
      const data = await response.json();
      if (!response.ok || data.result !== "ok") {
        throw new Error(data.error?.message || `Could not delete ${publicId}`);
      }
      return data;
    })
  );

  return res.status(200).json({ deleted: results.length });
}
