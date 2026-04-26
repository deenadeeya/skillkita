export type OcrState =
  | { status: "idle" }
  | { status: "running"; progressLabel: string; progressPct?: number }
  | { status: "done"; extractedText: string }
  | { status: "error"; message: string };

export function normalizeWhitespace(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractLabeledValue(text: string, labels: string[]) {
  const clean = normalizeWhitespace(text);
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  const labelGroup = labels
    .map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp(
    `^\\s*(?:${labelGroup})\\s*(?:\\(|\\[)?\\s*[:\\-–]?\\s*(.+)$`,
    "i"
  );
  for (const line of lines) {
    const m = line.match(re);
    if (m?.[1]) {
      const v = m[1].trim();
      if (!v) continue;
      if (new RegExp(`^(?:${labelGroup})$`, "i").test(v)) continue;
      return v;
    }
  }
  return null;
}

export function extractAfterKeyword(text: string, keywords: string[]) {
  const clean = normalizeWhitespace(text);
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  const keyGroup = keywords
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp(`\\b(?:${keyGroup})\\b\\s*[:\\-–]?\\s*(.+)$`, "i");
  for (const line of lines) {
    const m = line.match(re);
    if (m?.[1]) {
      const v = m[1].trim();
      if (v) return v;
    }
  }
  return null;
}

export function extractContactPerson(text: string, knownPhone?: string | null) {
  const clean = normalizeWhitespace(text);
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (
      !/(person to contact|contact person|contact|hubungi|untuk pertanyaan|pertanyaan|call)/i.test(
        line
      )
    ) {
      continue;
    }
    let candidate = line;
    if (knownPhone) candidate = candidate.replace(knownPhone, " ");
    candidate = candidate.replace(
      /\b(\+?6?0?\s?\d{2,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4})\b/g,
      " "
    );
    candidate = candidate.replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      " "
    );
    candidate = candidate.replace(
      /(person to contact|contact person|contact|hubungi|untuk pertanyaan|pertanyaan|call)\s*[:\-–]?\s*/i,
      ""
    );
    candidate = candidate.replace(/\s{2,}/g, " ").trim();
    if (candidate.length >= 3 && candidate.length <= 60) return candidate;
  }
  return null;
}

