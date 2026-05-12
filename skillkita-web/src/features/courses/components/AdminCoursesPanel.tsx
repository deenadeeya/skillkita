import PlaceholderPoster from "../../../assets/placeholder.jpg";
import { CoursePosterMedia } from "./CoursePosterMedia";
import {
  PRIVATE_DOC_LABELS,
  columnForKind,
  type PrivateDocKind,
} from "../storage/coursePrivateStorage";

type CoursePrivatePaths = {
  syllabus_storage_path: string | null;
  tentative_storage_path: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_cv_storage_path: string | null;
};

type CourseCard = {
  id: string;
  name: string;
  date: string;
  trainerNames: string;
  time: string;
  venue: string;
  mycoid: string;
  price: string;
  contactPerson: string;
  contactPhone: string;
  details: string;
  posterUrl: string | null;
  isVisible: boolean;
  privateFiles: CoursePrivatePaths | null;
};

type Props = {
  courses: CourseCard[];
  filteredCourses: CourseCard[];
  publicCount: number;
  isLoading: boolean;
  isSaving: boolean;
  searchValue: string;
  onSearchChange: (next: string) => void;
  onCreateCourse: () => void;
  onEditCourse: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onToggleVisibility: (courseId: string) => void;
  onOpenPrivateDoc: (path: string | null | undefined) => void;
};

export function AdminCoursesPanel({
  courses,
  filteredCourses,
  publicCount,
  isLoading,
  isSaving,
  searchValue,
  onSearchChange,
  onCreateCourse,
  onEditCourse,
  onDeleteCourse,
  onToggleVisibility,
  onOpenPrivateDoc,
}: Props) {
  return (
    <>
      <section className="sk-card p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Course creation</h2>
            <p className="mt-2 text-sm text-black">
              Create new courses and upload posters along with course documents
            </p>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onCreateCourse}
            className="sk-button-primary px-4 py-2"
          >
            Add New Course
          </button>
        </div>
      </section>

      <section className="sk-card p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-[#7A1F1F]">All Courses</h2>
          <p className="text-sm font-semibold text-[#7A1F1F]">
            {courses.length} total / {publicCount} public
          </p>
        </div>

        <div className="mt-4">
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search courses by name or details..."
            className="w-full rounded-xl border border-[#d8c9c2] bg-white px-4 py-2 text-sm text-black outline-none focus:border-[#7A1F1F]"
          />
          <p className="mt-2 text-xs font-semibold text-black/60">
            Showing {filteredCourses.length} of {courses.length}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {isLoading && (
            <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
              Loading courses...
            </p>
          )}
          {filteredCourses.map((course) => {
            const hasAnyPrivateFile = Boolean(
              course.privateFiles && Object.values(course.privateFiles).some((v) => Boolean(v))
            );
            return (
              <article key={course.id} className="rounded-xl border border-[#efe1db] p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px,1fr]">
                  <CoursePosterMedia
                    url={course.posterUrl ?? PlaceholderPoster}
                    alt={`${course.name} poster`}
                    className="aspect-[210/297] w-full rounded-lg object-cover"
                  />

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xl font-semibold text-[#0001fc]">{course.name}</h3>
                      <span
                        className={`sk-badge ${
                          course.isVisible
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {course.isVisible ? "Public" : "Hidden"}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-black/80 md:grid-cols-2">
                      <p>
                        <span className="font-semibold text-[#7A1F1F]">Date:</span> {course.date}
                      </p>
                      <p>
                        <span className="font-semibold text-[#7A1F1F]">Time:</span> {course.time || "—"}
                      </p>
                      <p className="md:col-span-2">
                        <span className="font-semibold text-[#7A1F1F]">Venue:</span> {course.venue || "—"}
                      </p>
                      <p className="md:col-span-2">
                        <span className="font-semibold text-[#7A1F1F]">Trainer:</span>{" "}
                        {course.trainerNames || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-[#7A1F1F]">MyCOID:</span> {course.mycoid || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-[#7A1F1F]">Price:</span> {course.price || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-[#7A1F1F]">Contact:</span>{" "}
                        {[course.contactPerson, course.contactPhone].filter(Boolean).join(" • ") || "—"}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-black">{course.details}</p>

                    <div
                      className={[
                        "mt-4 rounded-lg border border-dashed p-3",
                        hasAnyPrivateFile ? "border-[#c5b5ad] bg-[#faf7f2]" : "border-gray-300 bg-gray-100",
                      ].join(" ")}
                    >
                      <p
                        className={[
                          "text-xs font-semibold",
                          hasAnyPrivateFile ? "text-[#7A1F1F]" : "text-gray-700",
                        ].join(" ")}
                      >
                        Files
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => {
                          const col = columnForKind(kind) as keyof CoursePrivatePaths;
                          const path = course.privateFiles?.[col];
                          return (
                            <button
                              key={kind}
                              type="button"
                              disabled={isSaving || !path}
                              onClick={() => onOpenPrivateDoc(path)}
                              className={[
                                "rounded-md border bg-white px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50",
                                hasAnyPrivateFile
                                  ? "border-[#7A1F1F] text-[#7A1F1F]"
                                  : "border-gray-400 text-gray-700",
                              ].join(" ")}
                            >
                              {path ? `Open ${PRIVATE_DOC_LABELS[kind]}` : `${PRIVATE_DOC_LABELS[kind]} (none)`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEditCourse(course.id)}
                        disabled={isSaving}
                        className="sk-button bg-[#0001fc] text-white hover:bg-[#0001fc]/90"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCourse(course.id)}
                        disabled={isSaving}
                        className="sk-button-primary px-3 py-2"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleVisibility(course.id)}
                        disabled={isSaving}
                        className="sk-button-secondary px-3 py-2"
                      >
                        {course.isVisible ? "Hide from Public" : "Show to Public"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {!isLoading && filteredCourses.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
              No courses match your search.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

