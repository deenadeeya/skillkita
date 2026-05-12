import { Outlet } from "react-router-dom";
import { DashboardMainInsetProvider } from "./DashboardMainInsetContext";
import SiteFooter from "./SiteFooter";

/** Wraps all routes: main content grows; footer stays at the bottom on short pages. */
const AppShell = () => {
  return (
    <DashboardMainInsetProvider>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
        <SiteFooter />
      </div>
    </DashboardMainInsetProvider>
  );
};

export default AppShell;
