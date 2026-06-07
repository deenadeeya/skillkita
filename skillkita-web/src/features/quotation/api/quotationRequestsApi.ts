import { supabase } from "../../../shared/api/supabaseClient";
import type { QuotationRequestRow, QuotationStatus } from "../types";

function quotationRlsHint(action: string): string {
  return ` Admin ${action} requires Supabase RLS (public.is_admin()). Run supabase migrations (see supabase/README.md), and ensure your login user has user_profiles.role = 'admin'.`;
}

function quotationStorageHint(): string {
  return " Ensure migrations through 20260501000006_quotations.sql are applied (see supabase/README.md).";
}

export type EmployerLabel = {
  full_name: string;
  company_name: string | null;
  company_address: string | null;
};

export type ApprovedEmployerOption = EmployerLabel & { user_id: string };

export type CourseLabel = { id: string; name: string };

export async function listQuotationRequests() {
  const { data, error } = await supabase
    .from("quotation_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as QuotationRequestRow[];
}

export async function getQuotationRequestById(id: string) {
  const { data, error } = await supabase
    .from("quotation_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as QuotationRequestRow | null;
}

export async function listApprovedEmployers() {
  // Prefer reading company_address, but gracefully fall back if the DB
  // hasn't been migrated yet.
  const primary = await supabase
    .from("user_profiles")
    .select("user_id,full_name,company_name,company_address,role,status")
    .eq("role", "employer")
    .eq("status", "approved")
    .order("full_name", { ascending: true });

  const shouldFallback =
    !!primary.error &&
    primary.error.message.toLowerCase().includes("company_address") &&
    primary.error.message.toLowerCase().includes("does not exist");

  const res = shouldFallback
    ? await supabase
        .from("user_profiles")
        .select("user_id,full_name,company_name,role,status")
        .eq("role", "employer")
        .eq("status", "approved")
        .order("full_name", { ascending: true })
    : primary;

  if (res.error) throw new Error(res.error.message);

  return (res.data ?? []).map((r) => ({
    user_id: (r as { user_id: string }).user_id,
    full_name: (r as { full_name: string }).full_name,
    company_name: (r as { company_name: string | null }).company_name,
    company_address: (r as { company_address?: string | null }).company_address ?? null,
  })) as ApprovedEmployerOption[];
}

export async function listCourseLabels() {
  const { data, error } = await supabase
    .from("courses")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as CourseLabel[]).filter((c) => Boolean(c?.id) && Boolean(c?.name));
}

export async function adminCreateApprovedQuotationRequest(
  payload: {
    employer_user_id: string;
    company_name_snapshot: string;
    company_address: string | null;
    course_name: string;
    number_of_employers: number;
    proposed_date: string;
    additional_description: string | null;
    status: "approved";
    company_name: string;
    course_mode: string;
    course_location_address: string | null;
    unit_price: number;
    amount_rm: number;
    reviewed_at: string;
    reviewed_by: string;
    updated_at: string;
  }
) {
  const { data, error } = await supabase
    .from("quotation_requests")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) {
    const hint = error.message.toLowerCase().includes("row-level security")
      ? quotationRlsHint("create")
      : "";
    throw new Error(error.message + hint);
  }
  if (!data) throw new Error("Failed to create quotation.");
  return data as QuotationRequestRow;
}

export async function setQuotationPdfPath(id: string, pdf_storage_path: string) {
  const { error } = await supabase
    .from("quotation_requests")
    .update({ pdf_storage_path, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function createEmployerQuotationRequest(payload: {
  employer_user_id: string;
  company_name_snapshot: string;
  company_address: string | null;
  company_name: string | null;
  course_name: string;
  course_mode: string;
  course_location_address: string;
  number_of_employers: number;
  proposed_date: string;
  additional_description: string | null;
}) {
  const { error } = await supabase.from("quotation_requests").insert({
    ...payload,
    status: "pending",
  });

  if (error) {
    throw new Error(
      error.message +
        (error.message.toLowerCase().includes("row-level security")
          ? quotationRlsHint("submit")
          : "")
    );
  }
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

  if (error) {
    const msg = error.message.toLowerCase();
    const hint = msg.includes("row-level security")
      ? quotationRlsHint("update")
      : msg.includes("bucket") || msg.includes("storage")
        ? quotationStorageHint()
        : "";
    throw new Error(error.message + hint);
  }
}

export async function deleteQuotationRequest(id: string) {
  const { data: deletedRows, error } = await supabase
    .from("quotation_requests")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(
      error.message +
        (error.message.toLowerCase().includes("row-level security")
          ? quotationRlsHint("delete")
          : "")
    );
  }
  if (!deletedRows || deletedRows.length === 0) {
    throw new Error("Delete blocked (no rows removed). Check Supabase RLS delete policy.");
  }
}

