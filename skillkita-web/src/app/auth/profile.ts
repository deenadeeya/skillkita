import { supabase } from "../../shared/api/supabaseClient";
import type { UserProfileRow } from "./types";

export async function getSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session?.user ?? null;
}

export async function getUserProfile(userId: string) {
  const primary = await supabase
    .from("user_profiles")
    .select("user_id,role,status,full_name,company_name,company_address")
    .eq("user_id", userId)
    .maybeSingle();

  const shouldFallback =
    !!primary.error &&
    primary.error.message.toLowerCase().includes("company_address") &&
    primary.error.message.toLowerCase().includes("does not exist");

  const res = shouldFallback
    ? await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name,company_name")
        .eq("user_id", userId)
        .maybeSingle()
    : primary;

  if (res.error) throw new Error(res.error.message);
  return (res.data ?? null) as UserProfileRow | null;
}

