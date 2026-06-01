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

  const courseDay = parseCourseDate(trimmed);
  if (!courseDay) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return courseDay >= today;
}

function parseCourseDate(date: string): Date | null {
  const courseDay = new Date(`${date.trim()}T00:00:00`);
  return Number.isNaN(courseDay.getTime()) ? null : courseDay;
}

/** Upcoming courses first (soonest date), then others by newest created_at. */
export function compareCoursesUpcomingFirst<
  T extends { date: string | null; created_at?: string | null },
>(a: T, b: T): number {
  const aUpcoming = isUpcomingCourseDate(a.date);
  const bUpcoming = isUpcomingCourseDate(b.date);
  if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

  if (aUpcoming && bUpcoming && a.date && b.date) {
    const aDay = parseCourseDate(a.date);
    const bDay = parseCourseDate(b.date);
    if (aDay && bDay) return aDay.getTime() - bDay.getTime();
  }

  const aCreated = a.created_at ?? "";
  const bCreated = b.created_at ?? "";
  return bCreated.localeCompare(aCreated);
}
