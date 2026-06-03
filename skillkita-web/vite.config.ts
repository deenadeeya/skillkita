import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { extractPosterDevPlugin } from "./vite-plugin-extract-poster-dev";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseTarget = env.VITE_SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

  if (mode === "production" && (!supabaseTarget || !supabaseAnonKey)) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for production build. " +
        "Set them in skillkita-web/.env locally, or in Vercel → Settings → Environment Variables before deploy."
    );
  }

  const supabaseProxy = supabaseTarget
    ? {
        "/supabase-api": {
          target: supabaseTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/supabase-api/, ""),
        },
      }
    : undefined;

  return {
  server: {
    // Fallback when VITE_* are unset. Normal dev calls the project URL from .env directly.
    proxy: supabaseProxy,
  },
  preview: {
    proxy: supabaseProxy,
  },
  plugins: [
    ...(mode === "development" ? [extractPosterDevPlugin(env)] : []),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    VitePWA({
      // Avoid registering a service worker during `npm run dev` (can break API calls after a production build).
      devOptions: { enabled: false },
      registerType: "autoUpdate",
      includeAssets: [
        "vite.svg",
        "pwa-192x192.svg",
        "pwa-512x512.svg",
        "apple-touch-icon.svg",
      ],
      manifest: {
        name: "SkillKita",
        short_name: "SkillKita",
        description: "SkillKita web app",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0b1220",
        theme_color: "#0b1220",
        icons: [
          {
            src: "/pwa-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/pwa-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/supabase-api/, /^\/api\//],
        // Precache app shell only; large photos load on demand (faster first visit on mobile).
        globPatterns: ["**/*.{js,css,html,ico,svg,webmanifest}"],
        globIgnores: ["**/TRSCGroupPhoto*.png", "**/pdf.worker*.mjs"],
        maximumFileSizeToCacheInBytes: 600_000,
      },
    }),
  ],
  };
});
