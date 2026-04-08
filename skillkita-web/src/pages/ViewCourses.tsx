import { useEffect, useState } from "react";
import PlaceholderPoster from "../assets/placeholder.jpg";
import { supabase } from "../lib/supabaseClient";
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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

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

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader
        menuLinks={[
          { label: "Home", href: "/" },
          { label: "View Courses", href: "/courses" },
        ]}
      />

      <main className="sk-container py-12">
        <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">
          Available Courses
        </h1>
        <p className="mt-3 text-lg text-black md:text-xl">
          Browse our current public training programs.
        </p>
        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading && (
            <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
              Loading courses...
            </p>
          )}
          {publicCourses.map((course) => (
            <article key={course.id} className="sk-card overflow-hidden p-4">
              <img
                src={course.posterUrl ?? PlaceholderPoster}
                alt={`${course.name} poster`}
                className="aspect-[210/297] w-full rounded-lg object-cover"
              />
              <h2 className="mt-4 text-xl font-semibold text-[#0001fc]">
                {course.name}
              </h2>
              <p className="mt-2 text-sm font-medium text-[#7A1F1F]">
                Date: {course.date}
              </p>
              <p className="mt-2 text-sm text-black">{course.details}</p>
            </article>
          ))}
          {!isLoading && publicCourses.length === 0 && !errorMessage && (
            <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
              No public courses available right now.
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

export default ViewCourses;