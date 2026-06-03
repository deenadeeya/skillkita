const buckets = new Map();

/** @param {string} key @param {number} limit @param {number} windowMs */
export function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry || now - entry.start > windowMs) {
    entry = { start: now, count: 0 };
    buckets.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((entry.start + windowMs - now) / 1000) };
  }
  return { ok: true };
}

export function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}
