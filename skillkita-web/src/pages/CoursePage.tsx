import { useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../assets/placeholder.jpg";
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
import { supabase } from "../lib/supabaseClient";

type ViewerRole = "admin" | "employer" | null;

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
};

type CoursePrivatePaths = {
  course_id: string;
  syllabus_storage_path: string | null;
  tentative_storage_path: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_cv_storage_path: string | null;
};

export default function CoursePage() {
  const courseId = useMemo(() => {
    return new URLSearchParams(window.location.search).get("id");
  }, []);

  const [viewerRole, setViewerRole] = useState<ViewerRole>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);

  const [course, setCourse] = useState<CourseRow | null>(null);
  const [privateFiles, setPrivateFiles] = useState<CoursePrivatePaths | null>(null);
  const [accessStatus, setAccessStatus] = useState<"pending" | "approved" | "rejected" | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    const loadViewer = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;

      if (!user) {
        setViewerRole(null);
        setViewerEmail(null);
        setViewerId(null);
        setViewerName("User");
        return;
      }

      setViewerEmail(user.email ?? null);
      setViewerId(user.id);

      const { data: profileRow } = await supabase
        .from("user_profiles")
        .select("role,status,full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profileRow) {
        setViewerRole(null);
        setViewerName("User");
        return;
      }

      const p = profileRow as { role: "admin" | "employer"; status: string; full_name?: string };
      if (p.role === "admin") {
        setViewerRole("admin");
        setViewerName(p.full_name ?? "Admin");
      } else if (p.role === "employer" && p.status === "approved") {
        setViewerRole("employer");
        setViewerName(p.full_name ?? "Employer");
      } else {
        setViewerRole(null);
        setViewerName("User");
      }
    };

    void loadViewer();
  }, []);

  const openPrivateDoc = async (path: string | null | undefined) => {
    if (!path) return;
    setErrorMessage(null);
    try {
      const url = await createSignedUrlForPath(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open file.");
    }
  };

  const loadEmployerAccess = async (employerUserId: string, id: string) => {
    const { data, error } = await supabase
      .from("employer_course_file_access")
      .select("status")
      .eq("employer_user_id", employerUserId)
      .eq("course_id", id)
      .maybeSingle();

    if (error) {
      setAccessStatus(null);
      return;
    }

    const status = (data as { status?: string } | null)?.status ?? null;
    if (status === "pending" || status === "approved" || status === "rejected") {
      setAccessStatus(status);
    } else {
      setAccessStatus(null);
    }
  };

  const loadPrivateFiles = async (id: string) => {
    const { data, error } = await supabase
      .from("course_private_files")
      .select(
        "course_id,syllabus_storage_path,tentative_storage_path,trainer_hrd_storage_path,trainer_cv_storage_path"
      )
      .eq("course_id", id)
      .maybeSingle();

    if (error) {
      setPrivateFiles(null);
      return;
    }
    setPrivateFiles((data as CoursePrivatePaths | null) ?? null);
  };

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) {
        setIsLoading(false);
        setErrorMessage("Missing course id.");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("courses")
        .select(
          "id,name,date,details,trainer_names,course_time,venue,mycoid,price,contact_person,contact_phone,syllabus,poster_url,is_visible"
        )
        .eq("id", courseId)
        .maybeSingle();

      if (error) {
        setCourse(null);
        setIsLoading(false);
        setErrorMessage(error.message);
        return;
      }

      if (!data) {
        setCourse(null);
        setIsLoading(false);
        setErrorMessage("Course not found.");
        return;
      }

      setCourse(data as CourseRow);
      setIsLoading(false);
    };

    void loadCourse();
  }, [courseId]);

  useEffect(() => {
    const loadAccessAndPrivate = async () => {
      if (!courseId) return;
      if (!viewerRole) {
        setAccessStatus(null);
        setPrivateFiles(null);
        return;
      }

      if (viewerRole === "admin") {
        setAccessStatus("approved");
        await loadPrivateFiles(courseId);
        return;
      }

      if (viewerRole === "employer" && viewerId) {
        await loadEmployerAccess(viewerId, courseId);
      }
    };

    void loadAccessAndPrivate();
  }, [courseId, viewerId, viewerRole]);

  useEffect(() => {
    const loadForApprovedEmployer = async () => {
      if (!courseId) return;
      if (viewerRole !== "employer") return;
      if (accessStatus !== "approved") {
        setPrivateFiles(null);
        return;
      }
      await loadPrivateFiles(courseId);
    };
    void loadForApprovedEmployer();
  }, [accessStatus, courseId, viewerRole]);

  const requestAccess = async () => {
    if (!courseId) return;
    if (viewerRole !== "employer" || !viewerId) return;

    setActionBusy(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.from("employer_course_file_access").insert({
        employer_user_id: viewerId,
        course_id: courseId,
        status: "pending",
      });
      if (error) throw new Error(error.message);
      await loadEmployerAccess(viewerId, courseId);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to request access.");
    } finally {
      setActionBusy(false);
    }
  };

  const canViewHidden = viewerRole === "admin";
  const isHidden = course ? !course.is_visible : false;

  const body = (
    <main className="sk-container py-12">
      <div className="text-sm font-semibold text-[#7A1F1F]">
        <a href="/courses" className="underline">
          ← Back to Browse Courses
        </a>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <p className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
          Loading course...
        </p>
      )}

      {!isLoading && course && isHidden && !canViewHidden && (
        <p className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
          This course is currently not available for public viewing.
        </p>
      )}

      {!isLoading && course && (!isHidden || canViewHidden) && (
        <>
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

          {(course.syllabus?.trim() || course.details?.trim()) && (
            <section className="sk-card mt-6 p-6">
              {course.syllabus?.trim() && (
                <div>
                  <h2 className="text-xl font-bold text-[#7A1F1F]">Syllabus</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-black">{course.syllabus}</p>
                </div>
              )}
              {course.details?.trim() && (
                <div className={course.syllabus?.trim() ? "mt-6" : ""}>
                  <h2 className="text-xl font-bold text-[#7A1F1F]">Other information</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-black">{course.details}</p>
                </div>
              )}
            </section>
          )}

          {(viewerRole === "admin" || viewerRole === "employer") && (
            <section className="sk-card mt-6 p-6">
              <h2 className="text-xl font-bold text-[#7A1F1F]">Private documents</h2>

              {viewerRole === "admin" && (
                <p className="mt-2 text-sm text-black/80">
                  As admin, you can open all uploaded private documents for this course.
                </p>
              )}

              {viewerRole === "employer" && (
                <p className="mt-2 text-sm text-black/80">
                  Private documents require admin approval. Request access first, then you can open them here.
                </p>
              )}

              {viewerRole === "employer" && !accessStatus && (
                <div className="mt-4">
                  <button
                    type="button"
                    className="sk-button-primary"
                    disabled={actionBusy}
                    onClick={() => void requestAccess()}
                  >
                    {actionBusy ? "Sending..." : "Request access"}
                  </button>
                </div>
              )}

              {viewerRole === "employer" && accessStatus === "pending" && (
                <p className="mt-4 text-sm font-semibold text-amber-800">Pending admin approval.</p>
              )}

              {viewerRole === "employer" && accessStatus === "rejected" && (
                <p className="mt-4 text-sm font-semibold text-red-800">
                  Your request was rejected. Contact admin for more info.
                </p>
              )}

              {(viewerRole === "admin" || accessStatus === "approved") && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => {
                    const col = columnForKind(kind) as keyof CoursePrivatePaths;
                    const path = privateFiles?.[col];
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
            </section>
          )}
        </>
      )}
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
}