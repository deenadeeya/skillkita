import PlaceholderPoster from "../../../assets/placeholder.jpg";
import { CoursePosterMedia } from "./CoursePosterMedia";
import type { CourseDetailRow } from "../api/coursesApi";

type Props = {
  course: CourseDetailRow;
};

export function CourseDetailHeader({ course }: Props) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[280px,1fr]">
      <CoursePosterMedia
        url={course.poster_url ?? PlaceholderPoster}
        alt={`${course.name} poster`}
        className="aspect-[210/297] w-full rounded-xl object-cover"
      />

      <section className="sk-card p-6">
        <h1 className="text-3xl font-bold text-[#0001fc] md:text-4xl">{course.name}</h1>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-black/90 md:grid-cols-2">
          <p>
            <span className="font-semibold text-[#7A1F1F]">Date:</span> {course.date || "—"}
          </p>
          <p>
            <span className="font-semibold text-[#7A1F1F]">Time:</span> {course.course_time || "—"}
          </p>
          <p className="md:col-span-2">
            <span className="font-semibold text-[#7A1F1F]">Venue:</span> {course.venue || "—"}
          </p>
          <p className="md:col-span-2">
            <span className="font-semibold text-[#7A1F1F]">Trainer:</span> {course.trainer_names || "—"}
          </p>
          <p>
            <span className="font-semibold text-[#7A1F1F]">MyCOID:</span> {course.mycoid || "—"}
          </p>
          <p>
            <span className="font-semibold text-[#7A1F1F]">Price:</span> {course.price || "—"}
          </p>
          <p className="md:col-span-2">
            <span className="font-semibold text-[#7A1F1F]">Person to contact:</span>{" "}
            {course.contact_person || "—"}
          </p>
          <p className="md:col-span-2">
            <span className="font-semibold text-[#7A1F1F]">Phone number:</span>{" "}
            {course.contact_phone || "—"}
          </p>
        </div>
      </section>
    </div>
  );
}

