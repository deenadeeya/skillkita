/** Format YYYY-MM-DD for display in the UI. */
export function formatCourseDisplayDate(date: string | null | undefined): string | null {
  const trimmed = date?.trim();
  if (!trimmed) return null;

  const courseDay = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(courseDay.getTime())) return trimmed;

  return courseDay.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** True when the course has a scheduled date on or after today (local calendar). */
export function isUpcomingCourseDate(date: string | null | undefined): boolean {
  const trimmed = date?.trim();
  if (!trimmed) return false;

  const courseDay = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(courseDay.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return courseDay >= today;
}
