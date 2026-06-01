import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../../../assets/placeholder.jpg";
import { compareCoursesUpcomingFirst } from "../../courses/courseDate";
import { CoursePosterMedia } from "../../courses/components/CoursePosterMedia";
import { CourseUpcomingMeta } from "../../courses/components/CourseUpcomingMeta";

export type FeaturedCourse = {
  id: string;
  name: string;
  date: string | null;
  details: string;
  poster_url: string | null;
  created_at?: string | null;
};

type Props = {
  courses: FeaturedCourse[];
};

const AUTO_PLAY_MS = 5000;

function useVisibleSlideCount() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCount(4);
      else if (w >= 1024) setCount(3);
      else if (w >= 640) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function CourseSlideCard({ course }: { course: FeaturedCourse }) {
  return (
    <article className="sk-card group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex h-[200px] shrink-0 items-center justify-center overflow-hidden bg-paper sm:h-[220px] lg:h-[240px]">
        <CoursePosterMedia
          url={course.poster_url ?? PlaceholderPoster}
          alt={`${course.name} poster`}
          className="h-full w-full object-contain object-center p-1.5 transition duration-300 group-hover:scale-[1.02]"
          optimizeWidth={480}
        />
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <CourseUpcomingMeta date={course.date} reserveSpace />
        <h3 className="font-heading line-clamp-2 text-base font-semibold text-ink sm:text-lg">
          {course.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-ink-muted">{course.details}</p>
        <a
          href="/courses"
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
        >
          View details
        </a>
      </div>
    </article>
  );
}

export function HomeFeaturedCoursesSection({ courses }: Props) {
  const display = useMemo(
    () => [...courses].sort(compareCoursesUpcomingFirst).slice(0, 12),
    [courses]
  );
  const visibleCount = useVisibleSlideCount();
  const [activePage, setActivePage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const pages = useMemo(() => {
    const chunks: FeaturedCourse[][] = [];
    for (let i = 0; i < display.length; i += visibleCount) {
      chunks.push(display.slice(i, i + visibleCount));
    }
    return chunks;
  }, [display, visibleCount]);

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
  }, [visibleCount, display.length]);

  useEffect(() => {
    if (pageCount <= 1 || isPaused) return;

    const timer = window.setInterval(() => {
      setActivePage((p) => (p + 1) % pageCount);
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
  }, [pageCount, isPaused]);

  const gridCols =
    visibleCount >= 4
      ? "xl:grid-cols-4"
      : visibleCount === 3
        ? "lg:grid-cols-3"
        : visibleCount === 2
          ? "sm:grid-cols-2"
          : "grid-cols-1";

  const showControls = pageCount > 1;

  return (
    <section id="featured-courses" className="mt-16 sm:mt-20">
      <div className="text-center">
        <h2 className="sk-heading-2">Featured Courses</h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-muted">
          Explore our accredited training programmes designed for individuals and organisations.
        </p>
      </div>

      {display.length === 0 ? (
        <div className="mt-10 rounded-hero border border-dashed border-primary/20 bg-white p-10 text-center">
          <p className="font-medium text-ink-muted">New courses will appear here once published.</p>
        </div>
      ) : (
        <div
          className="relative mt-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          {showControls && (
            <>
              <button
                type="button"
                aria-label="Previous courses"
                onClick={goPrev}
                className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-x-1 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:bg-primary-dark sm:-translate-x-4"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next courses"
                onClick={goNext}
                className="absolute right-0 top-1/2 z-10 flex h-11 w-11 translate-x-1 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:bg-primary-dark sm:translate-x-4"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            className="overflow-hidden px-1"
            aria-roledescription="carousel"
            aria-label="Featured courses"
          >
            <div
              className="flex transition-transform duration-700 ease-in-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${activePage * 100}%)` }}
            >
              {pages.map((pageCourses, pageIndex) => (
                <div
                  key={pageIndex}
                  className="w-full shrink-0"
                  aria-hidden={pageIndex !== activePage}
                >
                  <div className={`grid gap-6 ${gridCols}`}>
                    {pageCourses.map((course) => (
                      <CourseSlideCard key={course.id} course={course} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showControls && (
            <div className="mt-6 flex justify-center gap-2">
              {pages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
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
      )}

      <div className="mt-10 text-center">
        <a href="/courses" className="sk-button-primary">
          Browse all courses
        </a>
      </div>
    </section>
  );
}
