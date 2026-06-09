import { adminDeleteDocumentSubmission } from "./submissionsApi";
import { removeEmployerDocumentStoragePaths } from "./submissionsStorage";
import type { DocumentSubmissionRow, DocumentSubmissionType } from "./types";

function submissionTypeLabel(type: DocumentSubmissionType): string {
  return type === "jd14" ? "JD14 submission" : "payment receipt";
}

export function confirmAdminDeleteDocumentSubmission(row: DocumentSubmissionRow): boolean {
  const label = submissionTypeLabel(row.submission_type);
  return window.confirm(
    `Delete this ${label} for “${row.course_name}”? The uploaded file will be permanently removed.`
  );
}

export async function deleteDocumentSubmissionWithFile(id: string): Promise<void> {
  const storagePath = await adminDeleteDocumentSubmission(id);
  try {
    await removeEmployerDocumentStoragePaths([storagePath]);
  } catch {
    /* DB row is gone; storage cleanup is best-effort */
  }
}
