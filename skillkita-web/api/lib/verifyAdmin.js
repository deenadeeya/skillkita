export async function verifyAdminRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
    return { ok: false, status: 401, message: "Missing authorization." };
  }

  const supabaseUrl = (process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!supabaseUrl || !anonKey) {
    return {
      ok: false,
      status: 500,
      message: "Server missing Supabase configuration.",
    };
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      authorization: authHeader,
      apikey: anonKey,
    },
  });

  if (!userRes.ok) {
    return { ok: false, status: 401, message: "Invalid or expired session." };
  }

  const userPayload = await userRes.json().catch(() => null);
  const userId = userPayload?.id;
  if (!userId) {
    return { ok: false, status: 401, message: "Invalid session." };
  }

  const profileUrl = new URL(`${supabaseUrl}/rest/v1/user_profiles`);
  profileUrl.searchParams.set("user_id", `eq.${userId}`);
  profileUrl.searchParams.set("select", "role,status");
  profileUrl.searchParams.set("limit", "1");

  const profileRes = await fetch(profileUrl.toString(), {
    headers: {
      authorization: authHeader,
      apikey: anonKey,
      accept: "application/json",
    },
  });

  if (!profileRes.ok) {
    return { ok: false, status: 403, message: "Could not verify admin access." };
  }

  const rows = await profileRes.json().catch(() => []);
  const profile = Array.isArray(rows) ? rows[0] : null;
  if (!profile || profile.role !== "admin") {
    return { ok: false, status: 403, message: "Admin access required." };
  }

  return { ok: true, userId };
}
