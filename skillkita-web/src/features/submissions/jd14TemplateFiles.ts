/** Allowed template extensions (lowercase, no dot). */
const JD14_TEMPLATE_EXT = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "odp",
  "rtf",
  "txt",
  "csv",
]);

/** HTML `accept` for JD14 template file inputs. */
export const JD14_TEMPLATE_FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv";

export function jd14TemplateExtensionFromFileName(fileName: string): string {
  const raw = (fileName.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return raw;
}

/** Returns sanitized extension for storage path, or throws. */
export function assertAllowedJd14TemplateFile(file: File): string {
  const ext = jd14TemplateExtensionFromFileName(file.name);
  if (!ext || !JD14_TEMPLATE_EXT.has(ext)) {
    throw new Error(
      "Template file type not allowed. Use PDF, Word (.doc/.docx), Excel, PowerPoint, OpenDocument, RTF, plain text, or CSV."
    );
  }
  return ext;
}
