import { useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { normalizeSupabaseStorageUrl, supabase } from "../../shared/api/supabaseClient";
import {
  getLandingContent,
  listExperiences,
  type ExperienceRow,
  type LandingContentRow,
} from "../../features/landing/api/landingApi";
import { AboutUsPublicSections } from "../../features/landing/components/AboutUsPublicSections";
import { getProfileDisplayName } from "../../features/profile/displayName";

const AboutUs = () => {
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  const [landing, setLanding] = useState<LandingContentRow | null>(null);
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
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
            }
          } else {
            setViewerRole(null);
          }
        } else {
          setViewerRole(null);
          setViewerEmail(null);
          setProfilePicUrl(null);
        }

        const [row, experienceRows] = await Promise.all([getLandingContent(1), listExperiences()]);
        setLanding(row);
        setExperiences(experienceRows);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        setErrorMessage(err instanceof Error ? err.message : "Failed to load About Us.");
      }
    };

    void load();
  }, []);

  const body = (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      <AboutUsPublicSections landing={landing} experiences={experiences} isLoading={isLoading} />
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
          userRole={viewerRole}
          userEmail={viewerEmail}
          profilePicUrl={profilePicUrl}
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

export default AboutUs;
