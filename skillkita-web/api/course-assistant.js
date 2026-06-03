import { callGeminiCourseAssistant } from "./lib/geminiCourseAssistant.js";
import {
  fetchLandingGuideForAssistant,
  fetchVisibleCoursesForAssistant,
  formatCourseCatalog,
  formatSiteGuide,
} from "./lib/fetchPublicCatalog.js";
import { clientIp, checkRateLimit } from "./lib/rateLimit.js";
import { readJsonBody, sendJson } from "./lib/http.js";

const MAX_MESSAGE_LEN = 800;
const MAX_HISTORY = 8;
const RATE_LIMIT = 25;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    .map((t) => ({ role: t.role, content: t.content.trim().slice(0, 1200) }))
    .filter((t) => t.content.length > 0)
    .slice(-MAX_HISTORY);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { message: "Method not allowed." });
    return;
  }

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    sendJson(res, 503, {
      message: "Course assistant is not configured. Set GEMINI_API_KEY on the server.",
    });
    return;
  }

  const ip = clientIp(req);
  const rate = checkRateLimit(`course-assistant:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.ok) {
    sendJson(res, 429, {
      message: `Too many requests. Try again in about ${rate.retryAfterSec} seconds.`,
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    sendJson(res, 400, { message: e instanceof Error ? e.message : "Bad request." });
    return;
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    sendJson(res, 400, { message: "Message is required." });
    return;
  }
  if (message.length > MAX_MESSAGE_LEN) {
    sendJson(res, 400, { message: `Message must be under ${MAX_MESSAGE_LEN} characters.` });
    return;
  }

  const history = normalizeHistory(body.history);

  try {
    const [courses, landing] = await Promise.all([
      fetchVisibleCoursesForAssistant(),
      fetchLandingGuideForAssistant(),
    ]);

    const reply = await callGeminiCourseAssistant({
      apiKey,
      userMessage: message,
      history,
      courseCatalogText: formatCourseCatalog(courses),
      siteGuideText: formatSiteGuide(landing),
    });

    sendJson(res, 200, { reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Assistant failed.";
    sendJson(res, 502, { message: msg });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
