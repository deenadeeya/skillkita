import { useDashboardMainInset } from "./DashboardMainInsetContext";

const SiteFooter = () => {
  const year = new Date().getFullYear();
  const { desktopInsetPx } = useDashboardMainInset();

  return (
    <footer className="w-full border-t border-white/15 bg-[#7A1F1F] py-6 text-sm text-white">
      <div className={desktopInsetPx > 0 ? "w-full md:pl-[280px]" : "w-full"}>
        <div className="sk-container text-center">
          <p className="font-semibold">SkillKita</p>
          <p className="mt-1 text-white/90">© {year} All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
