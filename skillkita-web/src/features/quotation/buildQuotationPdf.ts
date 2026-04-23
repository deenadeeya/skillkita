import { jsPDF } from "jspdf";
import type { QuotationRequestRow } from "./types";

export type QuotationPdfInput = Pick<
  QuotationRequestRow,
  | "company_name"
  | "course_name"
  | "course_mode"
  | "unit_price"
  | "amount_rm"
  | "number_of_employers"
  | "proposed_date"
  | "additional_description"
> & { company_name: string };

export type QuotationPdfMeta = {
  quotation_id?: string;
  approved_date?: string;
  employer_company_address?: string;
  account_code?: string;
};

const BRAND = {
  name: "Tawau Resources & Skills Centre",
  reg: "(R72087/22)",
  addressLines: [
    "TB 15095, LOT 3715,",
    "BANDAR SRI INDAH",
    "JALAN APAS, BATU 10,",
    "91000 TAWAU, SABAH.",
  ],
  tel: "016-5825825",
  email: "tawauresourceskillscentre@gmail.com",
  accountCodeDefault: "TD-B004",
};

const COLOR = {
  black: [0, 0, 0] as const,
  gray: [90, 90, 90] as const,
};

function formatDateHuman(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatMoney(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "";
  return v.toFixed(2);
}

function numberToWordsUnder1000(n: number): string {
  const ones = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n < 20) return ones[n] ?? "";
  if (n < 100) {
    const t = Math.floor(n / 10);
    const r = n % 10;
    return r ? `${tens[t]}-${ones[r]}` : tens[t];
  }
  const h = Math.floor(n / 100);
  const r = n % 100;
  return r ? `${ones[h]} hundred ${numberToWordsUnder1000(r)}` : `${ones[h]} hundred`;
}

function numberToWords(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "zero";
  const parts: string[] = [];
  const chunks: [number, string][] = [
    [1_000_000_000, "billion"],
    [1_000_000, "million"],
    [1_000, "thousand"],
  ];
  let rest = Math.floor(n);
  for (const [div, label] of chunks) {
    const q = Math.floor(rest / div);
    if (q) {
      parts.push(`${numberToWordsUnder1000(q)} ${label}`);
      rest %= div;
    }
  }
  if (rest) parts.push(numberToWordsUnder1000(rest));
  return parts.join(" ");
}

function ringgitToWords(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "";
  const ringgit = Math.floor(amount);
  const sen = Math.round((amount - ringgit) * 100);
  const rg = `${numberToWords(ringgit)} ringgit`;
  const s = sen ? ` and ${numberToWords(sen)} sen` : "";
  return `${rg}${s}`.toUpperCase();
}

