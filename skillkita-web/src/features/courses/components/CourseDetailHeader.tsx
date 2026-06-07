import { formatCourseDisplayDate, isUpcomingCourseDate } from "../courseDate";
import type { CourseDetailRow } from "../api/coursesApi";
import { CoursePosterMedia } from "./CoursePosterMedia";
import { CourseUpcomingMeta } from "./CourseUpcomingMeta";

type Props = {
  course: CourseDetailRow;
};

export function CourseDetailHeader({ course }: Props) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(240px,320px),1fr]">
      <div className="sk-card flex items-center justify-center overflow-hidden bg-paper p-4">
        <CoursePosterMedia
          url={course.poster_url}
          alt={`${course.name} poster`}
          className="max-h-[420px] w-full object-contain"
          optimizeWidth={640}
        />
      </div>

      <section className="sk-card p-6 md:p-8">
        <CourseUpcomingMeta date={course.date} />
        <h1 className="sk-heading-3 text-ink">{course.name}</h1>
        <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {!isUpcomingCourseDate(course.date) && (
            <div>
              <dt className="font-semibold text-primary">Date</dt>
              <dd className="mt-0.5 text-ink-muted">
                {formatCourseDisplayDate(course.date) ?? course.date ?? "—"}
              </dd>
            </div>
          )}
          <div>
            <dt className="font-semibold text-primary">Time</dt>
            <dd className="mt-0.5 text-ink-muted">{course.course_time || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-primary">Venue</dt>
            <dd className="mt-0.5 text-ink-muted">{course.venue || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-primary">Trainer</dt>
            <dd className="mt-0.5 text-ink-muted">{course.trainer_names || "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-primary">MyCOID</dt>
            <dd className="mt-0.5 text-ink-muted">{course.mycoid || "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-primary">Price</dt>
            <dd className="mt-0.5 text-ink-muted">{course.price || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-primary">Person to contact</dt>
            <dd className="mt-0.5 text-ink-muted">{course.contact_person || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-primary">Phone number</dt>
            <dd className="mt-0.5 text-ink-muted">{course.contact_phone || "—"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

