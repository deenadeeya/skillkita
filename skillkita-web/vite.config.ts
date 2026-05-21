import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseTarget =
    env.VITE_SUPABASE_URL?.trim() || "https://ieckdfppqtnejletnqyi.supabase.co";

  return {
  server: {
    // Dev-only: browser calls localhost; Vite forwards to Supabase (avoids firewall/ad-block on *.supabase.co).
    proxy: {
      "/supabase-api": {
        target: supabaseTarget,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/supabase-api/, ""),
      },
    },
  },
  plugins: [
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
        // Precache app shell only; large photos load on demand (faster first visit on mobile).
        globPatterns: ["**/*.{js,css,html,ico,svg,webmanifest}"],
        globIgnores: ["**/TRSCGroupPhoto*.png", "**/pdf.worker*.mjs"],
        maximumFileSizeToCacheInBytes: 600_000,
      },
    }),
  ],
  };
});
