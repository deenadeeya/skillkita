import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { adminNavItems } from "../../components/layout/navItems";
import { supabase } from "../../lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";

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

  const existingEmployers = useMemo(
    () =>
      profiles.filter((p) => p.role === "employer" && p.status === "approved"),
    [profiles]
  );

  const admins = useMemo(
    () => profiles.filter((p) => p.role === "admin"),
    [profiles]
  );

  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminSuccess, setNewAdminSuccess] = useState<string | null>(null);

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
    setNewAdminSuccess(null);

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

  const createAdmin = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setNewAdminSuccess(null);

    const fullName = newAdminFullName.trim();
    const email = newAdminEmail.trim();
    const password = newAdminPassword;

    if (!fullName || !email || !password) {
      setErrorMessage("Please provide full name, email, and password.");
      setIsSaving(false);
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    if (!supabaseUrl || !supabaseAnonKey) {
      setErrorMessage("Missing Supabase env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      setIsSaving(false);
      return;
    }

    const isolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setErrorMessage(signUpError.message);
      setIsSaving(false);
      return;
    }

    const newUserId = signUpData.user?.id ?? null;
    if (!newUserId) {
      setErrorMessage("Admin user created, but could not read new user id. Please refresh and verify in users list.");
      setIsSaving(false);
      await load();
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const adminId = sessionData.session?.user?.id ?? null;

    const { error: promoteError } = await supabase
      .from("user_profiles")
      .update({
        role: "admin",
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq("user_id", newUserId);

    if (promoteError) {
      setErrorMessage(
        `Created auth user, but failed to promote to admin: ${promoteError.message}`
      );
      setIsSaving(false);
      await load();
      return;
    }

    setNewAdminSuccess(
      "Admin created successfully. If email confirmations are enabled, they may need to confirm before logging in."
    );
    setNewAdminFullName("");
    setNewAdminEmail("");
    setNewAdminPassword("");
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
          Approve employers or create new admin.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {newAdminSuccess && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {newAdminSuccess}
          </div>
        )}

        {isAuthChecking && (
          <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
            Checking admin access...
          </div>
        )}

        <section className="sk-card mt-10 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Pending Employer</h2>
            <p className="text-sm font-semibold text-[#7A1F1F]">
              {pendingEmployers.length} pending
            </p>
          </div>
          <p className="mt-2 text-sm text-black">
            Admin can reject or approve the new users.
          </p>

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
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Employers</h2>
            <p className="text-sm font-semibold text-[#7A1F1F]">
              {existingEmployers.length} employers
            </p>
          </div>
          <p className="mt-2 text-sm text-black">
            Display the company name they are associated with.
          </p>

          <div className="mt-5 space-y-3">
            {isLoading && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                Loading users...
              </p>
            )}

            {!isLoading && existingEmployers.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                No approved employers found.
              </p>
            )}

            {!isLoading &&
              existingEmployers.map((p) => (
                <article key={p.user_id} className="rounded-xl border border-[#efe1db] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#0001fc]">{p.full_name}</h3>
                      <p className="mt-1 text-sm text-black/80">
                        Company:{" "}
                        <span className="font-semibold text-[#7A1F1F]">
                          {p.company_name ?? "—"}
                        </span>
                      </p>
                      <p className="mt-1 text-xs font-semibold text-black/70">
                        Approved: {p.approved_at ? new Date(p.approved_at).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>

        <section className="sk-card mt-8 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Admins</h2>
            <p className="text-sm font-semibold text-[#7A1F1F]">{admins.length} admins</p>
          </div>

          <div className="mt-3 rounded-xl border border-[#efe1db] bg-white/60 p-5">
            <h3 className="text-lg font-bold text-[#7A1F1F]">
              Create New Admin
            </h3>
            <p className="mt-2 text-sm text-black">
              Create a new admin by submitting Full Name, Email and Password.
            </p>

            <form
              className="mt-4 grid gap-3 md:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                void createAdmin();
              }}
            >
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-black">Full Name</span>
                <input
                  value={newAdminFullName}
                  onChange={(e) => setNewAdminFullName(e.target.value)}
                  className="w-full rounded-xl border border-[#efe1db] bg-white px-3 py-2 text-black outline-none focus:border-[#0001fc]"
                  placeholder="e.g. Jane Doe"
                  autoComplete="name"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-black">Email</span>
                <input
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#efe1db] bg-white px-3 py-2 text-black outline-none focus:border-[#0001fc]"
                  placeholder="admin@example.com"
                  type="email"
                  autoComplete="email"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-black">Password</span>
                <input
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#efe1db] bg-white px-3 py-2 text-black outline-none focus:border-[#0001fc]"
                  placeholder="Minimum 6 characters"
                  type="password"
                  autoComplete="new-password"
                />
              </label>

              <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="sk-button-primary px-4 py-2"
                >
                  {isSaving ? "Saving..." : "Create admin"}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 space-y-3">
            {!isLoading && admins.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                No admins found.
              </p>
            )}

            {!isLoading &&
              admins.map((p) => (
                <article key={p.user_id} className="rounded-xl border border-[#efe1db] p-4">
                  <h3 className="text-lg font-bold text-[#0001fc]">{p.full_name}</h3>
                  <p className="mt-1 text-xs font-semibold text-black/70">
                    Created: {new Date(p.created_at).toLocaleString()}
                  </p>
                </article>
              ))}
          </div>

          
        </section>
    </DashboardLayout>
  );
};

export default AdminUsers;

