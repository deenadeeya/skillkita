import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import { hideImageOnError } from "../../shared/ui/hideImageOnError";

export type NavItem = {
  label: string;
  href?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children?: NavItem[];
};

type Props = {
  items: NavItem[];
  currentPath: string;
  userName: string;
  userRole?: string;
  userEmail?: string | null;
  profilePicUrl?: string | null;
  onLogout: () => void | Promise<void>;
  onNavigate?: () => void;
};

function isItemActive(item: NavItem, currentPath: string): boolean {
  if (item.href && item.href === currentPath) return true;
  return (item.children ?? []).some((c) => isItemActive(c, currentPath));
}

function isLinkActive(href: string | undefined, currentPath: string): boolean {
  if (!href) return false;
  const path = href.split("?")[0] ?? href;
  return currentPath === path || currentPath.startsWith(path + "/");
}

const navTransition = "transition-all duration-200 ease-out";

const categoryBtnClass = (active: boolean) =>
  [
    "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium",
    navTransition,
    active
      ? "bg-primary/10 text-primary"
      : "text-ink-muted hover:bg-primary/5 hover:text-primary",
  ].join(" ");

const subsectionToggleClass = (hasActiveDescendant: boolean) =>
  [
    "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium",
    navTransition,
    hasActiveDescendant
      ? "bg-primary/10 text-primary"
      : "text-ink-muted hover:bg-primary/5 hover:text-primary",
  ].join(" ");

const linkClass = (active: boolean) =>
  [
    "group flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
    navTransition,
    active
      ? "bg-primary text-white shadow-sm"
      : "text-ink-muted hover:bg-primary/5 hover:text-primary",
  ].join(" ");

const categoryIconClass =
  "h-5 w-5 shrink-0 text-primary/80 transition-colors duration-200 group-hover:text-primary";

const linkIconClass = (active: boolean) =>
  [
    "h-5 w-5 shrink-0 transition-colors duration-200",
    active ? "text-white" : "text-primary/70 group-hover:text-primary",
  ].join(" ");

const chevronClass = (open: boolean) =>
  ["h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200", open ? "rotate-180" : ""].join(
    " "
  );

const LeftNav = ({
  items,
  currentPath,
  userName,
  userRole,
  userEmail,
  profilePicUrl,
  onLogout,
  onNavigate,
}: Props) => {
  const initialOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    items.forEach((cat) => {
      open[cat.label] = isItemActive(cat, currentPath);
    });
    return open;
  }, [items, currentPath]);

  const [openByLabel, setOpenByLabel] = useState<Record<string, boolean>>(initialOpen);
  const [openChildByKey, setOpenChildByKey] = useState<Record<string, boolean>>({});

  const initials = (userName.trim()[0] ?? "U").toUpperCase();
  const roleLabel =
    userRole === "admin" ? "Administrator" : userRole === "employer" ? "Employer" : "User";

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <nav className="flex-1 overflow-auto px-3 py-4">
        {items.map((cat) => {
          const hasChildren = (cat.children?.length ?? 0) > 0;
          const CatIcon = cat.icon;

          if (!hasChildren && cat.href) {
            const active = isLinkActive(cat.href, currentPath);
            return (
              <div key={cat.label} className="mb-1">
                <a
                  href={cat.href}
                  className={linkClass(active)}
                  onClick={onNavigate}
                >
                  {CatIcon && <CatIcon className={linkIconClass(active)} />}
                  {cat.label}
                </a>
              </div>
            );
          }

          const open = openByLabel[cat.label] ?? false;
          const active = isItemActive(cat, currentPath);

          return (
            <div key={cat.label} className="mb-1">
              <button
                type="button"
                onClick={() => setOpenByLabel((p) => ({ ...p, [cat.label]: !open }))}
                className={categoryBtnClass(active)}
              >
                <span className="flex items-center gap-2.5">
                  {CatIcon && <CatIcon className={categoryIconClass} />}
                  {cat.label}
                </span>
                <ChevronDownIcon className={chevronClass(open)} />
              </button>

              {open && (cat.children?.length ?? 0) > 0 && (
                <div className="mt-1 space-y-0.5 border-l-2 border-primary/10 pl-3">
                  {(cat.children ?? []).map((child) => {
                    const childHrefActive = isLinkActive(child.href, currentPath);
                    const hasActiveGrandchild = (child.children ?? []).some((g) =>
                      isLinkActive(g.href, currentPath)
                    );
                    const childActive = childHrefActive || hasActiveGrandchild;
                    const ChildIcon = child.icon;
                    const childKey = `${cat.label}::${child.label}`;
                    const hasGrandChildren = (child.children?.length ?? 0) > 0;
                    const childOpen = openChildByKey[childKey] ?? childActive;

                    return (
                      <div key={child.label}>
                        {hasGrandChildren ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenChildByKey((p) => ({ ...p, [childKey]: !childOpen }))
                              }
                              className={subsectionToggleClass(childActive)}
                            >
                              <span className="flex items-center gap-2.5">
                                {ChildIcon && <ChildIcon className={categoryIconClass} />}
                                {child.label}
                              </span>
                              <ChevronDownIcon className={chevronClass(childOpen)} />
                            </button>
                            {childOpen && (
                              <div className="mt-0.5 space-y-0.5 pl-2">
                                {(child.children ?? []).map((g) => {
                                  const grandActive = isLinkActive(g.href, currentPath);
                                  const GrandIcon = g.icon;
                                  return (
                                    <a
                                      key={g.label}
                                      href={g.href ?? "#"}
                                      className={linkClass(grandActive)}
                                      onClick={onNavigate}
                                    >
                                      {GrandIcon && (
                                        <GrandIcon className={linkIconClass(grandActive)} />
                                      )}
                                      {g.label}
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        ) : (
                          <a
                            href={child.href ?? "#"}
                            className={linkClass(childActive)}
                            onClick={onNavigate}
                          >
                            {ChildIcon && <ChildIcon className={linkIconClass(childActive)} />}
                            {child.label}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-black/5 p-4">
        <div className="flex items-center gap-3">
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-primary/15"
              onError={hideImageOnError}
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/15">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{userName}</p>
            <p className="truncate text-xs text-ink-muted">{roleLabel}</p>
            {userEmail && (
              <p className="mt-0.5 truncate text-[11px] text-ink-muted/80">{userEmail}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-primary/30 px-3 py-2 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-white"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default LeftNav;
