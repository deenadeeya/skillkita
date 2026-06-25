import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { uploadProfilePic } from "../../features/profile/profilePicStorage";
import {
  createAdminAuthUser,
  createEmployerAccount,
  deleteEmployerAccount,
  listUserProfiles,
  promoteProfileToAdmin,
  setAdminActiveStatus,
  setEmployerActiveStatus,
  updateEmployerProfile,
  type ProfileRow,
} from "../../features/users/api/adminUsersApi";
import { useViewer } from "../../shared/hooks/useViewer";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { hideImageOnError } from "../../shared/ui/hideImageOnError";

function profileInitials(fullName: string, shortName: string | null) {
  const base = (shortName || fullName || "—").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "—";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

function countActiveAdmins(admins: ProfileRow[]) {
  return admins.filter((a) => a.status === "approved").length;
}

function canDeactivateAdmin(target: ProfileRow, viewerId: string | null, admins: ProfileRow[]) {
  if (!viewerId || target.user_id === viewerId) return false;
  if (target.status !== "approved") return false;
  return countActiveAdmins(admins) > 1;
}

type UserTabId = "employers" | "admins";

function matchesProfileSearch(profile: ProfileRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    profile.full_name,
    profile.short_name,
    profile.email,
    profile.company_name,
    profile.company_address,
    profile.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

type EmployerEditDraft = {
  userId: string;
  fullName: string;
  shortName: string;
  companyName: string;
  companyAddress: string;
  phone: string;
  email: string;
  pendingPic: File | null;
};

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const viewerState = useViewer();

  const managedEmployers = useMemo(
    () => profiles.filter((p) => p.role === "employer"),
    [profiles]
  );

  const activeEmployerCount = useMemo(
    () => managedEmployers.filter((p) => p.status === "approved").length,
    [managedEmployers]
  );

  const admins = useMemo(() => profiles.filter((p) => p.role === "admin"), [profiles]);

  const [activeTab, setActiveTab] = useState<UserTabId>("employers");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployers = useMemo(
    () => managedEmployers.filter((p) => matchesProfileSearch(p, searchQuery)),
    [managedEmployers, searchQuery]
  );

  const filteredAdmins = useMemo(
    () => admins.filter((p) => matchesProfileSearch(p, searchQuery)),
    [admins, searchQuery]
  );

  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminSuccess, setNewAdminSuccess] = useState<string | null>(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null);

  const viewerId = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;

  const [employerEdit, setEmployerEdit] = useState<EmployerEditDraft | null>(null);
  const [employerEditSuccess, setEmployerEditSuccess] = useState<string | null>(null);
  const [employerActionSuccess, setEmployerActionSuccess] = useState<string | null>(null);

  const [newEmployerFullName, setNewEmployerFullName] = useState("");
  const [newEmployerEmail, setNewEmployerEmail] = useState("");
  const [newEmployerPassword, setNewEmployerPassword] = useState("");
  const [newEmployerCompanyName, setNewEmployerCompanyName] = useState("");
  const [newEmployerCompanyAddress, setNewEmployerCompanyAddress] = useState("");
  const [newEmployerPhone, setNewEmployerPhone] = useState("");
  const [newEmployerSuccess, setNewEmployerSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const rows = await listUserProfiles();
      setProfiles(rows);
      setIsLoading(false);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to load users.");
      setProfiles([]);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewerState.kind === "signedIn") {
      setAdminEmail(viewerState.viewer.email);
      setAdminName(viewerState.viewer.displayName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    void load();
  }, [load]);

  const createAdmin = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setNewAdminSuccess(null);
    setAdminActionSuccess(null);

    const fullName = newAdminFullName.trim();
    const email = newAdminEmail.trim();
    const password = newAdminPassword;

    if (!fullName || !email || !password) {
      setErrorMessage("Please provide full name, email, and password.");
      setIsSaving(false);
      return;
    }

    try {
      const newUserId = await createAdminAuthUser({ fullName, email, password });
      const adminId = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;
      await promoteProfileToAdmin({ userId: newUserId, approvedBy: adminId });

      setNewAdminSuccess(
        "Admin created successfully. If email confirmations are enabled, they may need to confirm before logging in."
      );
      setNewAdminFullName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setActiveTab("admins");
      await load();
      setIsSaving(false);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to create admin.");
      setIsSaving(false);
      await load();
    }
  };

  const setAdminStatus = async (userId: string, active: boolean) => {
    const target = profiles.find((p) => p.user_id === userId);
    if (!target || target.role !== "admin") return;

    if (!active && !canDeactivateAdmin(target, viewerId, admins)) {
      if (target.user_id === viewerId) {
        setErrorMessage("You cannot deactivate your own admin account.");
      } else {
        setErrorMessage("At least one active admin must remain.");
      }
      return;
    }

    const label = active ? "reactivate" : "deactivate";
    const ok = window.confirm(
      active
        ? `Reactivate admin access for ${target.full_name}?`
        : `Deactivate admin access for ${target.full_name}? They will not be able to use admin tools.`
    );
    if (!ok) return;

    setIsSaving(true);
    setErrorMessage(null);
    setNewAdminSuccess(null);
    setAdminActionSuccess(null);

    try {
      await setAdminActiveStatus({
        userId,
        active,
        approvedBy: viewerId,
      });
      setAdminActionSuccess(
        active
          ? `${target.full_name} can access admin tools again.`
          : `${target.full_name} has been deactivated.`
      );
      await load();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : `Failed to ${label} admin.`);
    } finally {
      setIsSaving(false);
    }
  };

  const createEmployer = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setNewEmployerSuccess(null);
    setEmployerActionSuccess(null);

    const fullName = newEmployerFullName.trim();
    const email = newEmployerEmail.trim();
    const password = newEmployerPassword;

    if (!fullName || !email || !password) {
      setErrorMessage("Please provide full name, email, and password.");
      setIsSaving(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      setIsSaving(false);
      return;
    }

    try {
      const result = await createEmployerAccount({
        fullName,
        password,
        email,
        companyName: newEmployerCompanyName.trim() || null,
        companyAddress: newEmployerCompanyAddress.trim() || null,
        phone: newEmployerPhone.trim() || null,
      });

      setNewEmployerSuccess(result.message);
      setNewEmployerFullName("");
      setNewEmployerEmail("");
      setNewEmployerPassword("");
      setNewEmployerCompanyName("");
      setNewEmployerCompanyAddress("");
      setNewEmployerPhone("");
      await load();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to create employer.");
    } finally {
      setIsSaving(false);
    }
  };

  const setManagedEmployerStatus = async (target: ProfileRow, active: boolean) => {
    const label = active ? "reactivate" : "deactivate";
    const ok = window.confirm(
      active
        ? `Reactivate employer access for ${target.full_name}?`
        : `Deactivate ${target.full_name}? They will not be able to sign in or use employer tools.`
    );
    if (!ok) return;

    setIsSaving(true);
    setErrorMessage(null);
    setEmployerActionSuccess(null);
    setNewEmployerSuccess(null);

    try {
      const adminId = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;
      await setEmployerActiveStatus({
        userId: target.user_id,
        active,
        approvedBy: adminId,
      });
      setEmployerActionSuccess(
        active
          ? `${target.full_name} can access employer tools again.`
          : `${target.full_name} has been deactivated.`
      );
      await load();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : `Failed to ${label} employer.`);
    } finally {
      setIsSaving(false);
    }
  };

  const removeEmployer = async (target: ProfileRow) => {
    const ok = window.confirm(
      `Permanently delete ${target.full_name}? This removes their account and cannot be undone.`
    );
    if (!ok) return;

    setIsSaving(true);
    setErrorMessage(null);
    setEmployerActionSuccess(null);
    setNewEmployerSuccess(null);

    try {
      const result = await deleteEmployerAccount(target.user_id);
      if (employerEdit?.userId === target.user_id) setEmployerEdit(null);
      setEmployerActionSuccess(result.message);
      await load();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to delete employer.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEmployerEdit = (p: ProfileRow) => {
    setEmployerEditSuccess(null);
    setEmployerEdit({
      userId: p.user_id,
      fullName: p.full_name,
      shortName: p.short_name ?? "",
      companyName: p.company_name ?? "",
      companyAddress: p.company_address ?? "",
      phone: p.phone ?? "",
      email: p.email ?? "",
      pendingPic: null,
    });
  };

  const saveEmployerEdit = async () => {
    if (!employerEdit) return;
    setIsSaving(true);
    setErrorMessage(null);
    setEmployerEditSuccess(null);

    try {
      const profile = profiles.find((x) => x.user_id === employerEdit.userId);
      let profilePicUrl = profile?.profile_pic_url ?? null;
      if (employerEdit.pendingPic) {
        profilePicUrl = await uploadProfilePic(employerEdit.userId, employerEdit.pendingPic);
      }

      await updateEmployerProfile({
        userId: employerEdit.userId,
        fullName: employerEdit.fullName,
        shortName: employerEdit.shortName.trim() ? employerEdit.shortName.trim() : null,
        companyName: employerEdit.companyName.trim() ? employerEdit.companyName.trim() : null,
        companyAddress: employerEdit.companyAddress.trim() ? employerEdit.companyAddress.trim() : null,
        phone: employerEdit.phone.trim() ? employerEdit.phone.trim() : null,
        email: employerEdit.email.trim() ? employerEdit.email.trim() : null,
        profilePicUrl,
      });

      setEmployerEditSuccess("Employer profile updated.");
      setEmployerEdit(null);
      await load();
      setIsSaving(false);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to update employer profile.");
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      items={adminNavItems}
      userName={adminName}
      userEmail={adminEmail}
>
      <AdminPageFrame
        title="Manage Users"
        headerVariant="hero"
        subtitle="Create and manage employer and admin accounts."
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn"}
      >
        <section className="sk-card mt-10 overflow-hidden">
          <nav
            className="border-b border-black/10 bg-white/60 p-2 md:p-3"
            aria-label="User types"
            role="tablist"
          >
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "employers" as const, label: "Employers", count: managedEmployers.length },
                  { id: "admins" as const, label: "Admins", count: admins.length },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`users-tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`users-panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-ink hover:bg-primary/5 hover:text-primary",
                    ].join(" ")}
                  >
                    {tab.label}
                    <span
                      className={[
                        "ml-2 rounded-full px-2 py-0.5 text-xs",
                        isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
                      ].join(" ")}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {activeTab === "employers" && (
            <div
              id="users-panel-employers"
              role="tabpanel"
              aria-labelledby="users-tab-employers"
              className="p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary">Employers</h2>
                  <p className="mt-1 text-sm text-ink">
                    {activeEmployerCount} active · {managedEmployers.length} total
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-ink">
                Create employer accounts, update profiles, deactivate access, or permanently delete
                an account.
              </p>

              <div className="mt-4">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, company, or phone..."
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-ink outline-none focus:border-primary"
                />
                <p className="mt-2 text-xs font-semibold text-ink-muted">
                  Showing {filteredEmployers.length} of {managedEmployers.length}
                </p>
              </div>

              {employerActionSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {employerActionSuccess}
                </div>
              )}

              {newEmployerSuccess && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  {newEmployerSuccess}
                </div>
              )}

              {employerEditSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {employerEditSuccess}
                </div>
              )}

              <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-5">
            <h3 className="text-lg font-bold text-primary">Create New Employer</h3>
            <p className="mt-2 text-sm text-ink">
              Create employer accounts with full name, email, and password so they can sign in and use
              employer tools.
            </p>

            <form
              className="mt-4 grid gap-3 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                void createEmployer();
              }}
            >
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm font-semibold text-ink">Full name</span>
                <input
                  value={newEmployerFullName}
                  onChange={(e) => setNewEmployerFullName(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-primary"
                  placeholder="e.g. Ahmad Rahman"
                  autoComplete="name"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink">Email</span>
                <input
                  value={newEmployerEmail}
                  onChange={(e) => setNewEmployerEmail(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-primary"
                  placeholder="employer@company.com"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink">Password</span>
                <input
                  value={newEmployerPassword}
                  onChange={(e) => setNewEmployerPassword(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-primary"
                  placeholder="Minimum 6 characters"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink">Company name</span>
                <input
                  value={newEmployerCompanyName}
                  onChange={(e) => setNewEmployerCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink">Phone</span>
                <input
                  value={newEmployerPhone}
                  onChange={(e) => setNewEmployerPhone(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm font-semibold text-ink">Company address</span>
                <textarea
                  value={newEmployerCompanyAddress}
                  onChange={(e) => setNewEmployerCompanyAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-primary"
                />
              </label>

              <div className="md:col-span-2">
                <button type="submit" disabled={isSaving} className="sk-button-primary px-4 py-2">
                  {isSaving ? "Saving…" : "Create employer"}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 space-y-3">
            {isLoading && (
              <p className="rounded-xl border border-dashed border-primary/20 p-6 text-sm text-ink">
                Loading users...
              </p>
            )}

            {!isLoading && managedEmployers.length === 0 && (
              <p className="rounded-xl border border-dashed border-primary/20 p-6 text-sm text-ink">
                No employer accounts yet.
              </p>
            )}

            {!isLoading && managedEmployers.length > 0 && filteredEmployers.length === 0 && (
              <p className="rounded-xl border border-dashed border-primary/20 p-6 text-sm text-ink">
                No employers match your search.
              </p>
            )}

            {!isLoading &&
              filteredEmployers.map((p) => {
                const isEditing = employerEdit?.userId === p.user_id;
                const initials = profileInitials(p.full_name, p.short_name);
                const isActive = p.status === "approved";

                return (
                  <article key={p.user_id} className="rounded-xl border border-black/10 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 flex-1 gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-black/10 bg-white shadow-sm">
                          {p.profile_pic_url ? (
                            <img
                              src={p.profile_pic_url}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={hideImageOnError}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-ink">{p.full_name}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {isActive ? "Active" : "Deactivated"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-ink-muted">
                            Company:{" "}
                            <span className="font-semibold text-primary">{p.company_name ?? "—"}</span>
                          </p>
                          <p className="mt-1 text-sm text-ink-muted">
                            Email:{" "}
                            <span className="break-all font-medium text-ink">
                              {p.email?.trim() ? p.email : "—"}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-ink-muted">
                            Company address:{" "}
                            <span className="whitespace-pre-wrap text-ink">
                              {p.company_address?.trim() ? p.company_address : "—"}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-ink-muted">
                            Phone: <span className="font-medium">{p.phone?.trim() ? p.phone : "—"}</span>
                          </p>
                          <p className="mt-1 text-xs font-semibold text-ink-muted">
                            Approved: {p.approved_at ? new Date(p.approved_at).toLocaleString() : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 md:pt-1">
                        {isEditing ? (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setEmployerEdit(null)}
                            className="sk-button-secondary px-3 py-2"
                          >
                            Cancel
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => openEmployerEdit(p)}
                              className="sk-button-primary px-3 py-2"
                            >
                              Edit
                            </button>
                            {isActive ? (
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void setManagedEmployerStatus(p, false)}
                                className="sk-button-secondary border-red-200 px-3 py-2 text-red-800 hover:bg-red-50"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void setManagedEmployerStatus(p, true)}
                                className="sk-button-secondary px-3 py-2"
                              >
                                Reactivate
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => void removeEmployer(p)}
                              className="sk-button-secondary border-red-200 px-3 py-2 text-red-800 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing && employerEdit && (
                      <form
                        className="mt-5 space-y-4 border-t border-black/10 pt-5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void saveEmployerEdit();
                        }}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-primary">
                              Full name
                            </span>
                            <input
                              value={employerEdit.fullName}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, fullName: e.target.value })
                              }
                              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink"
                              required
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-sm font-semibold text-primary">
                              Short name
                            </span>
                            <input
                              value={employerEdit.shortName}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, shortName: e.target.value })
                              }
                              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink"
                              placeholder="Optional"
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-primary">
                              Company name
                            </span>
                            <input
                              value={employerEdit.companyName}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, companyName: e.target.value })
                              }
                              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink"
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-primary">
                              Company address
                            </span>
                            <textarea
                              value={employerEdit.companyAddress}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, companyAddress: e.target.value })
                              }
                              rows={3}
                              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink"
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-primary">
                              Email (for sign-in)
                            </span>
                            <input
                              value={employerEdit.email}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, email: e.target.value })
                              }
                              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink"
                              placeholder="Add or update login email"
                              type="email"
                              disabled={isSaving}
                            />
                            <span className="mt-1 block text-xs text-ink-muted">
                              Employers manage their own password via Forgot password on the login page.
                            </span>
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-primary">
                              Phone number
                            </span>
                            <input
                              value={employerEdit.phone}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, phone: e.target.value })
                              }
                              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink"
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-primary">
                              Profile picture
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setEmployerEdit({
                                  ...employerEdit,
                                  pendingPic: e.currentTarget.files?.[0] ?? null,
                                })
                              }
                              className="block w-full text-sm text-ink"
                              disabled={isSaving}
                            />
                            {employerEdit.pendingPic && (
                              <p className="mt-1 text-xs text-ink-muted">
                                Selected:{" "}
                                <span className="font-semibold">{employerEdit.pendingPic.name}</span>
                              </p>
                            )}
                          </label>
                        </div>
                        <button type="submit" disabled={isSaving} className="sk-button-primary px-4 py-2">
                          {isSaving ? "Saving…" : "Save changes"}
                        </button>
                      </form>
                    )}
                  </article>
                );
              })}
          </div>
            </div>
          )}

          {activeTab === "admins" && (
            <div
              id="users-panel-admins"
              role="tabpanel"
              aria-labelledby="users-tab-admins"
              className="p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary">Admins</h2>
                  <p className="mt-1 text-sm text-ink">
                    {countActiveAdmins(admins)} active · {admins.length} total
                  </p>
                </div>
              </div>

              <p className="mt-2 text-sm text-ink">
                Deactivate another admin to revoke their access. At least one admin must stay active.
                You cannot deactivate yourself.
              </p>

              <div className="mt-4">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-ink outline-none focus:border-primary"
                />
                <p className="mt-2 text-xs font-semibold text-ink-muted">
                  Showing {filteredAdmins.length} of {admins.length}
                </p>
              </div>

              {adminActionSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {adminActionSuccess}
                </div>
              )}

              {newAdminSuccess && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  {newAdminSuccess}
                </div>
              )}

              <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-5">
                <h3 className="text-lg font-bold text-primary">Create New Admin</h3>
                <p className="mt-2 text-sm text-ink">
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
                    <span className="text-sm font-semibold text-ink">Full Name</span>
                    <input
                      value={newAdminFullName}
                      onChange={(e) => setNewAdminFullName(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-primary"
                      placeholder="e.g. Jane Doe"
                      autoComplete="name"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-ink">Email</span>
                    <input
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-primary"
                      placeholder="admin@example.com"
                      type="email"
                      autoComplete="email"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-ink">Password</span>
                    <input
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-primary"
                      placeholder="Minimum 6 characters"
                      type="password"
                      autoComplete="new-password"
                    />
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-3">
                    <button type="submit" disabled={isSaving} className="sk-button-primary px-4 py-2">
                      {isSaving ? "Saving..." : "Create admin"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-5 space-y-3">
            {!isLoading && admins.length === 0 && (
              <p className="rounded-xl border border-dashed border-primary/20 p-6 text-sm text-ink">
                No admins found.
              </p>
            )}

            {!isLoading && admins.length > 0 && filteredAdmins.length === 0 && (
              <p className="rounded-xl border border-dashed border-primary/20 p-6 text-sm text-ink">
                No admins match your search.
              </p>
            )}

            {!isLoading &&
              filteredAdmins.map((p) => {
                const isSelf = p.user_id === viewerId;
                const isActive = p.status === "approved";
                const showDeactivate = canDeactivateAdmin(p, viewerId, admins);

                return (
                <article key={p.user_id} className="rounded-xl border border-black/10 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-ink">{p.full_name}</h3>
                        {isSelf && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            You
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">
                        Email:{" "}
                        <span className="break-all font-medium text-ink">
                          {p.email?.trim() ? p.email : "—"}
                        </span>
                      </p>
                      <p className="mt-1 text-xs font-semibold text-ink-muted">
                        Created: {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isActive && showDeactivate && (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void setAdminStatus(p.user_id, false)}
                          className="sk-button-secondary px-3 py-2 text-red-800 border-red-200 hover:bg-red-50"
                        >
                          Deactivate
                        </button>
                      )}
                      {!isActive && (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void setAdminStatus(p.user_id, true)}
                          className="sk-button-primary px-3 py-2"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
              })}
          </div>
            </div>
          )}
        </section>
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminUsers;

