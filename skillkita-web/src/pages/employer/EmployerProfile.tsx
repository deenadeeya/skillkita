import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { employerNavItems } from "../../components/layout/navItems";
import ProfileEditor from "../../features/profile/ProfileEditor";
import { supabase } from "../../lib/supabaseClient";

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
        void supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
      <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Profile</h1>
      <p className="mt-3 text-lg text-black md:text-xl">Update your employer profile details.</p>

      <ProfileEditor expectedRole="employer" />
    </DashboardLayout>
  );
};

export default EmployerProfile;

