import { useEffect, useState } from "react";
import TRSCLogo from "../../assets/TRSCLogo.png";
import { supabase } from "../../lib/supabaseClient";

const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
] as const;

const SiteHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isEmployerMenuOpen, setIsEmployerMenuOpen] = useState(false);

  type ProfileRow = {
    role: "admin" | "employer";
    status: "pending" | "approved" | "rejected";
  };

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        setIsAdmin(false);
        setIsEmployer(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role,status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !profile) {
        setIsAdmin(false);
        setIsEmployer(false);
        return;
      }

      const row = profile as ProfileRow;
      setIsAdmin(row.role === "admin");
      setIsEmployer(row.role === "employer" && row.status === "approved");
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

  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#7A1F1F] text-white shadow-sm">
      <div className="relative flex h-16 w-full items-center justify-between gap-4 px-4 md:px-6">
        <a href="/" className="flex min-w-0 shrink items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
            <img src={TRSCLogo} alt="TRSC logo" className="h-8 w-8 rounded-full" />
          </span>
          <span className="hidden truncate text-sm font-semibold sm:block md:text-base">
            TRSC SkillKita
          </span>
          <span className="truncate text-sm font-semibold sm:hidden">SkillKita</span>
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
          {!isAdmin && !isEmployer && (
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
                    href="/admin/landing"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Manage Landing Page
                  </a>
                  <a
                    href="/admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Manage Course
                  </a>
                  <a
                    href="/admin/users"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Manage Users
                  </a>
                  <a
                    href="/admin/quotations"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Quotations
                  </a>
                  <a
                    href="/admin/messages?role=admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Messages
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
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10 md:hidden"
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span className="h-0.5 w-5 bg-white" />
            <span className="h-0.5 w-5 bg-white" />
            <span className="h-0.5 w-5 bg-white" />
          </span>
        </button>

        {isMenuOpen && (
          <nav className="absolute right-4 top-[4.25rem] z-50 w-64 rounded-xl bg-white p-2 text-[#7A1F1F] shadow-lg ring-1 ring-black/5 md:hidden">
            {PRIMARY_NAV.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
              >
                {link.label}
              </a>
            ))}

            <div className="my-2 h-px bg-black/10" />

            {!isAdmin && !isEmployer && (
              <>
                <a
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Sign up
                </a>
                <a
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Log in
                </a>
              </>
            )}

            {isAdmin && (
              <>
                <a
                  href="/admin/landing"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Manage Landing Page
                </a>
                <a
                  href="/admin"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Manage Course
                </a>
                <a
                  href="/admin/users"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Manage Users
                </a>
                <a
                  href="/admin/quotations"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Quotations
                </a>
                <a
                  href="/admin/messages?role=admin"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Messages
                </a>
                <a
                  href="/admin/profile?role=admin"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Profile
                </a>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Logout
                </button>
              </>
            )}

            {isEmployer && (
              <>
                <a
                  href="/employer/quotation"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Quotation
                </a>
                <a
                  href="/employer"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Documents
                </a>
                <a
                  href="/employer/talk-to-admin"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Talk to Admin
                </a>
                <a
                  href="/employer/profile"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Profile
                </a>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Log Out
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;
