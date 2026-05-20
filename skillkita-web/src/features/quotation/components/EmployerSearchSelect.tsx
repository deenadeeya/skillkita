import { useEffect, useId, useMemo, useRef, useState } from "react";

export type EmployerSearchOption = {
  value: string;
  label: string;
  company_name: string | null;
};

const MANUAL_VALUE = "__manual__";
const MANUAL_LABEL = "Manual / not listed";

type Props = {
  value: string;
  options: EmployerSearchOption[];
  onChange: (employerUserId: string) => void;
  disabled?: boolean;
  required?: boolean;
};

function optionMatchesQuery(opt: EmployerSearchOption, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (opt.label.toLowerCase().includes(needle)) return true;
  if (opt.company_name?.toLowerCase().includes(needle)) return true;
  return false;
}

export function EmployerSearchSelect({ value, options, onChange, disabled = false, required }: Props) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    if (value === MANUAL_VALUE) return MANUAL_LABEL;
    return options.find((o) => o.value === value)?.label ?? "";
  }, [options, value]);

  const displayValue = open ? query : selectedLabel;

  const filteredOptions = useMemo(() => {
    const manualMatches =
      !query.trim() ||
      MANUAL_LABEL.toLowerCase().includes(query.trim().toLowerCase()) ||
      "manual".includes(query.trim().toLowerCase());
    const employers = options.filter((o) => optionMatchesQuery(o, query));
    return { employers, showManual: manualMatches };
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

  const selectValue = (next: string) => {
    onChange(next);
    setQuery("");
    setOpen(false);
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    setOpen(true);
    if (value) onChange("");
  };

  const handleFocus = () => {
    setOpen(true);
    setQuery("");
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      setOpen(false);
      setQuery("");
    }, 150);
  };

  return (
    <div className="relative" ref={rootRef}>
      <input
        type="search"
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        required={required && !value}
        placeholder="Search by name or company…"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
      />

      {open && !disabled && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-black/10 bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
        >
          {filteredOptions.showManual && (
            <li role="option" aria-selected={value === MANUAL_VALUE}>
              <button
                type="button"
                className="w-full px-3.5 py-2 text-left hover:bg-[#faf7f2] aria-selected:bg-[#faf7f2]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectValue(MANUAL_VALUE)}
              >
                <span className="font-semibold text-[#7A1F1F]">{MANUAL_LABEL}</span>
              </button>
            </li>
          )}

          {filteredOptions.employers.length === 0 && !filteredOptions.showManual && (
            <li className="px-3.5 py-3 text-black/60">No employers match your search.</li>
          )}

          {filteredOptions.employers.map((opt) => (
            <li key={opt.value} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                className="w-full px-3.5 py-2 text-left hover:bg-[#faf7f2] aria-selected:bg-[#faf7f2]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectValue(opt.value)}
              >
                <span className="block font-medium text-black/90">{opt.label}</span>
                {opt.company_name?.trim() ? (
                  <span className="mt-0.5 block text-xs text-black/55">{opt.company_name}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      {value && !open && (
        <p className="mt-1 text-xs text-black/55">
          {value === MANUAL_VALUE
            ? "Quotation will be stored under your admin account."
            : "Employer selected. Type to search for a different one."}
        </p>
      )}
    </div>
  );
}