function setColor(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function textValue(doc: jsPDF, text: string, x: number, y: number, opts?: Parameters<jsPDF["text"]>[3]) {
  // Per request: values are rendered in black (no blue).
  setColor(doc, COLOR.black);
  doc.text(text, x, y, opts as any);
}

/** Builds an A4 quotation PDF closely matching the provided template image. */
export function buildQuotationPdfBlob(data: QuotationPdfInput, meta: QuotationPdfMeta = {}): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  doc.setFont("times", "normal");
  setColor(doc, COLOR.black);

  const pageW = 210;
  // Larger surrounding whitespace for a cleaner look.
  const margin = 18;
  const leftX = margin;
  const rightX = pageW - margin;

  // Header (left)
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.text(BRAND.name, leftX, 18);
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text(BRAND.reg, leftX + 76, 18);

  doc.setFontSize(9);
  let y = 26;
  BRAND.addressLines.forEach((l) => {
    doc.text(l, leftX, y);
    y += 4.2;
  });
  doc.text(`Tel: ${BRAND.tel}`, leftX, y);
  y += 4.2;
  doc.text(`Email: ${BRAND.email}`, leftX, y);

  // Header (right)
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("QUOTATION", rightX - 55, 28.5);
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("No.", rightX - 55, 34.5);
  doc.text("Date:", rightX - 55, 39.5);

  const quotationNo = `TRSC-${meta.quotation_id ?? ""}`.trim().replace(/-$/, "");
  if (quotationNo) textValue(doc, quotationNo, rightX - 38, 34.5);
  const approvedDate = meta.approved_date ? formatDateHuman(meta.approved_date) : "";
  if (approvedDate) textValue(doc, approvedDate, rightX - 38, 39.5);

  // To + A/C Code
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  const toY = 60;
  doc.text("To:", leftX, toY);
  doc.setFont("times", "bold");
  textValue(doc, data.company_name, leftX + 10, toY);
  doc.setFont("times", "normal");
  const addr = (meta.employer_company_address ?? "").trim();
  if (addr) {
    const addrLines = doc.splitTextToSize(addr, 85);
    textValue(doc, addrLines.join("\n"), leftX + 10, toY + 4.8);
  }
  doc.text("A/C Code :", rightX - 55, toY);
  doc.setFont("times", "bold");
  textValue(doc, meta.account_code ?? BRAND.accountCodeDefault, rightX - 25, toY);
  doc.setFont("times", "normal");

  // Table frame
  // Reduce the gap between "To:" block and table.
  const tableTop = 80;
  const tableLeft = leftX;
  const tableRight = rightX;
  const tableW = tableRight - tableLeft;
  const col = {
    // Column positions are proportioned to the available table width so they stay aligned
    // even if margins change.
    item: tableLeft + tableW * 0.00,
    stock: tableLeft + tableW * 0.10,
    desc: tableLeft + tableW * 0.26,
    // QTY and Unit share one column ("QTY Unit") per template.
    qtyUnit: tableLeft + tableW * 0.74,
    // Give more width to the numeric columns on the right.
    uprice: tableLeft + tableW * 0.88,
    amount: tableRight,
  };

  doc.setLineWidth(0.25);
  doc.line(tableLeft, tableTop, tableRight, tableTop);
  doc.line(tableLeft, tableTop + 6.5, tableRight, tableTop + 6.5);

  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text("ITEM", col.item, tableTop + 4.8);
  doc.text("STOCK CODE", col.stock, tableTop + 4.8);
  doc.text("DESCRIPTION", col.desc, tableTop + 4.8);
  doc.text("QTY Unit", col.qtyUnit, tableTop + 4.8, { align: "right" });
  doc.text("U*PRICE", col.uprice, tableTop + 4.8, { align: "right" });
  doc.text("AMOUNT(RM)", col.amount, tableTop + 4.8, { align: "right" });

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  const rowY = tableTop + 15;

  // Values
  const courseName = data.course_name;
  const proposed = formatDateHuman(data.proposed_date);
  const mode = data.course_mode ?? "";
  const descWidth = Math.max(10, col.qtyUnit - col.desc - 4);

  doc.setFont("times", "normal");
  textValue(doc, "1", col.item, rowY);
  doc.setFont("times", "bold");
  const courseLines = doc.splitTextToSize(courseName, descWidth);
  textValue(doc, courseLines.join("\n"), col.desc, rowY);
  doc.setFont("times", "normal");
  const afterCourseY = rowY + Math.max(5, courseLines.length * 4.2);
  textValue(doc, `TARIKH: ${proposed || data.proposed_date}`, col.desc, afterCourseY);
  textValue(doc, `MODE: ${mode}`, col.desc, afterCourseY + 4.8);

  // Qty / Unit / Price / Amount
  textValue(doc, `${data.number_of_employers} pax`, col.qtyUnit, rowY, { align: "right" });
  const uPrice = formatMoney(data.unit_price);
  const amt = formatMoney(data.amount_rm);
  if (uPrice) textValue(doc, uPrice, col.uprice, rowY, { align: "right" });
  if (amt) textValue(doc, amt, col.amount, rowY, { align: "right" });

  // Bottom section: amount in words + total
  const words = ringgitToWords(data.amount_rm);
  // Increase bottom margin by moving this whole block upward.
  const footerY = 238;
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text("•", leftX + 5, footerY);
  doc.setFont("times", "normal");
  doc.text("RINGGIT (", leftX + 10, footerY);
  if (words) textValue(doc, words, leftX + 28, footerY);
  doc.setFont("times", "normal");
  doc.text(") ONLY", leftX + 140, footerY);

  doc.setLineWidth(0.2);
  doc.line(leftX, 248, rightX, 248);

  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("Total: RM", rightX - 55, 256);
  if (amt) textValue(doc, amt, rightX - 10, 256, { align: "right" });

  // Signature area
  // Reduce right margin ONLY for the signature section.
  const sigRightX = pageW - 12;
  doc.setFontSize(9);
  doc.setFont("times", "bold");
  doc.text("Received By", leftX, 265);
  doc.text(BRAND.name.toUpperCase(), sigRightX - 80, 265);

  doc.setFont("times", "normal");
  doc.setFontSize(8);
  setColor(doc, COLOR.gray);
  doc.text("..............................", leftX, 278);
  doc.text("Company Chop & Signature", leftX, 284);

  setColor(doc, COLOR.black);
  textValue(doc, "(insert company stamp)", sigRightX - 80, 273);
  setColor(doc, COLOR.gray);
  doc.text("..............................", sigRightX - 80, 278);
  doc.text("(Authorised Signature)", sigRightX - 78, 284);
  setColor(doc, COLOR.black);

  return doc.output("blob");
}
