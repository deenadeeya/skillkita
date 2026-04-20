import {
  ChevronDownIcon,
} from "@heroicons/react/24/solid";
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

const LeftNav = ({
  items,
  currentPath,
  userName,
  userEmail,
  onLogout,
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
                className={[
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold",
                  active ? "bg-[#7A1F1F]/10 text-[#7A1F1F]" : "text-black/80 hover:bg-black/5",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  {CatIcon && <CatIcon className="h-5 w-5 text-[#7A1F1F]" />}
                  {cat.label}
                </span>
                <ChevronDownIcon className={["h-4 w-4 transition", open ? "rotate-180" : ""].join(" ")} />
              </button>

              {open && (cat.children?.length ?? 0) > 0 && (
                <div className="mt-1 space-y-1 pl-2">
                  {(cat.children ?? []).map((child) => {
                    const childActive = child.href
                      ? currentPath === child.href || currentPath.startsWith(child.href + "/")
                      : false;
                    const ChildIcon = child.icon;
                    const childKey = `${cat.label}::${child.label}`;
                    const hasGrandChildren = (child.children?.length ?? 0) > 0;
                    const childOpen = openChildByKey[childKey] ?? false;
                    return (
                      <div key={child.label}>
                        {hasGrandChildren ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setOpenChildByKey((p) => ({ ...p, [childKey]: !childOpen }))}
                              className={[
                                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold",
                                childActive
                                  ? "bg-[#7A1F1F] text-white"
                                  : "text-black/70 hover:bg-[#7A1F1F]/10 hover:text-[#7A1F1F]",
                              ].join(" ")}
                            >
                              <span className="flex items-center gap-2">
                                {ChildIcon && (
                                  <ChildIcon
                                    className={[
                                      "h-5 w-5",
                                      childActive ? "text-white" : "text-[#7A1F1F]",
                                    ].join(" ")}
                                  />
                                )}
                                {child.label}
                              </span>
                              <ChevronDownIcon className={["h-4 w-4 transition", childOpen ? "rotate-180" : ""].join(" ")} />
                            </button>
                            {childOpen && (
                              <div className="mt-1 space-y-1 pl-4">
                                {(child.children ?? []).map((g) => {
                                  const grandActive = g.href
                                    ? currentPath === g.href || currentPath.startsWith(g.href + "/")
                                    : false;
                                  const GrandIcon = g.icon;
                                  return (
                                    <a
                                      key={g.label}
                                      href={g.href ?? "#"}
                                      className={[
                                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                                        grandActive
                                          ? "bg-[#7A1F1F] text-white"
                                          : "text-black/70 hover:bg-[#7A1F1F]/10 hover:text-[#7A1F1F]",
                                      ].join(" ")}
                                    >
                                      {GrandIcon && (
                                        <GrandIcon
                                          className={[
                                            "h-5 w-5",
                                            grandActive ? "text-white" : "text-[#7A1F1F]",
                                          ].join(" ")}
                                        />
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
                            className={[
                              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                              childActive
                                ? "bg-[#7A1F1F] text-white"
                                : "text-black/70 hover:bg-[#7A1F1F]/10 hover:text-[#7A1F1F]",
                            ].join(" ")}
                          >
                            {ChildIcon && (
                              <ChildIcon
                                className={[
                                  "h-5 w-5",
                                  childActive ? "text-white" : "text-[#7A1F1F]",
                                ].join(" ")}
                              />
                            )}
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
          className="mt-3 w-full rounded-xl border border-[#7A1F1F] px-3 py-2 text-sm font-semibold text-[#7A1F1F] hover:bg-[#7A1F1F]/5"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default LeftNav;