export function extractPhone(text: string) {
  const m =
    text.match(/\b(\+?6?0?1\d[\s\-]?\d{3,4}[\s\-]?\d{3,4})\b/) ||
    text.match(/\b(\+?6?0?\s?\d{2,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4})\b/);
  return m?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

export function extractEmail(text: string) {
  const m = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  return m?.[0] ?? null;
}

export function extractMycoid(text: string) {
  const m =
    text.match(/\bmycoid\s*[:#\-]?\s*([a-z0-9\-_/]{4,})\b/i) ||
    text.match(/\bmyco\s*id\s*[:#\-]?\s*([a-z0-9\-_/]{4,})\b/i);
  return m?.[1]?.trim() ?? null;
}

export function extractPrice(text: string) {
  const clean = normalizeWhitespace(text);
  const labeled =
    extractLabeledValue(clean, ["Fee", "Harga", "Price", "Yuran", "Bayaran", "RM"]) ??
    extractAfterKeyword(clean, ["fee", "harga", "price", "yuran", "bayaran", "rm"]);
  if (labeled) {
    const rm = labeled.match(/\bRM\s*[\d,.]+/i);
    if (rm?.[0]) return rm[0].replace(/\s+/g, " ").trim();
    const num = labeled.match(/\b[\d,.]+\b/);
    if (num?.[0]) return `RM ${num[0]}`.replace(/\s+/g, " ").trim();
    return labeled.trim();
  }
  const inline = clean.match(/\bRM\s*[\d,.]+/i);
  return inline?.[0]?.replace(/\s+/g, " ").trim() ?? null;
}

export function extractTime(text: string) {
  const m =
    text.match(
      /\b(\d{1,2}[:.]\d{2}\s*(?:am|pm)?\s*[-–]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm)?)\b/i
    ) ||
    text.match(/\b(\d{1,2}\s*(?:am|pm)\s*[-–]\s*\d{1,2}\s*(?:am|pm))\b/i) ||
    text.match(
      /\b(\d{1,2}(?:\.\d{2})?\s*(?:pagi|petang|malam)\s*[-–]\s*\d{1,2}(?:\.\d{2})?\s*(?:pagi|petang|malam))\b/i
    ) ||
    text.match(/\b(\d{3,4}\s*[-–]\s*\d{3,4})\b/);
  return m?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

export function tryExtractDateISO(text: string): string | null {
  const monthMap: Record<string, number> = {
    jan: 1,
    january: 1,
    januari: 1,
    feb: 2,
    february: 2,
    februari: 2,
    mar: 3,
    march: 3,
    mac: 3,
    apr: 4,
    april: 4,
    may: 5,
    mei: 5,
    jun: 6,
    june: 6,
    juni: 6,
    jul: 7,
    july: 7,
    julai: 7,
    aug: 8,
    august: 8,
    ogos: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    oktober: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
    dis: 12,
    disember: 12,
  };

  const mRange = text.match(
    /\b(\d{1,2})\s*(?:[-–&]|and|hingga)\s*\d{1,2}\s+(jan(?:uary)?|feb(?:ruary)?|februari|mar(?:ch)?|mac|apr(?:il)?|may|mei|jun(?:e)?|juni|jul(?:y)?|julai|aug(?:ust)?|ogos|sep(?:t)?(?:ember)?|oct(?:ober)?|oktober|nov(?:ember)?|dec(?:ember)?|dis(?:ember)?)\s+(\d{4})\b/i
  );
  if (mRange) {
    const dd = Number(mRange[1]);
    const mm = monthMap[mRange[2].toLowerCase()];
    const yyyy = Number(mRange[3]);
    if (mm && dd >= 1 && dd <= 31) {
      return new Date(Date.UTC(yyyy, mm - 1, dd)).toISOString().slice(0, 10);
    }
  }

  const m1 = text.match(
    /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|februari|mar(?:ch)?|mac|apr(?:il)?|may|mei|jun(?:e)?|juni|jul(?:y)?|julai|aug(?:ust)?|ogos|sep(?:t)?(?:ember)?|oct(?:ober)?|oktober|nov(?:ember)?|dec(?:ember)?|dis(?:ember)?)\s+(\d{4})\b/i
  );
  if (m1) {
    const dd = Number(m1[1]);
    const mm = monthMap[m1[2].toLowerCase()];
    const yyyy = Number(m1[3]);
    if (mm && dd >= 1 && dd <= 31) {
      return new Date(Date.UTC(yyyy, mm - 1, dd)).toISOString().slice(0, 10);
    }
  }

  const m2 = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (m2) {
    const dd = Number(m2[1]);
    const mm = Number(m2[2]);
    const yyyy = Number(m2[3]);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return new Date(Date.UTC(yyyy, mm - 1, dd)).toISOString().slice(0, 10);
    }
  }

  const m3 = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m3) return m3[0];

  return null;
}

export function guessCourseNameFromText(text: string): string | null {
  const lines = normalizeWhitespace(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const ignore =
    /^(date|tarikh|time|masa|venue|tempat|trainer|pengajar|instructor|fee|price|harga|rm|contact|tel|email)\b/i;
  const top = lines.slice(0, 25);
  const candidates = top
    .filter((l) => !ignore.test(l))
    .filter((l) => l.length >= 6)
    .map((l) => l.replace(/\s{2,}/g, " ").trim())
    .filter((l) => !/^(poster|brochure|training|kursus)\b/i.test(l));
  if (candidates.length === 0) return null;

  const scored = candidates
    .map((l) => {
      const words = l.split(/\s+/).filter(Boolean);
      const upperRatio =
        l.replace(/[^A-Z]/g, "").length /
        Math.max(1, l.replace(/[^A-Za-z]/g, "").length);
      const punctuationPenalty = (l.match(/[.?!]/g) ?? []).length;
      const score =
        Math.min(90, l.length) +
        (upperRatio > 0.6 ? 12 : 0) +
        (words.length >= 3 && words.length <= 12 ? 10 : 0) -
        punctuationPenalty * 8;
      return { l, score };
    })
    .sort((a, b) => b.score - a.score);

  const candidate = scored[0]?.l ?? null;
  if (!candidate) return null;
  const words = candidate.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  return candidate.replace(/\s{2,}/g, " ").trim();
}

export function buildPosterSummary(text: string): string {
  const clean = normalizeWhitespace(text);
  const date = tryExtractDateISO(clean);
  const name = guessCourseNameFromText(clean);

  const lines = clean
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const keepLine = (l: string) =>
    /(venue|tempat|location|trainer|instructor|time|masa|fee|price|rm|duration|hours|jam|module|syllabus|who should attend|objective|outcome)/i.test(
      l
    );

  const picked = lines.filter(keepLine).slice(0, 8);
  const bullets =
    picked.length > 0
      ? picked.map((l) => `- ${l}`).join("\n")
      : "- (No obvious structured details found; pasted raw OCR below.)";

  const headerParts = [name ? `Course: ${name}` : null, date ? `Date: ${date}` : null].filter(
    Boolean
  );

  return [
    "Poster OCR summary (auto-generated):",
    headerParts.length
      ? (headerParts as string[]).join(" | ")
      : "(Headline/date not confidently detected)",
    "",
    bullets,
    "",
    "Raw OCR:",
    clean.slice(0, 3500),
  ].join("\n");
}

export function buildDetailsTemplate(fields: {
  trainerNames?: string | null;
  time?: string | null;
  venue?: string | null;
  mycoid?: string | null;
  price?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  syllabus?: string | null;
  email?: string | null;
}) {
  const parts: string[] = [];
  parts.push(
    `Trainer name(s) / Nama jurulatih: ${fields.trainerNames ?? ""}`.trimEnd()
  );
  parts.push(`Time / Pukul: ${fields.time ?? ""}`.trimEnd());
  parts.push(`Venue / Lokasi: ${fields.venue ?? ""}`.trimEnd());
  parts.push(`MyCOID: ${fields.mycoid ?? ""}`.trimEnd());
  parts.push(`Price / Harga: ${fields.price ?? ""}`.trimEnd());
  const contactLine = [
    fields.contactPerson
      ? `Person to contact: ${fields.contactPerson}`
      : "Person to contact:",
    fields.contactPhone ? `Phone: ${fields.contactPhone}` : "Phone:",
    fields.email ? `Email: ${fields.email}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  parts.push(contactLine);
  parts.push("");
  parts.push("Syllabus / Kandungan Kursus:");
  parts.push(fields.syllabus ?? "");
  return parts.join("\n");
}

export function isPdfPoster(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isImagePoster(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export async function createOcrWorker(
  setOcrState: (next: OcrState | ((prev: OcrState) => OcrState)) => void
) {
  const tesseractMod = await import("tesseract.js");
  return await tesseractMod.createWorker("eng+msa", 1, {
    langPath: "https://tessdata.projectnaptha.com/4.0.0",
    logger: (m: { status?: string; progress?: number }) => {
      if (!m?.status) return;
      setOcrState((prev) => {
        if (prev.status !== "running") return prev;
        const pct =
          typeof m.progress === "number" ? Math.round(m.progress * 100) : undefined;
        return {
          status: "running",
          progressLabel: `OCR: ${m.status}`,
          progressPct: pct,
        };
      });
    },
  });
}

export async function ocrPdfPoster(
  file: File,
  worker: { recognize: (img: string) => Promise<{ data: { text?: string } }> },
  setOcrState: (next: OcrState) => void
) {
  setOcrState({ status: "running", progressLabel: "Loading PDF…" });

  const [{ getDocument, GlobalWorkerOptions }, workerUrlMod] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker?url"),
  ]);
  GlobalWorkerOptions.workerSrc = (workerUrlMod as { default: string }).default;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;

  const pagesToProcess = Math.min(2, pdf.numPages);

  let combinedText = "";
  for (let i = 1; i <= pagesToProcess; i += 1) {
    setOcrState({
      status: "running",
      progressLabel: `Rendering page ${i}/${pagesToProcess}…`,
    });

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas rendering not available.");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/png");

    setOcrState({
      status: "running",
      progressLabel: `Recognizing page ${i}/${pagesToProcess}…`,
    });

    const result = await worker.recognize(dataUrl);
    combinedText += `\n\n--- Page ${i} ---\n${result.data.text ?? ""}`;
  }

  return combinedText;
}

export async function ocrImagePoster(
  file: File,
  worker: { recognize: (img: string) => Promise<{ data: { text?: string } }> },
  setOcrState: (next: OcrState) => void
) {
  setOcrState({ status: "running", progressLabel: "Recognizing image…" });
  const dataUrl = await readFileAsDataUrl(file);
  const result = await worker.recognize(dataUrl);
  return result.data.text ?? "";
}

export function extractPosterFields(extractedText: string) {
  const name = guessCourseNameFromText(extractedText);
  const date = tryExtractDateISO(extractedText);
  const trainerNames =
    extractLabeledValue(extractedText, [
      "Trainer",
      "Instructor",
      "Nama jurulatih",
      "Jurulatih",
    ]) ?? extractAfterKeyword(extractedText, ["trainer", "jurulatih", "instructor"]);
  const venue =
    extractLabeledValue(extractedText, ["Venue", "Lokasi", "Tempat", "Location"]) ??
    extractAfterKeyword(extractedText, [
      "venue",
      "lokasi",
      "tempat",
      "location",
      "satvoc",
      "bilik",
      "Bilik",
    ]);
  const time =
    extractLabeledValue(extractedText, ["Time", "Masa", "Pukul"]) ??
    extractAfterKeyword(extractedText, ["time", "masa", "pukul"]) ??
    extractTime(extractedText);
  const mycoid =
    extractLabeledValue(extractedText, ["MyCOID", "Mycoid", "MyCoID"]) ??
    extractMycoid(extractedText);
  const price = extractPrice(extractedText);
  const contactPhone =
    extractLabeledValue(extractedText, [
      "Phone",
      "Tel",
      "Telephone",
      "No telefon",
      "No. telefon",
      "HP",
    ]) ?? extractPhone(extractedText);
  const contactPerson =
    extractLabeledValue(extractedText, ["Person to contact", "Contact person"]) ??
    extractAfterKeyword(extractedText, ["hubungi", "contact", "call"]) ??
    extractContactPerson(extractedText, contactPhone);
  const syllabus =
    extractLabeledValue(extractedText, [
      "Syllabus",
      "Sylibus",
      "Kandungan Kursus",
      "Kandungan",
      "Module",
      "Modules",
    ]) ?? null;
  const email = extractEmail(extractedText);
  const summary = buildPosterSummary(extractedText);
  const detailsTemplate = buildDetailsTemplate({
    trainerNames,
    time,
    venue,
    mycoid,
    price,
    contactPerson,
    contactPhone,
    syllabus,
    email,
  });

  return {
    name,
    date,
    trainerNames,
    time,
    venue,
    mycoid,
    price,
    contactPerson,
    contactPhone,
    syllabus,
    summary,
    detailsTemplate,
  };
}

