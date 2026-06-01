import { useEffect, useMemo, useState } from "react";
import LeftNav, { type NavItem } from "./LeftNav";
import SiteHeader from "./SiteHeader";
import { DASHBOARD_SIDEBAR_WIDTH_PX, useDashboardMainInset } from "./DashboardMainInsetContext";

type Props = {
  items: NavItem[];
  userName: string;
  userRole?: string;
  userEmail?: string | null;
  profilePicUrl?: string | null;
  onLogout: () => void | Promise<void>;
  children: React.ReactNode;
  /** If false, parent page renders its own header. */
  showHeader?: boolean;
  /** Full-width homepage layout without max-width constraint. */
  fullWidth?: boolean;
};

const DashboardLayout = ({
  items,
  userName,
  userRole,
  userEmail,
  profilePicUrl,
  onLogout,
  children,
  showHeader = true,
  fullWidth = false,
}: Props) => {
  const currentPath = useMemo(() => window.location.pathname.replace(/\/+$/, "") || "/", []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setDesktopInsetPx } = useDashboardMainInset();

  const headerOffset = showHeader ? "72px" : "0px";

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setDesktopInsetPx(mq.matches ? DASHBOARD_SIDEBAR_WIDTH_PX : 0);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      setDesktopInsetPx(0);
    };
  }, [setDesktopInsetPx]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const mainClass = fullWidth
    ? "sk-page-container w-full min-w-0 max-w-none"
    : "sk-page-container min-w-0 max-w-content";

  return (
    <div className="min-h-screen bg-paper">
      {showHeader && <SiteHeader onMenuClick={() => setMobileOpen(true)} />}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          role="presentation"
        >
          <div
            className="h-full w-[220px] max-w-[85vw] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full overflow-auto">
              <LeftNav
                items={items}
                currentPath={currentPath}
                userName={userName}
                userRole={userRole}
                userEmail={userEmail}
                profilePicUrl={profilePicUrl}
                onLogout={onLogout}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop: sidebar + main in a two-column grid (no fixed overlay). */}
      <div
        className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)]"
        style={{ minHeight: showHeader ? `calc(100vh - ${headerOffset})` : "100vh" }}
      >
        <aside
          className="hidden lg:block lg:sticky lg:self-start lg:overflow-hidden lg:border-r lg:border-black/5 lg:bg-white"
          style={{
            top: headerOffset,
            height: showHeader ? `calc(100vh - ${headerOffset})` : "100vh",
            width: DASHBOARD_SIDEBAR_WIDTH_PX,
          }}
        >
          <LeftNav
            items={items}
            currentPath={currentPath}
            userName={userName}
            userRole={userRole}
            userEmail={userEmail}
            profilePicUrl={profilePicUrl}
            onLogout={onLogout}
          />
        </aside>

        <div className="min-w-0">
          <main className={mainClass}>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
