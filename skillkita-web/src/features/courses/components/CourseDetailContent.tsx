import type { CourseDetailRow } from "../api/coursesApi";

type Props = {
  course: CourseDetailRow;
};

export function CourseDetailContent({ course }: Props) {
  const syllabus = course.syllabus?.trim() ?? "";
  const details = course.details?.trim() ?? "";
  if (!syllabus && !details) return null;

  return (
    <section className="sk-card mt-8 p-6 md:p-8">
      {syllabus && (
        <div>
          <h2 className="sk-heading-3 text-primary">Syllabus</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
            {course.syllabus}
          </p>
        </div>
      )}
      {details && (
        <div className={syllabus ? "mt-8 border-t border-black/5 pt-8" : ""}>
          <h2 className="sk-heading-3 text-primary">Other information</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
            {course.details}
          </p>
        </div>
      )}
    </section>
  );
}

