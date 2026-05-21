import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, supabase } from "../../../shared/api/supabaseClient";

export type ProfileRow = {
  user_id: string;
  full_name: string;
  short_name: string | null;
  company_name: string | null;
  company_address: string | null;
  phone: string | null;
  /** Mirrored from auth.users; see supabase/user_profiles_email.sql */
  email: string | null;
  profile_pic_url: string | null;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

const PROFILE_LIST_SELECT_WITH_EMAIL =
  "user_id,full_name,short_name,company_name,company_address,phone,profile_pic_url,role,status,created_at,approved_at,approved_by,email";

const PROFILE_LIST_SELECT_NO_EMAIL =
  "user_id,full_name,short_name,company_name,company_address,phone,profile_pic_url,role,status,created_at,approved_at,approved_by";

export async function listUserProfiles() {
  const primary = await supabase
    .from("user_profiles")
    .select(PROFILE_LIST_SELECT_WITH_EMAIL)
    .order("created_at", { ascending: false });

  const missingEmailColumn =
    !!primary.error &&
    primary.error.message.toLowerCase().includes("email") &&
    primary.error.message.toLowerCase().includes("does not exist");

  const res = missingEmailColumn
    ? await supabase
        .from("user_profiles")
        .select(PROFILE_LIST_SELECT_NO_EMAIL)
        .order("created_at", { ascending: false })
    : primary;

  if (res.error) throw new Error(res.error.message);
  const rows = (res.data ?? []) as ProfileRow[];
  if (missingEmailColumn) {
    return rows.map((r) => ({ ...r, email: null as string | null }));
  }
  return rows;
}

export type EmployerProfileUpdate = {
  userId: string;
  fullName: string;
  shortName: string | null;
  companyName: string | null;
  companyAddress: string | null;
  phone: string | null;
  profilePicUrl: string | null;
};

export async function updateEmployerProfile(params: EmployerProfileUpdate) {
  const update = {
    full_name: params.fullName.trim() || "—",
    short_name: params.shortName?.trim() ? params.shortName.trim() : null,
    company_name: params.companyName?.trim() ? params.companyName.trim() : null,
    company_address: params.companyAddress?.trim() ? params.companyAddress.trim() : null,
    phone: params.phone?.trim() ? params.phone.trim() : null,
    profile_pic_url: params.profilePicUrl,
  };

  const primary = await supabase.from("user_profiles").update(update).eq("user_id", params.userId);

  const shouldFallback =
    !!primary.error &&
    primary.error.message.toLowerCase().includes("company_address") &&
    primary.error.message.toLowerCase().includes("does not exist");

  const res = shouldFallback
    ? await supabase
        .from("user_profiles")
        .update({
          ...update,
          company_address: undefined,
        })
        .eq("user_id", params.userId)
    : primary;

  if (res.error) throw new Error(res.error.message);
}

export async function setEmployerApproval(params: {
  userId: string;
  status: "approved" | "rejected";
  approvedBy: string | null;
}) {
  const { error } = await supabase
    .from("user_profiles")
    .update({
      status: params.status,
      approved_at: params.status === "approved" ? new Date().toISOString() : null,
      approved_by: params.status === "approved" ? params.approvedBy : null,
    })
    .eq("user_id", params.userId);

  if (error) throw new Error(error.message);
}

export async function createAdminAuthUser(params: {
  fullName: string;
  email: string;
  password: string;
}) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  const isolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { full_name: params.fullName } },
  });

  if (signUpError) throw new Error(signUpError.message);

  const newUserId = signUpData.user?.id ?? null;
  if (!newUserId) {
    throw new Error(
      "Admin user created, but could not read new user id. Please refresh and verify in users list."
    );
  }

  return newUserId;
}

export async function promoteProfileToAdmin(params: { userId: string; approvedBy: string | null }) {
  const { error } = await supabase
    .from("user_profiles")
    .update({
      role: "admin",
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: params.approvedBy,
    })
    .eq("user_id", params.userId);

  if (error) throw new Error(error.message);
}

