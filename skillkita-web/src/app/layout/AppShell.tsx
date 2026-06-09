import { Outlet } from "react-router-dom";
import { CourseAssistantWidget } from "../../features/course-assistant/components/CourseAssistantWidget";
import NotificationRouteSync from "../../features/notifications/NotificationRouteSync";
import { DashboardMainInsetProvider } from "./DashboardMainInsetContext";
import SiteFooter from "./SiteFooter";

/** Wraps all routes: main content grows; footer stays at the bottom on short pages. */
const AppShell = () => {
  return (
    <DashboardMainInsetProvider>
      <div className="flex min-h-screen flex-col">
        <NotificationRouteSync />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
        <SiteFooter />
        <CourseAssistantWidget />
      </div>
    </DashboardMainInsetProvider>
  );
};

export default AppShell;
