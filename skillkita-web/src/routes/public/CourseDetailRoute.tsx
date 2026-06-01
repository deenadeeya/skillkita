import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { openCourseDocumentUrl } from "../../features/courses/storage/coursePrivateStorage";
import { supabase } from "../../shared/api/supabaseClient";
import { getCourseById, type CourseDetailRow } from "../../features/courses/api/coursesApi";
import {
  getCoursePrivateFilesByCourseId,
  type CoursePrivatePaths,
} from "../../features/courses/api/privateFilesApi";
import { useViewer } from "../../shared/hooks/useViewer";
import { CourseDetailHeader } from "../../features/courses/components/CourseDetailHeader";
import { CourseDetailContent } from "../../features/courses/components/CourseDetailContent";
import { CoursePrivateDocumentsPanel } from "../../features/courses/components/CoursePrivateDocumentsPanel";

type ViewerRole = "admin" | "employer" | null;

export default function CoursePage() {
  const courseId = useMemo(() => {
    return new URLSearchParams(window.location.search).get("id");
  }, []);

  const [viewerRole, setViewerRole] = useState<ViewerRole>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const viewerState = useViewer();

  const [course, setCourse] = useState<CourseDetailRow | null>(null);
  const [privateFiles, setPrivateFiles] = useState<CoursePrivatePaths | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (viewerState.kind === "loading") return;

    if (viewerState.kind === "signedIn") {
      setViewerEmail(viewerState.viewer.email);
      if (viewerState.viewer.role === "admin") {
        setViewerRole("admin");
        setViewerName(viewerState.viewer.fullName || "Admin");
        return;
      }
      if (viewerState.viewer.role === "employer" && viewerState.viewer.status !== "rejected") {
        setViewerRole("employer");
        setViewerName(viewerState.viewer.fullName || "Employer");
        return;
      }
    }

    setViewerRole(null);
    setViewerName("User");
    setViewerEmail(viewerState.kind === "signedInNoProfile" ? viewerState.email : null);
  }, [viewerState]);

  const openPrivateDoc = async (path: string | null | undefined) => {
    if (!path) return;
    setErrorMessage(null);
    try {
      const url = await openCourseDocumentUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open file.");
    }
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
      try {
        const data = await getCourseById(courseId);
        if (!data) {
          setCourse(null);
          setIsLoading(false);
          setErrorMessage("Course not found.");
          return;
        }
        setCourse(data);
        setIsLoading(false);
      } catch (e) {
        setCourse(null);
        setIsLoading(false);
        setErrorMessage(e instanceof Error ? e.message : "Failed to load course.");
      }
    };

    void loadCourse();
  }, [courseId]);

  const canViewHidden = viewerRole === "admin";
  const isHidden = course ? !course.is_visible : false;
  const canViewCourse = Boolean(course && (!isHidden || canViewHidden));

  useEffect(() => {
    const loadDocuments = async () => {
      if (!courseId || !canViewCourse) {
        setPrivateFiles(null);
        return;
      }
      try {
        const data = await getCoursePrivateFilesByCourseId(courseId);
        setPrivateFiles(data);
      } catch {
        setPrivateFiles(null);
      }
    };

    void loadDocuments();
  }, [canViewCourse, courseId]);

  const heroTitle = course?.name?.trim() || "Course details";

  const body = (
    <div className="w-full pb-8">
      <a
        href="/courses"
        className="inline-flex min-h-[44px] items-center text-sm font-semibold text-primary transition hover:underline"
      >
        ← Back to courses
      </a>

      <section className="mt-4 rounded-hero bg-primary px-6 py-10 text-center sm:px-10 sm:py-12">
        <h1 className="sk-heading-2 text-white">{heroTitle}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-white/90">
          Schedule, venue, syllabus, and downloadable materials for this programme.
        </p>
      </section>

      {errorMessage && (
        <div className="mt-6 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="mt-10 space-y-6">
          <div className="sk-card h-64 animate-pulse bg-white/80" />
          <div className="sk-card h-40 animate-pulse bg-white/80" />
        </div>
      )}

      {!isLoading && course && isHidden && !canViewHidden && (
        <p className="mt-10 rounded-hero border border-dashed border-primary/20 bg-white p-10 text-center text-ink-muted">
          This course is currently not available for public viewing.
        </p>
      )}

      {!isLoading && canViewCourse && course && (
        <>
          <CourseDetailHeader course={course} />
          <CourseDetailContent course={course} />
          <CoursePrivateDocumentsPanel
            privateFiles={privateFiles}
            onOpenPrivateDoc={(path) => void openPrivateDoc(path)}
          />
        </>
      )}

      
    </div>
  );

  const logout = async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem("skillkita-role");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen w-full bg-paper">
      {viewerRole ? (
        <DashboardLayout
          showHeader
          fullWidth
          items={viewerRole === "admin" ? adminNavItems : employerNavItems}
          userName={viewerName}
          userEmail={viewerEmail}
          onLogout={logout}
        >
          {body}
        </DashboardLayout>
      ) : (
        <>
          <SiteHeader />
          <main className="sk-page-container">{body}</main>
        </>
      )}
    </div>
  );
}
