import { useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import ProfileEditor from "../../features/profile/ProfileEditor";
import { getProfileDisplayName } from "../../features/profile/displayName";
import { supabase } from "../../shared/api/supabaseClient";
import { DashboardPageHeader } from "../../shared/ui/DashboardPageHeader";

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
        .select("full_name,short_name,role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileRow && (profileRow as { role?: string }).role === "admin") {
        setAdminName(
          getProfileDisplayName(
            profileRow as { full_name: string; short_name?: string | null },
            "Admin"
          )
        );
      }
    };

    void load();
  }, []);

  return (
    <DashboardLayout
      items={adminNavItems}
      userName={adminName}
      userEmail={adminEmail}
>
      <DashboardPageHeader
        title="Profile"
        subtitle="View your account email and password, and update your admin profile details."
      />
      <div className="mt-10">
        <ProfileEditor expectedRole="admin" />
      </div>
    </DashboardLayout>
  );
};

export default AdminProfile;

