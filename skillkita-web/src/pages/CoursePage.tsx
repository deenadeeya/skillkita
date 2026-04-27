import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../app/layout/navItems";
import SiteHeader from "../app/layout/SiteHeader";
import { createSignedUrlForPath } from "../lib/coursePrivateStorage";
import { supabase } from "../shared/api/supabaseClient";
import { getCourseById, type CourseDetailRow } from "../features/courses/api/coursesApi";
import {
  getCoursePrivateFilesByCourseId,
  getEmployerAccessStatus,
  requestCoursePrivateFilesAccess,
  type CoursePrivatePaths,
} from "../features/courses/api/privateFilesApi";
import { useViewer } from "../shared/hooks/useViewer";
import { CourseDetailHeader } from "../features/courses/components/CourseDetailHeader";
import { CourseDetailContent } from "../features/courses/components/CourseDetailContent";
import { CoursePrivateDocumentsPanel } from "../features/courses/components/CoursePrivateDocumentsPanel";

type ViewerRole = "admin" | "employer" | null;

export default function CoursePage() {
  const courseId = useMemo(() => {
    return new URLSearchParams(window.location.search).get("id");
  }, []);

  const [viewerRole, setViewerRole] = useState<ViewerRole>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const viewerState = useViewer();

  const [course, setCourse] = useState<CourseDetailRow | null>(null);
  const [privateFiles, setPrivateFiles] = useState<CoursePrivatePaths | null>(null);
  const [accessStatus, setAccessStatus] = useState<"pending" | "approved" | "rejected" | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (viewerState.kind === "loading") return;

    if (viewerState.kind === "signedIn") {
      setViewerEmail(viewerState.viewer.email);
      setViewerId(viewerState.viewer.userId);
      if (viewerState.viewer.role === "admin") {
        setViewerRole("admin");
        setViewerName(viewerState.viewer.fullName || "Admin");
        return;
      }
      if (viewerState.viewer.role === "employer" && viewerState.viewer.status === "approved") {
        setViewerRole("employer");
        setViewerName(viewerState.viewer.fullName || "Employer");
        return;
      }
    }

    setViewerRole(null);
    setViewerName("User");
    setViewerId(null);
    setViewerEmail(viewerState.kind === "signedInNoProfile" ? viewerState.email : null);
  }, [viewerState]);

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
    try {
      const status = await getEmployerAccessStatus({ employerUserId, courseId: id });
      if (status === "pending" || status === "approved" || status === "rejected") {
        setAccessStatus(status);
      } else {
        setAccessStatus(null);
      }
    } catch {
      setAccessStatus(null);
    }
  };

  const loadPrivateFiles = async (id: string) => {
    try {
      const data = await getCoursePrivateFilesByCourseId(id);
      setPrivateFiles(data);
    } catch {
      setPrivateFiles(null);
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
      await requestCoursePrivateFilesAccess({ employerUserId: viewerId, courseId });
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
          <CourseDetailHeader course={course} />
          <CourseDetailContent course={course} />

          {(viewerRole === "admin" || viewerRole === "employer") && (
            <CoursePrivateDocumentsPanel
              viewerRole={viewerRole}
              accessStatus={accessStatus}
              privateFiles={privateFiles}
              actionBusy={actionBusy}
              onRequestAccess={() => void requestAccess()}
              onOpenPrivateDoc={(path) => void openPrivateDoc(path)}
            />
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