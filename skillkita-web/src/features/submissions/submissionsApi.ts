import { supabase } from "../../shared/api/supabaseClient";
import type { DocumentSubmissionRow, DocumentSubmissionStatus, DocumentSubmissionType } from "./types";

export async function listMyDocumentSubmissions(submissionType: DocumentSubmissionType) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("employer_document_submissions")
    .select("*")
    .eq("employer_user_id", user.id)
    .eq("submission_type", submissionType)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DocumentSubmissionRow[];
}

export async function listAllDocumentSubmissions(submissionType: DocumentSubmissionType) {
  const { data, error } = await supabase
    .from("employer_document_submissions")
    .select("*")
    .eq("submission_type", submissionType)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DocumentSubmissionRow[];
}

export async function insertDocumentSubmission(payload: {
  submission_type: DocumentSubmissionType;
  course_name: string;
  proposed_date: string;
  file_storage_path: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase.from("employer_document_submissions").insert({
    employer_user_id: user.id,
    submission_type: payload.submission_type,
    course_name: payload.course_name.trim(),
    proposed_date: payload.proposed_date,
    file_storage_path: payload.file_storage_path,
    status: "pending",
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export async function adminReviewDocumentSubmission(
  id: string,
  payload: {
    status: Extract<DocumentSubmissionStatus, "approved" | "rejected">;
    rejection_reason: string | null;
  }
) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase
    .from("employer_document_submissions")
    .update({
      status: payload.status,
      rejection_reason: payload.status === "rejected" ? (payload.rejection_reason?.trim() || null) : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
