import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/** Matches `DashboardLayout` desktop left nav width. */
export const DASHBOARD_SIDEBAR_WIDTH_PX = 220;

type Ctx = {
  desktopInsetPx: number;
  setDesktopInsetPx: (px: number) => void;
};

const DashboardMainInsetContext = createContext<Ctx | null>(null);

export function DashboardMainInsetProvider({ children }: { children: ReactNode }) {
  const [desktopInsetPx, setDesktopInsetPx] = useState(0);
  const value = useMemo(
    () => ({ desktopInsetPx, setDesktopInsetPx }),
    [desktopInsetPx]
  );
  return <DashboardMainInsetContext.Provider value={value}>{children}</DashboardMainInsetContext.Provider>;
}

export function useDashboardMainInset() {
  const ctx = useContext(DashboardMainInsetContext);
  if (!ctx) {
    throw new Error("useDashboardMainInset must be used within DashboardMainInsetProvider");
  }
  return ctx;
}
