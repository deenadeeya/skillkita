import { supabase } from "../../shared/api/supabaseClient";
import type { QuotationRequestRow } from "./types";
import { QUOTATION_PDF_BUCKET, quotationPdfPath } from "./types";

/** Strip characters invalid in file names (Windows + common). */
export function sanitizeQuotationFileNameSegment(raw: string, maxLen = 72): string {
  const cleaned = raw
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = cleaned.slice(0, maxLen);
  return base.length > 0 ? base : "quotation";
}

function buildPdfDownloadFileName(row: QuotationRequestRow, prefix: "Quotation" | "Invoice"): string {
  const no =
    row.quotation_no != null
      ? String(row.quotation_no).padStart(4, "0")
      : `id-${row.id.replace(/-/g, "").slice(0, 12)}`;
  const course = sanitizeQuotationFileNameSegment(row.course_name);
  const name = `${prefix}-${no}-${course}.pdf`;
  return name.length > 180 ? `${name.slice(0, 175)}.pdf` : name;
}

/** Suggested download filename for an approved quotation PDF. */
export function buildQuotationPdfDownloadFileName(row: QuotationRequestRow): string {
  return buildPdfDownloadFileName(row, "Quotation");
}

/** Suggested download filename for an invoice PDF. */
export function buildInvoicePdfDownloadFileName(row: QuotationRequestRow): string {
  return buildPdfDownloadFileName(row, "Invoice");
}

/** Triggers a browser download for a PDF blob generated in the client. */
export function downloadBlobWithFileName(blob: Blob, downloadFileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const safeName = downloadFileName.toLowerCase().endsWith(".pdf")
    ? downloadFileName
    : `${downloadFileName}.pdf`;

  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = safeName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}

/** Fetches PDF from signed URL and saves with the given file name (not the storage token). */
export async function downloadQuotationPdfWithFileName(
  storagePath: string,
  downloadFileName: string
): Promise<void> {
  const url = await createQuotationPdfSignedUrl(storagePath);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}).`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const safeName = downloadFileName.toLowerCase().endsWith(".pdf")
    ? downloadFileName
    : `${downloadFileName}.pdf`;

  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = safeName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}

export async function uploadQuotationPdf(
  employerUserId: string,
  quotationId: string,
  blob: Blob
): Promise<string> {
  const path = quotationPdfPath(employerUserId, quotationId);
  const { error } = await supabase.storage
    .from(QUOTATION_PDF_BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: "application/pdf",
    });
  if (error) {
    throw new Error(error.message);
  }
  return path;
}

export async function createQuotationPdfSignedUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(QUOTATION_PDF_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    throw new Error(error.message);
  }
  if (!data?.signedUrl) {
    throw new Error("Could not create download link.");
  }
  return data.signedUrl;
}

export async function deleteQuotationPdf(path: string): Promise<void> {
  const { error } = await supabase.storage.from(QUOTATION_PDF_BUCKET).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
}
