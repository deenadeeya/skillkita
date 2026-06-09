import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { autoMarkNotificationsForLocation } from "./autoMarkNotifications";

/** Clears quotation / document notifications when the user visits the related admin or employer page. */
export function useAutoMarkNotificationsForRoute() {
  const location = useLocation();

  useEffect(() => {
    void autoMarkNotificationsForLocation(location.pathname, location.search);
  }, [location.pathname, location.search]);
}
