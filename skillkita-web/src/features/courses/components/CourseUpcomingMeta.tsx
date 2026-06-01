import { formatCourseDisplayDate, isUpcomingCourseDate } from "../courseDate";

type Props = {
  date: string | null | undefined;
  /** Keeps card body height consistent when some courses are not upcoming (e.g. carousel). */
  reserveSpace?: boolean;
  className?: string;
};

/**
 * Upcoming status + start date for course cards (below poster, above title).
 */
export function CourseUpcomingMeta({ date, reserveSpace = false, className = "" }: Props) {
  const isUpcoming = isUpcomingCourseDate(date);
  const displayDate = formatCourseDisplayDate(date);
  const isoDate = date?.trim() || undefined;

  if (!isUpcoming || !displayDate) {
    if (reserveSpace) {
      return <div className={`min-h-10 ${className}`} aria-hidden />;
    }
    return null;
  }

  return (
    <div
      className={`mb-3 flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}
    >
      <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-3 py-1 text-sm font-semibold uppercase tracking-wide text-white">
        Upcoming
      </span>
      <time
        dateTime={isoDate}
        className="min-w-0 text-sm font-semibold leading-snug text-secondary sm:text-base"
      >
        Starts {displayDate}
      </time>
    </div>
  );
}
