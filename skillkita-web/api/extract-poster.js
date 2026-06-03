import { callGeminiPosterExtract } from "./lib/geminiPosterExtract.js";
import { verifyAdminRequest } from "./lib/verifyAdmin.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { message: "Method not allowed." });
    return;
  }

  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    sendJson(res, auth.status, { message: auth.message });
    return;
  }

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    sendJson(res, 503, {
      message:
        "Poster extraction is not configured. Set GEMINI_API_KEY in environment variables.",
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    sendJson(res, 400, {
      message: e instanceof Error ? e.message : "Bad request.",
    });
    return;
  }

  const mimeType = String(body.mimeType ?? "").trim().toLowerCase();
  const base64 = String(body.imageBase64 ?? "").trim();

  if (!mimeType || !ALLOWED_MIME.has(mimeType)) {
    sendJson(res, 400, { message: "Unsupported image type. Use JPEG, PNG, or WebP." });
    return;
  }

  if (!base64 || base64.length > 4_500_000) {
    sendJson(res, 400, { message: "Poster image is missing or too large." });
    return;
  }

  try {
    const fields = await callGeminiPosterExtract({ apiKey, mimeType, base64 });
    sendJson(res, 200, { fields });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Extraction failed.";
    sendJson(res, 502, { message: msg });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
