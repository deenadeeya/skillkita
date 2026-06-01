import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
const TRSC_LOGO_SRC = "/TRSCLogo.png";
import NotificationBell from "../../features/notifications/NotificationBell";
import { signOutAndRedirectHome } from "../../shared/auth/signOutAndRedirectHome";
import { useViewer } from "../../shared/hooks/useViewer";

const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Company Experience", href: "/company-experience" },
  { label: "Courses", href: "/courses" },
  { label: "Contact", href: "/about-us" },
] as const;

type Props = {
  /** When provided, the mobile hamburger triggers this (e.g. open LeftNav drawer). */
  onMenuClick?: () => void;
};

const SiteHeader = ({ onMenuClick }: Props) => {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isEmployerMenuOpen, setIsEmployerMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const viewerState = useViewer();

  const useBuiltInMobileNav = !onMenuClick;

  const hasAuthSession =
    viewerState.kind === "signedIn" || viewerState.kind === "signedInNoProfile";

  const viewerEmail =
    viewerState.kind === "signedIn"
      ? viewerState.viewer.email
      : viewerState.kind === "signedInNoProfile"
        ? viewerState.email
        : null;

  const viewerName =
    viewerState.kind === "signedIn"
      ? viewerState.viewer.fullName?.trim()
        ? viewerState.viewer.fullName
        : viewerState.viewer.role === "admin"
          ? "Admin"
          : "Employer"
      : "User";

  const isAdmin = viewerState.kind === "signedIn" && viewerState.viewer.role === "admin";
  const employerStatus =
    viewerState.kind === "signedIn" && viewerState.viewer.role === "employer"
      ? viewerState.viewer.status
      : null;
  const isEmployer = Boolean(employerStatus && employerStatus !== "rejected");

  const signOut = () => {
    void signOutAndRedirectHome();
  };

  const profileHref = useMemo(() => {
    if (isAdmin) return "/admin/profile?role=admin";
    if (isEmployer) return "/employer/profile";
    if (employerStatus === "rejected") return "/employer/profile";
    return hasAuthSession ? "/login?stay=1" : "/login";
  }, [employerStatus, hasAuthSession, isAdmin, isEmployer]);

  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-white shadow-md">
      <div className="relative flex h-header min-h-[72px] w-full items-center justify-between gap-4 px-4 md:px-6">
        {/* Mobile: hamburger (left) + centered title + profile (right) */}
        <div className="flex w-full items-center justify-between md:hidden">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => {
              if (onMenuClick) {
                onMenuClick();
                return;
              }
              setIsMobileNavOpen((open) => !open);
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10"
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
              <img
                src={TRSC_LOGO_SRC}
                alt="TRSC logo"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full"
                decoding="async"
              />
            </span>
            <span className="truncate text-sm font-semibold">TRSC SkillKita</span>
          </a>

          <div className="flex shrink-0 items-center gap-2">
            {viewerState.kind === "signedIn" && (isAdmin || isEmployer) && (
              <NotificationBell viewer={viewerState.viewer} />
            )}
            <a
              href={profileHref}
              aria-label={isAdmin || isEmployer ? "Open profile" : "Log in"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10"
              title={viewerEmail ?? viewerName}
            >
              <UserCircleIcon className="h-7 w-7 text-white" />
            </a>
          </div>
        </div>

        {/* Desktop: logo + center nav + auth/profile menus */}
        <a href="/" className="hidden min-w-0 shrink items-center gap-3 md:flex">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
            <img
              src={TRSC_LOGO_SRC}
              alt="TRSC logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
              decoding="async"
            />
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
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90"
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
            <div className={["relative", isAdminMenuOpen ? "z-[80]" : "z-0"].join(" ")}>
              <button
                type="button"
                onClick={() => setIsAdminMenuOpen((p) => !p)}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                aria-expanded={isAdminMenuOpen}
              >
                Admin
              </button>
              {isAdminMenuOpen && (
                <div className="absolute right-0 top-14 z-[70] w-64 rounded-xl bg-white p-2 text-primary shadow-lg ring-1 ring-black/5">
                  <a
                    href="/about-us"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    About Us
                  </a>
                  <a
                    href="/company-experience"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Company Experience
                  </a>
                  <a
                    href="/admin/landing"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Manage Home
                  </a>
                  <a
                    href="/courses"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Browse Course
                  </a>
                  <a
                    href="/admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Manage Course
                  </a>
                  <a
                    href="/admin/quotations"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Quotation
                  </a>
                  <a
                    href="/admin/messages?role=admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Chat
                  </a>
                  <a
                    href="/admin/users"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Manage Users
                  </a>
                  <a
                    href="/admin/profile?role=admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Profile
                  </a>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-paper"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {isEmployer && (
            <div className={["relative", isEmployerMenuOpen ? "z-[80]" : "z-0"].join(" ")}>
              <button
                type="button"
                onClick={() => setIsEmployerMenuOpen((p) => !p)}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                aria-expanded={isEmployerMenuOpen}
              >
                Employer
              </button>
              {isEmployerMenuOpen && (
                <div className="absolute right-0 top-14 z-[70] w-64 rounded-xl bg-white p-2 text-primary shadow-lg ring-1 ring-black/5">
                  <a
                    href="/employer/quotation"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Quotation
                  </a>
                  <a
                    href="/employer"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Documents
                  </a>
                  <a
                    href="/employer/talk-to-admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Talk to Admin
                  </a>
                  <a
                    href="/employer/profile"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Profile
                  </a>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-paper"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}

          {hasAuthSession && !isAdmin && !isEmployer && (
            <div className={["relative", isAccountMenuOpen ? "z-[80]" : "z-0"].join(" ")}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((p) => !p)}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                aria-expanded={isAccountMenuOpen}
              >
                {employerStatus === "rejected" ? "Employer (rejected)" : "Account"}
              </button>
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-12 z-[70] w-72 rounded-xl bg-white p-2 text-primary shadow-lg ring-1 ring-black/5">
                  <div className="px-3 py-2 text-xs text-ink-muted">
                    <div className="font-semibold text-primary">{viewerName}</div>
                    {viewerEmail && <div className="mt-1 break-all">{viewerEmail}</div>}
                    {employerStatus === "rejected" && (
                      <div className="mt-2 text-[11px] leading-snug text-red-700">
                        Your employer request was rejected. Please contact support if you believe this is a mistake.
                      </div>
                    )}
                  </div>

                  <a
                    href="/courses"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Browse courses
                  </a>

                  {employerStatus === "rejected" && (
                    <a
                      href="/employer/profile"
                      className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                    >
                      Profile
                    </a>
                  )}

                  <a
                    href="/login?stay=1"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper"
                  >
                    Account / sign-in status
                  </a>

                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-paper"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}

          {viewerState.kind === "signedIn" && (isAdmin || isEmployer) && (
            <div className="relative z-10 flex items-center gap-2">
              <NotificationBell viewer={viewerState.viewer} />
              <a
                href={profileHref}
                aria-label="Open profile"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10"
                title={viewerEmail ?? viewerName}
              >
                <UserCircleIcon className="h-8 w-8 text-white" />
              </a>
            </div>
          )}
        </div>
      </div>

      {useBuiltInMobileNav && isMobileNavOpen && (
        <nav className="border-t border-white/20 bg-primary-dark px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {PRIMARY_NAV.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default SiteHeader;


