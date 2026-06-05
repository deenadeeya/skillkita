import { hideImageOnError } from "../../../shared/ui/hideImageOnError";
import { useState } from "react";
import type { HomepageTestimonialRow } from "../api/homepageApi";

type Props = {
  items: HomepageTestimonialRow[];
};

export function HomeTestimonialsSection({ items }: Props) {
  const [index, setIndex] = useState(0);

  if (items.length === 0) return null;

  const current = items[index]!;

  const prev = () => setIndex((i) => (i === 0 ? items.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === items.length - 1 ? 0 : i + 1));

  return (
    <section className="mt-16 sm:mt-20">
      <div className="text-center">
        <h2 className="sk-heading-2">What Our Learners Say</h2>
      </div>

      <div className="relative mx-auto mt-10 max-w-3xl">
        <article className="sk-card px-6 py-10 text-center sm:px-12">
          {current.photo ? (
            <img
              src={current.photo}
              alt=""
              className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-primary/10"
              onError={hideImageOnError}
            />
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {(current.name.trim()[0] ?? "T").toUpperCase()}
            </div>
          )}

          <div className="mt-4 flex justify-center gap-0.5" aria-label={`${current.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={[
                  "h-5 w-5",
                  i < current.rating ? "text-secondary" : "text-ink/15",
                ].join(" ")}
              />
            ))}
          </div>

          <blockquote className="mt-6 text-lg leading-relaxed text-ink-muted">
            &ldquo;{current.review}&rdquo;
          </blockquote>

          <p className="mt-6 font-heading text-lg font-semibold text-ink">{current.name}</p>
          <p className="text-sm text-ink-muted">{current.position}</p>
        </article>

        {items.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={prev}
              className="absolute left-0 top-1/2 flex h-11 w-11 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:bg-primary-dark sm:-translate-x-6"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={next}
              className="absolute right-0 top-1/2 flex h-11 w-11 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:bg-primary-dark sm:translate-x-6"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
