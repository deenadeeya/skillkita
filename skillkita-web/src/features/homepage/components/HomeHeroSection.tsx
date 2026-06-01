import { CoursePosterMedia } from "../../courses/components/CoursePosterMedia";
import { DEFAULT_HERO, type HomepageHeroRow } from "../api/homepageApi";

type Props = {
  hero: HomepageHeroRow;
  welcomeName?: string | null;
};

export function HomeHeroSection({ hero, welcomeName }: Props) {
  const imageUrl = hero.hero_image?.trim() || "/TRSCGroupPhoto.jpg";

  return (
    <section className="relative w-full overflow-hidden rounded-hero bg-ink">
      <div className="grid min-h-[350px] items-center lg:min-h-[450px] xl:min-h-[600px] lg:grid-cols-2">
        <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
          {welcomeName && (
            <span className="mb-4 inline-flex w-fit items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              Welcome, {welcomeName}
            </span>
          )}
          <h1 className="sk-heading-1 max-w-xl text-white">{hero.title}</h1>
          <p className="mt-4 max-w-lg text-base text-white/90 sm:text-lg">{DEFAULT_HERO.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={DEFAULT_HERO.button_1_link} className="sk-button-primary min-w-[160px]">
              {DEFAULT_HERO.button_1_text}
            </a>
            <a
              href={DEFAULT_HERO.button_2_link}
              className="sk-button inline-flex min-w-[160px] border-2 border-white/90 bg-transparent text-white hover:bg-white/10"
            >
              {DEFAULT_HERO.button_2_text}
            </a>
          </div>
        </div>

        <div className="relative min-h-[240px] lg:min-h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent lg:from-black/40 lg:via-transparent" />
          <CoursePosterMedia
            url={imageUrl}
            alt="TRSC SkillKita training"
            className="h-full min-h-[240px] w-full object-cover lg:absolute lg:inset-0 lg:min-h-full lg:rounded-l-none lg:rounded-r-hero"
            loading="eager"
            fetchPriority="high"
            optimizeWidth={1200}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/40 lg:hidden" />
        </div>
      </div>
    </section>
  );
}
