import { useMemo, useState } from "react";
import { CoursePosterMedia } from "../../courses/components/CoursePosterMedia";
import type { HomepageGalleryRow } from "../api/homepageApi";

const CATEGORIES = [
  "All",
  "Training Sessions",
  "Facilities",
  "Graduation",
  "Industry Collaboration",
] as const;

type Props = {
  items: HomepageGalleryRow[];
};

export function HomeGallerySection({ items }: Props) {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16 sm:mt-20">
      <div className="text-center">
        <h2 className="sk-heading-2">Gallery</h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-muted">
          A glimpse into our training sessions, facilities, and industry partnerships.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={[
              "min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition",
              activeCategory === cat
                ? "bg-primary text-white"
                : "bg-white text-ink-muted ring-1 ring-black/5 hover:text-primary",
            ].join(" ")}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {filtered.map((item) => (
          <figure
            key={item.id}
            className="mb-4 break-inside-avoid overflow-hidden rounded-card bg-white shadow-card"
          >
            <CoursePosterMedia
              url={item.image}
              alt={item.caption ?? item.category}
              className="w-full object-cover"
            />
            {item.caption && (
              <figcaption className="px-4 py-3 text-sm text-ink-muted">{item.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
