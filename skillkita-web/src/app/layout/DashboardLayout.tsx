import { useEffect, useMemo, useState } from "react";
import LeftNav, { type NavItem } from "./LeftNav";
import SiteHeader from "./SiteHeader";
import { DASHBOARD_SIDEBAR_WIDTH_PX, useDashboardMainInset } from "./DashboardMainInsetContext";

type Props = {
  items: NavItem[];
  userName: string;
  userEmail?: string | null;
  onLogout: () => void | Promise<void>;
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
  const { setDesktopInsetPx } = useDashboardMainInset();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
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
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {showHeader && <SiteHeader onMenuClick={() => setMobileOpen(true)} />}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
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


