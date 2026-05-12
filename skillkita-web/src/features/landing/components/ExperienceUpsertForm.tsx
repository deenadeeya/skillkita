import type { ChangeEvent, FormEvent } from "react";
import { RequiredMark } from "../../../shared/ui/RequiredMark";
import type { ExperienceRow } from "../api/landingApi";

export type ExperienceFormState = {
  name: string;
  date: string;
  details: string;
};

type Props = {
  experienceForm: ExperienceFormState;
  /** When set, form is in edit mode and existing photos may be shown. */
  editingExperience: ExperienceRow | null;
  /** Remount file input when opening a fresh add/edit flow. */
  formResetKey?: string | number;
  isSaving: boolean;
  onFieldChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPhotosChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveExistingPhoto: (photoUrl: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
};

export function ExperienceUpsertForm({
  experienceForm,
  editingExperience,
  formResetKey = 0,
  isSaving,
  onFieldChange,
  onPhotosChange,
  onRemoveExistingPhoto,
  onSubmit,
  onCancel,
}: Props) {
  const isEdit = editingExperience !== null;

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Title
            <RequiredMark />
          </span>
          <input
            name="name"
            value={experienceForm.name}
            onChange={onFieldChange}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Date
            <RequiredMark />
          </span>
          <input
            type="date"
            name="date"
            value={experienceForm.date}
            onChange={onFieldChange}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Photos (Accepts Multiple Images)</span>
          <input
            key={formResetKey}
            type="file"
            accept="image/*"
            multiple
            onChange={onPhotosChange}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            disabled={isSaving}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Details </span>
          <textarea
            name="details"
            value={experienceForm.details}
            onChange={onFieldChange}
            rows={5}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            placeholder="Optional description…"
          />
        </label>
      </div>

      {editingExperience?.photo_urls?.length ? (
        <div className="rounded-xl border border-[#efe1db] bg-[#faf7f2] p-4">
          <p className="text-sm font-semibold text-[#7A1F1F]">Existing photos</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(editingExperience.photo_urls ?? []).map((url) => (
              <div key={url} className="rounded-xl border border-[#efe1db] bg-white p-2">
                <img src={url} alt="Experience" className="aspect-square w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveExistingPhoto(url)}
                  className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-50"
                  disabled={isSaving}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={isSaving} className="sk-button-primary">
          {isSaving ? "Saving..." : isEdit ? "Update experience" : "Add experience"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="sk-button-secondary px-3 py-2" disabled={isSaving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
