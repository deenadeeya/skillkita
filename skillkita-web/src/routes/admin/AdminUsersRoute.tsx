import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { uploadProfilePic } from "../../features/profile/profilePicStorage";
import {
  createAdminAuthUser,
  listUserProfiles,
  promoteProfileToAdmin,
  setAdminActiveStatus,
  setEmployerApproval,
  updateEmployerProfile,
  type ProfileRow,
} from "../../features/users/api/adminUsersApi";
import { supabase } from "../../shared/api/supabaseClient";
import { useViewer } from "../../shared/hooks/useViewer";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";

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

type EmployerEditDraft = {
  userId: string;
  fullName: string;
  shortName: string;
  companyName: string;
  companyAddress: string;
  phone: string;
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

  const pendingEmployers = useMemo(
    () => profiles.filter((p) => p.role === "employer" && p.status === "pending"),
    [profiles]
  );

  const existingEmployers = useMemo(
    () => profiles.filter((p) => p.role === "employer" && p.status === "approved"),
    [profiles]
  );

  const admins = useMemo(() => profiles.filter((p) => p.role === "admin"), [profiles]);

  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminSuccess, setNewAdminSuccess] = useState<string | null>(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null);

  const viewerId = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;

  const [employerEdit, setEmployerEdit] = useState<EmployerEditDraft | null>(null);
  const [employerEditSuccess, setEmployerEditSuccess] = useState<string | null>(null);

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
      setAdminName(viewerState.viewer.fullName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    void load();
  }, [load]);

  const setEmployerStatus = async (userId: string, status: "approved" | "rejected") => {
    setIsSaving(true);
    setErrorMessage(null);
    setNewAdminSuccess(null);
    setAdminActionSuccess(null);

    try {
      const adminId = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;
      await setEmployerApproval({ userId, status, approvedBy: adminId });
      await load();
      setIsSaving(false);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to update employer status.");
      setIsSaving(false);
    }
  };

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

  const openEmployerEdit = (p: ProfileRow) => {
    setEmployerEditSuccess(null);
    setEmployerEdit({
      userId: p.user_id,
      fullName: p.full_name,
      shortName: p.short_name ?? "",
      companyName: p.company_name ?? "",
      companyAddress: p.company_address ?? "",
      phone: p.phone ?? "",
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
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
      <AdminPageFrame
        title="Manage Users"
        subtitle="Approve employers, manage admins, or create new admin accounts."
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn"}
      >
        {adminActionSuccess && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {adminActionSuccess}
          </div>
        )}

        {newAdminSuccess && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {newAdminSuccess}
          </div>
        )}

        <section className="sk-card mt-10 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Pending Employer</h2>
            <p className="text-sm font-semibold text-[#7A1F1F]">{pendingEmployers.length} pending</p>
          </div>
          <p className="mt-2 text-sm text-black">Admin can reject or approve the new users.</p>

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
            Company contact details and profile photo. Use Edit to update an employer&apos;s profile.
          </p>

          {employerEditSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {employerEditSuccess}
            </div>
          )}

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
              existingEmployers.map((p) => {
                const isEditing = employerEdit?.userId === p.user_id;
                const initials = profileInitials(p.full_name, p.short_name);

                return (
                  <article key={p.user_id} className="rounded-xl border border-[#efe1db] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 flex-1 gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#efe1db] bg-white shadow-sm">
                          {p.profile_pic_url ? (
                            <img
                              src={p.profile_pic_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#7A1F1F]">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-[#0001fc]">{p.full_name}</h3>
                          <p className="mt-1 text-sm text-black/80">
                            Company:{" "}
                            <span className="font-semibold text-[#7A1F1F]">{p.company_name ?? "—"}</span>
                          </p>
                          <p className="mt-1 text-sm text-black/80">
                            Email:{" "}
                            <span className="break-all font-medium text-black/90">
                              {p.email?.trim() ? p.email : "—"}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-black/80">
                            Company address:{" "}
                            <span className="whitespace-pre-wrap text-black/90">
                              {p.company_address?.trim() ? p.company_address : "—"}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-black/80">
                            Phone: <span className="font-medium">{p.phone?.trim() ? p.phone : "—"}</span>
                          </p>
                          <p className="mt-1 text-xs font-semibold text-black/70">
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
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => openEmployerEdit(p)}
                            className="sk-button-primary px-3 py-2"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing && employerEdit && (
                      <form
                        className="mt-5 space-y-4 border-t border-[#efe1db] pt-5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void saveEmployerEdit();
                        }}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                              Full name
                            </span>
                            <input
                              value={employerEdit.fullName}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, fullName: e.target.value })
                              }
                              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 text-black"
                              required
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                              Short name
                            </span>
                            <input
                              value={employerEdit.shortName}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, shortName: e.target.value })
                              }
                              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 text-black"
                              placeholder="Optional"
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                              Company name
                            </span>
                            <input
                              value={employerEdit.companyName}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, companyName: e.target.value })
                              }
                              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 text-black"
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                              Company address
                            </span>
                            <textarea
                              value={employerEdit.companyAddress}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, companyAddress: e.target.value })
                              }
                              rows={3}
                              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 text-black"
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                              Phone number
                            </span>
                            <input
                              value={employerEdit.phone}
                              onChange={(e) =>
                                setEmployerEdit({ ...employerEdit, phone: e.target.value })
                              }
                              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 text-black"
                              disabled={isSaving}
                            />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
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
                              className="block w-full text-sm text-black"
                              disabled={isSaving}
                            />
                            {employerEdit.pendingPic && (
                              <p className="mt-1 text-xs text-black/70">
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
        </section>

        <section className="sk-card mt-8 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Admins</h2>
            <p className="text-sm font-semibold text-[#7A1F1F]">{admins.length} admins</p>
          </div>

          <p className="mt-2 text-sm text-black">
            Deactivate another admin to revoke their access. At least one admin must stay active. You
            cannot deactivate yourself.
          </p>

          <div className="mt-3 rounded-xl border border-[#efe1db] bg-white/60 p-5">
            <h3 className="text-lg font-bold text-[#7A1F1F]">Create New Admin</h3>
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
                <button type="submit" disabled={isSaving} className="sk-button-primary px-4 py-2">
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
              admins.map((p) => {
                const isSelf = p.user_id === viewerId;
                const isActive = p.status === "approved";
                const showDeactivate = canDeactivateAdmin(p, viewerId, admins);

                return (
                <article key={p.user_id} className="rounded-xl border border-[#efe1db] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-[#0001fc]">{p.full_name}</h3>
                        {isSelf && (
                          <span className="rounded-full bg-[#7A1F1F]/10 px-2 py-0.5 text-xs font-semibold text-[#7A1F1F]">
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
                      <p className="mt-1 text-sm text-black/80">
                        Email:{" "}
                        <span className="break-all font-medium text-black/90">
                          {p.email?.trim() ? p.email : "—"}
                        </span>
                      </p>
                      <p className="mt-1 text-xs font-semibold text-black/70">
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
        </section>
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminUsers;

