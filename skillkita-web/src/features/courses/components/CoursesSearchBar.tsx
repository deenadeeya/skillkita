import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type Props = {
  value: string;
  onChange: (next: string) => void;
  filteredCount: number;
  totalCount: number;
};

export function CoursesSearchBar({ value, onChange, filteredCount, totalCount }: Props) {
  return (
    <div>
      <label className="sr-only" htmlFor="course-search">
        Search courses
      </label>
      <div className="relative">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <input
          id="course-search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name, date, or details..."
          className="w-full rounded-card border border-black/10 bg-white py-3 pl-12 pr-4 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Showing <span className="font-semibold text-ink">{filteredCount}</span> of{" "}
        <span className="font-semibold text-ink">{totalCount}</span> courses
      </p>
    </div>
  );
}
