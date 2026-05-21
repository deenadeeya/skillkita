import { supabase } from "../../shared/api/supabaseClient";
import type { Jd14SubmissionTemplateRow } from "./types";

/** Shown when PostgREST has no jd14_submission_templates (migration not applied or wrong Supabase project). */
export const JD14_TEMPLATES_DEPLOY_MESSAGE =
  "Supabase does not expose jd14_submission_templates yet. Open the Supabase project that matches skillkita-web/.env (VITE_SUPABASE_URL), run SQL from skillkita-web/supabase/migrations/20260514120000_jd14_submission_templates.sql (or the JD14 block at the end of supabase/employer_document_submissions.sql), then run: NOTIFY pgrst, 'reload schema'; For CLI: from skillkita-web run `npx supabase link` once, then `npx supabase db push`. Without link, use the Dashboard SQL Editor instead of db push.";

export function isJd14TemplatesMissingFromApi(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const o = err as { message?: string; code?: string; details?: string; hint?: string };
  const code = String(o.code ?? "");
  const msg = `${String(o.message ?? "")} ${String(o.details ?? "")} ${String(o.hint ?? "")}`.toLowerCase();
  if (code === "PGRST205") return true;
  if (msg.includes("jd14_submission_templates") && (msg.includes("schema cache") || msg.includes("could not find"))) {
    return true;
  }
  if (msg.includes("jd14_submission_templates") && msg.includes("does not exist")) return true;
  return false;
}

export type ListJd14TemplatesResult =
  | { ok: true; rows: Jd14SubmissionTemplateRow[] }
  | { ok: false; rows: []; deployMessage: string };

export async function listJd14SubmissionTemplates(): Promise<ListJd14TemplatesResult> {
  const { data, error } = await supabase
    .from("jd14_submission_templates")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!error) return { ok: true, rows: (data ?? []) as Jd14SubmissionTemplateRow[] };
  if (isJd14TemplatesMissingFromApi(error)) {
    return { ok: false, rows: [], deployMessage: JD14_TEMPLATES_DEPLOY_MESSAGE };
  }
  throw new Error(error.message);
}

export async function adminCreateJd14Template(payload: { title: string; file_storage_path: string }) {
  const { data: maxRow, error: maxErr } = await supabase
    .from("jd14_submission_templates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) {
    if (isJd14TemplatesMissingFromApi(maxErr)) throw new Error(JD14_TEMPLATES_DEPLOY_MESSAGE);
    throw new Error(maxErr.message);
  }
  const nextOrder = typeof maxRow?.sort_order === "number" ? maxRow.sort_order + 1 : 0;

  const { error } = await supabase.from("jd14_submission_templates").insert({
    title: payload.title.trim(),
    file_storage_path: payload.file_storage_path,
    sort_order: nextOrder,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (isJd14TemplatesMissingFromApi(error)) throw new Error(JD14_TEMPLATES_DEPLOY_MESSAGE);
    throw new Error(error.message);
  }
}

export async function adminUpdateJd14Template(
  id: string,
  payload: { title: string; file_storage_path?: string }
) {
  const row: Record<string, unknown> = {
    title: payload.title.trim(),
    updated_at: new Date().toISOString(),
  };
  if (payload.file_storage_path) row.file_storage_path = payload.file_storage_path;

  const { error } = await supabase.from("jd14_submission_templates").update(row).eq("id", id);

  if (error) {
    if (isJd14TemplatesMissingFromApi(error)) throw new Error(JD14_TEMPLATES_DEPLOY_MESSAGE);
    throw new Error(error.message);
  }
}

export async function adminDeleteJd14Template(id: string) {
  const { data: row, error: fetchErr } = await supabase
    .from("jd14_submission_templates")
    .select("file_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    if (isJd14TemplatesMissingFromApi(fetchErr)) throw new Error(JD14_TEMPLATES_DEPLOY_MESSAGE);
    throw new Error(fetchErr.message);
  }
  if (!row?.file_storage_path) throw new Error("Template not found.");

  const { error } = await supabase.from("jd14_submission_templates").delete().eq("id", id);
  if (error) {
    if (isJd14TemplatesMissingFromApi(error)) throw new Error(JD14_TEMPLATES_DEPLOY_MESSAGE);
    throw new Error(error.message);
  }

  return row.file_storage_path as string;
}
