import type { ChangeEvent, ReactNode } from "react";

type Props = {
  id: string;
  label: string;
  hint?: string;
  previewUrl: string;
  previewAlt?: string;
  previewClassName?: string;
  isSaving?: boolean;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  footer?: ReactNode;
};

export function MediaUploadField({
  id,
  label,
  hint,
  previewUrl,
  previewAlt = "",
  previewClassName = "mt-3 max-h-40 w-full rounded-card object-cover",
  isSaving = false,
  onImageChange,
  footer,
}: Props) {
  return (
    <div className="rounded-card border border-black/10 bg-paper/50 p-4">
      <label htmlFor={id} className="sk-label">
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-ink-muted">{hint}</p> : null}
      <input
        id={id}
        type="file"
        accept="image/*"
        onChange={onImageChange}
        className="sk-input mt-3"
        disabled={isSaving}
      />
      <img src={previewUrl} alt={previewAlt} className={previewClassName} loading="lazy" />
      {footer}
    </div>
  );
}
