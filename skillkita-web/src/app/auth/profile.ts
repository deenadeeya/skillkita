import { supabase } from "../../shared/api/supabaseClient";
import type { UserProfileRow } from "./types";

export async function getSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session?.user ?? null;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id,role,status,full_name,company_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as UserProfileRow | null;
}

