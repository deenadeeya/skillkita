import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../../assets/placeholder.jpg";
import { CoursePosterMedia } from "../../components/CoursePosterMedia";
import SiteHeader from "../../components/layout/SiteHeader";
import {
  COURSE_PRIVATE_BUCKET,
  PRIVATE_DOC_LABELS,
  columnForKind,
  createSignedUrlForPath,
  type PrivateDocKind,
  uploadCoursePrivateFile,
} from "../../lib/coursePrivateStorage";
import { supabase } from "../../lib/supabaseClient";

type CoursePrivatePaths = {
  syllabus_storage_path: string | null;
  tentative_storage_path: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_cv_storage_path: string | null;
};

type Course = {
  id: string;
  name: string;
  date: string;
  details: string;
  posterUrl: string | null;
  isVisible: boolean;
  privateFiles: CoursePrivatePaths | null;
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
  course_private_files:
    | CoursePrivatePaths
    | CoursePrivatePaths[]
    | null;
};

type EmployerAccessRow = {
  id: string;
  employer_user_id: string;
  course_id: string;
  status: string;
  created_at: string;
  courses: { name: string } | { name: string }[] | null;
};

function normalizePrivateFiles(
  raw: CourseRow["course_private_files"]
): CoursePrivatePaths | null {
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return null;
  return {
    syllabus_storage_path: row.syllabus_storage_path ?? null,
    tentative_storage_path: row.tentative_storage_path ?? null,
    trainer_hrd_storage_path: row.trainer_hrd_storage_path ?? null,
    trainer_cv_storage_path: row.trainer_cv_storage_path ?? null,
  };
}

function mapRowToCourse(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    details: row.details,
    posterUrl: row.poster_url,
    isVisible: row.is_visible,
    privateFiles: normalizePrivateFiles(row.course_private_files),
  };
}

const emptyPrivateSelections: Record<PrivateDocKind, File | null> = {
  syllabus: null,
  tentative: null,
  trainer_hrd: null,
  trainer_cv: null,
};

const AdminManageCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseFormState>(initialFormState);
  const [posterPreview, setPosterPreview] = useState<string>(PlaceholderPoster);
  const [selectedPosterFile, setSelectedPosterFile] = useState<File | null>(null);
  const [privateSelections, setPrivateSelections] =
    useState<Record<PrivateDocKind, File | null>>(emptyPrivateSelections);
  const [pendingAccess, setPendingAccess] = useState<EmployerAccessRow[]>([]);
  const [employerNames, setEmployerNames] = useState<Record<string, string>>({});
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
        window.location.href = "/login";
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id,role,status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        setErrorMessage(profileError.message);
        return;
      }

      if (!profileRow || profileRow.role !== "admin") {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/login";
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

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("courses")
      .select(
        "id,name,date,details,poster_url,is_visible,created_at,course_private_files(syllabus_storage_path,tentative_storage_path,trainer_hrd_storage_path,trainer_cv_storage_path)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setCourses([]);
      setIsLoading(false);
      return;
    }

    setCourses((data ?? []).map((r) => mapRowToCourse(r as CourseRow)));
    setIsLoading(false);
  }, []);

  const loadPendingAccess = useCallback(async () => {
    const { data, error } = await supabase
      .from("employer_course_file_access")
      .select("id,employer_user_id,course_id,status,created_at,courses(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setPendingAccess([]);
      return;
    }

    const rows = (data ?? []) as EmployerAccessRow[];
    setPendingAccess(rows);

    const ids = [...new Set(rows.map((r) => r.employer_user_id))];
    if (ids.length === 0) {
      setEmployerNames({});
      return;
    }

    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id,full_name,company_name")
      .in("user_id", ids);

    const map: Record<string, string> = {};
    (profiles ?? []).forEach((p: { user_id: string; full_name: string; company_name: string | null }) => {
      map[p.user_id] = p.company_name
        ? `${p.full_name} (${p.company_name})`
        : p.full_name;
    });
    setEmployerNames(map);
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }
    void loadCourses();
    void loadPendingAccess();
  }, [isAuthorized, loadCourses, loadPendingAccess]);

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
    setPrivateSelections({ ...emptyPrivateSelections });
    setEditingCourseId(null);
  };

  const handlePrivateFileChange = (
    kind: PrivateDocKind,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;
    setPrivateSelections((prev) => ({ ...prev, [kind]: file }));
  };

  const buildMergedPrivatePaths = async (
    courseId: string,
    existing: CoursePrivatePaths | null
  ): Promise<CoursePrivatePaths> => {
    const kinds: PrivateDocKind[] = [
      "syllabus",
      "tentative",
      "trainer_hrd",
      "trainer_cv",
    ];
    const merged: CoursePrivatePaths = {
      syllabus_storage_path: null,
      tentative_storage_path: null,
      trainer_hrd_storage_path: null,
      trainer_cv_storage_path: null,
    };

    for (const kind of kinds) {
      const col = columnForKind(kind) as keyof CoursePrivatePaths;
      const file = privateSelections[kind];
      if (file) {
        try {
          merged[col] = await uploadCoursePrivateFile(courseId, kind, file);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          throw new Error(
            `Private file upload failed (${PRIVATE_DOC_LABELS[kind]}; storage bucket "${COURSE_PRIVATE_BUCKET}", path prefix "${courseId}/${kind}/"): ${msg}`
          );
        }
      } else {
        merged[col] = existing?.[col] ?? null;
      }
    }
    return merged;
  };

  const openPrivateDoc = async (path: string | null | undefined) => {
    if (!path) return;
    try {
      const url = await createSignedUrlForPath(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open file.");
    }
  };

  const approveEmployerAccess = async (id: string, approve: boolean) => {
    setIsSaving(true);
    setErrorMessage(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const reviewer = sessionData.session?.user?.id ?? null;

    const { error } = await supabase
      .from("employer_course_file_access")
      .update({
        status: approve ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
      })
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    await loadPendingAccess();
    setIsSaving(false);
  };

  const uploadPosterIfNeeded = async (): Promise<string | null> => {
    if (!selectedPosterFile) {
      return null;
    }

    const fileExt = selectedPosterFile.name.split(".").pop() || "png";
    const safeExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = `${crypto.randomUUID()}.${safeExt || "png"}`;
    const filePath = `courses/${fileName}`;

    const contentType =
      selectedPosterFile.type ||
      (safeExt === "pdf" ? "application/pdf" : undefined);

    const { error: uploadError } = await supabase.storage
      .from("course-posters")
      .upload(filePath, selectedPosterFile, {
        upsert: false,
        contentType,
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

      let posterUrl: string | null = null;
      try {
        posterUrl = await uploadPosterIfNeeded();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(
          `Poster upload failed (storage bucket "course-posters", path prefix "courses/"): ${msg}`
        );
      }

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
          throw new Error(`Course update failed (table "courses"): ${error.message}`);
        }

        const existingCourse = courses.find((c) => c.id === editingCourseId);
        const mergedPrivate = await buildMergedPrivatePaths(
          editingCourseId,
          existingCourse?.privateFiles ?? null
        );
        if (Object.values(mergedPrivate).some(Boolean)) {
          const { error: pfError } = await supabase.from("course_private_files").upsert(
            {
              course_id: editingCourseId,
              ...mergedPrivate,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "course_id" }
          );
          if (pfError) {
            throw new Error(
              `Private document metadata failed (table "course_private_files"): ${pfError.message}`
            );
          }
        }

        await loadCourses();
        resetForm();
        setIsSaving(false);
        return;
      }

      const { data: inserted, error } = await supabase
        .from("courses")
        .insert({
          name: form.name.trim(),
          date: form.date,
          details: form.details.trim(),
          is_visible: form.isVisible,
          poster_url: posterUrl,
        })
        .select("id")
        .single();

      if (error) {
        const rlsHint = error.message.toLowerCase().includes("row-level security")
          ? " Check RLS: table \"courses\" needs FOR INSERT ... WITH CHECK (public.is_admin()) for role authenticated, and is_admin() must return true for your user."
          : "";
        throw new Error(`Course insert failed (table "courses"): ${error.message}${rlsHint}`);
      }

      if (!inserted?.id) {
        throw new Error("Could not create course.");
      }

      const mergedPrivate = await buildMergedPrivatePaths(inserted.id, null);
      if (Object.values(mergedPrivate).some(Boolean)) {
        const { error: pfError } = await supabase.from("course_private_files").upsert(
          {
            course_id: inserted.id,
            ...mergedPrivate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "course_id" }
        );
        if (pfError) {
          const rlsHint = pfError.message.toLowerCase().includes("row-level security")
            ? " Check RLS on \"course_private_files\" (admin ALL) or storage policies on bucket \"course-private-files\" if the failure was during upload."
            : "";
          throw new Error(
            `Private document metadata failed (table "course_private_files"): ${pfError.message}${rlsHint}`
          );
        }
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
    setPrivateSelections({ ...emptyPrivateSelections });
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
      <SiteHeader />

      <div className="sk-container py-12">
        <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">
          Manage Courses
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
                  accept="image/jpeg,image/png,image/webp,image/gif,.pdf,application/pdf"
                  onChange={handlePosterChange}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                />
                <CoursePosterMedia
                  url={posterPreview}
                  alt="Course poster preview"
                  className="mt-3 aspect-[210/297] w-full max-w-[160px] rounded-lg object-cover"
                  forcePdf={
                    selectedPosterFile
                      ? selectedPosterFile.type === "application/pdf" ||
                        selectedPosterFile.name.toLowerCase().endsWith(".pdf")
                      : false
                  }
                />
              </label>

              <div className="rounded-xl border border-[#efe1db] bg-[#f9f5ed] p-4">
                <p className="text-sm font-semibold text-[#7A1F1F]">
                  Private documents (not on public pages)
                </p>
                <p className="mt-1 text-xs text-black/75">
                  Upload syllabus, trainer documents, etc. Employers can open these only after you approve
                  their access request.
                </p>
                <div className="mt-4 space-y-3">
                  {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => (
                    <label key={kind} className="block">
                      <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                        {PRIVATE_DOC_LABELS[kind]}
                      </span>
                      <input
                        type="file"
                        onChange={(e) => handlePrivateFileChange(kind, e)}
                        className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 text-sm"
                      />
                    </label>
                  ))}
                </div>
              </div>

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
                    <CoursePosterMedia
                      url={course.posterUrl ?? PlaceholderPoster}
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

                      <div className="mt-4 rounded-lg border border-dashed border-[#c5b5ad] bg-[#faf7f2] p-3">
                        <p className="text-xs font-semibold text-[#7A1F1F]">
                          Private files (admin)
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
                                onClick={() => void openPrivateDoc(path)}
                                className="rounded-md border border-[#7A1F1F] bg-white px-2 py-1 text-xs font-semibold text-[#7A1F1F] disabled:cursor-not-allowed disabled:opacity-50"
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
          <h2 className="text-2xl font-bold text-[#7A1F1F]">Employer access to private files</h2>
          <p className="mt-2 text-sm text-black">
            When an employer requests access, approve or reject here. Approved employers can open private
            documents from their dashboard.
          </p>
          <div className="mt-5 space-y-3">
            {pendingAccess.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                No pending requests.
              </p>
            )}
            {pendingAccess.map((req) => {
              const courseName = Array.isArray(req.courses)
                ? req.courses[0]?.name
                : req.courses?.name;
              return (
                <article
                  key={req.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#efe1db] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#0001fc]">{courseName ?? "Course"}</p>
                    <p className="text-sm text-black">
                      {employerNames[req.employer_user_id] ?? req.employer_user_id}
                    </p>
                    <p className="text-xs text-black/60">
                      Requested: {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void approveEmployerAccess(req.id, true)}
                      className="sk-button-primary px-3 py-2"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void approveEmployerAccess(req.id, false)}
                      className="sk-button-secondary px-3 py-2"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="sk-card mt-10 p-6">
          <h2 className="text-2xl font-bold text-[#7A1F1F]">Public Preview</h2>
          <p className="mt-2 text-sm text-black">
            This section simulates what users can see on the public website.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publicCourses.map((course) => (
              <article key={course.id} className="rounded-xl bg-[#f9f5ed] p-4">
                <CoursePosterMedia
                  url={course.posterUrl ?? PlaceholderPoster}
                  alt={`${course.name} poster`}
                  className="mx-auto aspect-[210/297] w-1/2 rounded-lg object-cover"
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

export default AdminManageCourses;
