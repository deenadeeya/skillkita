type Props = {
  className?: string;
};

/**
 * Folded red ribbon badge overlay (inspired by promotional "UPCOMING" labels).
 * Place inside a `relative` container over course poster media.
 */
export function UpcomingCourseRibbon({ className = "" }: Props) {
  return (
    <div
      className={`pointer-events-none absolute left-0 top-0 z-10 origin-top-left ${className}`}
      aria-label="Upcoming course"
      role="img"
    >
      <svg
        viewBox="0 4 176 44"
        className="h-7 w-[7.25rem] drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)] sm:h-8 sm:w-[7.75rem] md:h-9 md:w-[8.5rem]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Back fold — top right */}
        <path d="M148 4 L176 10 L172 20 L144 14 Z" fill="#5f1818" />
        {/* Under fold — bottom left */}
        <path d="M0 38 L16 48 L20 36 L4 28 Z" fill="#5f1818" />
        {/* Main ribbon face */}
        <path d="M8 10 L164 4 L160 36 L4 42 Z" fill="#E02020" />
        {/* Front edge highlight */}
        <path d="M8 10 L164 4 L160 10 L4 16 Z" fill="#F04444" opacity="0.55" />
        <text
          x="86"
          y="27"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize="13.5"
          fontWeight="700"
          fontFamily="Arial, Helvetica, ui-sans-serif, system-ui, sans-serif"
          letterSpacing="0.14em"
          transform="rotate(-3.5 86 27)"
        >
          UPCOMING
        </text>
      </svg>
    </div>
  );
}
