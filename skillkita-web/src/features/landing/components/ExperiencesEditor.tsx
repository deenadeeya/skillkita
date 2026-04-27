import type { ChangeEvent, FormEvent } from "react";
import type { ExperienceRow } from "../api/landingApi";

export type ExperienceFormState = {
  name: string;
  date: string;
  details: string;
};

type Props = {
  experiences: ExperienceRow[];
  isLoading: boolean;
  isSaving: boolean;
  editingExperienceId: string | null;
  experienceForm: ExperienceFormState;
  onFieldChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPhotosChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onStartEdit: (exp: ExperienceRow) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onRemoveExistingPhoto: (photoUrl: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ExperiencesEditor({
  experiences,
  isLoading,
  isSaving,
  editingExperienceId,
  experienceForm,
  onFieldChange,
  onPhotosChange,
  onStartEdit,
  onCancelEdit,
  onDelete,
  onRemoveExistingPhoto,
  onSubmit,
}: Props) {
  const editing = experiences.find((e) => e.id === editingExperienceId) ?? null;

  return (
    <section className="sk-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#7A1F1F]">Experiences</h2>
          <p className="mt-2 text-sm text-black/80">Add, update, and remove past company experiences.</p>
        </div>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="sk-button-secondary px-3 py-2" disabled={isSaving}>
            Cancel edit
          </button>
        )}
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Title</span>
            <input
              name="name"
              value={experienceForm.name}
              onChange={onFieldChange}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Date</span>
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
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPhotosChange}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              disabled={isSaving}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Details</span>
            <textarea
              name="details"
              value={experienceForm.details}
              onChange={onFieldChange}
              rows={5}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              required
            />
          </label>
        </div>

        {editing?.photo_urls?.length ? (
          <div className="rounded-xl border border-[#efe1db] bg-[#faf7f2] p-4">
            <p className="text-sm font-semibold text-[#7A1F1F]">Existing photos</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {(editing.photo_urls ?? []).map((url) => (
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

        <div className="pt-2">
          <button type="submit" disabled={isSaving} className="sk-button-primary">
            {isSaving ? "Saving..." : editing ? "Update experience" : "Add experience"}
          </button>
        </div>
      </form>

      <div className="mt-8 space-y-3">
        <h3 className="text-lg font-bold text-[#7A1F1F]">All experiences</h3>
        {isLoading && (
          <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
            Loading experiences...
          </p>
        )}
        {!isLoading && experiences.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
            No experiences yet.
          </p>
        )}
        {!isLoading &&
          experiences.map((exp) => (
            <article key={exp.id} className="rounded-xl border border-[#efe1db] bg-white p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-[#0001fc]">{exp.name}</p>
                  <p className="text-sm text-black/70">{exp.date}</p>
                  <p className="mt-2 text-sm text-black">{exp.details}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onStartEdit(exp)}
                    className="sk-button-secondary px-3 py-2"
                    disabled={isSaving}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(exp.id)}
                    className="sk-button-secondary border-red-200 px-3 py-2 text-red-800 hover:bg-red-50"
                    disabled={isSaving}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

