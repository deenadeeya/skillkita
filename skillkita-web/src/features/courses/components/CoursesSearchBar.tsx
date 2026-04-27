type Props = {
  value: string;
  onChange: (next: string) => void;
  filteredCount: number;
  totalCount: number;
};

export function CoursesSearchBar({ value, onChange, filteredCount, totalCount }: Props) {
  return (
    <div className="mt-6">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search courses by name, date, or details..."
        className="w-full rounded-xl border border-[#d8c9c2] bg-white px-4 py-2 text-sm text-black outline-none focus:border-[#7A1F1F]"
      />
      <p className="mt-2 text-xs font-semibold text-black/60">
        Showing {filteredCount} of {totalCount}
      </p>
    </div>
  );
}

