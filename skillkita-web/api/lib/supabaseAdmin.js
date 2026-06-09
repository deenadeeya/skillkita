import { createClient } from "@supabase/supabase-js";

/** Prefer new secret key (sb_secret_...); legacy service_role JWT still works if enabled. */
export function getSupabaseAdminKey() {
  const secretKey = (process.env.SUPABASE_SECRET_KEY || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  return secretKey || serviceRoleKey;
}

export function formatSupabaseAdminAuthError(message) {
  if (/legacy api keys are disabled/i.test(message)) {
    return [
      "Supabase legacy service_role keys are disabled on this project.",
      "Set SUPABASE_SECRET_KEY in skillkita-web/.env to the secret key (sb_secret_...) from",
      "Supabase Dashboard → Project Settings → API Keys, then restart npm run dev.",
      "On Vercel, add the same variable under Environment Variables.",
    ].join(" ");
  }

  return message;
}

export function getSupabaseAdmin() {
  const url = (process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const adminKey = getSupabaseAdminKey();

  if (!url || !adminKey) {
    throw new Error(
      "Employer account management is not configured. Set SUPABASE_SECRET_KEY (sb_secret_...) or SUPABASE_SERVICE_ROLE_KEY on the server."
    );
  }

  return createClient(url, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function placeholderEmployerAuthEmail() {
  return `employer-${crypto.randomUUID()}@noemail.skillkita`;
}

export function randomEmployerPassword() {
  return crypto.randomBytes(24).toString("base64url");
}
