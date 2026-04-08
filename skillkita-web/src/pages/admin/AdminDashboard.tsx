import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../../assets/placeholder.jpg";
import { supabase } from "../../lib/supabaseClient";
import SiteHeader from "../../components/layout/SiteHeader";

type Course = {
  id: string;
  name: string;
  date: string;
  details: string;
  posterUrl: string | null;
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

type CourseRow = {
  id: string;
  name: string;
  date: string;
  details: string;
  poster_url: string | null;
  is_visible: boolean;
  created_at: string;
};

const AdminDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseFormState>(initialFormState);
  const [posterPreview, setPosterPreview] = useState<string>(PlaceholderPoster);
  const [selectedPosterFile, setSelectedPosterFile] = useState<File | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const publicCourses = useMemo(
    () => courses.filter((course) => course.isVisible),
    [courses]
  );

  useEffect(() => {
    const checkAdmin = async () => {
      setIsAuthChecking(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        setErrorMessage(error.message);
        return;
      }

      const user = data.session?.user;
      if (!user) {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        window.location.href = "/admin/login";
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        setErrorMessage(adminError.message);
        return;
      }

      if (!adminRow) {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/admin/login";
        return;
      }

      window.localStorage.setItem("skillkita-role", "admin");
      setIsAuthorized(true);
      setIsAuthChecking(false);
    };

    void checkAdmin();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void checkAdmin();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const mapRowToCourse = (row: CourseRow): Course => ({
    id: row.id,
    name: row.name,
    date: row.date,
    details: row.details,
    posterUrl: row.poster_url,
    isVisible: row.is_visible,
  });

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("courses")
      .select("id,name,date,details,poster_url,is_visible,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setCourses([]);
      setIsLoading(false);
      return;
    }

    setCourses((data ?? []).map(mapRowToCourse));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }
    void loadCourses();
  }, [isAuthorized, loadCourses]);

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
      setSelectedPosterFile(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPosterPreview(objectUrl);
    setSelectedPosterFile(file);
  };

  const resetForm = () => {
    setForm(initialFormState);
    setPosterPreview(PlaceholderPoster);
    setSelectedPosterFile(null);
    setEditingCourseId(null);
  };

  const uploadPosterIfNeeded = async (): Promise<string | null> => {
    if (!selectedPosterFile) {
      return null;
    }

    const fileExt = selectedPosterFile.name.split(".").pop() || "png";
    const safeExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = `${crypto.randomUUID()}.${safeExt || "png"}`;
    const filePath = `courses/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("course-posters")
      .upload(filePath, selectedPosterFile, {
        upsert: false,
        contentType: selectedPosterFile.type || undefined,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("course-posters")
      .getPublicUrl(filePath);

    return data.publicUrl ?? null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.name.trim() || !form.date.trim() || !form.details.trim()) {
      return;
    }

    try {
      setIsSaving(true);

      const posterUrl = await uploadPosterIfNeeded();

      if (editingCourseId !== null) {
        const payload: Partial<CourseRow> = {
          name: form.name.trim(),
          date: form.date,
          details: form.details.trim(),
          is_visible: form.isVisible,
        };

        if (posterUrl) {
          payload.poster_url = posterUrl;
        }

        const { error } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", editingCourseId);

        if (error) {
          throw new Error(error.message);
        }

        await loadCourses();
        resetForm();
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.from("courses").insert({
        name: form.name.trim(),
        date: form.date,
        details: form.details.trim(),
        is_visible: form.isVisible,
        poster_url: posterUrl,
      });

      if (error) {
        throw new Error(
          `${error.message}${
            error.message.toLowerCase().includes("row-level security")
              ? " (RLS is blocking inserts. Add an INSERT policy for admins on public.courses.)"
              : ""
          }`
        );
      }

      await loadCourses();
      resetForm();
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save course.");
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourseId(course.id);
    setForm({
      name: course.name,
      date: course.date,
      details: course.details,
      isVisible: course.isVisible,
    });
    setPosterPreview(course.posterUrl ?? PlaceholderPoster);
    setSelectedPosterFile(null);
  };

  const handleDelete = async (courseId: string) => {
    setErrorMessage(null);
    setIsSaving(true);

    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    if (error) {
      setIsSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await loadCourses();
    if (editingCourseId === courseId) {
      resetForm();
    }
    setIsSaving(false);
  };

  const handleVisibilityToggle = async (courseId: string) => {
    setErrorMessage(null);
    const course = courses.find((item) => item.id === courseId);
    if (!course) {
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("courses")
      .update({ is_visible: !course.isVisible })
      .eq("id", courseId);

    if (error) {
      setIsSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await loadCourses();
    setIsSaving(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader
        menuLinks={[
          { label: "Home", href: "/" },
          { label: "View Courses", href: "/courses" },
          { label: "Admin Dashboard", href: "/admin?role=admin" },
          { label: "Edit Landing Page", href: "/admin/landing?role=admin" },
        ]}
      />

      <div className="sk-container py-12">
        <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">
          Admin Dashboard
        </h1>
        <p className="mt-3 text-lg text-black md:text-xl">
          Manage courses with add, update, delete, and public visibility controls.
        </p>
        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isAuthChecking && (
          <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
            Checking admin access...
          </div>
        )}

        <div className={`mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr,1.9fr] ${!isAuthorized ? "opacity-60 pointer-events-none" : ""}`}>
          <section className="sk-card p-6">
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
                  disabled={isSaving}
                  className="sk-button-primary"
                >
                  {isSaving
                    ? "Saving..."
                    : editingCourseId
                      ? "Update Course"
                      : "Add Course"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="sk-button-secondary"
                >
                  Clear
                </button>
              </div>
            </form>
          </section>

          <section className="sk-card p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-[#7A1F1F]">All Courses</h2>
              <p className="text-sm font-semibold text-[#7A1F1F]">
                {courses.length} total / {publicCourses.length} public
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {isLoading && (
                <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                  Loading courses...
                </p>
              )}
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-xl border border-[#efe1db] p-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px,1fr]">
                    <img
                      src={course.posterUrl ?? PlaceholderPoster}
                      alt={`${course.name} poster`}
                      className="aspect-[210/297] w-full rounded-lg object-cover"
                    />

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xl font-semibold text-[#0001fc]">
                          {course.name}
                        </h3>
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

                      <p className="mt-2 text-sm font-medium text-[#7A1F1F]">
                        Date: {course.date}
                      </p>
                      <p className="mt-2 text-sm text-black">{course.details}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(course)}
                          disabled={isSaving}
                          className="sk-button bg-[#0001fc] text-white hover:bg-[#0001fc]/90"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(course.id)}
                          disabled={isSaving}
                          className="sk-button-primary px-3 py-2"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVisibilityToggle(course.id)}
                          disabled={isSaving}
                          className="sk-button-secondary px-3 py-2"
                        >
                          {course.isVisible ? "Hide from Public" : "Show to Public"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {!isLoading && courses.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                  No courses yet. Add one on the left.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="sk-card mt-10 p-6">
          <h2 className="text-2xl font-bold text-[#7A1F1F]">Public Preview</h2>
          <p className="mt-2 text-sm text-black">
            This section simulates what users can see on the public website.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publicCourses.map((course) => (
              <article key={course.id} className="rounded-xl bg-[#f9f5ed] p-4">
                <img
                  src={course.posterUrl ?? PlaceholderPoster}
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
