import { useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../assets/placeholder.jpg";
import { supabase } from "../lib/supabaseClient";
import { CoursePosterMedia } from "../components/CoursePosterMedia";
import DashboardLayout from "../components/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../components/layout/navItems";
import SiteHeader from "../components/layout/SiteHeader";
import {
  PRIVATE_DOC_LABELS,
  columnForKind,
  createSignedUrlForPath,
  type PrivateDocKind,
} from "../lib/coursePrivateStorage";

type PublicCourse = {
  id: string;
  name: string;
  date: string;
  details: string;
  posterUrl: string | null;
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

type CoursePrivatePaths = {
  syllabus_storage_path: string | null;
  tentative_storage_path: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_cv_storage_path: string | null;
};

const ViewCourses = () => {
  const [publicCourses, setPublicCourses] = useState<PublicCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState("");

  const [accessByCourse, setAccessByCourse] = useState<
    Record<string, "pending" | "approved" | "rejected" | undefined>
  >({});
  const [privateByCourse, setPrivateByCourse] = useState<
    Record<string, CoursePrivatePaths | null>
  >({});
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;

      if (user) {
        setViewerEmail(user.email ?? null);
        const { data: profileRow } = await supabase
          .from("user_profiles")
          .select("role,status,full_name")
          .eq("user_id", user.id)
          .maybeSingle();

        let isEmployerApproved = false;
        if (profileRow) {
          const r = profileRow as { role: "admin" | "employer"; status: string; full_name?: string };
          if (r.role === "admin") {
            setViewerRole("admin");
            setViewerName(r.full_name ?? "Admin");
          } else if (r.role === "employer" && r.status === "approved") {
            setViewerRole("employer");
            setViewerName(r.full_name ?? "Employer");
            isEmployerApproved = true;
          } else {
            setViewerRole(null);
          }
        } else {
          setViewerRole(null);
        }

        if (isEmployerApproved) {
          await loadEmployerPrivateAccess(user.id);
        } else {
          setAccessByCourse({});
          setPrivateByCourse({});
        }
      } else {
        setViewerRole(null);
        setViewerEmail(null);
        setAccessByCourse({});
        setPrivateByCourse({});
      }

      const { data, error } = await supabase
        .from("courses")
        .select("id,name,date,details,poster_url,is_visible,created_at")
        .eq("is_visible", true)
        .order("date", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setPublicCourses([]);
        setIsLoading(false);
        return;
      }

      setPublicCourses(
        (data ?? []).map((row: CourseRow) => ({
          id: row.id,
          name: row.name,
          date: row.date,
          details: row.details,
          posterUrl: row.poster_url,
        }))
      );

      setIsLoading(false);
    };

    void load();
  }, []);

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return publicCourses;
    return publicCourses.filter((c) => {
      const haystack = `${c.name}\n${c.details}\n${c.date}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [courseSearch, publicCourses]);

  const employerCourses = useMemo(() => {
    return publicCourses.map((c) => ({ id: c.id, name: c.name, date: c.date }));
  }, [publicCourses]);

  const openPrivateDoc = async (path: string | null | undefined) => {
    if (!path) return;
    try {
      const url = await createSignedUrlForPath(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open file.");
    }
  };

  const requestAccess = async (courseId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return;

    setActionId(courseId);
    setErrorMessage(null);

    const { error } = await supabase.from("employer_course_file_access").insert({
      employer_user_id: uid,
      course_id: courseId,
      status: "pending",
    });

    setActionId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadEmployerPrivateAccess(uid);
  };

  const loadEmployerPrivateAccess = async (userId: string) => {
    const { data: accessRows, error: aErr } = await supabase
      .from("employer_course_file_access")
      .select("course_id,status")
      .eq("employer_user_id", userId);

    if (aErr) {
      setErrorMessage(aErr.message);
    }

    const map: Record<string, "pending" | "approved" | "rejected"> = {};
    (accessRows ?? []).forEach((r: { course_id: string; status: string }) => {
      map[r.course_id] = r.status as "pending" | "approved" | "rejected";
    });
    setAccessByCourse(map);

    const approvedIds = Object.entries(map)
      .filter(([, s]) => s === "approved")
      .map(([id]) => id);

    if (approvedIds.length === 0) {
      setPrivateByCourse({});
      return;
    }

    const { data: pfRows, error: pErr } = await supabase
      .from("course_private_files")
      .select(
        "course_id,syllabus_storage_path,tentative_storage_path,trainer_hrd_storage_path,trainer_cv_storage_path"
      )
      .in("course_id", approvedIds);

    if (pErr) {
      setErrorMessage(pErr.message);
      setPrivateByCourse({});
      return;
    }

    const pfMap: Record<string, CoursePrivatePaths | null> = {};
    (pfRows ?? []).forEach((row: CoursePrivatePaths & { course_id: string }) => {
      pfMap[row.course_id] = {
        syllabus_storage_path: row.syllabus_storage_path,
        tentative_storage_path: row.tentative_storage_path,
        trainer_hrd_storage_path: row.trainer_hrd_storage_path,
        trainer_cv_storage_path: row.trainer_cv_storage_path,
      };
    });
    setPrivateByCourse(pfMap);
  };

  const body = (
    <main className="sk-container py-12">
      <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">
        Available Courses
      </h1>
      <p className="mt-3 text-lg text-black md:text-xl">
        Browse training programs that is currently available. Log in to contact us for more information regarding the courses.
      </p>
      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {viewerRole === "employer" && (
        <section className="sk-card mt-8 p-6">
          <h2 className="text-xl font-bold text-[#7A1F1F]">Courses (private files access)</h2>
          <p className="mt-2 text-sm text-black/80">
            Request access to private course documents (tentativesyllabus, trainer files). An admin must approve
            before you can open them.
          </p>

          {isLoading && (
            <p className="mt-4 text-sm text-black">Loading...</p>
          )}
          {!isLoading && (
            <ul className="mt-4 space-y-4">
              {employerCourses.map((c) => {
                const status = accessByCourse[c.id];
                const priv = privateByCourse[c.id];
                return (
                  <li
                    key={c.id}
                    className="rounded-xl border border-[#efe1db] bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#0001fc]">{c.name}</h3>
                        <p className="mt-1 text-xs text-black/70">
                          Status:{" "}
                          <span
                            className={
                              status === "approved"
                                ? "font-bold text-green-800"
                                : status === "rejected"
                                  ? "font-bold text-red-800"
                                  : "font-semibold text-black/80"
                            }
                          >
                            {status === "approved"
                              ? "Approved — you can open private files below"
                              : status === "pending"
                                ? "Pending admin approval"
                                : status === "rejected"
                                  ? "Rejected"
                                  : "No request yet"}
                          </span>
                        </p>
                      </div>
                      {!status && (
                        <button
                          type="button"
                          disabled={actionId === c.id}
                          onClick={() => void requestAccess(c.id)}
                          className="sk-button-primary shrink-0 self-start"
                        >
                          {actionId === c.id ? "Sending..." : "Request access to private files"}
                        </button>
                      )}
                      {status === "pending" && (
                        <span className="text-sm font-semibold text-amber-800">Waiting for admin</span>
                      )}
                    </div>

                    {status === "approved" && priv && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#efe1db] pt-4">
                        {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => {
                          const col = columnForKind(kind) as keyof CoursePrivatePaths;
                          const path = priv[col];
                          return (
                            <button
                              key={kind}
                              type="button"
                              disabled={!path}
                              onClick={() => void openPrivateDoc(path)}
                              className="rounded-md border border-[#7A1F1F] bg-[#f9f5ed] px-3 py-1.5 text-xs font-semibold text-[#7A1F1F] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {path ? `Open ${PRIVATE_DOC_LABELS[kind]}` : `${PRIVATE_DOC_LABELS[kind]} (n/a)`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!isLoading && employerCourses.length === 0 && (
            <p className="mt-4 text-sm text-black">No public courses listed yet.</p>
          )}
        </section>
      )}

      <div className="mt-6">
        <input
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
          placeholder="Search courses by name, date, or details..."
          className="w-full rounded-xl border border-[#d8c9c2] bg-white px-4 py-2 text-sm text-black outline-none focus:border-[#7A1F1F]"
        />
        <p className="mt-2 text-xs font-semibold text-black/60">
          Showing {filteredCourses.length} of {publicCourses.length}
        </p>
      </div>

      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {isLoading && (
          <p className="col-span-full rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
            Loading courses...
          </p>
        )}
        {filteredCourses.map((course) => (
          <article
            key={course.id}
            className="sk-card overflow-hidden p-3 md:p-4 cursor-pointer transition hover:shadow-md focus-within:ring-2 focus-within:ring-[#7A1F1F]/30"
            role="link"
            tabIndex={0}
            onClick={() => {
              window.location.href = `/courses/view?id=${encodeURIComponent(course.id)}`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                window.location.href = `/courses/view?id=${encodeURIComponent(course.id)}`;
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
            <p className="mt-1 text-xs text-black md:mt-2 md:text-sm">
              {course.details}
            </p>
          </article>
        ))}
        {!isLoading && filteredCourses.length === 0 && !errorMessage && (
          <p className="col-span-full rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
            {publicCourses.length === 0
              ? "No public courses available right now."
              : "No courses match your search."}
          </p>
        )}
      </section>
    </main>
  );

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      {viewerRole ? (
        <DashboardLayout
          showHeader
          items={viewerRole === "admin" ? adminNavItems : employerNavItems}
          userName={viewerName}
          userEmail={viewerEmail}
          onLogout={async () => {
            await supabase.auth.signOut();
            window.localStorage.removeItem("skillkita-role");
            window.location.href = "/";
          }}
        >
          {body}
        </DashboardLayout>
      ) : (
        <>
          <SiteHeader />
          {body}
        </>
      )}
    </div>
  );
};

export default ViewCourses;