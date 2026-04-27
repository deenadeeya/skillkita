import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../../shared/api/supabaseClient";

export type ProfileRow = {
  user_id: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

export async function listUserProfiles() {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id,full_name,company_name,phone,role,status,created_at,approved_at,approved_by")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProfileRow[];
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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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

