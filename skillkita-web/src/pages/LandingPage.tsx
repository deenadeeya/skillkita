import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../assets/placeholder.jpg";
import TRSCGroupPhoto from "../assets/TRSCGroupPhoto.png";
import { CoursePosterMedia } from "../components/CoursePosterMedia";
import SiteHeader from "../components/layout/SiteHeader";
import { supabase } from "../lib/supabaseClient";

const LandingPage = () => {
  type LandingContentRow = {
    id: number;
    cover_description: string;
    who_image_url: string | null;
    who_description: string;
    updated_at: string;
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

  type ExperienceRow = {
    id: string;
    name: string;
    date: string;
    details: string;
    photo_urls: string[] | null;
    created_at: string;
  };

  const [coverDescription, setCoverDescription] = useState(
    "Offering HRD-Corp Levy Claimable Training Courses"
  );
  const [whoImageUrl, setWhoImageUrl] = useState<string>(TRSCGroupPhoto);
  const [whoDescription, setWhoDescription] = useState(
    "TAWAU RESOURCES & SKILLS CENTRE is a Bumiputera Company. This company has been registered under the Trade License Ordinance 1948 in 2023 in the field of services and learning activities.\n\nThis company has also been registered with the Ministry of Finance (MoF) in 2023 as a Welding Competency Assessment (Accreditation) Centre for CIDB"
  );

  const [upcomingCourses, setUpcomingCourses] = useState<CourseRow[]>([]);
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeCourseIndex, setActiveCourseIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [landingRes, coursesRes, expRes] = await Promise.all([
          supabase
            .from("landing_content")
            .select("id,cover_description,who_image_url,who_description,updated_at")
            .eq("id", 1)
            .maybeSingle(),
          supabase
            .from("courses")
            .select("id,name,date,details,poster_url,is_visible,created_at")
            .eq("is_visible", true)
            .gte("date", new Date().toISOString().slice(0, 10))
            .order("date", { ascending: true })
            .limit(8),
          supabase
            .from("experiences")
            .select("id,name,date,details,photo_urls,created_at")
            .order("date", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

        if (landingRes.error) throw new Error(landingRes.error.message);
        if (coursesRes.error) throw new Error(coursesRes.error.message);
        if (expRes.error) throw new Error(expRes.error.message);

        const landing = landingRes.data as LandingContentRow | null;
        if (landing) {
          setCoverDescription(landing.cover_description ?? coverDescription);
          setWhoImageUrl(landing.who_image_url ?? TRSCGroupPhoto);
          setWhoDescription(landing.who_description ?? whoDescription);
        }

        setUpcomingCourses((coursesRes.data ?? []) as CourseRow[]);
        setExperiences((expRes.data ?? []) as ExperienceRow[]);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        setErrorMessage(err instanceof Error ? err.message : "Failed to load landing page.");
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showPreviousCourse = () => {
    setActiveCourseIndex((prev) =>
      prev === 0 ? upcomingCourses.length - 1 : prev - 1
    );
  };

  const showNextCourse = () => {
    setActiveCourseIndex((prev) =>
      prev === upcomingCourses.length - 1 ? 0 : prev + 1
    );
  };

  const activeCourse = upcomingCourses[activeCourseIndex];
  const activeCoursePoster = activeCourse?.poster_url ?? PlaceholderPoster;

  const whoParagraphs = useMemo(
    () =>
      whoDescription
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [whoDescription]
  );

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader />

      <main className="sk-container flex w-full flex-col items-center py-12 text-center">
        <h1 className="mb-6 mt-16 text-4xl font-bold text-[#0001fc] md:mt-20 md:text-6xl">
          Tawau Resources & Skills Centre
        </h1>

        <p className="text-lg text-black md:text-xl">{coverDescription}</p>
        {errorMessage && (
          <div className="mt-6 w-full max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-12 flex flex-row items-center justify-center gap-4">
          <a href="#who-are-we" className="sk-button-primary rounded-xl px-6 py-3">
            Who Are We
          </a>
          <a
            href="/courses"
            className="sk-button-primary rounded-xl px-6 py-3"
          >
            Show All Courses
          </a>
        </div>

        <h2
          id="who-are-we"
          className="mb-12 mt-36 text-2xl font-bold text-[#0001fc] md:text-4xl"
        >
          Who Are We
        </h2>
        <div className="mt-2 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <img
            src={whoImageUrl}
            alt="TRSC group photo"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="mt-4 w-full max-w-3xl text-left">
          {whoParagraphs.map((p) => (
            <p key={p.slice(0, 32)} className="mt-4 text-lg text-black md:text-xl">
              {p}
            </p>
          ))}
        </div>

        <h2
          id="upcoming-courses"
          className="mt-24 text-2xl font-bold text-[#0001fc] md:text-4xl"
        >
          Upcoming Courses
        </h2>

        <div className="mt-8 w-full max-w-5xl">
          <div className="flex items-center justify-center gap-3 md:gap-6">
            <button
              type="button"
              aria-label="Show previous upcoming course"
              onClick={showPreviousCourse}
              disabled={upcomingCourses.length === 0}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F] text-white shadow-md transition hover:bg-[#5f1818] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:ring-offset-2"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>

            <article className="w-full max-w-md rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
              <p className="text-sm font-semibold text-[#7A1F1F]">
                {activeCourse ? `Date: ${activeCourse.date}` : "No upcoming courses yet."}
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#0001fc] md:text-xl">
                {activeCourse?.name ?? "Check back soon"}
              </h3>
              <p className="mt-2 text-sm text-black md:text-base">
                {activeCourse?.details ??
                  "New courses will appear here once published in the admin dashboard."}
              </p>
              <CoursePosterMedia
                url={activeCoursePoster}
                alt={`${activeCourse?.name ?? "Course"} poster`}
                className="mt-4 aspect-[210/297] w-full rounded-xl object-cover"
              />
            </article>

            <button
              type="button"
              aria-label="Show next upcoming course"
              onClick={showNextCourse}
              disabled={upcomingCourses.length === 0}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F] text-white shadow-md transition hover:bg-[#5f1818] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:ring-offset-2"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <a
          href="/courses"
          className="sk-button-primary mt-10 rounded-xl px-6 py-3"
        >
          Show All Courses
        </a>

        <h2 id="courses" className="mt-24 text-2xl font-bold text-[#0001fc] md:text-4xl">
          Experiences
        </h2>

        <section className="mt-8 w-full max-w-6xl text-left">
          {isLoading && (
            <p className="rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
              Loading content...
            </p>
          )}

          {!isLoading && experiences.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
              No experiences posted yet.
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {experiences.map((exp) => (
              <article key={exp.id} className="sk-card overflow-hidden p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#0001fc]">{exp.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#7A1F1F]">
                      Date: {exp.date}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-black">{exp.details}</p>

                {(exp.photo_urls?.length ?? 0) > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {(exp.photo_urls ?? []).slice(0, 6).map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt={`${exp.name} photo`}
                        className="h-24 w-full rounded-xl object-cover ring-1 ring-black/5"
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
