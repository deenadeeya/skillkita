import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { supabase } from "../../shared/api/supabaseClient";

type LandingContentRow = {
  id: number;
  who_image_url: string | null;
  who_description: string;
};

const AboutUs = () => {
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);

  const [whoImageUrl, setWhoImageUrl] = useState<string | null>(null);
  const [whoDescription, setWhoDescription] = useState<string>("");
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

        const landingRes = await supabase
          .from("landing_content")
          .select("id,who_image_url,who_description")
          .eq("id", 1)
          .maybeSingle();

        if (landingRes.error) throw new Error(landingRes.error.message);

        const landing = landingRes.data as LandingContentRow | null;
        setWhoImageUrl(landing?.who_image_url ?? null);
        setWhoDescription(landing?.who_description ?? "");
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        setErrorMessage(err instanceof Error ? err.message : "Failed to load About Us.");
      }
    };

    void load();
  }, []);

  const paragraphs = useMemo(
    () =>
      whoDescription
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [whoDescription]
  );

  const body = (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0001fc] md:text-5xl">About Us</h1>
          <p className="mt-2 text-sm font-semibold text-black/70 md:text-base">
            Company info and description.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="mt-8 w-full max-w-3xl">
        <div className="mt-6 sk-card overflow-hidden">
          {whoImageUrl && (
            <img
              src={whoImageUrl}
              alt="Company photo"
              className="h-48 w-full object-cover md:h-64"
              loading="lazy"
            />
          )}
          <div className="px-4 py-5 md:px-6 md:py-6">
            {isLoading && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
                Loading content...
              </p>
            )}
            {!isLoading && paragraphs.length === 0 && (
              <p className="text-sm text-black/70">No description yet. Update it in “Manage Home”.</p>
            )}
            {paragraphs.map((p) => (
              <p key={p.slice(0, 32)} className="mt-3 text-base text-black md:text-lg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>
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

