import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCourseDisplayDate } from "../../courses/courseDate";
import { CoursePosterMedia } from "../../courses/components/CoursePosterMedia";
import type { ExperienceRow } from "../api/landingApi";

const AUTO_PLAY_MS = 5000;

export type ExperienceSlide = {
  id: string;
  imageUrl: string;
  title: string;
  date: string;
  details: string;
};

export function experienceRowsToSlides(experiences: ExperienceRow[]): ExperienceSlide[] {
  const slides: ExperienceSlide[] = [];
  for (const exp of experiences) {
    const urls = exp.photo_urls ?? [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]?.trim();
      if (!url) continue;
      slides.push({
        id: `${exp.id}-${i}`,
        imageUrl: url,
        title: exp.name,
        date: exp.date,
        details: exp.details,
      });
    }
  }
  return slides;
}

function useSlidesPerPage() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCount(3);
      else if (w >= 640) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function ExperienceSlidePanel({ slide }: { slide: ExperienceSlide }) {
  const dateLabel = formatCourseDisplayDate(slide.date) ?? slide.date;

  return (
    <figure className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink shadow-card ring-1 ring-black/5 lg:aspect-[3/2]">
      <CoursePosterMedia
        url={slide.imageUrl}
        alt={slide.title}
        className="h-full w-full object-cover"
        loading="lazy"
        optimizeWidth={520}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <figcaption className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary sm:text-xs">
          {dateLabel}
        </p>
        <p className="mt-0.5 font-heading line-clamp-2 text-sm font-bold text-white lg:text-base">
          {slide.title}
        </p>
      </figcaption>
    </figure>
  );
}

type Props = {
  experiences: ExperienceRow[];
};

export function CompanyExperienceSlideshow({ experiences }: Props) {
  const slides = useMemo(() => experienceRowsToSlides(experiences), [experiences]);
  const slidesPerPage = useSlidesPerPage();
  const [activePage, setActivePage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const pages = useMemo(() => {
    const chunks: ExperienceSlide[][] = [];
    for (let i = 0; i < slides.length; i += slidesPerPage) {
      chunks.push(slides.slice(i, i + slidesPerPage));
    }
    return chunks;
  }, [slides, slidesPerPage]);

  const pageCount = pages.length;

  const goTo = useCallback(
    (page: number) => {
      if (pageCount === 0) return;
      setActivePage(((page % pageCount) + pageCount) % pageCount);
    },
    [pageCount]
  );

  const goNext = useCallback(() => goTo(activePage + 1), [activePage, goTo]);
  const goPrev = useCallback(() => goTo(activePage - 1), [activePage, goTo]);

  useEffect(() => {
    setActivePage(0);
  }, [slidesPerPage, slides.length]);

  useEffect(() => {
    if (pageCount <= 1 || isPaused) return;
    const timer = window.setInterval(() => {
      setActivePage((p) => (p + 1) % pageCount);
    }, AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [pageCount, isPaused]);

  if (slides.length === 0) {
    return (
      <section className="mt-16 sm:mt-20">
        <div className="text-center">
          <h2 className="sk-heading-2 text-ink">Company Experience</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-muted">
            Training highlights and industry collaboration will appear here once published.
          </p>
        </div>
        <p className="mt-10 rounded-hero border border-dashed border-primary/20 bg-white p-10 text-center text-ink-muted">
          No experience photos yet.{" "}
          <a href="/company-experience" className="font-semibold text-primary hover:underline">
            View company experience
          </a>
        </p>
      </section>
    );
  }

  const showControls = pageCount > 1;
  const gridCols =
    slidesPerPage >= 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : slidesPerPage === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1";

  return (
    <section className="mt-16 sm:mt-20">
      <div className="text-center">
        <h2 className="sk-heading-2 text-ink">Company Experience</h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-muted">
          Highlights from our training programmes, facilities, and industry partnerships.
        </p>
      </div>

      <div
        className="relative mx-auto mt-10 w-full max-w-content"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
        aria-roledescription="carousel"
        aria-label="Company experience photos"
      >
        {showControls && (
          <>
            <button
              type="button"
              aria-label="Previous photos"
              onClick={goPrev}
              className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-x-1 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:bg-primary-dark sm:-translate-x-4"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photos"
              onClick={goNext}
              className="absolute right-0 top-1/2 z-10 flex h-11 w-11 translate-x-1 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:bg-primary-dark sm:translate-x-4"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="overflow-hidden px-1">
          <div
            className="flex transition-transform duration-700 ease-in-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${activePage * 100}%)` }}
          >
            {pages.map((pageSlides, pageIndex) => (
              <div
                key={pageIndex}
                className="w-full shrink-0"
                aria-hidden={pageIndex !== activePage}
              >
                <div className={`grid gap-4 ${gridCols}`}>
                  {pageSlides.map((slide) => (
                    <ExperienceSlidePanel key={slide.id} slide={slide} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showControls && (
          <div className="mt-5 flex justify-center gap-2">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide group ${i + 1}`}
                aria-current={i === activePage}
                onClick={() => goTo(i)}
                className={[
                  "h-2.5 rounded-full transition-all duration-300",
                  i === activePage ? "w-8 bg-primary" : "w-2.5 bg-primary/25 hover:bg-primary/40",
                ].join(" ")}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <a href="/company-experience" className="sk-button-secondary">
          View all experiences
        </a>
      </div>
    </section>
  );
}
