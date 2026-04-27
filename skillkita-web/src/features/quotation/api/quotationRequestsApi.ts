import { supabase } from "../../../shared/api/supabaseClient";
import type { QuotationRequestRow, QuotationStatus } from "../types";

export type EmployerLabel = {
  full_name: string;
  company_name: string | null;
  company_address: string | null;
};

export async function listQuotationRequests() {
  const { data, error } = await supabase
    .from("quotation_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as QuotationRequestRow[];
}

export async function listEmployerLabels(userIds: string[]) {
  if (userIds.length === 0) return {} as Record<string, EmployerLabel>;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id,full_name,company_name,company_address")
    .in("user_id", userIds);

  if (error) throw new Error(error.message);

  const map: Record<string, EmployerLabel> = {};
  (data ?? []).forEach((p: { user_id: string; full_name: string; company_name: string | null; company_address: string | null }) => {
    map[p.user_id] = {
      full_name: p.full_name,
      company_name: p.company_name,
      company_address: p.company_address,
    };
  });
  return map;
}

export async function updateQuotationRequest(
  id: string,
  patch: Partial<QuotationRequestRow> & { status?: QuotationStatus }
) {
  const { error } = await supabase
    .from("quotation_requests")
    .update(patch)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteQuotationRequest(id: string) {
  const { data: deletedRows, error } = await supabase
    .from("quotation_requests")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!deletedRows || deletedRows.length === 0) {
    throw new Error("Delete blocked (no rows removed). Check Supabase RLS delete policy.");
  }
}

