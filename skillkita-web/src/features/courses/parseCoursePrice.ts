/** Parse admin-entered course price text into RM per participant (e.g. "RM 300", "300.50"). */
export function parseCoursePriceRm(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/,/g, "").replace(/^rm\s*/i, "").trim();
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function formatCoursePriceRm(value: number): string {
  return value.toFixed(2);
}
