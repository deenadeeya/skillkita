import { Bars3Icon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState } from "react";
import LeftNav, { type NavItem } from "./LeftNav";
import SiteHeader from "./SiteHeader";

type Props = {
  items: NavItem[];
  userName: string;
  userEmail?: string | null;
  onLogout: () => void;
  children: React.ReactNode;
  /** If false, parent page renders its own header. */
  showHeader?: boolean;
};

const DashboardLayout = ({
  items,
  userName,
  userEmail,
  onLogout,
  children,
  showHeader = true,
}: Props) => {
  const currentPath = useMemo(() => window.location.pathname.replace(/\/+$/, "") || "/", []);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {showHeader && <SiteHeader />}

      <div className="md:hidden">
        <header
          className={[
            "sticky z-40 flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3",
            showHeader ? "top-16" : "top-0",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => setMobileOpen((p) => !p)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white"
            aria-label="Toggle navigation"
          >
            <Bars3Icon className="h-6 w-6 text-[#7A1F1F]" />
          </button>
          <p className="truncate text-sm font-semibold text-[#7A1F1F]">Menu</p>
          <div className="h-10 w-10" />
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setMobileOpen(false)}>
            <div className="h-full w-[320px] bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="h-full overflow-auto">
                <LeftNav
                  items={items}
                  currentPath={currentPath}
                  userName={userName}
                  userEmail={userEmail}
                  onLogout={onLogout}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop sticky sidebar */}
      <div className="hidden md:block">
        <div className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-[280px]">
          <LeftNav
            items={items}
            currentPath={currentPath}
            userName={userName}
            userEmail={userEmail}
            onLogout={onLogout}
          />
        </div>
      </div>

      {/* Content */}
      <div className="w-full md:pl-[280px]">
        <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;

