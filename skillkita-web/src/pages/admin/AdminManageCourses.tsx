import { useCallback, useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../../assets/placeholder.jpg";
import { CoursePosterMedia } from "../../components/CoursePosterMedia";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { adminNavItems } from "../../components/layout/navItems";
import {
    PRIVATE_DOC_LABELS,
    columnForKind,
    createSignedUrlForPath,
    type PrivateDocKind,
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
  trainerNames: string;
  time: string;
  venue: string;
  mycoid: string;
  price: string;
  contactPerson: string;
  contactPhone: string;
  syllabus: string;
  details: string;
  posterUrl: string | null;
  isVisible: boolean;
  privateFiles: CoursePrivatePaths | null;
};

// NOTE: course create/update form moved to `AdminCreateCourse.tsx`

type CourseRow = {
  id: string;
  name: string;
  date: string;
  details: string;
  trainer_names: string | null;
  course_time: string | null;
  venue: string | null;
  mycoid: string | null;
  price: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  syllabus: string | null;
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
    trainerNames: row.trainer_names ?? "",
    time: row.course_time ?? "",
    venue: row.venue ?? "",
    mycoid: row.mycoid ?? "",
    price: row.price ?? "",
    contactPerson: row.contact_person ?? "",
    contactPhone: row.contact_phone ?? "",
    syllabus: row.syllabus ?? "",
    details: row.details,
    posterUrl: row.poster_url,
    isVisible: row.is_visible,
    privateFiles: normalizePrivateFiles(row.course_private_files),
  };
}

const AdminManageCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingAccess, setPendingAccess] = useState<EmployerAccessRow[]>([]);
  const [employerNames, setEmployerNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState("");

  const publicCourses = useMemo(
    () => courses.filter((course) => course.isVisible),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const haystack =
        `${c.name}\n${c.trainerNames}\n${c.venue}\n${c.mycoid}\n${c.contactPerson}\n${c.contactPhone}\n${c.details}\n${c.syllabus}\n${c.date}\n${c.time}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [courseSearch, courses]);

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

      setAdminEmail(user.email ?? null);

      const { data: profileRow, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name")
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
      setAdminName((profileRow as { full_name?: string }).full_name ?? "Admin");
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
        "id,name,date,details,trainer_names,course_time,venue,mycoid,price,contact_person,contact_phone,syllabus,poster_url,is_visible,created_at,course_private_files(syllabus_storage_path,tentative_storage_path,trainer_hrd_storage_path,trainer_cv_storage_path)"
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

  const goToCreateCourse = () => {
    window.location.href = "/admin/courses/create";
  };

  const goToEditCourse = (courseId: string) => {
    window.location.href = `/admin/courses/edit?id=${encodeURIComponent(courseId)}`;
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
    <DashboardLayout
      items={adminNavItems}
      userName={adminName}
      userEmail={adminEmail}
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
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

        <div
          className={`mt-10 space-y-8 ${!isAuthorized ? "opacity-60 pointer-events-none" : ""}`}
        >
          <section className="sk-card p-6">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">
              Employer access to private files
            </h2>
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

          <section className="sk-card p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#7A1F1F]">Course creation</h2>
                <p className="mt-2 text-sm text-black">
                  Create new courses on a dedicated page (with OCR and private documents).
                </p>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={goToCreateCourse}
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
                {courses.length} total / {publicCourses.length} public
              </p>
            </div>

            <div className="mt-4">
              <input
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
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
                  course.privateFiles &&
                    Object.values(course.privateFiles).some((v) => Boolean(v))
                );
                return (
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

                      <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-black/80 md:grid-cols-2">
                        <p>
                          <span className="font-semibold text-[#7A1F1F]">Date:</span>{" "}
                          {course.date}
                        </p>
                        <p>
                          <span className="font-semibold text-[#7A1F1F]">Time:</span>{" "}
                          {course.time || "—"}
                        </p>
                        <p className="md:col-span-2">
                          <span className="font-semibold text-[#7A1F1F]">Venue:</span>{" "}
                          {course.venue || "—"}
                        </p>
                        <p className="md:col-span-2">
                          <span className="font-semibold text-[#7A1F1F]">Trainer:</span>{" "}
                          {course.trainerNames || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-[#7A1F1F]">MyCOID:</span>{" "}
                          {course.mycoid || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-[#7A1F1F]">Price:</span>{" "}
                          {course.price || "—"}
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
                          hasAnyPrivateFile
                            ? "border-[#c5b5ad] bg-[#faf7f2]"
                            : "border-gray-300 bg-gray-100",
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
                                onClick={() => void openPrivateDoc(path)}
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
                          onClick={() => goToEditCourse(course.id)}
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
              );
              })}
              {!isLoading && filteredCourses.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                  No courses match your search.
                </p>
              )}
            </div>
          </section>
        </div>
    </DashboardLayout>
  );
};

export default AdminManageCourses;
