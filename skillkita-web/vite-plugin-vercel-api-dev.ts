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

type ApiRouteConfig = {
  file: string;
  methods: ReadonlySet<string>;
};

/** Absolute paths — relative imports break when Vite loads the plugin from node_modules/.vite-temp */
const API_ROUTES: Record<string, ApiRouteConfig> = {
  "/api/extract-poster": {
    file: path.join(projectRoot, "api", "extract-poster.js"),
    methods: new Set(["POST"]),
  },
  "/api/course-assistant": {
    file: path.join(projectRoot, "api", "course-assistant.js"),
    methods: new Set(["POST"]),
  },
  "/api/admin-employers": {
    file: path.join(projectRoot, "api", "admin-employers.js"),
    methods: new Set(["POST", "PATCH", "DELETE"]),
  },
};

function createMockReq(req: IncomingMessage) {
  const mock = req as IncomingMessage & { query: Record<string, string> };
  mock.query = {};
  return mock;
}

function matchApiRoute(url: string): { route: string; config: ApiRouteConfig } | null {
  const path = url.split("?")[0];
  for (const [route, config] of Object.entries(API_ROUTES)) {
    if (path === route || path.startsWith(`${route}/`)) return { route, config };
  }
  return null;
}

export function vercelApiDevPlugin(env: Env): Plugin {
  return {
    name: "skillkita-vercel-api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        const matched = matchApiRoute(url);
        if (!matched) {
          next();
          return;
        }

        const method = req.method ?? "GET";
        if (!matched.config.methods.has(method)) {
          res.statusCode = 405;
          res.setHeader("Allow", [...matched.config.methods].join(", "));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Method not allowed." }));
          return;
        }

        const prevGemini = process.env.GEMINI_API_KEY;
        const prevUrl = process.env.VITE_SUPABASE_URL;
        const prevKey = process.env.VITE_SUPABASE_ANON_KEY;
        const prevServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const prevSecretKey = process.env.SUPABASE_SECRET_KEY;
        try {
          if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
          if (env.VITE_SUPABASE_URL) process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
          if (env.VITE_SUPABASE_ANON_KEY) {
            process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
          }
          if (env.SUPABASE_SECRET_KEY) {
            process.env.SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY;
          }
          if (env.SUPABASE_SERVICE_ROLE_KEY) {
            process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
          }

          const handlerUrl = pathToFileURL(matched.config.file).href;
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
          if (prevSecretKey === undefined) delete process.env.SUPABASE_SECRET_KEY;
          else process.env.SUPABASE_SECRET_KEY = prevSecretKey;
          if (prevServiceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
          else process.env.SUPABASE_SERVICE_ROLE_KEY = prevServiceRole;
        }
      });
    },
  };
}
