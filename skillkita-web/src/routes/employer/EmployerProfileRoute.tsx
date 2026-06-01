import { useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { employerNavItems } from "../../app/layout/navItems";
import ProfileEditor from "../../features/profile/ProfileEditor";
import { supabase } from "../../shared/api/supabaseClient";
import { signOutAndRedirectHome } from "../../shared/auth/signOutAndRedirectHome";
import { DashboardPageHeader } from "../../shared/ui/DashboardPageHeader";

const EmployerProfile = () => {
  const [name, setName] = useState("Employer");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      setEmail(user.email ?? null);

      const { data: profileRow } = await supabase
        .from("user_profiles")
        .select("full_name,role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileRow && (profileRow as { role?: string }).role === "employer") {
        setName((profileRow as { full_name?: string }).full_name ?? "Employer");
      }
    };

    void load();
  }, []);

  return (
    <DashboardLayout
      items={employerNavItems}
      userName={name}
      userEmail={email}
      onLogout={() => {
        void signOutAndRedirectHome();
      }}
    >
      <DashboardPageHeader title="Profile" subtitle="Update your employer profile details." />
      <div className="mt-10">
        <ProfileEditor expectedRole="employer" />
      </div>
    </DashboardLayout>
  );
};

export default EmployerProfile;

