import { useEffect, useMemo, useState } from "react";
import { supabase } from "../shared/api/supabaseClient";
import DashboardLayout from "../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../app/layout/navItems";
import SiteHeader from "../app/layout/SiteHeader";
import { createSignedUrlForPath } from "../lib/coursePrivateStorage";
import { listVisibleCourses } from "../features/courses/api/coursesApi";
import {
  listCoursePrivateFilesByCourseIds,
  listEmployerAccessRows,
  requestCoursePrivateFilesAccess,
  type CoursePrivatePaths,
} from "../features/courses/api/privateFilesApi";
import { useViewer } from "../shared/hooks/useViewer";
import { CoursesGrid } from "../features/courses/components/CoursesGrid";
import { CoursesSearchBar } from "../features/courses/components/CoursesSearchBar";
import { EmployerPrivateAccessPanel } from "../features/courses/components/EmployerPrivateAccessPanel";

type PublicCourse = {
  id: string;
  name: string;
  date: string;
  details: string;
  posterUrl: string | null;
};

const ViewCourses = () => {
  const [publicCourses, setPublicCourses] = useState<PublicCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const viewerState = useViewer();

  const [accessByCourse, setAccessByCourse] = useState<
    Record<string, "pending" | "approved" | "rejected" | undefined>
  >({});
  const [privateByCourse, setPrivateByCourse] = useState<
    Record<string, CoursePrivatePaths | null>
  >({});
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (viewerState.kind === "loading") return;

    if (viewerState.kind === "signedIn") {
      setViewerEmail(viewerState.viewer.email);
      if (viewerState.viewer.role === "admin") {
        setViewerRole("admin");
        setViewerName(viewerState.viewer.fullName || "Admin");
        setAccessByCourse({});
        setPrivateByCourse({});
        return;
      }
      if (viewerState.viewer.role === "employer" && viewerState.viewer.status === "approved") {
        setViewerRole("employer");
        setViewerName(viewerState.viewer.fullName || "Employer");
        void loadEmployerPrivateAccess(viewerState.viewer.userId);
        return;
      }
    }

    // anonymous, no profile, or employer not approved
    setViewerRole(null);
    setViewerName("User");
    setViewerEmail(viewerState.kind === "signedInNoProfile" ? viewerState.email : null);
    setAccessByCourse({});
    setPrivateByCourse({});
  }, [viewerState]);

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const rows = await listVisibleCourses();
        setPublicCourses(
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            date: row.date,
            details: row.details,
            posterUrl: row.poster_url,
          }))
        );
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Failed to load courses.");
        setPublicCourses([]);
      } finally {
        setIsLoading(false);
      }
    };
    void loadCourses();
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
    if (viewerState.kind !== "signedIn") return;
    if (viewerState.viewer.role !== "employer") return;
    if (viewerState.viewer.status !== "approved") return;
    const uid = viewerState.viewer.userId;

    setActionId(courseId);
    setErrorMessage(null);
    try {
      await requestCoursePrivateFilesAccess({ employerUserId: uid, courseId });
      await loadEmployerPrivateAccess(uid);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to request access.");
    } finally {
      setActionId(null);
    }
  };

  const loadEmployerPrivateAccess = async (userId: string) => {
    const map: Record<string, "pending" | "approved" | "rejected"> = {};
    try {
      const accessRows = await listEmployerAccessRows(userId);
      accessRows.forEach((r) => {
        map[r.course_id] = r.status;
      });
      setAccessByCourse(map);

      const approvedIds = Object.entries(map)
        .filter(([, s]) => s === "approved")
        .map(([id]) => id);

      if (approvedIds.length === 0) {
        setPrivateByCourse({});
        return;
      }

      const pfRows = await listCoursePrivateFilesByCourseIds(approvedIds);
      const pfMap: Record<string, CoursePrivatePaths | null> = {};
      pfRows.forEach((row) => {
        pfMap[row.course_id] = row;
      });
      setPrivateByCourse(pfMap);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to load private access.");
      setAccessByCourse({});
      setPrivateByCourse({});
    }
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
        <EmployerPrivateAccessPanel
          isLoading={isLoading}
          courses={employerCourses}
          accessByCourse={accessByCourse}
          privateByCourse={privateByCourse}
          actionId={actionId}
          onRequestAccess={(courseId) => void requestAccess(courseId)}
          onOpenPrivateDoc={(path) => void openPrivateDoc(path)}
        />
      )}

      <CoursesSearchBar
        value={courseSearch}
        onChange={setCourseSearch}
        filteredCount={filteredCourses.length}
        totalCount={publicCourses.length}
      />

      <CoursesGrid
        courses={filteredCourses}
        isLoading={isLoading}
        errorMessage={errorMessage}
        totalPublicCount={publicCourses.length}
        onOpenCourse={(courseId) => {
          window.location.href = `/courses/view?id=${encodeURIComponent(courseId)}`;
        }}
      />
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