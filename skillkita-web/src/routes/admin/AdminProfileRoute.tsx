import { useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import ProfileEditor from "../../features/profile/ProfileEditor";
import { supabase } from "../../shared/api/supabaseClient";

const AdminProfile = () => {
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      setAdminEmail(user.email ?? null);

      const { data: profileRow } = await supabase
        .from("user_profiles")
        .select("full_name,role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileRow && (profileRow as { role?: string }).role === "admin") {
        setAdminName((profileRow as { full_name?: string }).full_name ?? "Admin");
      }
    };

    void load();
  }, []);

  return (
    <DashboardLayout
      items={adminNavItems}
      userName={adminName}
      userEmail={adminEmail}
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
      <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Profile</h1>
      <p className="mt-3 text-lg text-black md:text-xl">Update your admin profile details.</p>

      <ProfileEditor expectedRole="admin" />
    </DashboardLayout>
  );
};

export default AdminProfile;

