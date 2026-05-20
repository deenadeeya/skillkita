/** Multiline display: keeps explicit newlines, or splits comma-separated text onto separate lines. */
export function formatMultilineForDisplay(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (/\n/.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

/** @deprecated Use formatMultilineForDisplay */
export const formatLocationForDisplay = formatMultilineForDisplay;

export function multilineToDisplayLines(text: string): string[] {
  return formatMultilineForDisplay(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export const BANK_DETAIL_LABELS = ["Account name", "Bank", "Account number"] as const;
