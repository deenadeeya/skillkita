import { useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { supabase } from "../../shared/api/supabaseClient";
import { getLandingContent, type LandingContentRow } from "../../features/landing/api/landingApi";
import { AboutUsPublicSections } from "../../features/landing/components/AboutUsPublicSections";

const AboutUs = () => {
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);

  const [landing, setLanding] = useState<LandingContentRow | null>(null);
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
            .select("role,status,full_name")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileRow) {
            const r = profileRow as { role: "admin" | "employer"; status: string; full_name?: string };
            if (r.role === "admin") {
              setViewerRole("admin");
              setViewerName(r.full_name ?? "Admin");
            } else if (r.role === "employer" && r.status !== "rejected") {
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

        const row = await getLandingContent(1);
        setLanding(row);
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0001fc] md:text-5xl">About Us</h1>
          <p className="mt-2 text-sm font-semibold text-black/70 md:text-base">
            Company profile, location, payment details, and contacts.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <AboutUsPublicSections landing={landing} isLoading={isLoading} />
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
          <main className="sk-container py-10">{body}</main>
        </>
      )}
    </div>
  );
};

export default AboutUs;
