import { useAutoMarkNotificationsForRoute } from "./useAutoMarkNotificationsForRoute";

/** Marks quotation / document notifications read when the current route matches their target page. */
export default function NotificationRouteSync() {
  useAutoMarkNotificationsForRoute();
  return null;
}
