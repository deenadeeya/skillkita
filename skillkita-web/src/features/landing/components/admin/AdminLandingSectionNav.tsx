export type AdminLandingTabId = "site-images" | "social-profiles" | "about-us" | "homepage-cms";

export const ADMIN_LANDING_TABS: { id: AdminLandingTabId; label: string }[] = [
  { id: "site-images", label: "Site images" },
  { id: "social-profiles", label: "Social profiles" },
  { id: "about-us", label: "About Us" },
  { id: "homepage-cms", label: "Homepage CMS" },
];

type NavProps = {
  activeTab: AdminLandingTabId;
  onTabChange: (tab: AdminLandingTabId) => void;
};

export function AdminLandingSectionNav({ activeTab, onTabChange }: NavProps) {
  return (
    <nav className="sk-card mb-2 p-2 md:p-3" aria-label="Manage Home sections" role="tablist">
      <div className="flex flex-wrap gap-2">
        {ADMIN_LANDING_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`landing-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`landing-panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={[
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-ink hover:bg-primary/5 hover:text-primary",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

type TabLinkProps = {
  tab: AdminLandingTabId;
  onNavigate: (tab: AdminLandingTabId) => void;
  children?: string;
};

export function AdminLandingTabLink({ tab, onNavigate, children }: TabLinkProps) {
  const label = children ?? ADMIN_LANDING_TABS.find((item) => item.id === tab)?.label ?? tab;

  return (
    <button
      type="button"
      onClick={() => onNavigate(tab)}
      className="font-semibold text-primary underline hover:text-primary-dark"
    >
      {label}
    </button>
  );
}
