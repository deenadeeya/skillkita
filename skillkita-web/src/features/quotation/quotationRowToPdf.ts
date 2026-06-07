import type {
  QuotationPdfDocumentKind,
  QuotationPdfInput,
  QuotationPdfMeta,
} from "./buildQuotationPdf";
import { lookupCourseUnitPriceByName } from "./coursePriceLookup";
import type { QuotationRequestRow } from "./types";

export function quotationTotalAmountRm(unitPrice: number, participants: number): number {
  return Number((unitPrice * participants).toFixed(2));
}

function receiverCompanyName(row: QuotationRequestRow): string {
  return row.company_name_snapshot?.trim() || row.company_name?.trim() || "";
}

/** Approved row fields required to generate quotation or invoice PDF on demand. */
export function canDownloadInvoicePdf(row: QuotationRequestRow): boolean {
  return row.status === "approved" && quotationRowToPdfInput(row) !== null;
}

export function quotationRowToPdfInput(row: QuotationRequestRow): QuotationPdfInput | null {
  const companyName = receiverCompanyName(row);
  if (!companyName || !row.course_mode?.trim()) return null;
  if (row.unit_price == null) return null;

  const unitPrice = Number(row.unit_price);
  if (!Number.isFinite(unitPrice)) return null;

  return {
    company_name: companyName,
    course_name: row.course_name,
    course_mode: row.course_mode.trim(),
    unit_price: unitPrice,
    amount_rm: quotationTotalAmountRm(unitPrice, row.number_of_employers),
    number_of_employers: row.number_of_employers,
    proposed_date: row.proposed_date,
    additional_description: row.additional_description,
    course_location_address: row.course_location_address,
  };
}

/** Resolve PDF fields from the quotation form snapshot and course catalog pricing. */
export async function resolveQuotationPdfInput(
  row: QuotationRequestRow
): Promise<QuotationPdfInput | null> {
  const companyName = receiverCompanyName(row);
  if (!companyName || !row.course_mode?.trim()) return null;

  let unitPrice: number | null = null;
  try {
    unitPrice = await lookupCourseUnitPriceByName(row.course_name);
  } catch {
    unitPrice = null;
  }

  if (unitPrice == null && row.unit_price != null) {
    unitPrice = Number(row.unit_price);
  }
  if (unitPrice == null || !Number.isFinite(unitPrice)) return null;

  return {
    company_name: companyName,
    course_name: row.course_name,
    course_mode: row.course_mode.trim(),
    unit_price: unitPrice,
    amount_rm: quotationTotalAmountRm(unitPrice, row.number_of_employers),
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
