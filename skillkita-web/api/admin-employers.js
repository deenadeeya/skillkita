import { readJsonBody, sendJson } from "./lib/http.js";
import { formatSupabaseAdminAuthError, getSupabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyAdminRequest } from "./lib/verifyAdmin.js";

export default async function handler(req, res) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    sendJson(res, auth.status, { message: auth.message });
    return;
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    sendJson(res, 503, {
      message: e instanceof Error ? e.message : "Server configuration error.",
    });
    return;
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      sendJson(res, 400, { message: e instanceof Error ? e.message : "Bad request." });
      return;
    }

    const fullName = String(body.fullName ?? "").trim();
    const password = String(body.password ?? "");
    const email = String(body.email ?? "").trim();
    const companyName = String(body.companyName ?? "").trim();
    const companyAddress = String(body.companyAddress ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (!fullName || !email || !password) {
      sendJson(res, 400, { message: "Full name, email, and password are required." });
      return;
    }

    if (password.length < 6) {
      sendJson(res, 400, { message: "Password must be at least 6 characters." });
      return;
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        company_name: companyName,
        phone,
      },
    });

    if (createError) {
      sendJson(res, 400, { message: formatSupabaseAdminAuthError(createError.message) });
      return;
    }

    const userId = created.user?.id;
    if (!userId) {
      sendJson(res, 500, { message: "Employer account was created but user id is missing." });
      return;
    }

    const { error: profileError } = await admin
      .from("user_profiles")
      .update({
        full_name: fullName,
        company_name: companyName || null,
        company_address: companyAddress || null,
        phone: phone || null,
        email: email || null,
        role: "employer",
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: auth.userId,
      })
      .eq("user_id", userId);

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      sendJson(res, 500, { message: profileError.message });
      return;
    }

    sendJson(res, 200, { userId, message: "Employer account created." });
    return;
  }

  if (req.method === "PATCH") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      sendJson(res, 400, { message: e instanceof Error ? e.message : "Bad request." });
      return;
    }

    const userId = String(body.userId ?? "").trim();
    const email = String(body.email ?? "").trim();

    if (!userId) {
      sendJson(res, 400, { message: "userId is required." });
      return;
    }

    if (!email) {
      sendJson(res, 400, { message: "Email is required to update login email." });
      return;
    }

    const { data: profile, error: profileFetchError } = await admin
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileFetchError) {
      sendJson(res, 500, { message: profileFetchError.message });
      return;
    }

    if (!profile || profile.role !== "employer") {
      sendJson(res, 404, { message: "Employer account not found." });
      return;
    }

    const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });

    if (authUpdateError) {
      sendJson(res, 400, { message: formatSupabaseAdminAuthError(authUpdateError.message) });
      return;
    }

    const { error: profileUpdateError } = await admin
      .from("user_profiles")
      .update({ email })
      .eq("user_id", userId);

    if (profileUpdateError) {
      sendJson(res, 500, { message: profileUpdateError.message });
      return;
    }

    sendJson(res, 200, { message: "Employer email updated." });
    return;
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url || "", "http://localhost");
    const userId = url.searchParams.get("userId")?.trim() ?? "";

    if (!userId) {
      sendJson(res, 400, { message: "userId query parameter is required." });
      return;
    }

    const { data: profile, error: profileFetchError } = await admin
      .from("user_profiles")
      .select("role,full_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileFetchError) {
      sendJson(res, 500, { message: profileFetchError.message });
      return;
    }

    if (!profile || profile.role !== "employer") {
      sendJson(res, 404, { message: "Employer account not found." });
      return;
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      sendJson(res, 400, { message: formatSupabaseAdminAuthError(deleteError.message) });
      return;
    }

    sendJson(res, 200, { message: `${profile.full_name} was deleted.` });
    return;
  }

  res.setHeader("Allow", "POST, PATCH, DELETE");
  sendJson(res, 405, { message: "Method not allowed." });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
