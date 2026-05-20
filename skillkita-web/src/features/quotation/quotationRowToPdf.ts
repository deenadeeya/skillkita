import type {
  QuotationPdfDocumentKind,
  QuotationPdfInput,
  QuotationPdfMeta,
} from "./buildQuotationPdf";
import type { QuotationRequestRow } from "./types";

/** Approved row fields required to generate quotation or invoice PDF on demand. */
export function canDownloadInvoicePdf(row: QuotationRequestRow): boolean {
  return row.status === "approved" && quotationRowToPdfInput(row) !== null;
}

export function quotationRowToPdfInput(row: QuotationRequestRow): QuotationPdfInput | null {
  const companyName = row.company_name?.trim() || row.company_name_snapshot?.trim();
  if (!companyName || !row.course_mode?.trim()) return null;
  if (row.unit_price == null || row.amount_rm == null) return null;

  return {
    company_name: companyName,
    course_name: row.course_name,
    course_mode: row.course_mode.trim(),
    unit_price: row.unit_price,
    amount_rm: row.amount_rm,
    number_of_employers: row.number_of_employers,
    proposed_date: row.proposed_date,
    additional_description: row.additional_description,
    course_location_address: row.course_location_address,
  };
}

export function quotationRowToPdfMeta(
  row: QuotationRequestRow,
  documentKind: QuotationPdfDocumentKind = "quotation"
): QuotationPdfMeta {
  return {
    quotation_id: row.quotation_no != null ? String(row.quotation_no) : row.id,
    approved_date: row.reviewed_at ?? row.updated_at,
    employer_company_address: row.company_address?.trim() || undefined,
    documentKind,
  };
}
