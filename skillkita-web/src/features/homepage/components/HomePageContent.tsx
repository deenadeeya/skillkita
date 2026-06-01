import type { HomepageHeroRow, HomepagePartnerRow, HomepageStatsRow } from "../api/homepageApi";
import type { FeaturedCourse } from "./HomeFeaturedCoursesSection";
import { HomeCtaBanner } from "./HomeCtaBanner";
import { HomeFeaturedCoursesSection } from "./HomeFeaturedCoursesSection";
import { HomeHeroSection } from "./HomeHeroSection";
import { HomePartnersSection } from "./HomePartnersSection";
import { HomeStatsSection } from "./HomeStatsSection";
import { HomeTrustSection } from "./HomeTrustSection";
import { HomeWhyChooseSection } from "./HomeWhyChooseSection";

type Props = {
  hero: HomepageHeroRow;
  stats: HomepageStatsRow;
  courses: FeaturedCourse[];
  whyChooseImage: string;
  whyChooseDescription: string;
  partners: HomepagePartnerRow[];
  welcomeName?: string | null;
  errorMessage?: string | null;
};

export function HomePageContent({
  hero,
  stats,
  courses,
  whyChooseImage,
  whyChooseDescription,
  partners,
  welcomeName,
  errorMessage,
}: Props) {
  return (
    <div className="w-full pb-8">
      <HomeHeroSection hero={hero} welcomeName={welcomeName} />
      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      <HomeTrustSection />
      <HomeStatsSection stats={stats} />
      <HomeFeaturedCoursesSection courses={courses} />
      <HomeWhyChooseSection imageUrl={whyChooseImage} description={whyChooseDescription} />
      <HomePartnersSection partners={partners} />
      <HomeCtaBanner />
    </div>
  );
}
