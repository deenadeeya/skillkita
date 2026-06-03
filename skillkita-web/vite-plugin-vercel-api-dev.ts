import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { IncomingMessage, ServerResponse } from "http";
import type { Plugin } from "vite";

type Env = Record<string, string | undefined>;

type ApiHandler = (
  req: IncomingMessage & { query: Record<string, string> },
  res: ServerResponse
) => Promise<void>;

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** Absolute paths — relative imports break when Vite loads the plugin from node_modules/.vite-temp */
const API_HANDLER_FILES: Record<string, string> = {
  "/api/extract-poster": path.join(projectRoot, "api", "extract-poster.js"),
  "/api/course-assistant": path.join(projectRoot, "api", "course-assistant.js"),
};

function createMockReq(req: IncomingMessage) {
  const mock = req as IncomingMessage & { query: Record<string, string> };
  mock.query = {};
  return mock;
}

function matchApiRoute(url: string): string | null {
  const path = url.split("?")[0];
  for (const route of Object.keys(API_HANDLER_FILES)) {
    if (path === route || path.startsWith(`${route}/`)) return route;
  }
  return null;
}

export function vercelApiDevPlugin(env: Env): Plugin {
  return {
    name: "skillkita-vercel-api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        const route = matchApiRoute(url);
        if (!route) {
          next();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Allow", "POST");
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Method not allowed." }));
          return;
        }

        const prevGemini = process.env.GEMINI_API_KEY;
        const prevUrl = process.env.VITE_SUPABASE_URL;
        const prevKey = process.env.VITE_SUPABASE_ANON_KEY;
        try {
          if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
          if (env.VITE_SUPABASE_URL) process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
          if (env.VITE_SUPABASE_ANON_KEY) {
            process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
          }

          const handlerUrl = pathToFileURL(API_HANDLER_FILES[route]).href;
          const mod = (await import(handlerUrl)) as { default: ApiHandler };
          await mod.default(createMockReq(req), res);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Dev API error.";
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: msg }));
          }
        } finally {
          if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
          else process.env.GEMINI_API_KEY = prevGemini;
          if (prevUrl === undefined) delete process.env.VITE_SUPABASE_URL;
          else process.env.VITE_SUPABASE_URL = prevUrl;
          if (prevKey === undefined) delete process.env.VITE_SUPABASE_ANON_KEY;
          else process.env.VITE_SUPABASE_ANON_KEY = prevKey;
        }
      });
    },
  };
}
