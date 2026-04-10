import { jsPDF } from "jspdf";
import type { QuotationRequestRow } from "./types";

export type QuotationPdfInput = Pick<
  QuotationRequestRow,
  | "company_name"
  | "course_name"
  | "course_booking_date"
  | "course_mode"
  | "unit_price"
  | "amount_rm"
  | "number_of_employers"
  | "proposed_date"
  | "additional_description"
> & { company_name: string };

/** Builds a simple A4 quotation PDF for download / upload. */
export function buildQuotationPdfBlob(data: QuotationPdfInput): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 20;
  let y = 20;
  const line = 7;

  doc.setFontSize(16);
  doc.text("TRSC SkillKita — Quotation", left, y);
  y += line * 2;

  doc.setFontSize(11);
  const rows: [string, string][] = [
    ["Company name", data.company_name],
    ["Course name", data.course_name],
    ["Course booking date", data.course_booking_date ?? "—"],
    ["Course mode", data.course_mode ?? "—"],
    ["Participants (employers)", String(data.number_of_employers)],
    ["Proposed date (requested)", data.proposed_date],
    ["Unit price (RM)", data.unit_price != null ? data.unit_price.toFixed(2) : "—"],
    ["Amount (RM)", data.amount_rm != null ? data.amount_rm.toFixed(2) : "—"],
  ];

  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, left, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, 120);
    doc.text(lines, left + 55, y);
    y += Math.max(line, lines.length * line * 0.55);
  }

  if (data.additional_description?.trim()) {
    y += line;
    doc.setFont("helvetica", "bold");
    doc.text("Additional notes (from request):", left, y);
    y += line;
    doc.setFont("helvetica", "normal");
    const desc = doc.splitTextToSize(data.additional_description.trim(), 170);
    doc.text(desc, left, y);
  }

  y = 280;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("This document was issued electronically. For queries, contact TRSC.", left, y);

  return doc.output("blob");
}
