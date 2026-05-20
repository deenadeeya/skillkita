import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";

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
  userEmail?: string | null;
  onLogout: () => void | Promise<void>;
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

const navTransition = "transition-colors duration-150";

/** Top-level section (Home, Course, Documents, …) */
const categoryBtnClass = (active: boolean) =>
  [
    "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold",
    navTransition,
    active
      ? "bg-[#7A1F1F]/12 text-[#7A1F1F] hover:bg-[#7A1F1F]/20"
      : "text-black/80 hover:bg-[#7A1F1F]/10 hover:text-[#7A1F1F]",
  ].join(" ");

/** Subsection with nested children (e.g. Quotation under Documents) */
const subsectionToggleClass = (hasActiveDescendant: boolean) =>
  [
    "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold",
    navTransition,
    hasActiveDescendant
      ? "bg-[#7A1F1F]/12 text-[#7A1F1F] hover:bg-[#7A1F1F]/20"
      : "text-black/70 hover:bg-[#7A1F1F]/14 hover:text-[#7A1F1F]",
  ].join(" ");

/** Leaf link (direct child or grandchild) */
const linkClass = (active: boolean) =>
  [
    "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
    navTransition,
    active
      ? "bg-[#7A1F1F] text-white hover:bg-[#651919]"
      : "text-black/70 hover:bg-[#7A1F1F]/14 hover:text-[#7A1F1F]",
  ].join(" ");

const categoryIconClass =
  "h-5 w-5 shrink-0 text-[#7A1F1F] transition-colors duration-150 group-hover:text-[#651919]";

const subsectionIconClass =
  "h-5 w-5 shrink-0 text-[#7A1F1F] transition-colors duration-150 group-hover:text-[#651919]";

const linkIconClass = (active: boolean) =>
  [
    "h-5 w-5 shrink-0 transition-colors duration-150",
    active ? "text-white group-hover:text-white" : "text-[#7A1F1F] group-hover:text-[#651919]",
  ].join(" ");

const chevronClass = (open: boolean) =>
  [
    "h-4 w-4 shrink-0 text-[#7A1F1F] transition duration-150 group-hover:text-[#651919]",
    open ? "rotate-180" : "",
  ].join(" ");

const LeftNav = ({ items, currentPath, userName, userEmail, onLogout }: Props) => {
  const initialOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    items.forEach((cat) => {
      open[cat.label] = isItemActive(cat, currentPath);
    });
    return open;
  }, [items, currentPath]);

  const [openByLabel, setOpenByLabel] = useState<Record<string, boolean>>(initialOpen);
  const [openChildByKey, setOpenChildByKey] = useState<Record<string, boolean>>({});

  return (
    <aside className="flex h-full w-full flex-col border-r border-black/10 bg-white md:w-[280px] md:shrink-0">
      <nav className="flex-1 overflow-auto p-3">
        {items.map((cat) => {
          const open = openByLabel[cat.label] ?? false;
          const active = isItemActive(cat, currentPath);
          const CatIcon = cat.icon;

          return (
            <div key={cat.label} className="mb-2">
              <button
                type="button"
                onClick={() => setOpenByLabel((p) => ({ ...p, [cat.label]: !open }))}
                className={categoryBtnClass(active)}
              >
                <span className="flex items-center gap-2">
                  {CatIcon && <CatIcon className={categoryIconClass} />}
                  {cat.label}
                </span>
                <ChevronDownIcon className={chevronClass(open)} />
              </button>

              {open && (cat.children?.length ?? 0) > 0 && (
                <div className="mt-1 space-y-1 pl-2">
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
                              <span className="flex items-center gap-2">
                                {ChildIcon && <ChildIcon className={subsectionIconClass} />}
                                {child.label}
                              </span>
                              <ChevronDownIcon className={chevronClass(childOpen)} />
                            </button>
                            {childOpen && (
                              <div className="mt-1 space-y-1 pl-4">
                                {(child.children ?? []).map((g) => {
                                  const grandActive = isLinkActive(g.href, currentPath);
                                  const GrandIcon = g.icon;
                                  return (
                                    <a
                                      key={g.label}
                                      href={g.href ?? "#"}
                                      className={linkClass(grandActive)}
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
                          <a href={child.href ?? "#"} className={linkClass(childActive)}>
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

      <div className="border-t border-black/10 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#7A1F1F]/10 text-[#7A1F1F] ring-1 ring-black/5">
            <div className="flex h-full w-full items-center justify-center text-sm font-bold">
              {(userName.trim()[0] ?? "U").toUpperCase()}
            </div>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-black">{userName}</p>
            {userEmail && <p className="truncate text-xs text-black/60">{userEmail}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-3 w-full rounded-xl border border-[#7A1F1F] px-3 py-2 text-sm font-semibold text-[#7A1F1F] transition-colors duration-150 hover:bg-[#7A1F1F]/12"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default LeftNav;
