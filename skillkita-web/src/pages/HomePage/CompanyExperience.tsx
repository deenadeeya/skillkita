import { useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { supabase } from "../../shared/api/supabaseClient";

type ExperienceRow = {
  id: string;
  name: string;
  date: string;
  details: string;
  photo_urls: string[] | null;
  created_at: string;
};

const CompanyExperience = () => {
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);

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

        const expRes = await supabase
          .from("experiences")
          .select("id,name,date,details,photo_urls,created_at")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false });

        if (expRes.error) throw new Error(expRes.error.message);

        setExperiences((expRes.data ?? []) as ExperienceRow[]);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        setErrorMessage(err instanceof Error ? err.message : "Failed to load experiences.");
      }
    };

    void load();
  }, []);

  const body = (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0001fc] md:text-5xl">
            Company Experience
          </h1>
          <p className="mt-2 text-sm font-semibold text-black/70 md:text-base">
            Activities and past experiences.
          </p>
        </div>
        
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="mt-6 w-full max-w-6xl text-left md:mt-8">
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
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </article>
          ))}
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

export default CompanyExperience;

