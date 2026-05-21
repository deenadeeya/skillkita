export const QUOTATION_COURSE_MODES = ["Inhouse", "Public"] as const;

export type QuotationCourseMode = (typeof QUOTATION_COURSE_MODES)[number];

export function isQuotationCourseMode(value: string): value is QuotationCourseMode {
  return (QUOTATION_COURSE_MODES as readonly string[]).includes(value);
}
