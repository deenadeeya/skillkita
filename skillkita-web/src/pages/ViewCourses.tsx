import { useEffect, useState } from "react";
import PlaceholderPoster from "../assets/placeholder.jpg";
import { supabase } from "../lib/supabaseClient";
import { CoursePosterMedia } from "../components/CoursePosterMedia";
import DashboardLayout from "../components/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../components/layout/navItems";
import SiteHeader from "../components/layout/SiteHeader";

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

const ViewCourses = () => {
  const [publicCourses, setPublicCourses] = useState<PublicCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);

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

        if (profileRow) {
          const r = profileRow as { role: "admin" | "employer"; status: string; full_name?: string };
          if (r.role === "admin") {
            setViewerRole("admin");
            setViewerName(r.full_name ?? "Admin");
          } else if (r.role === "employer" && r.status === "approved") {
            setViewerRole("employer");
            setViewerName(r.full_name ?? "Employer");
          } else {
            setViewerRole(null);
          }
        } else {
          setViewerRole(null);
        }
      } else {
        setViewerRole(null);
        setViewerEmail(null);
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

      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {isLoading && (
          <p className="col-span-full rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
            Loading courses...
          </p>
        )}
        {publicCourses.map((course) => (
          <article key={course.id} className="sk-card overflow-hidden p-3 md:p-4">
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
        {!isLoading && publicCourses.length === 0 && !errorMessage && (
          <p className="col-span-full rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
            No public courses available right now.
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