export type QuotationStatus = "pending" | "approved" | "rejected";

export type QuotationRequestRow = {
  id: string;
  quotation_no: number | null;
  employer_user_id: string;
  company_name_snapshot: string;
  company_address: string | null;
  course_name: string;
  number_of_employers: number;
  proposed_date: string;
  additional_description: string | null;
  course_location_address: string | null;
  status: QuotationStatus;
  company_name: string | null;
  course_mode: string | null;
  unit_price: number | null;
  amount_rm: number | null;
  pdf_storage_path: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export const QUOTATION_PDF_BUCKET = "quotation-pdfs";

export function quotationPdfPath(employerUserId: string, quotationId: string): string {
  return `${employerUserId}/${quotationId}.pdf`;
}
