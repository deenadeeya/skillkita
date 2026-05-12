/** Red asterisk for required form fields (use next to label text). */
export function RequiredMark() {
  return (
    <abbr title="Required" className="ml-0.5 cursor-help font-bold text-red-600 no-underline" aria-label="required">
      *
    </abbr>
  );
}
