import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { supabase } from "../../shared/api/supabaseClient";
import { listVisibleCourses } from "../../features/courses/api/coursesApi";
import { compareCoursesUpcomingFirst } from "../../features/courses/courseDate";
import { CoursesGrid } from "../../features/courses/components/CoursesGrid";
import { CoursesSearchBar } from "../../features/courses/components/CoursesSearchBar";
import { CourseQuotationBanner } from "../../features/courses/components/CourseQuotationBanner";
import { useViewer } from "../../shared/hooks/useViewer";

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

  const sortedCourses = useMemo(
    () => [...publicCourses].sort(compareCoursesUpcomingFirst),
    [publicCourses]
  );

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return sortedCourses;
    return sortedCourses.filter((c) => {
      const haystack = `${c.name}\n${c.details}\n${c.date ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [courseSearch, sortedCourses]);

  const body = (
    <div className="w-full pb-8">
      <CourseQuotationBanner viewerRole={viewerRole} variant="browse" />

      <section className="mt-6 rounded-hero bg-primary px-6 py-12 text-center sm:px-10 sm:py-14">
        <h1 className="sk-heading-1 text-white">Available Courses</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
          Browse training programmes currently open for registration. Open a course to view
          schedules, venue details, and download syllabus and trainer documents.
        </p>
      </section>

      {errorMessage && (
        <div className="mt-6 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="mt-16 sm:mt-20">
        <div className="text-center">
          <h2 className="sk-heading-2 text-ink">Training programmes</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-muted">
            Upcoming courses are listed first. Use search to filter by name, date, or description.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <CoursesSearchBar
            value={courseSearch}
            onChange={setCourseSearch}
            filteredCount={filteredCourses.length}
            totalCount={publicCourses.length}
          />
        </div>

        <CoursesGrid
          courses={filteredCourses}
          isLoading={isLoading}
          errorMessage={errorMessage}
          totalPublicCount={publicCourses.length}
          onOpenCourse={(courseId) => {
            window.location.href = `/courses/view?id=${encodeURIComponent(courseId)}`;
          }}
        />
      </section>

     
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
};

export default ViewCourses;
