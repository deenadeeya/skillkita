/**
 * Same-origin Supabase proxy for production (Vercel).
 * Used when the Vercel project root is the repository root (see root vercel.json).
 */

const PASSTHROUGH_HEADERS = [
  "authorization",
  "apikey",
  "content-type",
  "x-client-info",
  "accept",
  "accept-profile",
  "content-profile",
  "prefer",
  "range",
  "x-upsert",
  "if-none-match",
  "if-modified-since",
];

function invalidSupabaseBase(base) {
  if (!base) return "Missing VITE_SUPABASE_URL on the server. Add it in Vercel → Settings → Environment Variables.";
  if (/your-project-id/i.test(base)) {
    return "VITE_SUPABASE_URL is still the .env.example placeholder. Set your real Supabase project URL in Vercel env vars and redeploy.";
  }
  return null;
}

export default async function handler(req, res) {
  const base = (process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const configError = invalidSupabaseBase(base);
  if (configError) {
    res.status(500).json({ message: configError });
    return;
  }

  const pathSegs = req.query.path;
  const subPath = Array.isArray(pathSegs) ? pathSegs.join("/") : pathSegs || "";

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue;
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (value != null) {
      query.append(key, value);
    }
  }
  const qs = query.toString();
  const target = `${base}/${subPath}${qs ? `?${qs}` : ""}`;

  const headers = {};
  for (const name of PASSTHROUGH_HEADERS) {
    const value = req.headers[name];
    if (value == null) continue;
    headers[name] = Array.isArray(value) ? value.join(", ") : value;
  }

  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!headers.apikey && anonKey) {
    headers.apikey = anonKey;
  }

  const method = req.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstream = await fetch(target, {
    method,
    headers,
    body: hasBody ? req : undefined,
    duplex: hasBody ? "half" : undefined,
  });

  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "transfer-encoding" || lower === "connection" || lower === "content-encoding") {
      return;
    }
    res.setHeader(key, value);
  });

  const body = Buffer.from(await upstream.arrayBuffer());
  res.send(body);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
