import PlaceholderPoster from "../../../assets/placeholder.jpg";
import { CoursePosterMedia } from "./CoursePosterMedia";

export type PublicCourseCard = {
  id: string;
  name: string;
  date: string;
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

export function CoursesGrid({
  courses,
  isLoading,
  errorMessage,
  totalPublicCount,
  onOpenCourse,
}: Props) {
  return (
    <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
      {isLoading && (
        <p className="col-span-full rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
          Loading courses...
        </p>
      )}
      {courses.map((course) => (
        <article
          key={course.id}
          className="sk-card overflow-hidden p-3 md:p-4 cursor-pointer transition hover:shadow-md focus-within:ring-2 focus-within:ring-[#7A1F1F]/30"
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
          <CoursePosterMedia
            url={course.posterUrl ?? PlaceholderPoster}
            alt={`${course.name} poster`}
            className="aspect-[210/297] w-full rounded-lg object-cover"
          />
          <h2 className="mt-3 text-sm font-semibold text-[#0001fc] md:mt-4 md:text-xl">
            {course.name}
          </h2>
          <p className="mt-1 text-xs font-medium text-[#7A1F1F] md:mt-2 md:text-sm">
            Date: {course.date}
          </p>
          <p className="mt-1 text-xs text-black md:mt-2 md:text-sm">{course.details}</p>
        </article>
      ))}
      {!isLoading && courses.length === 0 && !errorMessage && (
        <p className="col-span-full rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
          {totalPublicCount === 0 ? "No public courses available right now." : "No courses match your search."}
        </p>
      )}
    </section>
  );
}

