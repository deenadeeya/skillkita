import { createClient } from "@supabase/supabase-js";

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
const envSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();

/** Real project URL from env — use for persisted storage links, not the dev proxy origin. */
export function getSupabaseProjectUrl(): string {
  return envSupabaseUrl ?? "";
}

export function getSupabaseUrl(): string {
  if (import.meta.env.DEV && typeof window !== "undefined") {
    // Same-origin proxy configured in vite.config.ts (server.proxy).
    return `${window.location.origin}/supabase-api`;
  }
  return envSupabaseUrl ?? "";
}

/** Public object URL that works in production (avoids localhost dev-proxy URLs in the DB). */
export function getStoragePublicUrl(bucket: string, path: string): string {
  const base = getSupabaseProjectUrl().replace(/\/$/, "");
  if (!base) return "";
  const cleanPath = path.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

const STORAGE_PUBLIC_PATH =
  /^https?:\/\/[^/]+(\/storage\/v1\/(?:object\/public|render\/image\/public)\/.+)$/i;

/**
 * Rewrite storage URLs to VITE_SUPABASE_URL (dev proxy, wrong host, or old project ref in DB).
 */
export function normalizeSupabaseStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const base = getSupabaseProjectUrl().replace(/\/$/, "");
  if (!base) return trimmed;

  const proxyMatch = trimmed.match(/^https?:\/\/[^/]+\/supabase-api(\/storage\/v1\/object\/public\/.+)$/i);
  if (proxyMatch) return `${base}${proxyMatch[1]}`;

  const publicMatch = trimmed.match(STORAGE_PUBLIC_PATH);
  if (publicMatch) return `${base}${publicMatch[1]}`;

  // Bare storage path saved in DB (bucket/key...)
  const pathOnly = trimmed.match(/^(site-assets|experience-photos|course-posters)\/(.+)$/i);
  if (pathOnly) {
    return getStoragePublicUrl(pathOnly[1].toLowerCase(), pathOnly[2]);
  }

  return trimmed;
}

const supabaseUrl = getSupabaseUrl();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in skillkita-web/.env, then restart npm run dev."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** User-facing hint when the browser blocks the network call (not an Auth API error). */
export function formatSupabaseNetworkError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (/unexpected end of json input/i.test(message)) {
    return [
      "Supabase returned an empty response (often a bad dev proxy target).",
      "Check skillkita-web/.env.local — it overrides .env. VITE_SUPABASE_URL must be your real project URL, not your-project-id.supabase.co.",
      "Restart `npm run dev` after fixing, then hard-refresh (Ctrl+Shift+R).",
    ].join(" ");
  }

  if (!/failed to fetch/i.test(message)) return message;

  return [
    "Cannot reach Supabase (network error).",
    "In dev, requests go through http://localhost:5173/supabase-api — restart `npm run dev` after .env changes, then hard-refresh (Ctrl+Shift+R).",
    "Check .env.local overrides .env. In DevTools → Application → Service Workers, click Unregister for localhost.",
    "If you disabled legacy API keys in Supabase, use the Publishable key (`sb_publishable_...`) in .env or re-enable legacy anon.",
    "If it still fails: allow *.supabase.co in firewall/VPN/ad-block, or try another browser.",
  ].join(" ");
}

