import type { CourseDetailRow } from "../api/coursesApi";

type Props = {
  course: CourseDetailRow;
};

export function CourseDetailContent({ course }: Props) {
  const syllabus = course.syllabus?.trim() ?? "";
  const details = course.details?.trim() ?? "";
  if (!syllabus && !details) return null;

  return (
    <section className="sk-card mt-6 p-6">
      {syllabus && (
        <div>
          <h2 className="text-xl font-bold text-[#7A1F1F]">Syllabus</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-black">{course.syllabus}</p>
        </div>
      )}
      {details && (
        <div className={syllabus ? "mt-6" : ""}>
          <h2 className="text-xl font-bold text-[#7A1F1F]">Other information</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-black">{course.details}</p>
        </div>
      )}
    </section>
  );
}

