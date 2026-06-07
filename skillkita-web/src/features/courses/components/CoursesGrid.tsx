import { CoursePosterMedia } from "./CoursePosterMedia";
import { CourseUpcomingMeta } from "./CourseUpcomingMeta";
import { formatCourseDisplayDate, isUpcomingCourseDate } from "../courseDate";

export type PublicCourseCard = {
  id: string;
  name: string;
  date: string | null;
  details: string;
  posterUrl: string | null;
};

type Props = {
  courses: PublicCourseCard[];
  isLoading: boolean;
  errorMessage: string | null;
  totalPublicCount: number;
  onOpenCourse: (courseId: string) => void;
};

function CourseCardSkeleton() {
  return (
    <div className="sk-card overflow-hidden">
      <div className="h-[220px] animate-pulse bg-primary/5 sm:h-[240px]" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-6 w-28 animate-pulse rounded-full bg-primary/10" />
        <div className="h-5 w-full animate-pulse rounded bg-black/5" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-black/5" />
      </div>
    </div>
  );
}

export function CoursesGrid({
  courses,
  isLoading,
  errorMessage,
  totalPublicCount,
  onOpenCourse,
}: Props) {
  return (
    <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {isLoading &&
        [1, 2, 3, 4, 5, 6].map((n) => (
          <CourseCardSkeleton key={n} />
        ))}

      {!isLoading &&
        courses.map((course) => (
          <article
            key={course.id}
            className="sk-card group flex h-full cursor-pointer flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/25"
            role="link"
            tabIndex={0}
            onClick={() => onOpenCourse(course.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenCourse(course.id);
              }
            }}
          >
            <div className="relative flex h-[200px] shrink-0 items-center justify-center overflow-hidden bg-paper sm:h-[220px] lg:h-[240px]">
              <CoursePosterMedia
                url={course.posterUrl}
                alt={`${course.name} poster`}
                className="h-full w-full object-contain object-center p-2 transition duration-300 group-hover:scale-[1.02]"
                optimizeWidth={520}
              />
            </div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <CourseUpcomingMeta date={course.date} reserveSpace />
              <h2 className="font-heading line-clamp-2 text-lg font-semibold text-ink">
                {course.name}
              </h2>
              {course.date && !isUpcomingCourseDate(course.date) && (
                <p className="mt-1 text-sm font-medium text-ink-muted">
                  {formatCourseDisplayDate(course.date) ?? course.date}
                </p>
              )}
              {course.details?.trim() ? (
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-muted">{course.details}</p>
              ) : null}
              <span className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary group-hover:underline">
                View course details →
              </span>
            </div>
          </article>
        ))}

      {!isLoading && courses.length === 0 && !errorMessage && (
        <p className="col-span-full rounded-hero border border-dashed border-primary/20 bg-white p-10 text-center text-ink-muted">
          {totalPublicCount === 0
            ? "No public courses available right now. Please check back soon."
            : "No courses match your search. Try a different keyword."}
        </p>
      )}
    </section>
  );
}
