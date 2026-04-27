import { supabase } from "../../shared/api/supabaseClient";
import { QUOTATION_PDF_BUCKET, quotationPdfPath } from "./types";

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
