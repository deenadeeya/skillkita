import { useEffect, useState } from "react";
import { formatCourseDisplayDate } from "../../courses/courseDate";
import type { ExperienceRow } from "../api/landingApi";

type Props = {
  experience: ExperienceRow;
  isAdmin?: boolean;
  isSaving?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ExperienceShowcaseCard({
  experience,
  isAdmin = false,
  isSaving = false,
  onEdit,
  onDelete,
}: Props) {
  const photos = experience.photo_urls ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeUrl = photos[activeIndex] ?? photos[0];
  const dateLabel = formatCourseDisplayDate(experience.date) ?? experience.date;

  useEffect(() => {
    setActiveIndex(0);
  }, [experience.id, photos.length]);

  useEffect(() => {
    if (activeIndex >= photos.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, photos.length]);

  return (
    <article className="sk-card group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {activeUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-paper">
          <img
            key={activeUrl}
            src={activeUrl}
            alt={experience.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-primary/5 text-sm font-medium text-ink-muted">
          No photos
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{dateLabel}</p>
        <h3 className="mt-1 font-heading line-clamp-2 text-lg font-semibold text-ink">{experience.name}</h3>
        {experience.details?.trim() ? (
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-muted">{experience.details}</p>
        ) : null}

        {photos.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={`Photos for ${experience.name}`}>
            {photos.map((url, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Show photo ${index + 1} of ${photos.length}`}
                  onClick={() => setActiveIndex(index)}
                  className={`shrink-0 overflow-hidden rounded-lg ring-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isActive ? "ring-primary" : "ring-transparent hover:ring-primary/40"
                  }`}
                >
                  <img
                    src={url}
                    alt=""
                    className="h-14 w-20 object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}

        {isAdmin && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">
            <button
              type="button"
              onClick={onEdit}
              className="sk-button-secondary min-h-[44px] px-4 py-2"
              disabled={isSaving}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="sk-button inline-flex min-h-[44px] items-center justify-center rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
              disabled={isSaving}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
