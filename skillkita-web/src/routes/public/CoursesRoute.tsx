import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { supabase } from "../../shared/api/supabaseClient";
import { listVisibleCourses } from "../../features/courses/api/coursesApi";
import { useViewer } from "../../shared/hooks/useViewer";
import { CoursesGrid } from "../../features/courses/components/CoursesGrid";
import { CoursesSearchBar } from "../../features/courses/components/CoursesSearchBar";

type PublicCourse = {
  id: string;
  name: string;
  date: string | null;
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
      const haystack = `${c.name}\n${c.details}\n${c.date ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [courseSearch, publicCourses]);

  const body = (
    <main className="sk-container py-12">
      <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">
        Available Courses
      </h1>
      <p className="mt-3 text-lg text-black md:text-xl">
        Browse training programs that are currently available. Open a course to view details and
        download syllabus, tentative schedule, and trainer documents.
      </p>
      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
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
