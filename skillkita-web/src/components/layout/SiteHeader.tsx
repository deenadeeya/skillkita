import { useEffect, useState } from "react";
import TRSCLogo from "../../assets/TRSCLogo.png";
import { supabase } from "../../lib/supabaseClient";

type HeaderLink = {
  label: string;
  href: string;
};

type SiteHeaderProps = {
  menuLinks: HeaderLink[];
};

const SiteHeader = ({ menuLinks }: SiteHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const role = window.localStorage.getItem("skillkita-role");
      setIsAdmin(Boolean(data.session?.user) && role === "admin");
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

  return (
    <header className="sticky top-0 z-40 w-full bg-[#7A1F1F] text-white shadow-sm">
      <div className="sk-container relative flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <img src={TRSCLogo} alt="TRSC logo" className="h-8 w-8 rounded-full" />
          </span>
          <span className="hidden text-sm font-semibold sm:block md:text-base">
            Tawau Resources & Skills Centre
          </span>
          <span className="text-sm font-semibold sm:hidden">TRSC</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {menuLinks.map((link) => (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/95 hover:bg-white/10"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!isAdmin && (
            <a href="/admin/login" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15">
              Admin Login
            </a>
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
                <div className="absolute right-0 top-12 w-64 rounded-xl bg-white p-2 text-[#7A1F1F] shadow-lg ring-1 ring-black/5">
                  <a
                    href="/admin?role=admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Manage Course
                  </a>
                  <a
                    href="/admin/landing?role=admin"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                  >
                    Manage Company Profile
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
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 bg-white/10 md:hidden"
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span className="h-0.5 w-5 bg-white" />
            <span className="h-0.5 w-5 bg-white" />
            <span className="h-0.5 w-5 bg-white" />
          </span>
        </button>

        {isMenuOpen && (
          <nav className="absolute right-4 top-[4.25rem] w-64 rounded-xl bg-white p-2 text-[#7A1F1F] shadow-lg ring-1 ring-black/5 md:hidden">
            {menuLinks.map((link) => (
              <a
                key={`${link.label}-${link.href}`}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
              >
                {link.label}
              </a>
            ))}

            <div className="my-2 h-px bg-black/10" />

            {!isAdmin && (
              <a
                href="/admin/login"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
              >
                Admin Login
              </a>
            )}

            {isAdmin && (
              <>
                <a
                  href="/admin?role=admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Manage Course
                </a>
                <a
                  href="/admin/landing?role=admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F5F1E8]"
                >
                  Manage Company Profile
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
          </nav>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;