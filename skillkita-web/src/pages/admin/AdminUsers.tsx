import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { adminNavItems } from "../../components/layout/navItems";
import { supabase } from "../../lib/supabaseClient";

type ProfileRow = {
  user_id: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const pendingEmployers = useMemo(
    () => profiles.filter((p) => p.role === "employer" && p.status === "pending"),
    [profiles]
  );

  const load = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "user_id,full_name,company_name,phone,role,status,created_at,approved_at,approved_by"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    setProfiles((data ?? []) as ProfileRow[]);
    setIsLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      setIsAuthChecking(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setIsAuthChecking(false);
        setErrorMessage(error.message);
        return;
      }

      const user = data.session?.user;
      if (!user) {
        setIsAuthChecking(false);
        window.location.href = "/login";
        return;
      }

      setAdminEmail(user.email ?? null);

      const { data: profileRow, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        setIsAuthChecking(false);
        setErrorMessage(profileError.message);
        return;
      }

      if (!profileRow || profileRow.role !== "admin") {
        setIsAuthChecking(false);
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/login";
        return;
      }

      window.localStorage.setItem("skillkita-role", "admin");
      setAdminName((profileRow as { full_name?: string }).full_name ?? "Admin");
      setIsAuthChecking(false);
      await load();
    };

    void checkAdmin();
  }, []);

  const setEmployerStatus = async (userId: string, status: "approved" | "rejected") => {
    setIsSaving(true);
    setErrorMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const adminId = sessionData.session?.user?.id ?? null;

    const { error } = await supabase
      .from("user_profiles")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        approved_by: status === "approved" ? adminId : null,
      })
      .eq("user_id", userId);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    await load();
    setIsSaving(false);
  };

  const promoteToAdmin = async (userId: string) => {
    setIsSaving(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("user_profiles")
      .update({ role: "admin", status: "approved", approved_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    await load();
    setIsSaving(false);
  };

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
        <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Manage Users</h1>
        <p className="mt-3 text-lg text-black md:text-xl">
          Approve employers and promote users to admin.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isAuthChecking && (
          <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
            Checking admin access...
          </div>
        )}

        <section className="sk-card mt-10 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Pending employers</h2>
            <p className="text-sm font-semibold text-[#7A1F1F]">
              {pendingEmployers.length} pending
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {isLoading && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                Loading users...
              </p>
            )}

            {!isLoading && pendingEmployers.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                No pending requests.
              </p>
            )}

            {pendingEmployers.map((p) => (
              <article key={p.user_id} className="rounded-xl border border-[#efe1db] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#0001fc]">{p.full_name}</h3>
                    <p className="mt-1 text-sm text-black/80">
                      Company: {p.company_name ?? "—"} · Phone: {p.phone ?? "—"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#7A1F1F]">
                      Requested: {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void setEmployerStatus(p.user_id, "approved")}
                      className="sk-button-primary px-3 py-2"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void setEmployerStatus(p.user_id, "rejected")}
                      className="sk-button-secondary px-3 py-2"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sk-card mt-8 p-6">
          <h2 className="text-2xl font-bold text-[#7A1F1F]">All users</h2>
          <p className="mt-2 text-sm text-black">
            To create a new admin, ask them to sign up first, then promote them here.
          </p>

          <div className="mt-5 space-y-3">
            {!isLoading &&
              profiles.map((p) => (
                <article key={p.user_id} className="rounded-xl border border-[#efe1db] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#0001fc]">{p.full_name}</h3>
                      <p className="mt-1 text-sm text-black/80">
                        Role:{" "}
                        <span className="font-semibold text-[#7A1F1F]">{p.role}</span>{" "}
                        · Status:{" "}
                        <span className="font-semibold text-[#7A1F1F]">{p.status}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.role !== "admin" && (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void promoteToAdmin(p.user_id)}
                          className="sk-button bg-[#0001fc] px-3 py-2 text-white hover:bg-[#0001fc]/90"
                        >
                          Promote to admin
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>
    </DashboardLayout>
  );
};

export default AdminUsers;

