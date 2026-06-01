import { useEffect, useId, useMemo, useRef, useState } from "react";

export type QuotationCourseOption = {
  id: string;
  name: string;
  date: string | null;
  poster_url: string | null;
};


const CUSTOM_LABEL = "Enter custom course name";

type Props = {
  selectedCourseId: string;
  courseName: string;
  options: QuotationCourseOption[];
  onChange: (patch: { selectedCourseId: string; courseName: string }) => void;
  disabled?: boolean;
  required?: boolean;
};

function optionMatchesQuery(opt: QuotationCourseOption, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return opt.name.toLowerCase().includes(needle);
}

function formatCourseDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function CourseSearchSelect({
  selectedCourseId,
  courseName,
  options,
  onChange,
  disabled = false,
  required,
}: Props) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isCustom = !selectedCourseId;

  const selectedCourse = useMemo(
    () => options.find((o) => o.id === selectedCourseId) ?? null,
    [options, selectedCourseId]
  );

  const selectedLabel = selectedCourse?.name ?? (isCustom && courseName ? courseName : "");

  const displayValue = open ? query : selectedLabel;

  const filteredOptions = useMemo(() => {
    const customMatches =
      !query.trim() ||
      CUSTOM_LABEL.toLowerCase().includes(query.trim().toLowerCase()) ||
      "custom".includes(query.trim().toLowerCase());
    const courses = options.filter((o) => optionMatchesQuery(o, query));
    return { courses, showCustom: customMatches };
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selectCourse = (course: QuotationCourseOption) => {
    onChange({ selectedCourseId: course.id, courseName: course.name });
    setQuery("");
    setOpen(false);
  };

  const selectCustom = () => {
    const nextName = query.trim() || (selectedCourseId ? "" : courseName);
    onChange({ selectedCourseId: "", courseName: nextName });
    setQuery(nextName);
    setOpen(false);
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    setOpen(true);
    if (selectedCourseId) {
      onChange({ selectedCourseId: "", courseName: text });
    } else {
      onChange({ selectedCourseId: "", courseName: text });
    }
  };

  const handleFocus = () => {
    setOpen(true);
    setQuery(isCustom ? courseName : "");
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      setOpen(false);
      setQuery("");
    }, 150);
  };

  const hasValue = Boolean(selectedCourseId || courseName.trim());

  return (
    <div className="relative" ref={rootRef}>
      <input
        type="search"
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        required={required && !hasValue}
        placeholder="Search published courses or enter a custom name…"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      {open && !disabled && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-black/10 bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
        >
          {filteredOptions.showCustom && (
            <li role="option" aria-selected={isCustom && Boolean(courseName)}>
              <button
                type="button"
                className="w-full px-3.5 py-2 text-left hover:bg-primary/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={selectCustom}
              >
                <span className="font-semibold text-primary">{CUSTOM_LABEL}</span>
                <span className="mt-0.5 block text-xs text-ink/55">
                  Type a course title not listed below
                </span>
              </button>
            </li>
          )}

          {filteredOptions.courses.length === 0 && !filteredOptions.showCustom && (
            <li className="px-3.5 py-3 text-ink-muted">No courses match your search.</li>
          )}

          {filteredOptions.courses.map((opt) => {
            const dateLabel = formatCourseDate(opt.date);
            return (
              <li key={opt.id} role="option" aria-selected={selectedCourseId === opt.id}>
                <button
                  type="button"
                  className="w-full px-3.5 py-2 text-left hover:bg-primary/5"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectCourse(opt)}
                >
                  <span className="block font-medium text-ink">{opt.name}</span>
                  {dateLabel ? (
                    <span className="mt-0.5 block text-xs text-ink/55">{dateLabel}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!open && (
        <p className="mt-1 text-xs text-ink/55">
          {selectedCourse
            ? "Course selected from catalog. Search again to pick a different one."
            : courseName.trim()
              ? "Custom course name. Pick from the list to attach a catalog poster."
              : "Choose a published course or enter a custom name."}
        </p>
      )}
    </div>
  );
}
