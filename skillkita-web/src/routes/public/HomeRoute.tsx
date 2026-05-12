import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { CoursePosterMedia } from "../../features/courses/components/CoursePosterMedia";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { supabase } from "../../shared/api/supabaseClient";
import PlaceholderPoster from "../../assets/placeholder.jpg";
import TRSCGroupPhoto from "../../assets/TRSCGroupPhoto.png";
import { getLandingContent } from "../../features/landing/api/landingApi";
import { HomeSocialFeedsSection } from "../../features/landing/components/HomeSocialFeedsSection";

const HomePage = () => {
  type CourseRow = {
    id: string;
    name: string;
    date: string;
    details: string;
    poster_url: string | null;
    is_visible: boolean;
    created_at: string;
  };

  const [coverDescription, setCoverDescription] = useState(
    "Offering HRD-Corp Levy Claimable Training Courses"
  );
  const [whoDescription, setWhoDescription] = useState(
    "TAWAU RESOURCES & SKILLS CENTRE is a Bumiputera Company. This company has been registered under the Trade License Ordinance 1948 in 2023 in the field of services and learning activities.\n\nThis company has also been registered with the Ministry of Finance (MoF) in 2023 as a Welding Competency Assessment (Accreditation) Centre for CIDB"
  );

  const [homeFeatured1Url, setHomeFeatured1Url] = useState<string | null>(null);
  const [homeFeatured2Url, setHomeFeatured2Url] = useState<string | null>(null);
  const [homeFeatured3Url, setHomeFeatured3Url] = useState<string | null>(null);

  const [socialFacebookPageUrl, setSocialFacebookPageUrl] = useState<string | null>(null);
  const [socialFacebookPostUrls, setSocialFacebookPostUrls] = useState<string | null>(null);
  const [socialInstagramProfileUrl, setSocialInstagramProfileUrl] = useState<string | null>(null);
  const [socialInstagramPostUrls, setSocialInstagramPostUrls] = useState<string | null>(null);

  const [upcomingCourses, setUpcomingCourses] = useState<CourseRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeCourseIndex, setActiveCourseIndex] = useState(0);
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [hasAuthSession, setHasAuthSession] = useState(false);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setErrorMessage(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user ?? null;

        if (user) {
          setHasAuthSession(true);
          setViewerEmail(user.email ?? null);
          const { data: profileRow } = await supabase
            .from("user_profiles")
            .select("role,status,full_name")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileRow) {
            const r = profileRow as {
              role: "admin" | "employer";
              status: string;
              full_name?: string;
            };
            if (r.role === "admin") {
              setViewerRole("admin");
              setViewerName(r.full_name ?? "Admin");
            } else if (r.role === "employer" && r.status === "approved") {
              setViewerRole("employer");
              setViewerName(r.full_name ?? "Employer");
            } else {
              setViewerRole(null);
              // Pending/rejected employers are still authenticated; keep a friendly name if we have it.
              if (r.role === "employer") {
                setViewerName(r.full_name ?? "Employer");
              } else {
                setViewerName("User");
              }
            }
          } else {
            setViewerRole(null);
          }
        } else {
          setHasAuthSession(false);
          setViewerRole(null);
          setViewerEmail(null);
        }

        const [landing, coursesRes] = await Promise.all([
          getLandingContent(1),
          supabase
            .from("courses")
            .select("id,name,date,details,poster_url,is_visible,created_at")
            .eq("is_visible", true)
            .order("created_at", { ascending: false }),
        ]);

        if (coursesRes.error) throw new Error(coursesRes.error.message);

        if (landing) {
          setCoverDescription(landing.cover_description ?? coverDescription);
          setWhoDescription(landing.who_description ?? whoDescription);
          setHomeFeatured1Url(landing.home_featured_1_url);
          setHomeFeatured2Url(landing.home_featured_2_url);
          setHomeFeatured3Url(landing.home_featured_3_url);
          setSocialFacebookPageUrl(landing.social_facebook_page_url);
          setSocialFacebookPostUrls(landing.social_facebook_post_urls);
          setSocialInstagramProfileUrl(landing.social_instagram_profile_url);
          setSocialInstagramPostUrls(landing.social_instagram_post_url);
        } else {
          setHomeFeatured1Url(null);
          setHomeFeatured2Url(null);
          setHomeFeatured3Url(null);
          setSocialFacebookPageUrl(null);
          setSocialFacebookPostUrls(null);
          setSocialInstagramProfileUrl(null);
          setSocialInstagramPostUrls(null);
        }

        setUpcomingCourses((coursesRes.data ?? []) as CourseRow[]);
      } catch (err) {
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
  const nextCourse =
    upcomingCourses.length > 1
      ? upcomingCourses[(activeCourseIndex + 1) % upcomingCourses.length]
      : null;

  const visibleCourses = nextCourse
    ? [activeCourse, nextCourse]
    : [activeCourse].filter(Boolean);

  const landingBody = (
    <div className="flex w-full flex-col items-center pb-14 pt-6 text-center md:pt-10">
      <section className="w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-white/70 p-6 text-left shadow-sm ring-1 ring-black/5 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#7A1F1F]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#7A1F1F]/10 blur-3xl" />

          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
            <div>
              {(viewerRole === "admin" || viewerRole === "employer") && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7A1F1F]/10 px-3 py-1 text-sm font-bold text-[#7A1F1F]">
                  <span>
                    Welcome, {viewerName || "User"} {" "}
                  </span>
                </div>
              )}

              <h1 className="text-3xl font-extrabold tracking-tight text-[#0001fc] md:text-5xl">
                Education For All
              </h1>
              <p className="mt-4 text-sm text-black/80 md:text-base">
                {coverDescription}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={
                    viewerRole === "admin"
                      ? "/admin"
                      : viewerRole === "employer"
                        ? "/employer"
                        : hasAuthSession
                          ? "/login?stay=1"
                          : "/login"
                  }
                  className="sk-button-primary rounded-xl px-6 py-3"
                >
                  Get started
                </a>
                <a
                  href="#upcoming-courses"
                  className="sk-button-secondary rounded-xl px-6 py-3"
                >
                  Browse courses
                </a>
              </div>

              {errorMessage && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-[#7A1F1F]/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
                <CoursePosterMedia
                  url={TRSCGroupPhoto}
                  alt="Training"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[#7A1F1F] px-4 py-3 text-left text-white shadow-sm md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Trusted by Employers and Learners</p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white/90">
              <span></span>
        
            </div>
          </div>
        </div>

        <div className="mt-10 grid items-center gap-8 text-left md:grid-cols-2">
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <CoursePosterMedia
                  url={homeFeatured1Url ?? PlaceholderPoster}
                  alt="Learning"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <CoursePosterMedia
                  url={homeFeatured2Url ?? PlaceholderPoster}
                  alt="Classroom"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="col-span-2 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <CoursePosterMedia
                  url={homeFeatured3Url ?? PlaceholderPoster}
                  alt="Graduation"
                  className="aspect-[16/7] w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-black/5 md:p-8">
            <h2 className="text-2xl font-extrabold text-[#0001fc] md:text-4xl">
              We provide quality training programs
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm text-black/80 md:text-base">
              {whoDescription}
            </p>
            <div className="mt-6">
              <a href="/courses" className="sk-button-primary rounded-xl px-6 py-3">
                Learn more
              </a>
            </div>
          </div>
        </div>
      </section>

      <h2
        id="upcoming-courses"
        className="mt-12 text-2xl font-bold text-[#0001fc] md:mt-20 md:text-4xl"
      >
        Available Courses
      </h2>

      <div className="mt-6 w-full max-w-5xl">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            aria-label="Show previous course"
            onClick={showPreviousCourse}
            disabled={upcomingCourses.length < 2}
            className="absolute left-0 z-10 flex h-9 w-9 shrink-0 -translate-x-2 items-center justify-center rounded-full bg-[#7A1F1F] text-white shadow-md transition hover:bg-[#5f1818] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:ring-offset-2 disabled:opacity-50 md:h-12 md:w-12 md:-translate-x-3"
          >
            <ChevronLeftIcon className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <div className="grid w-full max-w-3xl grid-cols-2 gap-3 px-6 md:gap-4 md:px-0">
            {visibleCourses.length === 0 && (
              <article className="w-full rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5 md:p-5">
                <p className="text-sm font-semibold text-[#7A1F1F]">No courses available yet.</p>
                <h3 className="mt-1 text-lg font-bold text-[#0001fc] md:text-xl">Check back soon</h3>
                <p className="mt-2 text-sm text-black md:text-base">
                  New courses will appear here once published in the admin dashboard.
                </p>
                <CoursePosterMedia
                  url={PlaceholderPoster}
                  alt="Course poster"
                  className="mt-3 aspect-[210/297] w-full rounded-xl object-cover md:mt-4"
                />
              </article>
            )}

            {visibleCourses.map((course, idx) => (
              <article
                key={`${course?.id ?? "empty"}-${idx}`}
                className="w-full rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5 md:p-5"
              >
                <h3 className="text-sm font-bold text-[#0001fc] md:text-xl">
                  {course?.name ?? "Check back soon"}
                </h3>
                <p className="mt-2 text-xs text-black md:text-base">
                  {course?.details ??
                    "New courses will appear here once published in the admin dashboard."}
                </p>
                <CoursePosterMedia
                  url={course?.poster_url ?? PlaceholderPoster}
                  alt={`${course?.name ?? "Course"} poster`}
                  className="mt-3 aspect-[210/297] w-full rounded-xl object-cover md:mt-4"
                />
              </article>
            ))}
          </div>

          <button
            type="button"
            aria-label="Show next course"
            onClick={showNextCourse}
            disabled={upcomingCourses.length < 2}
            className="absolute right-0 z-10 flex h-9 w-9 shrink-0 translate-x-2 items-center justify-center rounded-full bg-[#7A1F1F] text-white shadow-md transition hover:bg-[#5f1818] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:ring-offset-2 disabled:opacity-50 md:h-12 md:w-12 md:translate-x-3"
          >
            <ChevronRightIcon className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>
      </div>

      <a href="/courses" className="sk-button-primary mt-8 rounded-xl px-6 py-3">
        Show All Courses
      </a>

      <HomeSocialFeedsSection
        facebookPageUrl={socialFacebookPageUrl}
        facebookPostUrls={socialFacebookPostUrls}
        instagramProfileUrl={socialInstagramProfileUrl}
        instagramPostUrls={socialInstagramPostUrls}
      />

    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      {viewerRole ? (
        <DashboardLayout
          showHeader
          items={viewerRole === "admin" ? adminNavItems : employerNavItems}
          userName={viewerName}
          userEmail={viewerEmail}
          onLogout={() => {
            void supabase.auth.signOut();
            window.localStorage.removeItem("skillkita-role");
            window.location.href = "/";
          }}
        >
          <main className="sk-container">{landingBody}</main>
        </DashboardLayout>
      ) : (
        <>
          <SiteHeader />
          <main className="sk-container">{landingBody}</main>
        </>
      )}
    </div>
  );
};

export default HomePage;

