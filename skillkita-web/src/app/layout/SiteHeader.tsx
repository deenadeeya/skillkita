import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useRef, useState } from "react";
const TRSC_LOGO_SRC = "/TRSCLogo.png";
import NotificationBell from "../../features/notifications/NotificationBell";
import { signOutAndRedirectHome } from "../../shared/auth/signOutAndRedirectHome";
import { useViewer } from "../../shared/hooks/useViewer";
import { adminNavItems, employerNavItems, flattenNavLinks } from "./navItems";

const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Company Experience", href: "/company-experience" },
  { label: "Courses", href: "/courses" },
  
] as const;

type Props = {
  /** When provided, the mobile hamburger triggers this (e.g. open LeftNav drawer). */
  onMenuClick?: () => void;
};

const dropdownLinkClass =
  "block rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-paper";

type UserNavMenuProps = {
  links: { label: string; href: string }[];
  buttonClassName: string;
  iconClassName: string;
  title?: string | null;
  onLogout: () => void;
};

function HeaderUserNavMenu({
  links,
  buttonClassName,
  iconClassName,
  title,
  onLogout,
}: UserNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen]);

  return (
    <div ref={menuRef} className={["relative", isOpen ? "z-[80]" : "z-0"].join(" ")}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        className={buttonClassName}
        title={title ?? undefined}
      >
        <UserCircleIcon className={iconClassName} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-14 z-[70] max-h-[70vh] w-64 overflow-y-auto rounded-xl bg-white p-2 text-primary shadow-lg ring-1 ring-black/5">
          {links.map((link) => (
            <a
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={dropdownLinkClass}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className={`mt-1 w-full text-left ${dropdownLinkClass}`}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

const SiteHeader = ({ onMenuClick }: Props) => {
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

  const userNavLinks = useMemo(() => {
    if (isAdmin) return flattenNavLinks(adminNavItems);
    if (isEmployer) return flattenNavLinks(employerNavItems);
    return [];
  }, [isAdmin, isEmployer]);

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
            {isAdmin || isEmployer ? (
              <HeaderUserNavMenu
                links={userNavLinks}
                title={viewerEmail ?? viewerName}
                onLogout={signOut}
                buttonClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10"
                iconClassName="h-7 w-7 text-white"
              />
            ) : (
              <a
                href={hasAuthSession ? "/login?stay=1" : "/login"}
                aria-label="Log in"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10"
                title={viewerEmail ?? viewerName}
              >
                <UserCircleIcon className="h-7 w-7 text-white" />
              </a>
            )}
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
              <HeaderUserNavMenu
                links={userNavLinks}
                title={viewerEmail ?? viewerName}
                onLogout={signOut}
                buttonClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10"
                iconClassName="h-8 w-8 text-white"
              />
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


