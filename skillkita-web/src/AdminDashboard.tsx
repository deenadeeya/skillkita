import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import CoursePoster1 from "./assets/CoursePoster1.jpg";
import SiteHeader from "./SiteHeader";

type Course = {
  id: number;
  name: string;
  date: string;
  details: string;
  poster: string;
  isVisible: boolean;
};

type CourseFormState = {
  name: string;
  date: string;
  details: string;
  isVisible: boolean;
};

const initialFormState: CourseFormState = {
  name: "",
  date: "",
  details: "",
  isVisible: true,
};

const AdminDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      name: "Employment Contract & Stamping",
      date: "2025-05-28",
      details:
        "Practical workshop on employment contracts, legal clauses, and document stamping requirements.",
      poster: CoursePoster1,
      isVisible: true,
    },
  ]);
  const [form, setForm] = useState<CourseFormState>(initialFormState);
  const [posterPreview, setPosterPreview] = useState<string>(CoursePoster1);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = event.currentTarget;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
      return;
    }

    setForm((prev) => ({ ...prev, [target.name]: target.value }));
  };

  const handlePosterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPosterPreview(objectUrl);
  };

  const resetForm = () => {
    setForm(initialFormState);
    setPosterPreview(CoursePoster1);
    setEditingCourseId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.date.trim() || !form.details.trim()) {
      return;
    }

    if (editingCourseId !== null) {
      setCourses((prev) =>
        prev.map((course) =>
          course.id === editingCourseId
            ? {
                ...course,
                name: form.name.trim(),
                date: form.date,
                details: form.details.trim(),
                poster: posterPreview,
                isVisible: form.isVisible,
              }
            : course
        )
      );
      resetForm();
      return;
    }

    const nextCourse: Course = {
      id: Date.now(),
      name: form.name.trim(),
      date: form.date,
      details: form.details.trim(),
      poster: posterPreview,
      isVisible: form.isVisible,
    };

    setCourses((prev) => [nextCourse, ...prev]);
    resetForm();
  };

  const handleEdit = (course: Course) => {
    setEditingCourseId(course.id);
    setForm({
      name: course.name,
      date: course.date,
      details: course.details,
      isVisible: course.isVisible,
    });
    setPosterPreview(course.poster);
  };

  const handleDelete = (courseId: number) => {
    setCourses((prev) => prev.filter((course) => course.id !== courseId));
    if (editingCourseId === courseId) {
      resetForm();
    }
  };

  const handleVisibilityToggle = (courseId: number) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId
          ? { ...course, isVisible: !course.isVisible }
          : course
      )
    );
  };

  const publicCourses = courses.filter((course) => course.isVisible);

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader
        menuLinks={[
          { label: "Home", href: "/" },
          { label: "View Courses", href: "/courses" },
          { label: "Admin Dashboard", href: "/admin?role=admin" },
        ]}
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">
          Admin Dashboard
        </h1>
        <p className="mt-3 text-lg text-black md:text-xl">
          Manage courses with add, update, delete, and public visibility controls.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr,1.9fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">
              {editingCourseId ? "Update Course" : "Add New Course"}
            </h2>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Course Name
                </span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  placeholder="Enter course name"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Date
                </span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Other Information
                </span>
                <textarea
                  name="details"
                  value={form.details}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  placeholder="Add summary, trainer, venue, etc."
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Poster
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterChange}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                />
                <img
                  src={posterPreview}
                  alt="Course poster preview"
                  className="mt-3 aspect-[210/297] w-full rounded-lg object-cover"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-[#7A1F1F]">
                <input
                  type="checkbox"
                  name="isVisible"
                  checked={form.isVisible}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                />
                Show to public
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-[#7A1F1F] px-4 py-2 font-semibold text-white"
                >
                  {editingCourseId ? "Update Course" : "Add Course"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-[#7A1F1F] px-4 py-2 font-semibold text-[#7A1F1F]"
                >
                  Clear
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-[#7A1F1F]">All Courses</h2>
              <p className="text-sm font-semibold text-[#7A1F1F]">
                {courses.length} total / {publicCourses.length} public
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-xl border border-[#efe1db] p-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px,1fr]">
                    <img
                      src={course.poster}
                      alt={`${course.name} poster`}
                      className="aspect-[210/297] w-full rounded-lg object-cover"
                    />

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xl font-semibold text-[#0001fc]">
                          {course.name}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            course.isVisible
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {course.isVisible ? "Public" : "Hidden"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-medium text-[#7A1F1F]">
                        Date: {course.date}
                      </p>
                      <p className="mt-2 text-sm text-black">{course.details}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(course)}
                          className="rounded-lg bg-[#0001fc] px-3 py-2 text-sm font-semibold text-white"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(course.id)}
                          className="rounded-lg bg-[#7A1F1F] px-3 py-2 text-sm font-semibold text-white"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVisibilityToggle(course.id)}
                          className="rounded-lg border border-[#7A1F1F] px-3 py-2 text-sm font-semibold text-[#7A1F1F]"
                        >
                          {course.isVisible ? "Hide from Public" : "Show to Public"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#7A1F1F]">Public Preview</h2>
          <p className="mt-2 text-sm text-black">
            This section simulates what users can see on the public website.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publicCourses.map((course) => (
              <article key={course.id} className="rounded-xl bg-[#f9f5ed] p-4">
                <img
                  src={course.poster}
                  alt={`${course.name} poster`}
                  className="aspect-[210/297] w-full rounded-lg object-cover"
                />
                <h3 className="mt-3 text-lg font-semibold text-[#0001fc]">
                  {course.name}
                </h3>
                <p className="mt-1 text-sm text-black">Date: {course.date}</p>
                <p className="mt-2 text-sm text-black">{course.details}</p>
              </article>
            ))}
            {publicCourses.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                No courses are visible to public right now.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
