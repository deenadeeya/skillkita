import { useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { getProfileDisplayName } from "../../features/profile/displayName";
import { normalizeSupabaseStorageUrl, supabase } from "../../shared/api/supabaseClient";
import { getLandingContent } from "../../features/landing/api/landingApi";
import {
  DEFAULT_HERO,
  DEFAULT_STATS,
  getHomepageHero,
  getHomepageStats,
  listHomepagePartners,
  type HomepageHeroRow,
  type HomepageStatsRow,
} from "../../features/homepage/api/homepageApi";
import { compareCoursesUpcomingFirst } from "../../features/courses/courseDate";
import { HomePageContent } from "../../features/homepage/components/HomePageContent";
import type { FeaturedCourse } from "../../features/homepage/components/HomeFeaturedCoursesSection";

const DEFAULT_WHO_DESCRIPTION =
  "TAWAU RESOURCES & SKILLS CENTRE is a Bumiputera Company registered under the Trade License Ordinance 1948 in 2023, delivering accredited services and learning activities. We are also registered with the Ministry of Finance (MoF) as a Welding Competency Assessment (Accreditation) Centre for CIDB.";

const HomePage = () => {
  const [hero, setHero] = useState<HomepageHeroRow>({
    ...DEFAULT_HERO,
    hero_image: "",
    updated_at: new Date().toISOString(),
  });
  const [stats, setStats] = useState<HomepageStatsRow>({
    ...DEFAULT_STATS,
    updated_at: new Date().toISOString(),
  });
  const [whyChooseImage, setWhyChooseImage] = useState("");
  const [whyChooseDescription, setWhyChooseDescription] = useState(DEFAULT_WHO_DESCRIPTION);
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [partners, setPartners] = useState<Awaited<ReturnType<typeof listHomepagePartners>>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setErrorMessage(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user ?? null;

        if (user) {
          setViewerEmail(user.email ?? null);
          const { data: profileRow } = await supabase
            .from("user_profiles")
            .select("role,status,full_name,short_name,profile_pic_url")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileRow) {
            const r = profileRow as {
              role: "admin" | "employer";
              status: string;
              full_name?: string;
              short_name?: string | null;
              profile_pic_url?: string | null;
            };
            setProfilePicUrl(normalizeSupabaseStorageUrl(r.profile_pic_url ?? null));

            if (r.role === "admin") {
              setViewerRole("admin");
              setViewerName(getProfileDisplayName(r, "Admin"));
            } else if (r.role === "employer" && r.status !== "rejected") {
              setViewerRole("employer");
              setViewerName(getProfileDisplayName(r, "Employer"));
            } else {
              setViewerRole(null);
              if (r.role === "employer") setViewerName(getProfileDisplayName(r, "Employer"));
            }
          } else {
            setViewerRole(null);
          }
        } else {
          setViewerRole(null);
          setViewerEmail(null);
          setProfilePicUrl(null);
        }

        const [landing, heroRow, statsRow, partnerRows, coursesRes] = await Promise.all([
          getLandingContent(1),
          getHomepageHero(),
          getHomepageStats(),
          listHomepagePartners(),
          supabase
            .from("courses")
            .select("id,name,date,details,poster_url,is_visible,created_at")
            .eq("is_visible", true),
        ]);

        if (coursesRes.error) throw new Error(coursesRes.error.message);

        const whoUrl = landing?.who_image_url?.trim() ?? "";
        const whoDesc = landing?.who_description?.trim() || DEFAULT_WHO_DESCRIPTION;

        setWhyChooseImage(whoUrl);
        setWhyChooseDescription(whoDesc);

        const mergedHero: HomepageHeroRow = heroRow
          ? {
              ...heroRow,
              hero_image: heroRow.hero_image?.trim() || whoUrl,
              subtitle: heroRow.subtitle?.trim() || DEFAULT_HERO.subtitle,
              button_1_text: DEFAULT_HERO.button_1_text,
              button_1_link: DEFAULT_HERO.button_1_link,
              button_2_text: DEFAULT_HERO.button_2_text,
              button_2_link: DEFAULT_HERO.button_2_link,
            }
          : {
              ...DEFAULT_HERO,
              hero_image: whoUrl,
              updated_at: new Date().toISOString(),
            };
        setHero(mergedHero);

        setStats(
          statsRow ?? {
            ...DEFAULT_STATS,
            updated_at: new Date().toISOString(),
          }
        );

        setPartners(partnerRows);

        setCourses(
          ((coursesRes.data ?? []) as FeaturedCourse[])
            .map((row) => ({
              ...row,
              poster_url: normalizeSupabaseStorageUrl(row.poster_url),
            }))
            .sort(compareCoursesUpcomingFirst)
        );
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load homepage.");
      }
    };

    void load();
  }, []);

  const welcomeName =
    viewerRole === "admin" || viewerRole === "employer" ? viewerName : null;

  const page = (
    <HomePageContent
      hero={hero}
      stats={stats}
      courses={courses}
      whyChooseImage={whyChooseImage}
      whyChooseDescription={whyChooseDescription}
      partners={partners}
      welcomeName={welcomeName}
      errorMessage={errorMessage}
    />
  );

  return (
    <div className="min-h-screen w-full bg-paper">
      {viewerRole ? (
        <DashboardLayout
          showHeader
          fullWidth
          items={viewerRole === "admin" ? adminNavItems : employerNavItems}
          userName={viewerName}
          userRole={viewerRole}
          userEmail={viewerEmail}
          profilePicUrl={profilePicUrl}
        >
          {page}
        </DashboardLayout>
      ) : (
        <>
          <SiteHeader />
          <main className="sk-page-container max-w-content">{page}</main>
        </>
      )}
    </div>
  );
};

export default HomePage;
