import { formatCoursePriceRm, parseCoursePriceRm } from "../parseCoursePrice";

export type PosterExtractedFields = {
  name: string;
  date: string;
  trainerNames: string;
  time: string;
  venue: string;
  mycoid: string;
  price: string;
  contactPerson: string;
  contactPhone: string;
  syllabus: string;
  details: string;
};

export type CourseFormSlice = {
  name: string;
  date: string;
  trainerNames: string;
  time: string;
  venue: string;
  mycoid: string;
  price: string;
  contactPerson: string;
  contactPhone: string;
  syllabus: string;
  details: string;
};

function normalizeExtractedPriceForForm(raw: string): string {
  const parsed = parseCoursePriceRm(raw);
  return parsed != null ? formatCoursePriceRm(parsed) : "";
}

function buildDetailsFromExtraction(fields: PosterExtractedFields): string {
  const lines: string[] = [];
  const push = (label: string, value: string) => {
    const v = value.trim();
    if (v) lines.push(`${label}: ${v}`);
  };

  push("Trainer", fields.trainerNames);
  push("Time", fields.time);
  push("Venue", fields.venue);
  push("MyCOID", fields.mycoid);
  push("Price", fields.price);
  push("Contact person", fields.contactPerson);
  push("Contact phone", fields.contactPhone);
  push("Syllabus", fields.syllabus);

  const summary = fields.details.trim();
  if (summary) {
    if (lines.length) lines.push("");
    lines.push(summary);
  }

  return lines.join("\n");
}

export function mergePosterExtractionIntoForm<T extends CourseFormSlice>(
  prev: T,
  extracted: PosterExtractedFields
): T {
  const normalizedPrice = normalizeExtractedPriceForForm(extracted.price);
  const fieldsForDetails: PosterExtractedFields = {
    ...extracted,
    price: normalizedPrice || extracted.price,
  };
  const detailsBlock = buildDetailsFromExtraction(fieldsForDetails);
  const nextDetails = prev.details.trim()
    ? detailsBlock
      ? `${prev.details.trim()}\n\n${detailsBlock}`
      : prev.details
    : detailsBlock;

  return {
    ...prev,
    name: prev.name.trim() ? prev.name : extracted.name || prev.name,
    date: prev.date.trim() ? prev.date : extracted.date || prev.date,
    trainerNames: prev.trainerNames.trim()
      ? prev.trainerNames
      : extracted.trainerNames || prev.trainerNames,
    time: prev.time.trim() ? prev.time : extracted.time || prev.time,
    venue: prev.venue.trim() ? prev.venue : extracted.venue || prev.venue,
    mycoid: prev.mycoid.trim() ? prev.mycoid : extracted.mycoid || prev.mycoid,
    price: prev.price.trim() ? prev.price : normalizedPrice || prev.price,
    contactPerson: prev.contactPerson.trim()
      ? prev.contactPerson
      : extracted.contactPerson || prev.contactPerson,
    contactPhone: prev.contactPhone.trim()
      ? prev.contactPhone
      : extracted.contactPhone || prev.contactPhone,
    syllabus: prev.syllabus.trim() ? prev.syllabus : extracted.syllabus || prev.syllabus,
    details: nextDetails || prev.details,
  };
}
