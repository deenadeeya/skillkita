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
> & { company_name: string; course_location_address?: string | null };

export type QuotationPdfDocumentKind = "quotation" | "invoice";

export type QuotationPdfMeta = {
  quotation_id?: string;
  approved_date?: string;
  employer_company_address?: string;
  account_code?: string;
  /** Header title on the PDF (default: quotation). */
  documentKind?: QuotationPdfDocumentKind;
};

const BRAND = {
  name: "Tawau Resources & Skills Centre",
  reg: " (R72087/22)",
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

function setColor(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

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

function textValue(doc: jsPDF, text: string, x: number, y: number, opts?: Parameters<jsPDF["text"]>[3]) {
  setColor(doc, COLOR.black);
  doc.text(text, x, y, opts as any);
}

/** Vertical layout for footer (amount in words, total, signatures). */
const FOOTER_LAYOUT = {
  wordsY: 215,
  ruleY: 225,
  totalY: 233,
  sigTitleY: 242,
  stampY: 247,
} as const;

/** Right-column block for issuer name, stamp, and authorised signature. */
const ISSUER_SIG_BLOCK = { widthMm: 82, rightMarginMm: 12 } as const;

const STAMP_MM = { width: 25, height: 25 };

const stampAssetLoaders = import.meta.glob<string>("../../assets/TRSCCompanyStamp.png", {
  query: "?url",
  import: "default",
});

let cachedStampDataUrl: string | null | undefined;

async function loadCompanyStampDataUrl(): Promise<string | null> {
  if (cachedStampDataUrl !== undefined) return cachedStampDataUrl;
  const load = Object.values(stampAssetLoaders)[0];
  if (!load) {
    cachedStampDataUrl = null;
    return null;
  }
  try {
    const url = await load();
    const res = await fetch(url);
    if (!res.ok) {
      cachedStampDataUrl = null;
      return null;
    }
    const blob = await res.blob();
    cachedStampDataUrl = await new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return cachedStampDataUrl;
  } catch {
    cachedStampDataUrl = null;
    return null;
  }
}

function stampImageFormat(dataUrl: string): "PNG" | "JPEG" {
  return dataUrl.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
}

/** Builds an A4 quotation PDF closely matching the provided template image. */
export async function buildQuotationPdfBlob(
  data: QuotationPdfInput,
  meta: QuotationPdfMeta = {}
): Promise<Blob> {
  const stampDataUrl = await loadCompanyStampDataUrl();
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  doc.setFont("times", "normal");
  setColor(doc, COLOR.black);

  const pageW = 210;
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
  doc.setFontSize(15);
  const documentTitle =
    meta.documentKind === "invoice" ? "INVOICE" : "QUOTATION";
  doc.text(documentTitle, rightX - 55, 28.5);
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
  const tableTop = 80;
  const tableLeft = leftX;
  const tableRight = rightX;
  const tableW = tableRight - tableLeft;
  const col = {
    item: tableLeft + tableW * 0.0,
    desc: tableLeft + tableW * 0.10,
    qtyUnit: tableLeft + tableW * 0.74,
    uprice: tableLeft + tableW * 0.88,
    amount: tableRight,
  };

  doc.setLineWidth(0.25);
  doc.line(tableLeft, tableTop, tableRight, tableTop);
  doc.line(tableLeft, tableTop + 6.5, tableRight, tableTop + 6.5);

  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text("ITEM", col.item, tableTop + 4.8);
  doc.text("DESCRIPTION", col.desc, tableTop + 4.8);
  doc.text("QTY Unit", col.qtyUnit, tableTop + 4.8, { align: "right" });
  doc.text("U*PRICE", col.uprice, tableTop + 4.8, { align: "right" });
  doc.text("AMOUNT(RM)", col.amount, tableTop + 4.8, { align: "right" });

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  const rowY = tableTop + 15;

  const descWidth = Math.max(10, col.qtyUnit - col.desc - 4);
  const proposed = formatDateHuman(data.proposed_date);
  const mode = data.course_mode ?? "";

  textValue(doc, "1", col.item, rowY);
  doc.setFont("times", "bold");
  const courseLines = doc.splitTextToSize(data.course_name, descWidth);
  textValue(doc, courseLines.join("\n"), col.desc, rowY);
  doc.setFont("times", "normal");
  const afterCourseY = rowY + Math.max(5, courseLines.length * 4.2);
  let descY = afterCourseY;
  textValue(doc, `Date: ${proposed || data.proposed_date}`, col.desc, descY);
  descY += 4.8;
  textValue(doc, `Mode: ${mode}`, col.desc, descY);
  descY += 4.8;
  const location = (data.course_location_address ?? "").trim();
  if (location) {
    const locLines = doc.splitTextToSize(`Address: ${location}`, descWidth);
    textValue(doc, locLines.join("\n"), col.desc, descY);
  }

  textValue(doc, `${data.number_of_employers} pax`, col.qtyUnit, rowY, { align: "right" });
  const uPrice = formatMoney(data.unit_price);
  const amt = formatMoney(data.amount_rm);
  if (uPrice) textValue(doc, uPrice, col.uprice, rowY, { align: "right" });
  if (amt) textValue(doc, amt, col.amount, rowY, { align: "right" });

  // Bottom section: amount in words + total
  const words = ringgitToWords(data.amount_rm);
  const { wordsY, ruleY, totalY, sigTitleY, stampY } = FOOTER_LAYOUT;
  const wordsAmountX = leftX + 28;
  const onlyGapMm = 2;

  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text("•", leftX + 5, wordsY);
  doc.setFont("times", "normal");
  doc.text("RINGGIT (", leftX + 10, wordsY);
  if (words) textValue(doc, words, wordsAmountX, wordsY);
  const onlyX = words
    ? wordsAmountX + doc.getTextWidth(words) + onlyGapMm
    : wordsAmountX;
  doc.text(") ONLY", onlyX, wordsY);

  doc.setLineWidth(0.2);
  doc.line(leftX, ruleY, rightX, ruleY);

  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("Total: RM", rightX - 55, totalY);
  if (amt) textValue(doc, amt, rightX - 10, totalY, { align: "right" });

  // Signature area
  const issuerSigRightX = pageW - ISSUER_SIG_BLOCK.rightMarginMm;
  const issuerSigCenterX = issuerSigRightX - ISSUER_SIG_BLOCK.widthMm / 2;
  const companyLine = BRAND.name.toUpperCase();
  const receivedByLabel = "RECEIVED BY";

  doc.setFontSize(9);
  doc.setFont("times", "bold");
  doc.text(receivedByLabel, leftX, sigTitleY);
  const recvSigCenterX = leftX + doc.getTextWidth(receivedByLabel) / 2;
  doc.text(companyLine, issuerSigCenterX, sigTitleY, { align: "center" });

  if (stampDataUrl) {
    doc.addImage(
      stampDataUrl,
      stampImageFormat(stampDataUrl),
      issuerSigCenterX - STAMP_MM.width / 2,
      stampY,
      STAMP_MM.width,
      STAMP_MM.height
    );
  }

  const recvSigLineY = sigTitleY + 14;
  const recvSigLabelY = recvSigLineY + 6;
  const issuerSigLineY = stampDataUrl
    ? stampY + STAMP_MM.height + 1
    : sigTitleY + 10;
  const issuerSigLabelY = issuerSigLineY + 6;

  doc.setFont("times", "normal");
  doc.setFontSize(8);
  setColor(doc, COLOR.gray);
  doc.text("..............................", recvSigCenterX, recvSigLineY, { align: "center" });
  doc.text("Company Chop & Signature", recvSigCenterX, recvSigLabelY, { align: "center" });
  doc.text("..............................", issuerSigCenterX, issuerSigLineY, { align: "center" });
  doc.text("(Authorised Signature)", issuerSigCenterX, issuerSigLabelY, { align: "center" });
  setColor(doc, COLOR.black);

  return doc.output("blob");
}
