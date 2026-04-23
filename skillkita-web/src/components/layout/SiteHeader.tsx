import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState } from "react";
import TRSCLogo from "../../assets/TRSCLogo.png";
import { supabase } from "../../lib/supabaseClient";

const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
] as const;

type Props = {
  /** When provided, the mobile hamburger triggers this (e.g. open LeftNav drawer). */
  onMenuClick?: () => void;
};

const SiteHeader = ({ onMenuClick }: Props) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);
  const [hasAuthSession, setHasAuthSession] = useState(false);
  const [employerStatus, setEmployerStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isEmployerMenuOpen, setIsEmployerMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);

  type ProfileRow = {
    role: "admin" | "employer";
    status: "pending" | "approved" | "rejected";
    full_name?: string | null;
  };

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        setIsAdmin(false);
        setIsEmployer(false);
        setHasAuthSession(false);
        setEmployerStatus(null);
        setViewerName("User");
        setViewerEmail(null);
        return;
      }

      setHasAuthSession(true);

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role,status,full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !profile) {
        setIsAdmin(false);
        setIsEmployer(false);
        setEmployerStatus(null);
        setViewerName("User");
        setViewerEmail(user.email ?? null);
        return;
      }

      const row = profile as ProfileRow;
      setIsAdmin(row.role === "admin");
      setIsEmployer(row.role === "employer" && row.status === "approved");
      setEmployerStatus(row.role === "employer" ? row.status : null);
      setViewerName(row.full_name?.trim() ? row.full_name : row.role === "admin" ? "Admin" : "Employer");
      setViewerEmail(user.email ?? null);
    };

    void check();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void check();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem("skillkita-role");
    window.location.href = "/";
  };

  const profileHref = useMemo(() => {
    if (isAdmin) return "/admin/profile?role=admin";
    if (isEmployer) return "/employer/profile";
    if (employerStatus === "pending" || employerStatus === "rejected") return "/employer/profile";
    return hasAuthSession ? "/login?stay=1" : "/login";
  }, [employerStatus, hasAuthSession, isAdmin, isEmployer]);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#7A1F1F] text-white shadow-sm">
      <div className="relative flex h-16 w-full items-center justify-between gap-4 px-4 md:px-6">
        {/* Mobile: hamburger (left) + centered title + profile (right) */}
        <div className="flex w-full items-center justify-between md:hidden">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => {
              onMenuClick?.();
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10"
            disabled={!onMenuClick}
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1.5">
              <span className="h-0.5 w-5 bg-white" />
              <span className="h-0.5 w-5 bg-white" />
              <span className="h-0.5 w-5 bg-white" />
            </span>
          </button>

          <a href="/" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
              <img src={TRSCLogo} alt="TRSC logo" className="h-7 w-7 rounded-full" />
            </span>
            <span className="truncate text-sm font-semibold">TRSC SkillKita</span>
          </a>

          <a
            href={profileHref}
            aria-label={isAdmin || isEmployer ? "Open profile" : "Log in"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10"
            title={viewerEmail ?? viewerName}
          >
            <UserCircleIcon className="h-7 w-7 text-white" />
          </a>
        </div>

        {/* Desktop: logo + center nav + auth/profile menus */}
        <a href="/" className="hidden min-w-0 shrink items-center gap-3 md:flex">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
            <img src={TRSCLogo} alt="TRSC logo" className="h-8 w-8 rounded-full" />
          </span>
          <span className="truncate text-sm font-semibold md:text-base">TRSC SkillKita</span>
        </a>

        {/* Center: Home + Courses (public and admin) */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {PRIMARY_NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/95 hover:bg-white/10"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {!hasAuthSession && (
            <>
              <a
                href="/signup"
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#7A1F1F] hover:bg-white/90"
              >
                Sign up
              </a>
              <a
                href="/login"
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Log in
              </a>
            </>
          )}

          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAdminMenuOpen((p) => !p)}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                aria-expanded={isAdminMenuOpen}
              >
                Admin
              </button>
              {isAdminMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl bg-white p-2 text-[#7A1F1F] shadow-lg ring-1 ring-black/5">
                  <a
                    href="/#about-us"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    About Us
                  </a>
                  <a
                    href="/#courses"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Company Experience
                  </a>
                  <a
                    href="/admin/landing"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Manage Home
                  </a>
                  <a
                    href="/courses"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Browse Course
                  </a>
                  <a
                    href="/admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Manage Course
                  </a>
                  <a
                    href="/admin/quotations"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Quotation
                  </a>
                  <a
                    href="/admin/messages?role=admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Chat
                  </a>
                  <a
                    href="/admin/users"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Manage Users
                  </a>
                  <a
                    href="/admin/profile?role=admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Profile
                  </a>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {isEmployer && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEmployerMenuOpen((p) => !p)}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                aria-expanded={isEmployerMenuOpen}
              >
                Employer
              </button>
              {isEmployerMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl bg-white p-2 text-[#7A1F1F] shadow-lg ring-1 ring-black/5">
                  <a
                    href="/employer/quotation"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Quotation
                  </a>
                  <a
                    href="/employer"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Documents
                  </a>
                  <a
                    href="/employer/talk-to-admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Talk to Admin
                  </a>
                  <a
                    href="/employer/profile"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Profile
                  </a>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}

          {hasAuthSession && !isAdmin && !isEmployer && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((p) => !p)}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                aria-expanded={isAccountMenuOpen}
              >
                {employerStatus === "pending"
                  ? "Employer (pending)"
                  : employerStatus === "rejected"
                    ? "Employer (rejected)"
                    : "Account"}
              </button>
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-xl bg-white p-2 text-[#7A1F1F] shadow-lg ring-1 ring-black/5">
                  <div className="px-3 py-2 text-xs text-black/70">
                    <div className="font-semibold text-[#7A1F1F]">{viewerName}</div>
                    {viewerEmail && <div className="mt-1 break-all">{viewerEmail}</div>}
                    {employerStatus === "pending" && (
                      <div className="mt-2 text-[11px] leading-snug">
                        Your employer account is pending admin approval. You can browse public pages and update your
                        profile while you wait.
                      </div>
                    )}
                    {employerStatus === "rejected" && (
                      <div className="mt-2 text-[11px] leading-snug text-red-700">
                        Your employer request was rejected. Please contact support if you believe this is a mistake.
                      </div>
                    )}
                  </div>

                  <a
                    href="/courses"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Browse courses
                  </a>

                  {(employerStatus === "pending" || employerStatus === "rejected") && (
                    <a
                      href="/employer/profile"
                      className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                    >
                      Profile
                    </a>
                  )}

                  <a
                    href="/login?stay=1"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Account / sign-in status
                  </a>

                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
