import { createClient } from "@supabase/supabase-js";

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
const envSupabaseUrl = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "").trim();

/** Real project URL from env — use for persisted storage links, not the dev proxy origin. */
export function getSupabaseProjectUrl(): string {
  return envSupabaseUrl ?? "";
}

export function getSupabaseUrl(): string {
  const base = envSupabaseUrl.replace(/\/$/, "");
  if (base) return base;
  // Fallback when VITE_* were missing at build time (misconfigured Vercel env).
  if (typeof window !== "undefined") {
    return `${window.location.origin}/supabase-api`;
  }
  return "";
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

  if (/method not allowed/i.test(message) || /\b405\b/.test(message)) {
    return import.meta.env.DEV
      ? "Supabase proxy returned 405. Restart `npm run dev` and ensure VITE_SUPABASE_URL in .env is correct."
      : [
          "Login hit HTTP 405 on /supabase-api — the Vercel proxy is serving the app shell instead of the API.",
          "Redeploy the latest code (vercel.json must exclude /api/ from the SPA fallback).",
          "Latest builds also call Supabase directly in production, so a fresh deploy fixes login even if the proxy is misconfigured.",
        ].join(" ");
  }

  if (/not valid json/i.test(message) || /unexpected token/i.test(message)) {
    return import.meta.env.DEV
      ? "Supabase returned HTML instead of JSON (often a bad proxy or stale cached JS). Hard-refresh (Ctrl+Shift+R) and check DevTools → Network."
      : [
          "Supabase returned HTML instead of JSON (e.g. a Vercel 404 page).",
          "Redeploy after setting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on Vercel (Production), then hard-refresh.",
          "Unregister the service worker: DevTools → Application → Service Workers → Unregister.",
          "Login should call https://YOUR-REF.supabase.co, not /supabase-api — if Network still shows /supabase-api, the build had no env vars.",
        ].join(" ");
  }

  if (/unexpected end of json input/i.test(message)) {
    const hints = import.meta.env.DEV
      ? [
          "Supabase returned an empty response (often a bad dev proxy target).",
          "Check skillkita-web/.env.local — it overrides .env. VITE_SUPABASE_URL must be your real project URL, not your-project-id.supabase.co.",
          "Restart `npm run dev` after fixing, then hard-refresh (Ctrl+Shift+R).",
        ]
      : [
          "Supabase returned an empty response from /supabase-api on your deployed site.",
          "In Vercel → Project → Settings → Environment Variables, set VITE_SUPABASE_URL (https://YOUR-REF.supabase.co) and VITE_SUPABASE_ANON_KEY for Production — same values as skillkita-web/.env, not the .env.example placeholders.",
          "Redeploy after changing env vars. In DevTools → Network, open the failed /supabase-api/auth/... request: 404/HTML means the proxy is missing (check Root Directory is skillkita-web or use the repo-root vercel.json); 500 JSON explains a server config issue.",
        ];
    return hints.join(" ");
  }

  if (!/failed to fetch/i.test(message)) return message;

  const devHints = import.meta.env.DEV
    ? [
        "Restart `npm run dev` after .env changes, then hard-refresh (Ctrl+Shift+R).",
        "Check .env.local overrides .env. In DevTools → Application → Service Workers, click Unregister for localhost.",
      ]
    : [
        "On Vercel, confirm VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set for Production (and Preview).",
        "Redeploy after changing env vars — Vite bakes them in at build time.",
      ];

  return [
    "Cannot reach Supabase (network error).",
    import.meta.env.DEV
      ? "Requests go through /supabase-api on localhost (Vite proxy) when .env is missing; otherwise your project URL from .env."
      : "Production calls your Supabase project URL directly when VITE_SUPABASE_URL was set at build time.",
    ...devHints,
    "If you disabled legacy API keys in Supabase, use the Publishable key (`sb_publishable_...`) or re-enable legacy anon.",
    "If it still fails: allow your app domain and *.supabase.co in firewall/VPN/ad-block.",
  ].join(" ");
}
