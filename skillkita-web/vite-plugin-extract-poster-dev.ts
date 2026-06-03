import type { IncomingMessage, ServerResponse } from "http";
import type { Plugin } from "vite";

type Env = Record<string, string | undefined>;

type ExtractPosterHandler = (
  req: IncomingMessage & { query: Record<string, string> },
  res: ServerResponse
) => Promise<void>;

function createMockReq(req: IncomingMessage) {
  const mock = req as IncomingMessage & { query: Record<string, string> };
  mock.query = {};
  return mock;
}

export function extractPosterDevPlugin(env: Env): Plugin {
  return {
    name: "skillkita-extract-poster-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/extract-poster")) {
          next();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Allow", "POST");
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

          const mod = (await import("./api/extract-poster.js")) as {
            default: ExtractPosterHandler;
          };
          const handler = mod.default;
          const mockReq = createMockReq(req);

          await handler(mockReq, res);
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
